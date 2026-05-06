/**
 * Preview.vue フリーズ再現テスト
 * - `getVisibleSourceLine` を重い同期処理に差し替え、
 *   `attachIframeScroll` のハンドラがメインスレッドをブロックすることを確認する
 */
const Preview = require('@/components/Preview.vue').default

describe('Preview.vue フリーズ再現テスト', () => {
  test('スクロールハンドラは重いgetVisibleSourceLineでもメインスレッドをブロックせず、emitは非同期で呼ばれる', async () => {
    jest.setTimeout(10000)

    const emitSpy = jest.fn()
    // 約2秒間ブロックする重い関数
    const heavyGetVisibleSourceLine = jest.fn(() => {
      const start = Date.now()
      while (Date.now() - start < 2000) {}
      return 1
    })
    const fakeRefs = {
      childFrame: {
        contentWindow: {
          addEventListener: jest.fn(),
          scrollY: 0
        },
        contentDocument: {
          querySelectorAll: jest.fn(),
          documentElement: { scrollHeight: 100, clientHeight: 100 },
          body: { scrollHeight: 100, clientHeight: 100 }
        }
      }
    }
    Preview.methods.attachIframeScroll.call({
      $refs: fakeRefs,
      isSyncingScroll: false,
      $emit: emitSpy,
      getVisibleSourceLine: heavyGetVisibleSourceLine,
      removeListener: jest.fn()
    })
    const onIframeScroll = fakeRefs.childFrame.contentWindow.addEventListener.mock.calls.find(
      (args) => args[0] === 'scroll'
    )[1]
    const t0 = Date.now()
    onIframeScroll()
    const t1 = Date.now()
    const duration = t1 - t0
    // メインスレッドが2秒以上ブロックされないこと
    expect(duration).toBeLessThan(500)
    // emitは非同期で呼ばれること
    await new Promise((resolve) => setTimeout(resolve, 2100))
    expect(emitSpy).toHaveBeenCalledWith('previewScroll', 1)
  })
})
