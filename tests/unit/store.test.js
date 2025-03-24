import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import { FileContainer, FileData } from './mocks/filecontainer'

const { mockLocalStorage } = global

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Store', () => {
  let store
  let state
  let getters
  let mutations
  let actions

  beforeEach(() => {
    mockLocalStorage._reset()
    state = {
      itemList: { filter: '' },
      editor: null,
      currentFile: {},
      currentModelId: 'source',
      fileContainer: new FileContainer(),
      noteKeyList: [],
      config: {
        general: {
          sort: '0',
          i18n_locale: 'ja'
        }
      }
    }

    getters = {
      currentFile: state => state.currentFile,
      source: state => state.currentFile ? state.currentFile.file?.content : '',
      config: state => state.config,
      refreshFileList: state => {
        const items = []
        state.noteKeyList.forEach(val => {
          const mockData = mockLocalStorage.getItem(val)
          if (mockData) {
            const data = JSON.parse(mockData)
            if (state.itemList.filter === '' || data.container.files[0].content.includes(state.itemList.filter)) {
              items.push({
                name: data.container.files[0].content.split('\n')[0] || val,
                uri: val,
                isActive: state.currentFile.projectName === data.container.projectName
              })
            }
          }
        })
        return items
      }
    }

    mutations = {
      updateContent(state, content) {
        if (state.currentFile.file) {
          state.currentFile.file.content = content
        }
      },
      setConfig(state, config) {
        state.config = config
      },
      newProject(state) {
        const file = new FileData()
        file.setFilename('index.md')
        state.fileContainer.putFile(file)
      },
      loadNoteKeyList(state) {
        const keyList = mockLocalStorage.getItem('noteKeyList')
        if (keyList) {
          state.noteKeyList = JSON.parse(keyList)
        }
      },
      saveNoteKeyList(state, noteName) {
        state.noteKeyList.push(noteName)
        mockLocalStorage.setItem('noteKeyList', JSON.stringify(state.noteKeyList))
      },
      deleteProject(state) {
        state.noteKeyList = state.noteKeyList.filter(
          name => name !== state.currentFile.projectName
        )
        mockLocalStorage.setItem('noteKeyList', JSON.stringify(state.noteKeyList))
      }
    }

    actions = {
      update: jest.fn(),
      setConfig: jest.fn()
    }

    store = new Vuex.Store({
      state,
      getters,
      mutations,
      actions
    })
  })

  test('初期状態が正しく設定される', () => {
    expect(store.state.itemList.filter).toBe('')
    expect(store.state.editor).toBeNull()
    expect(store.state.currentFile).toEqual({})
    expect(store.state.currentModelId).toBe('source')
  })

  test('新規プロジェクトを作成できる', () => {
    store.commit('newProject')
    expect(store.state.fileContainer.container.files.length).toBe(1)
    expect(store.state.fileContainer.container.files[0].filename).toBe('index.md')
  })

  test('gettersが正しく動作する', () => {
    const testContent = '# Test Content'
    const testFile = new FileData()
    testFile.setContent(testContent)
    store.state.currentFile = { file: testFile }

    expect(store.getters.source).toBe(testContent)
    expect(store.getters.currentFile).toBe(store.state.currentFile)
    expect(store.getters.config).toBe(store.state.config)
  })

  test('ファイルの内容を更新できる', () => {
    const testFile = new FileData()
    testFile.setContent('Initial content')
    store.state.currentFile = { file: testFile }

    const newContent = '# Updated Content'
    store.commit('updateContent', newContent)
    expect(store.state.currentFile.file.content).toBe(newContent)
  })

  test('設定を更新できる', () => {
    const newConfig = {
      general: {
        sort: '1',
        i18n_locale: 'en'
      }
    }
    store.commit('setConfig', newConfig)
    expect(store.state.config.general.sort).toBe('1')
    expect(store.state.config.general.i18n_locale).toBe('en')
  })

  test('ノートキーリストを読み込める', () => {
    const mockKeyList = ['note_1', 'note_2']
    mockLocalStorage.setItem('noteKeyList', JSON.stringify(mockKeyList))
    store.commit('loadNoteKeyList')
    expect(store.state.noteKeyList).toEqual(mockKeyList)
  })

  test('ノートキーリストを保存できる', () => {
    store.commit('saveNoteKeyList', 'note_3')
    expect(store.state.noteKeyList).toContain('note_3')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('noteKeyList', JSON.stringify(['note_3']))
  })

  test('ファイル一覧を更新できる', () => {
    const mockData = {
      container: {
        projectName: 'test',
        files: [{ name: 'index.md', content: '# Test' }]
      }
    }
    mockLocalStorage.setItem('note_1', JSON.stringify(mockData))
    store.state.itemList.filter = ''
    store.state.noteKeyList = ['note_1']
    
    const fileList = store.getters.refreshFileList
    expect(fileList.length).toBe(1)
    expect(fileList[0].uri).toBe('note_1')
  })

  test('プロジェクトを削除できる', () => {
    store.state.noteKeyList = ['note_1', 'note_2']
    store.state.currentFile = { projectName: 'note_1' }
    store.commit('deleteProject')
    expect(store.state.noteKeyList).not.toContain('note_1')
  })
})
