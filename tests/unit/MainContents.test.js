import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import MainContents from '@/js/components/MainContents.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

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
    store = new Vuex.Store({
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
      store,
      localVue,
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
    })
  })

  test('コンポーネントが正しくマウントされる', () => {
    expect(wrapper.exists()).toBe(true)
  })

  test('必要なコンポーネントが表示される', () => {
    expect(wrapper.findComponent({ name: 'SlideMenu' }).exists()).toBe(true)
    expect(wrapper.find('.main-contents').exists()).toBe(true)
  })

  test('NotListとContentsが表示される', () => {
    expect(wrapper.findComponent({ name: 'NoteList' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Contents' }).exists()).toBe(true)
  })

  test('ストアのステートが正しく動作する', () => {
    expect(wrapper.vm.notes).toBeDefined()
    expect(wrapper.vm.currentNote).toBeDefined()
    expect(wrapper.vm.settings).toBeDefined()
  })

  test('currentNoteが正しく取得できる', () => {
    expect(wrapper.vm.currentNote).toEqual({
      id: '1',
      content: '# テストメモ\nこれはテストです。',
      createdAt: '2025-03-11T00:00:00.000Z',
      updatedAt: '2025-03-11T00:00:00.000Z'
    })
  })
})
