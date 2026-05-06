/**
 * エディタ側スクロール同期テスト
 *
 * 修正後の検証:
 * handleEditorScroll が同期で preview.scrollToSourceLine を呼び出し、
 * スクロール同期イベントが正しく機能することを確認する
 */
const SplitpanesWrapper = require('@/components/SplitpanesWrapper.vue').default

// monaco-editor-vue3 モック
jest.mock('monaco-editor-vue3', () => ({
  CodeEditor: { template: '<div/>' }
}), { virtual: true })

// editorCompletions モック
jest.mock('@/editorCompletions', () => ({
  registerCompletions: jest.fn()
}), { virtual: true })

describe('エディタ側スクロール同期テスト', () => {
  /**
   * handleEditorScroll が非同期で preview.scrollToSourceLine を呼び出し、
   * 2回目ノート切り替えが10秒以上遅延しないことを確認
   */
  test('handleEditorScroll 後も2回目ノート切り替えが10秒以上遅延しない', async () => {
    jest.setTimeout(20000)

    const previewMock = {
      scrollToSourceLine: jest.fn(() => {
        const start = Date.now()
        while (Date.now() - start < 11000) {}
      })
    }
    const instance = {
      config: { editor: { syncEditorToPreview: true } },
      activePane: null,
      blockedPane: null,
      editorScrollSyncTimer: null,
      pendingEditorLine: 1,
      $refs: { preview: previewMock },
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }

    const firstSwitchStart = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const firstSwitchElapsed = Date.now() - firstSwitchStart
    expect(firstSwitchElapsed).toBeLessThan(1000)

    SplitpanesWrapper.methods.handleEditorScroll.call(instance, 5)

    const secondSwitchStart = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const secondSwitchElapsed = Date.now() - secondSwitchStart

    expect(secondSwitchElapsed).toBeLessThan(10000)
    expect(instance.activePane).toBe('editor')
  })

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

    SplitpanesWrapper.methods.handleEditorScroll.call(instance, 5)

    expect(previewMock.scrollToSourceLine).not.toHaveBeenCalled()
    jest.advanceTimersByTime(16)
    expect(previewMock.scrollToSourceLine).toHaveBeenCalledWith(5)

    jest.useRealTimers()
  })

  /**
   * handleEditorScroll が存在しない preview ref に対しても安全に処理されることを確認
   */
  test('handleEditorScroll は preview ref が null でも安全に処理される', () => {
    const instance = {
      config: { editor: { syncEditorToPreview: true } },
      activePane: null,
      editorScrollSyncTimer: null,
      pendingEditorLine: 1,
      $refs: { preview: null }
    }

    // エラーなく処理される
    expect(() => SplitpanesWrapper.methods.handleEditorScroll.call(instance, 10)).not.toThrow()
    expect(instance.activePane).toBe('editor')
  })

  /**
   * handleEditorScroll が preview.scrollToSourceLine の型をチェックすることを確認
   */
  test('handleEditorScroll は preview.scrollToSourceLine が関数でない場合スキップする', () => {
    const instance = {
      config: { editor: { syncEditorToPreview: true } },
      activePane: null,
      editorScrollSyncTimer: null,
      pendingEditorLine: 1,
      $refs: { preview: { scrollToSourceLine: 'not a function' } }
    }

    // エラーなく処理される
    expect(() => SplitpanesWrapper.methods.handleEditorScroll.call(instance, 10)).not.toThrow()
    expect(instance.activePane).toBe('editor')
  })
})

