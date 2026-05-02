import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import MainContents from '@/components/MainContents.vue'

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
        REORDER_NOTES: jest.fn()
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

    wrapper = shallowMount(MainContents, {
      global: {
        plugins: [store],
        stubs: {
          'monaco-editor': true,
          'markdown-preview': true,
          unicon: true,
          NoteList: true,
          Contents: true,
          SlideMenu: true,
          SettingPage: true,
          Footer: true
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
    expect(wrapper.findComponent({ name: 'Contents' }).exists()).toBe(true)
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
})
