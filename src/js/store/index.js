import Vue from 'vue'
import Vuex from 'vuex'

import { FileContainer, FileData } from 'filecontainer'
import { debounce } from 'lodash'

import jmd from '@/jmd.json'
import i18n from '../lang'

// import Debug from '../Debug.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    editor: null,
    currentFile: {},
    currentModelId: 'source',
    fileContainer: new FileContainer(),
    noteKeyList: JSON.parse(localStorage.getItem('noteKeyList')) || [],
    config: JSON.parse(localStorage.getItem('config')) || {
      general: {
        sort: '0',
        cover: '-1',
        i18n_locale: 'ja'
      },
      editor: {
        automaticLayout: true,
        fontSize: 16,
        // fontFamily: '',
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
        multimdTable: true,
        multimdTableOption: {
          multiline: true,
          rowspan: true,
          headerless: true
        },
        multibyteconvert: false,
        multibyteconvertList: jmd.RegExpList || []
      }
    }
  },
  getters: { // state の参照
    currentFile (state) {
      return state.currentFile
    },
    source (state) {
      return state.currentFile.file.content
    },
    config (state) {
      return state.config
    },
    // File一覧の更新
    refreshFileList (state) {
      // { name: 'いちご', uri: 'note_1583338656491', isActive: true },
      const items = []

      state.noteKeyList.forEach(function (val, i) {
        const tmpfileContainer = new FileContainer()
        tmpfileContainer.setContainerJson(localStorage.getItem(val))

        // const label = tmpfileContainer.getFile(tmpfileContainer.getFiles()[0]).getContent().split('\n')[0] || val
        const tmpfile = tmpfileContainer.getFile(tmpfileContainer.getFiles()[0])
        const label = tmpfile.getDescription() || tmpfile.getContent().split('\n')[0] || val
        items.push({ name: label, uri: val, isActive: (state.currentFile.projectName === tmpfileContainer.container.projectName), createdTime: tmpfileContainer.getCreatedTime() || 0, lastUpdatedTime: tmpfileContainer.getLastUpdatedTime() || 0 })
      })
      if (state.config.general.sort === '0') {
      // sort: 0 desc lastUpdatedTime
        items.sort(function (a, b) {
          if (a.lastUpdatedTime > b.lastUpdatedTime) return -1
          if (a.lastUpdatedTime < b.lastUpdatedTime) return 1
          return 0
        })
      } else if (state.config.general.sort === '1') {
      // sort: 1 asc lastUpdatedTime
        items.sort(function (a, b) {
          if (a.lastUpdatedTime < b.lastUpdatedTime) return -1
          if (a.lastUpdatedTime > b.lastUpdatedTime) return 1
          return 0
        })
      } else if (state.config.general.sort === '2') {
      // sort: 2 desc createdTime
        items.sort(function (a, b) {
          if (a.createdTime > b.createdTime) return -1
          if (a.createdTime < b.createdTime) return 1
          return 0
        })
      } else if (state.config.general.sort === '3') {
      // sort: 3 asc createdTime
        items.sort(function (a, b) {
          if (a.createdTime < b.createdTime) return -1
          if (a.createdTime > b.createdTime) return 1
          return 0
        })
      }
      return items
    }
  },
  mutations: { // stateを変更する為の処理(同期処理のみ)
    updateTitle (state, title) {
      state.currentFile.file.description = title
      state.fileContainer.putFile(state.currentFile)
      this.dispatch('saveProject')
    },
    updateContent (state, content) {
      state.currentFile.file.content = content
      state.fileContainer.putFile(state.currentFile)
      this.dispatch('saveProject')
    },
    saveProject (state, cb) {
      // console.log('mutations saveProject')
      // state.currentFile をfileContainerに格納
      // ローカルストレージに最新の状態を保存
      state.fileContainer.setLastUpdatedTime(new Date().getTime())
      localStorage.setItem(state.fileContainer.getProjectName(), state.fileContainer.getContainerJson())
      // console.log(state.fileContainer.getProjectName() + ':' + state.fileContainer.getContainerJson())
      // refreshFileList();
      // return cb ? cb() : true
    },
    // プロジェクトの読み込み処理
    loadProject (state, noteName) {
      // console.log('loadProject:' + noteName)
      if (localStorage.getItem(noteName)) {
        state.fileContainer.setContainerJson(localStorage.getItem(noteName))
        // console.log('fileContainer:' + state.fileContainer.getContainerJson())
      } else { // 存在しない場合は新規作成する
        this.dispatch('newProject')
      }
      this.dispatch('fileOpen', state.fileContainer.getFiles()[0])// プロジェクト内のファイルを開く
      // this.fileOpen(state.fileContainer.getFiles()[0])// プロジェクト内のファイルを開く

      // const label = state.fileContainer.getFile(state.fileContainer.getFiles()[0]).getContent().split('\n')[0] || state.fileContainer.getProjectName()
      // console.log(label)
      // return fileContainer.getContainerJson()
    },
    // プロジェクトの新規作成処理
    newProject (state) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      const noteName = 'note_' + noteId
      const today = new Date()
      const content = '' + today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + '\n'

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
    fileOpen (state, filename) {
      state.currentFile = state.fileContainer.getFile(filename)
      state.currentFile.projectName = state.fileContainer.container.projectName
    },
    loadNoteKeyList (state) { // ページが読み込まれたら、ローカルストレージから状態を読み込む
      const name = 'noteKeyList'
      state.noteKeyList = []
      if (localStorage.getItem(name)) {
        state.noteKeyList = JSON.parse(localStorage.getItem(name))
      }
      // console.log('loadNoteKeyList:' + state.noteKeyList)
    },
    saveNoteKeyList (state, noteName) { // ローカルストレージに状態を保存する
      const name = 'noteKeyList'
      state.noteKeyList.push(noteName)
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
    },
    deleteProject (state) {
      const noteName = state.currentFile.projectName
      state.noteKeyList = state.noteKeyList.filter((v) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
      this.dispatch('init')
    },
    openFirst (state) {
      if (state.noteKeyList.length === 0) {
        this.dispatch('newProject')
      }
      this.dispatch('loadProject', state.noteKeyList[state.noteKeyList.length - 1])
      console.log(i18n.tc('message.welcome'))
    },
    setConfig (state, config) {
      state.config = config
      const name = 'config'
      localStorage.setItem(name, JSON.stringify(state.config))
      i18n.locale = state.config.general.i18n_locale || i18n.locale
    },
    loadConfig (state) {
      const name = 'config'
      if (localStorage.getItem(name)) {
        state.config = JSON.parse(localStorage.getItem(name))
      }
      i18n.locale = state.config.general.i18n_locale || i18n.locale
    },
    importProject (state, pjdata) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      pjdata.id = pjdata.id || noteId
      pjdata.projectName = pjdata.projectName || 'note_' + pjdata.id
      const tmpfileContainer = new FileContainer()
      tmpfileContainer.setId(pjdata.id)
      tmpfileContainer.setProjectName(pjdata.projectName)
      if (pjdata.createdTime) tmpfileContainer.setCreatedTime(pjdata.createdTime)
      if (pjdata.lastUpdatedTime) tmpfileContainer.setLastUpdatedTime(pjdata.lastUpdatedTime)
      if (pjdata.files) {
        tmpfileContainer.setContainerJson(pjdata.files)
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
    loadNoteKeyList (context) { // ページが読み込まれたら、ローカルストレージから状態を読み込む
      context.commit('loadNoteKeyList')
    },
    // ファイル一覧の保存処理
    saveNoteKeyList (context, noteName) { // ローカルストレージに状態を保存する
      context.commit('saveNoteKeyList', noteName)
    },
    // ファイル一覧の削除処理
    deleteNoteKeyList (context, noteName) {
      this.noteKeyList = this.noteKeyList.filter((v) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify(this.noteKeyList))
    },
    // プロジェクトの読み込み処理
    loadProject (context, noteName) {
      context.commit('loadProject', noteName)
    },
    // プロジェクトの保存処理
    saveProject (context, cb) {
      context.commit('saveProject', cb)
      debounce(function () {
        console.log('saveProject')
      }, 3000)()
    },
    fileOpen (context, filename) {
      context.commit('fileOpen', filename)
    },
    newProject (context) {
      context.commit('newProject')
    },
    updateTitle (context, title) {
      context.commit('updateTitle', title)
    },
    update (context, content) {
      context.commit('updateContent', content)
    },
    deleteProject (context) {
      context.commit('deleteProject')
    },
    init (context) {
      context.commit('openFirst')
    },
    setConfig (context, config) {
      context.commit('setConfig', config)
    },
    importProject (context, pjdata) {
      context.commit('importProject', pjdata)
    }
  }
})
