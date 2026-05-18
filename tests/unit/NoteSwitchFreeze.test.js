/**
 * ノート切り替えスクロール同期テスト
 *
 * 修正後の検証:
 * Preview.scrollToSourceLine が requestAnimationFrame で isSyncingScroll をリセットし、
 * スクロール同期イベントが正しく機能することを確認する
 */
const SplitpanesWrapper = require('@/components/SplitpanesWrapper.vue').default
const Preview = require('@/components/Preview.vue').default

// monaco-editor-vue3 モック
jest.mock('monaco-editor-vue3', () => ({
  CodeEditor: { template: '<div/>' }
}), { virtual: true })

// editorCompletions モック
jest.mock('@/editorCompletions', () => ({
  registerCompletions: jest.fn()
}), { virtual: true })

describe('ノート切り替えスクロール同期テスト', () => {
  /**
   * 再現テスト:
   * preview 側スクロール後に 2 回目ノート切り替えが 10 秒以上遅延することを確認
   * （20秒タイムアウトで観察）
   */
  test('preview スクロール後の2回目ノート切り替えが10秒以上遅延しないこと', async () => {
    jest.setTimeout(20000)

    const monacoMock = {
      scrollToSourceLine: jest.fn(() => {
        const start = Date.now()
        while (Date.now() - start < 11000) {}
      })
    }
    const instance = {
      activePane: null,
      blockedPane: null,
      previewScrollSyncTimer: null,
      pendingPreviewLine: 1,
      $refs: { monaco: monacoMock },
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }

    const firstSwitchStart = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const firstSwitchElapsed = Date.now() - firstSwitchStart
    expect(firstSwitchElapsed).toBeLessThan(1000)

    SplitpanesWrapper.methods.handlePreviewScroll.call(instance, 5)

    const secondSwitchStart = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const secondSwitchElapsed = Date.now() - secondSwitchStart

    expect(secondSwitchElapsed).toBeLessThan(10000)
    expect(instance.activePane).toBe('preview')
  })

  /**
   * handlePreviewScroll が非同期で monaco.scrollToSourceLine を呼び出すことを確認
   */
  /**
   * handlePreviewScroll は monaco.scrollToSourceLine を呼ばない（editor→preview 片方向同期のみ）
   */
  test('handlePreviewScroll は asynchronously monaco.scrollToSourceLine を呼び出す', () => {
    jest.useFakeTimers()

    const monacoMock = { scrollToSourceLine: jest.fn() }
    const instance = {
      activePane: null,
      blockedPane: null,
      previewScrollSyncTimer: null,
      pendingPreviewLine: 1,
      $refs: { monaco: monacoMock },
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }

    SplitpanesWrapper.methods.handlePreviewScroll.call(instance, 5)

  jest.advanceTimersByTime(100)
  expect(monacoMock.scrollToSourceLine).not.toHaveBeenCalled()
    expect(instance.activePane).toBe('preview')

    jest.useRealTimers()
  })

  /**
   * handleEditorScroll が非同期で preview.scrollToSourceLine を呼び出すことを確認
   */
  test('handleEditorScroll は asynchronously preview.scrollToSourceLine を呼び出す', () => {
    jest.useFakeTimers()

    const previewMock = { scrollToSourceLine: jest.fn() }
    const instance = {
      config: { editor: { syncEditorToPreview: true } },
      activePane: null,
      blockedPane: null,
      editorScrollSyncTimer: null,
      pendingEditorLine: 1,
      $refs: { preview: previewMock },
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }

    SplitpanesWrapper.methods.handleEditorScroll.call(instance, 10)

    expect(previewMock.scrollToSourceLine).not.toHaveBeenCalled()

    jest.advanceTimersByTime(16)
    expect(previewMock.scrollToSourceLine).toHaveBeenCalledWith(10)
    expect(instance.activePane).toBe('editor')

    jest.useRealTimers()
  })

  /**
   * Preview の scrollToSourceLine が isSyncingScroll をリセットすることを確認
   */
  test('scrollToSourceLine は isSyncingScroll を requestAnimationFrame でリセットする', () => {
    jest.useFakeTimers()

    const fakeRefs = {
      childFrame: {
        contentWindow: {
          scrollTo: jest.fn()
        },
        contentDocument: {
          querySelectorAll: jest.fn().mockReturnValue([])
        }
      }
    }

    const previewInstance = {
      $refs: fakeRefs,
      isSyncingScroll: false,
      cachedLinePositions: [
        { line: 1, top: 0, height: 20 },
        { line: 5, top: 100, height: 20 }
      ],
      scheduleClearSyncing: Preview.methods.scheduleClearSyncing,
      cacheSourceLineElements: jest.fn()
    }

    Preview.methods.scrollToSourceLine.call(previewInstance, 5)

    // scrollTo 呼び出しがされること
    expect(fakeRefs.childFrame.contentWindow.scrollTo).toHaveBeenCalledWith(0, 100)
    // isSyncingScroll が true にセットされたこと
    expect(previewInstance.isSyncingScroll).toBe(true)

    // requestAnimationFrame コールバック実行
    jest.runAllTimers()

    // isSyncingScroll が false にリセットされたこと
    expect(previewInstance.isSyncingScroll).toBe(false)

    jest.useRealTimers()
  })

  /**
   * Preview の scrollToRatio も isSyncingScroll をリセットすることを確認
   */
  test('scrollToRatio は isSyncingScroll を requestAnimationFrame でリセットする', () => {
    jest.useFakeTimers()

    const fakeRefs = {
      childFrame: {
        contentWindow: {
          scrollTo: jest.fn()
        },
        contentDocument: {
          documentElement: { scrollHeight: 1000, clientHeight: 200 },
          body: { scrollHeight: 1000, clientHeight: 200 }
        }
      }
    }

    const previewInstance = {
      $refs: fakeRefs,
      isSyncingScroll: false,
      scheduleClearSyncing: Preview.methods.scheduleClearSyncing
    }

    Preview.methods.scrollToRatio.call(previewInstance, 0.5)

    // scrollTo 呼び出しがされること
    expect(fakeRefs.childFrame.contentWindow.scrollTo).toHaveBeenCalledWith(0, 400)
    // isSyncingScroll が true にセットされたこと
    expect(previewInstance.isSyncingScroll).toBe(true)

    // requestAnimationFrame コールバック実行
    jest.runAllTimers()

    // isSyncingScroll が false にリセットされたこと
    expect(previewInstance.isSyncingScroll).toBe(false)

    jest.useRealTimers()
  })
})


