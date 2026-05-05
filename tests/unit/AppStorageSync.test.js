import { shallowMount } from '@vue/test-utils'
import App from '@/components/App.vue'

describe('App.vue storage sync', () => {
  let storeMock
  let wrapper

  beforeEach(() => {
    storeMock = {
      dispatch: jest.fn(),
      getters: {
        config: { general: { privacyBlur: false } },
        currentFile: { projectName: 'note_12345' }
      }
    }
    document.hasFocus = jest.fn(() => true)
    wrapper = shallowMount(App, {
      global: {
        mocks: {
          $store: storeMock
        }
      }
    })
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    jest.clearAllMocks()
  })

  test('storage event on noteKeyList dispatches loadNoteKeyList', () => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'noteKeyList',
      newValue: JSON.stringify(['note_12345']),
      oldValue: null,
      storageArea: window.localStorage
    }))

    expect(storeMock.dispatch).toHaveBeenCalledWith('loadNoteKeyList')
  })

  test('storage event on current note with focus duplicates project', () => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'note_12345',
      newValue: JSON.stringify({}),
      oldValue: null,
      storageArea: window.localStorage
    }))

    expect(storeMock.dispatch).toHaveBeenCalledWith('duplicateCurrentProject')
  })

  test('storage event on current note without focus reloads project', () => {
    document.hasFocus = jest.fn(() => false)

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'note_12345',
      newValue: JSON.stringify({}),
      oldValue: null,
      storageArea: window.localStorage
    }))

    expect(storeMock.dispatch).toHaveBeenCalledWith('loadProject', 'note_12345')
  })
})
