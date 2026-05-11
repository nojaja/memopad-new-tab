import { shallowMount } from '@vue/test-utils'
import App from '@/components/App.vue'
import { nextTick } from 'vue'

describe('App.vue storage sync', () => {
  let storeMock
  let wrapper
  const hotkeySelectors = {
    F8: '#app > div > div.wrapper > div.contents-wrapper > div.footer > button:nth-child(1)',
    F9: '#app > div > div.wrapper > div.contents-wrapper > div.footer > button:nth-child(2)',
    F10: '#app > div > div.wrapper > div.contents-wrapper > div.footer > button:nth-child(3)'
  }

  beforeEach(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false
    })
    storeMock = {
      dispatch: jest.fn((action, payload) => {
        if (action === 'setConfig' && payload && payload.general) {
          storeMock.getters.config.general = {
            ...storeMock.getters.config.general,
            ...payload.general
          }
        }
      }),
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
    jest.useRealTimers()
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

  /**
   * 処理名: App再マウント
   * 処理概要: privacyBlur 設定を切り替えて App を再マウントする
   * 実装理由: Privacy Blur の有効・無効条件を個別テストで安全に切り替えるため
   * @param {boolean} privacyBlur - privacyBlur 設定値
   */
  function remountWithPrivacyBlur(privacyBlur) {
    if (wrapper) wrapper.unmount()
    storeMock.getters.config.general.privacyBlur = privacyBlur
    wrapper = shallowMount(App, {
      global: {
        mocks: {
          $store: storeMock
        }
      }
    })
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

  test('F6 で Privacy Blur を ON に切り替えて即時ブラーを実行する', async () => {
    const preventDefault = jest.fn()

    wrapper.vm.handleKeydown({ key: 'F6', ctrlKey: false, preventDefault })
    await nextTick()

    expect(preventDefault).toHaveBeenCalled()
    expect(storeMock.dispatch).toHaveBeenCalledWith('setConfig', expect.objectContaining({
      general: expect.objectContaining({ privacyBlur: true })
    }))
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(true)
  })

  test('F6 は Privacy Blur が既に ON の場合も即時ブラーを実行する', async () => {
    remountWithPrivacyBlur(true)
    const preventDefault = jest.fn()

    wrapper.vm.handleKeydown({ key: 'F6', ctrlKey: false, preventDefault })
    await nextTick()

    expect(preventDefault).toHaveBeenCalled()
    expect(storeMock.dispatch).not.toHaveBeenCalledWith('setConfig', expect.anything())
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(true)
  })

  test('Privacy Blur が ON の時、表示中はブラーが掛からない', async () => {
    remountWithPrivacyBlur(true)

    await nextTick()
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(false)
  })

  test('Privacy Blur が ON の時、タブが非表示になるとブラーが掛かる', async () => {
    remountWithPrivacyBlur(true)

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true
    })

    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()

    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(true)
  })

  test('Privacy Blur が ON の時、タブが再表示されるとブラーが解除される', async () => {
    remountWithPrivacyBlur(true)

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(true)

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()

    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(false)
  })

  test('Privacy Blur が ON の時、フォーカス中でも3秒経過でブラーが掛かる（本来5分）', async () => {
    jest.useFakeTimers()
    const originalSetTimeout = global.setTimeout
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((handler, timeout, ...args) => {
      const normalizedTimeout = timeout === 5 * 60 * 1000 ? 3000 : timeout
      return originalSetTimeout(handler, normalizedTimeout, ...args)
    })

    remountWithPrivacyBlur(true)
    wrapper.vm.handleWindowFocus()
    await nextTick()
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(false)

    jest.advanceTimersByTime(2999)
    await nextTick()
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(false)

    jest.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('.privacy-blur-overlay').exists()).toBe(true)

    setTimeoutSpy.mockRestore()
    jest.useRealTimers()
  })
})
