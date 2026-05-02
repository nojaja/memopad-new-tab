import { createStore } from 'vuex'
import { markRaw } from 'vue'

import { FileContainer, FileData } from 'filecontainer'
import { debounce } from 'lodash'

import jmd from '@/jmd.json'
import i18n from '../lang'

// import Debug from '../Debug'

let latestFileListCache: any[] = []

const defaultConfig = {
  general: {
    sort: '0',
    cover: '-1',
    i18n_locale: 'ja'
  },
  editor: {
    automaticLayout: true,
    fontSize: 16,
    tabSize: 4,
    theme: 'vs'
  },
  markdown: {
    basicOption: {
      html: true,
      breaks: false,
      linkify: true,
      typography: true
    },
    emoji: true,
    ruby: true,
    uml: true,
    multimdTable: true,
    multimdTableOption: {
      multiline: true,
      rowspan: true,
      headerless: true
    },
    multibyteconvert: false,
    multibyteconvertList: (jmd as any).RegExpList || []
  }
}

function normalizeLocale(locale: any): string {
  if (locale === 'en-US') return 'en'
  if (locale === 'ja-JP') return 'ja'
  if (locale === 'en' || locale === 'ja') return locale
  return defaultConfig.general.i18n_locale
}

function normalizeConfig(config: any): any {
  const input = config || {}
  const normalized = {
    ...defaultConfig,
    ...input,
    general: {
      ...defaultConfig.general,
      ...(input.general || {})
    },
    editor: {
      ...defaultConfig.editor,
      ...(input.editor || {})
    },
    markdown: {
      ...defaultConfig.markdown,
      ...(input.markdown || {}),
      basicOption: {
        ...defaultConfig.markdown.basicOption,
        ...((input.markdown && input.markdown.basicOption) || {})
      },
      multimdTableOption: {
        ...defaultConfig.markdown.multimdTableOption,
        ...((input.markdown && input.markdown.multimdTableOption) || {})
      },
      multibyteconvertList: Array.isArray(input.markdown?.multibyteconvertList)
        ? input.markdown.multibyteconvertList
        : defaultConfig.markdown.multibyteconvertList
    }
  }

  normalized.general.i18n_locale = normalizeLocale(normalized.general.i18n_locale)
  return normalized
}

function applyI18nLocale(locale: string) {
  const target = normalizeLocale(locale)
  const globalLocale = (i18n.global as any).locale
  if (globalLocale && typeof globalLocale === 'object' && 'value' in globalLocale) {
    globalLocale.value = target
    return
  }
  ;(i18n.global as any).locale = target
}

function isSameConfig(a: any, b: any): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch (e) {
    return false
  }
}

function getFileName(file: any): string {
  if (!file) return ''
  if (typeof file.name === 'string' && file.name) return file.name
  if (typeof file.filename === 'string' && file.filename) return file.filename
  if (typeof file.getFilename === 'function') return file.getFilename() || ''
  return ''
}

function getFileContent(file: any): string {
  if (!file) return ''
  if (typeof file.getContent === 'function') return file.getContent() || ''
  if (typeof file.content === 'string') return file.content
  return ''
}

function getFileDescription(file: any): string {
  if (!file) return ''
  if (typeof file.getDescription === 'function') return file.getDescription() || ''
  if (typeof file.description === 'string') return file.description
  return ''
}

function parseJsonSafely(raw: string | null, fallback: any): any {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch (e) {
    return fallback
  }
}

function getCurrentFileFromState(state: any): any | null {
  const filename = typeof state.currentFile?.filename === 'string' ? state.currentFile.filename : ''
  if (!filename) return null
  if (!state.fileContainer || typeof state.fileContainer.getFile !== 'function') return null
  return state.fileContainer.getFile(filename) || null
}

function extractJsonStringValue(raw: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('"' + escapedKey + '":"((?:\\\\.|[^"\\\\])*)"')
  const matched = re.exec(raw)
  if (!matched || typeof matched[1] !== 'string') return ''
  try {
    return JSON.parse('"' + matched[1] + '"')
  } catch (e) {
    return matched[1]
  }
}

function extractJsonNumberValue(raw: string, key: string): number {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('"' + escapedKey + '":(-?\\d+)')
  const matched = re.exec(raw)
  if (!matched) return 0
  const num = Number(matched[1])
  return Number.isFinite(num) ? num : 0
}

