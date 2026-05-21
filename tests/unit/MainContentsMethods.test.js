/**
 * MainContents.vue のメソッドカバレッジ追加テスト
 */
jest.mock('@/DialogHelper', () => ({
  __esModule: true,
  default: { showDialog: jest.fn() }
}))

const { shallowMount } = require('@vue/test-utils')
const { createStore } = require('vuex')
const DialogHelper = require('@/DialogHelper').default
const MainContents = require('@/components/MainContents.vue').default

// Chrome API モック
global.chrome = {
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    }
  }
}

function createTestStore() {
  return createStore({
    state: {
      noteKeyList: [],
      currentFile: { projectName: '', filename: '', content: '' },
      config: {
        general: { i18n_locale: 'ja', sortOrder: 0, isShowEmptyNote: false },
        editor: { fontSize: 14, wordWrap: 'on' },
        markdown: {}
      },
      isImporting: false
    },
    getters: {
      refreshFileList: () => [],
      itemList: () => ({ filter: '' }),
      currentFile: (state) => state.currentFile,
      getConfig: (state) => state.config
    },
    mutations: {
      loadProject: jest.fn(),
      replaceNoteKeyList: jest.fn()
    },
    actions: {
      newProject: jest.fn(),
      loadProject: jest.fn()
    }
  })
}

describe('MainContents.vue メソッドテスト', () => {
  let store
  let wrapper

  beforeEach(() => {
    store = createTestStore()
    wrapper = shallowMount(MainContents, {
      global: {
        plugins: [store],
        stubs: {
          NoteList: true,
          Contents: true,
          SlideMenu: { template: '<div><slot/></div>', methods: { open: jest.fn() } },
          SettingPage: true,
          Footer: true,
          unicon: true
        }
      }
    })
  })

  test('コンポーネントがマウントされる', () => {
    expect(wrapper.exists()).toBe(true)
  })

  test('handleResize でウィンドウサイズが更新される', () => {
    const vm = wrapper.vm
    window.innerWidth = 1280
    window.innerHeight = 800
    vm.handleResize()
    expect(vm.width).toBe(1280)
    expect(vm.height).toBe(800)
  })

  test('newProject アクションが呼ばれる', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue()
    wrapper.vm.newProject()
    expect(dispatchSpy).toHaveBeenCalledWith('newProject')
    dispatchSpy.mockRestore()
  })

  test('loadProject アクションが呼ばれる', async () => {
    jest.useFakeTimers()
    const dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue()
    wrapper.vm.loadProject('note_test_123')
    jest.runAllTimers()
    expect(dispatchSpy).toHaveBeenCalledWith('loadProject', 'note_test_123')
    dispatchSpy.mockRestore()
    jest.useRealTimers()
  })

  test('一覧削除要求で確認ダイアログを開き、OK時に対象ノートを削除する', () => {
    const commitSpy = jest.spyOn(store, 'commit')

    wrapper.vm.requestDeleteProject('note_test_123')

    expect(DialogHelper.showDialog).toHaveBeenCalled()
    const options = DialogHelper.showDialog.mock.calls[0][1]
    expect(options.subject).toBe('Delete')
    options.ok()

    expect(commitSpy).toHaveBeenCalledWith('loadProject', 'note_test_123')
    expect(commitSpy).toHaveBeenCalledWith('deleteProject')
    commitSpy.mockRestore()
  })

  test('一覧削除要求でキャンセル時は削除しない', () => {
    const commitSpy = jest.spyOn(store, 'commit')

    wrapper.vm.requestDeleteProject('note_test_123')
    const options = DialogHelper.showDialog.mock.calls[0][1]
    options.cancel()

    expect(commitSpy).not.toHaveBeenCalledWith('deleteProject')
    commitSpy.mockRestore()
  })

  test('beforeUnmount でリスナーが削除される', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })
})
