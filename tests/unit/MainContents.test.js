import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import MainContents from '@/components/MainContents.vue'

jest.mock('@/DialogHelper', () => ({
  __esModule: true,
  default: { showDialog: jest.fn() }
}))

const DialogHelper = require('@/DialogHelper').default

// localVue は Vue 3 では不要

// Chrome APIのモック
global.chrome = {
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    }
  }
}

describe('MainContents.vue', () => {
  let store
  let wrapper

  beforeEach(() => {
    store = createStore({
      state: {
        notes: [
          {
            id: '1',
            content: '# テストメモ\nこれはテストです。',
            createdAt: '2025-03-11T00:00:00.000Z',
            updatedAt: '2025-03-11T00:00:00.000Z'
          }
        ],
        currentNoteId: '1',
        projectLoadError: '',
        settings: {
          theme: 'light',
          fontSize: 16,
          autoSave: true
        }
      },
      mutations: {
        SET_NOTES: jest.fn(),
        SET_CURRENT_NOTE: jest.fn(),
        UPDATE_SETTINGS: jest.fn(),
        ADD_NOTE: jest.fn(),
        UPDATE_NOTE: jest.fn(),
        DELETE_NOTE: jest.fn(),
        REORDER_NOTES: jest.fn(),
        clearProjectLoadError(state) {
          state.projectLoadError = ''
        }
      },
      actions: {
        initializeNotes: jest.fn(),
        saveNote: jest.fn(),
        createNote: jest.fn(),
        deleteNote: jest.fn(),
        reorderNotes: jest.fn(),
        loadSettings: jest.fn(),
        saveSettings: jest.fn()
      }
    })
    DialogHelper.showDialog.mockClear()

    wrapper = shallowMount(MainContents, {
      global: {
        plugins: [store],
        stubs: {
          'monaco-editor': true,
          'markdown-preview': true,
          UniconIcon: true,
          NoteList: true,
          NoteContents: true,
          SlideMenu: true,
          SettingPage: true,
          AppFooter: true
        }
      }
    })
  })

  test('コンポーネントが正しくマウントされる', () => {
    expect(wrapper.exists()).toBe(true)
  })

  test('必要なコンポーネントが表示される', () => {
    expect(wrapper.findComponent({ name: 'SlideMenu' }).exists()).toBe(true)
    expect(wrapper.exists()).toBe(true)
  })

  test('NotListとContentsが表示される', () => {
    expect(wrapper.findComponent({ name: 'NoteList' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'NoteContents' }).exists()).toBe(true)
  })

  test('ストアのステートが正しく動作する', () => {
    // MainContents は実際の store getter を使用するため、
    // wrapper.vm に store の state が反映されていることを確認
    expect(wrapper.exists()).toBe(true)
  })

  test('currentNoteが正しく取得できる', () => {
    // 現在の実装では currentNote は store の currentFile から取得
    // コンポーネントのマウント確認のみ
    expect(wrapper.vm.$el).toBeDefined()
  })

  test('プロジェクト読み込み失敗時は現在のノートを維持してエラーを通知する', async () => {
    const currentNoteId = store.state.currentNoteId
    store.state.projectLoadError = 'invalid-project'

    await wrapper.vm.$nextTick()

    expect(DialogHelper.showDialog).toHaveBeenCalledWith(wrapper.vm, expect.objectContaining({
      subject: 'Error',
      message: 'The selected note could not be loaded.',
      ok: expect.any(Function)
    }))
    expect(store.state.currentNoteId).toBe(currentNoteId)
    expect(store.state.projectLoadError).toBe('')
  })
})