function normalizeStoredProject(raw: any): any | null {
  const parsed = typeof raw === 'string' ? parseJsonSafely(raw, null) : raw
  if (!parsed || typeof parsed !== 'object') return null

  const files = parsed.files
  if (!files || typeof files !== 'object') return null

  const normalizedFiles = Object.keys(files).reduce((acc: Record<string, any>, key) => {
    const source = files[key]
    if (!source || typeof source !== 'object') return acc

    const filename = typeof source.filename === 'string' && source.filename ? source.filename : key
    acc[filename] = {
      filename,
      fileType: typeof source.fileType === 'string' && source.fileType ? source.fileType : 'txt',
      type: typeof source.type === 'string' && source.type ? source.type : 'text/plain',
      language: typeof source.language === 'string' && source.language ? source.language : 'Markdown',
      size: typeof source.size === 'number' ? source.size : 0,
      truncated: !!source.truncated,
      content: typeof source.content === 'string' ? source.content : '',
      description: typeof source.description === 'string' ? source.description : ''
    }
    return acc
  }, {})

  if (Object.keys(normalizedFiles).length === 0) return null

  return {
    v: typeof parsed.v === 'number' ? parsed.v : 0.1,
    id: parsed.id ?? null,
    gistid: parsed.gistid ?? '',
    files: normalizedFiles,
    public: typeof parsed.public === 'boolean' ? parsed.public : true,
    createdTime: typeof parsed.createdTime === 'number' ? parsed.createdTime : Date.now(),
    lastUpdatedTime: typeof parsed.lastUpdatedTime === 'number' ? parsed.lastUpdatedTime : Date.now(),
    projectName: typeof parsed.projectName === 'string' ? parsed.projectName : '',
    description: typeof parsed.description === 'string' ? parsed.description : ''
  }
}

function getProjectFromStorage(raw: any): FileContainer | null {
  const normalizedProject = normalizeStoredProject(raw)
  if (!normalizedProject) return null

  const container = new FileContainer()
  const setContainerFn = (container as any)['setContainer']
  if (typeof setContainerFn === 'function') {
    setContainerFn.call(container, normalizedProject)
  } else {
    container.setContainerJson(JSON.stringify(normalizedProject))
  }
  return container
}

function getListItemFromRaw(raw: string, noteKey: string, currentProjectName: string, filter: string): any | null {
  if (filter === '') {
    const parsed = parseJsonSafely(raw, null)
    if (parsed && typeof parsed === 'object' && parsed.files && typeof parsed.files === 'object') {
      const fileKeys = Object.keys(parsed.files)
      if (fileKeys.length > 0) {
        const first = parsed.files[fileKeys[0]] || {}
        const content = typeof first.content === 'string' ? first.content : ''
        const description = typeof first.description === 'string' ? first.description : ''
        const label = description || content.split('\n')[0] || noteKey
        return {
          name: label,
          uri: noteKey,
          isActive: currentProjectName === noteKey,
          createdTime: typeof parsed.createdTime === 'number' ? parsed.createdTime : 0,
          lastUpdatedTime: typeof parsed.lastUpdatedTime === 'number' ? parsed.lastUpdatedTime : 0
        }
      }
    }

    return {
      name: noteKey,
      uri: noteKey,
      isActive: currentProjectName === noteKey,
      createdTime: 0,
      lastUpdatedTime: 0
    }
  }

  const parsed = parseJsonSafely(raw, null)
  if (!parsed || typeof parsed !== 'object') return null
  if (!parsed.files || typeof parsed.files !== 'object') return null

  const fileKeys = Object.keys(parsed.files)
  if (fileKeys.length === 0) return null

  const first = parsed.files[fileKeys[0]] || {}
  const content = typeof first.content === 'string' ? first.content : ''
  if (filter !== '' && content.indexOf(filter) === -1) return null

  const description = typeof first.description === 'string' ? first.description : ''
  const label = description || content.split('\n')[0] || noteKey
  const projectName = typeof parsed.projectName === 'string' ? parsed.projectName : ''

  return {
    name: label,
    uri: noteKey,
    isActive: currentProjectName === projectName,
    createdTime: typeof parsed.createdTime === 'number' ? parsed.createdTime : 0,
    lastUpdatedTime: typeof parsed.lastUpdatedTime === 'number' ? parsed.lastUpdatedTime : 0
  }
}

