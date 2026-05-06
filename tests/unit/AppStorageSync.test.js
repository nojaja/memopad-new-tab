import { shallowMount } from '@vue/test-utils'
import App from '@/components/App.vue'

describe('App.vue storage sync', () => {
  let storeMock
  let wrapper
  const hotkeySelectors = {
    F8: '#app > div > div.wrapper > div.contents-wrapper > div.footer > button:nth-child(1)',
    F9: '#app > div > div.wrapper > div.contents-wrapper > div.footer > button:nth-child(2)',
    F10: '#app > div > div.wrapper > div.contents-wrapper > div.footer > button:nth-child(3)'
  }

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
    document.body.innerHTML = ''
  })

  /**
   * 処理名: ビューモードボタン描画
   * 処理概要: ショートカット対象の footer ボタン DOM をテスト用に生成する
   * 実装理由: 実画面と同じセレクタでショートカット動作を検証するため
   */
  function renderViewModeButtons() {
    document.body.innerHTML = `
      <div id="app">
        <div>
          <div class="wrapper">
            <div class="contents-wrapper">
              <div class="footer">
                <button type="button"></button>
                <button type="button"></button>
                <button type="button"></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

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

  test.each([
    ['F8', hotkeySelectors.F8],
    ['F9', hotkeySelectors.F9],
    ['F10', hotkeySelectors.F10]
  ])('%s で対応するビューモードボタンをクリックする', (key, selector) => {
    renderViewModeButtons()
    const targetButton = document.querySelector(selector)
    const clickSpy = jest.spyOn(targetButton, 'click')
    const preventDefault = jest.fn()

    wrapper.vm.handleKeydown({ key, ctrlKey: false, preventDefault })

    expect(preventDefault).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })
})