function sanitizeNoteKeyList(list: any): string[] {
  if (!Array.isArray(list)) return []
  const uniq = new Set<string>()
  list.forEach((v: any) => {
    if (typeof v !== 'string') return
    if (!v.startsWith('note_')) return
    uniq.add(v)
  })
  return Array.from(uniq)
}

function findLatestReadableNoteName(noteKeyList: string[]): string {
  for (let i = noteKeyList.length - 1; i >= 0; i--) {
    const key = noteKeyList[i]
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const tmp = getProjectFromStorage(raw)
    if (!tmp) continue

    const files = tmp.getFiles()
    if (files && files.length > 0 && getFileName(files[0])) {
      return key
    }
  }
  return ''
}

export default createStore({
  devtools: false,
  state: {
    itemList: { filter: '' },
    editor: null as any,
    currentFile: {} as any,
    currentModelId: 'source',
    fileContainer: markRaw(new FileContainer()),
    noteKeyList: sanitizeNoteKeyList(parseJsonSafely(localStorage.getItem('noteKeyList'), [])) as string[],
    config: normalizeConfig(parseJsonSafely(localStorage.getItem('config'), null) as any),
    isImporting: false
  },
  getters: { // state の参照
    currentFile(state) {
      const file = getCurrentFileFromState(state)
      return {
        file,
        filename: state.currentFile?.filename || '',
        projectName: state.currentFile?.projectName || ''
      }
    },
    source(state) {
      return getFileContent(getCurrentFileFromState(state))
    },
    config(state) {
      return state.config
    },
    itemList(state) {
      return state.itemList
    },
    // File一覧の更新
    refreshFileList(state) {
      if (state.isImporting) {
        return latestFileListCache
      }

      // { name: 'いちご', uri: 'note_1583338656491', isActive: true },
      const items: any[] = []
      const filter = state.itemList.filter || ''

      state.noteKeyList.forEach(function(val: string) {
        const raw = localStorage.getItem(val)
        if (filter !== '' && !raw) return

        const item = getListItemFromRaw(raw || '', val, state.currentFile.projectName, filter)
        if (!item) return
        items.push(item)
      })
      if (state.config.general.sort === '0') {
      // sort: 0 desc lastUpdatedTime
        items.sort(function(a, b) {
          if (a.lastUpdatedTime > b.lastUpdatedTime) return -1
          if (a.lastUpdatedTime < b.lastUpdatedTime) return 1
          return 0
        })
      } else if (state.config.general.sort === '1') {
      // sort: 1 asc lastUpdatedTime
        items.sort(function(a, b) {
          if (a.lastUpdatedTime < b.lastUpdatedTime) return -1
          if (a.lastUpdatedTime > b.lastUpdatedTime) return 1
          return 0
        })
      } else if (state.config.general.sort === '2') {
      // sort: 2 desc createdTime
        items.sort(function(a, b) {
          if (a.createdTime > b.createdTime) return -1
          if (a.createdTime < b.createdTime) return 1
          return 0
        })
      } else if (state.config.general.sort === '3') {
      // sort: 3 asc createdTime
        items.sort(function(a, b) {
          if (a.createdTime < b.createdTime) return -1
          if (a.createdTime > b.createdTime) return 1
          return 0
        })
      }
      latestFileListCache = items
      return items
    }
  },
  mutations: { // stateを変更する為の処理(同期処理のみ)
    setImporting(state, importing) {
      state.isImporting = !!importing
    },
    updateTitle(state, title) {
      const currentFile = getCurrentFileFromState(state)
      if (!currentFile) return

      const currentTitle = getFileDescription(currentFile)
      if (currentTitle === title) return
      if (typeof currentFile.setDescription === 'function') {
        currentFile.setDescription(title)
      } else {
        currentFile.description = title
      }
      state.fileContainer.putFile(currentFile)
      this.dispatch('saveProject')
    },
    updateContent(state, content) {
      const currentFile = getCurrentFileFromState(state)
      if (!currentFile) return

      const currentContent = getFileContent(currentFile)
      if (currentContent === content) return
      if (typeof currentFile.setContent === 'function') {
        currentFile.setContent(content)
      } else {
        currentFile.content = content
      }
      state.fileContainer.putFile(currentFile)
      this.dispatch('saveProject')
    },
    saveProject(state) {
      // console.log('mutations saveProject')
      // state.currentFile をfileContainerに格納
      // ローカルストレージに最新の状態を保存
      state.fileContainer.setLastUpdatedTime(new Date().getTime())
      const noteName = state.fileContainer.getProjectName()
      localStorage.setItem(noteName, state.fileContainer.getContainerJson())
      // console.log(state.fileContainer.getProjectName() + ':' + state.fileContainer.getContainerJson())
      // refreshFileList();
      // return cb ? cb() : true
    },
    // プロジェクトの読み込み処理
    loadProject(state, noteName) {
      // console.log('loadProject:' + noteName)
      const raw = localStorage.getItem(noteName)
      if (!raw) { // 存在しない場合は新規作成する
        this.dispatch('newProject')
        return
      }

      const normalizedProject = normalizeStoredProject(raw)
      if (!normalizedProject) {
        console.warn('Failed to load project, recreate project:', noteName)
        this.dispatch('newProject')
        return
      }

      const setContainerFn = (state.fileContainer as any)['setContainer']
      if (typeof setContainerFn === 'function') {
        setContainerFn.call(state.fileContainer, normalizedProject)
      } else {
        state.fileContainer.setContainerJson(JSON.stringify(normalizedProject))
      }

      const files = state.fileContainer.getFiles()
      if (!files || files.length === 0) {
        console.warn('Project has no files, recreate project:', noteName)
        this.dispatch('newProject')
        return
      }

      const firstFilename = getFileName(files[0])
      if (!firstFilename) {
        console.warn('Project first file has no filename, recreate project:', noteName)
        this.dispatch('newProject')
        return
      }

      const file = state.fileContainer.getFile(firstFilename) || null
      state.currentFile = {
        filename: file ? firstFilename : '',
        projectName: file ? noteName : ''
      }
    },
    // プロジェクトの新規作成処理
    newProject(state) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      const noteName = 'note_' + noteId
      const today = new Date()
      const content = '' + today.getFullYear() + '/' + ('0' + (today.getMonth() + 1)).slice(-2) + '/' + ('0' + today.getDate()).slice(-2) + ' ' + ('0' + today.getHours()).slice(-2) + ':' + ('0' + today.getMinutes()).slice(-2) + '\n'

      // console.log('state.fileContainer:' + state.fileContainer)
      state.fileContainer.init()
      state.fileContainer.setCreatedTime(new Date().getTime())
      state.fileContainer.setLastUpdatedTime(new Date().getTime())
      const file = new FileData()
      file.setFilename('index.md')
      file.setContent(content)
      file.setDescription(content)
      state.fileContainer.putFile(file)
      // console.log('fileContainer:' + state.fileContainer.getContainerJson())

      state.fileContainer.setId(noteId)
      state.fileContainer.setProjectName(noteName)

      this.dispatch('saveProject')// プロジェクトの保存
      this.dispatch('saveNoteKeyList', noteName)// ファイル一覧の保存
      this.dispatch('loadProject', noteName)
      // console.log('noteKeyList:' + state.noteKeyList)
    },
    // プロジェクト内のFileを開く
    fileOpen(state, filename) {
      const file = state.fileContainer.getFile(filename) || null
      state.currentFile = {
        filename: file ? filename : '',
        projectName: file ? state.fileContainer.getProjectName() : ''
      }
    },
    loadNoteKeyList(state) { // ページが読み込まれたら、ローカルストレージから状態を読み込む
      const name = 'noteKeyList'
      state.noteKeyList = []
      if (localStorage.getItem(name)) {
        state.noteKeyList = sanitizeNoteKeyList(parseJsonSafely(localStorage.getItem(name), []))
      }
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
      // console.log('loadNoteKeyList:' + state.noteKeyList)
    },
    replaceNoteKeyList(state, list) {
      const sanitized = sanitizeNoteKeyList(list)
      state.noteKeyList = sanitized
      localStorage.setItem('noteKeyList', JSON.stringify(sanitized))
    },
    saveNoteKeyList(state, noteName) { // ローカルストレージに状態を保存する
      if (typeof noteName !== 'string' || !noteName.startsWith('note_')) return
      const name = 'noteKeyList'
      if (state.noteKeyList.indexOf(noteName) === -1) {
        state.noteKeyList.push(noteName)
      }
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
    },
    deleteProject(state) {
      const noteName = state.currentFile.projectName
      state.noteKeyList = state.noteKeyList.filter((v: string) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
      this.dispatch('init')
    },
    openFirst(state) {
      const readableNoteName = findLatestReadableNoteName(state.noteKeyList)
      if (!readableNoteName) {
        this.dispatch('newProject')
        return
      }
      this.dispatch('loadProject', readableNoteName)
    },
    setConfig(state, config) {
      const normalized = normalizeConfig(config)
      if (!isSameConfig(state.config, normalized)) {
        state.config = normalized
      }
      const name = 'config'
      localStorage.setItem(name, JSON.stringify(normalized))
      applyI18nLocale(normalized.general.i18n_locale)
    },
    loadConfig(state) {
      const name = 'config'
      if (localStorage.getItem(name)) {
        state.config = normalizeConfig(parseJsonSafely(localStorage.getItem(name), null))
      } else {
        state.config = normalizeConfig(state.config)
      }
      applyI18nLocale(state.config.general.i18n_locale)
    },
    importProject(state, pjdata) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      pjdata.id = pjdata.id || noteId
      pjdata.projectName = pjdata.projectName || 'note_' + pjdata.id
      const tmpfileContainer = new FileContainer()
      tmpfileContainer.setId(pjdata.id)
      tmpfileContainer.setProjectName(pjdata.projectName)
      if (pjdata.createdTime) tmpfileContainer.setCreatedTime(pjdata.createdTime)
      if (pjdata.lastUpdatedTime) tmpfileContainer.setLastUpdatedTime(pjdata.lastUpdatedTime)
      if (pjdata.files) {
        const importedContainer = getProjectFromStorage({
          ...pjdata,
          files: pjdata.files
        })
        if (importedContainer) {
          localStorage.setItem(pjdata.projectName, importedContainer.getContainerJson())
          return
        }
      } else {
        const file = new FileData()
        file.setFilename('index.md')
        if (pjdata.text) file.setContent(pjdata.text)
        const label = file.getDescription() || file.getContent().split('\n')[0] || pjdata.projectName
        file.setDescription(label)
        tmpfileContainer.putFile(file)
      }
      localStorage.setItem(pjdata.projectName, tmpfileContainer.getContainerJson())
    }
  },
  actions: { // ミューテーションをコミットする関数(外部APIとの連携や非同期処理もここ)
    setImporting(context, importing) {
      context.commit('setImporting', importing)
    },
    loadNoteKeyList(context) { // ページが読み込まれたら、ローカルストレージから状態を読み込む
      context.commit('loadNoteKeyList')
    },
    replaceNoteKeyList(context, list) {
      context.commit('replaceNoteKeyList', list)
    },
    // ファイル一覧の保存処理
    saveNoteKeyList(context, noteName) { // ローカルストレージに状態を保存する
      context.commit('saveNoteKeyList', noteName)
    },
    // ファイル一覧の削除処理
    deleteNoteKeyList(context, noteName) {
      (this as any).noteKeyList = ((this as any).noteKeyList as string[]).filter((v: string) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify((this as any).noteKeyList))
    },
    // プロジェクトの読み込み処理
    loadProject(context, noteName) {
      Promise.resolve().then(() => {
        context.commit('loadProject', noteName)
      })
    },
    // プロジェクトの保存処理
    saveProject(context, cb?: () => void) {
      context.commit('saveProject', cb)
      debounce(function() {
        console.log('saveProject')
      }, 3000)()
    },
    fileOpen(context, filename) {
      context.commit('fileOpen', filename)
    },
    newProject(context) {
      context.commit('newProject')
    },
    updateTitle(context, title) {
      context.commit('updateTitle', title)
    },
    update(context, content) {
      context.commit('updateContent', content)
    },
    deleteProject(context) {
      context.commit('deleteProject')
    },
    init(context) {
      context.commit('openFirst')
    },
    setConfig(context, config) {
      context.commit('setConfig', config)
    },
    importProject(context, pjdata) {
      context.commit('importProject', pjdata)
    }
  }
})
