/**
 * Monaco.vue と Preview.vue のメソッドカバレッジ追加テスト
 */
const { shallowMount } = require('@vue/test-utils')
const Monaco = require('@/components/Monaco.vue').default
const Preview = require('@/components/Preview.vue').default

// monaco-editor-vue3 モック
jest.mock('monaco-editor-vue3', () => ({
  CodeEditor: { template: '<div/>' }
}), { virtual: true })

// mermaid モジュールを Jest 環境用にモック
jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(() => Promise.resolve({ svg: '<svg><text>mermaid</text></svg>' })),
    mermaidAPI: {
      render: jest.fn(() => Promise.resolve({ svg: '<svg><text>mermaid</text></svg>' }))
    }
  }
}), { virtual: true })

// editorCompletions モック
jest.mock('@/editorCompletions', () => ({
  registerCompletions: jest.fn()
}), { virtual: true })

describe('Monaco.vue メソッドテスト', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallowMount(Monaco, {
      global: {
        stubs: { CodeEditor: true }
      },
      props: {
        source: '# テスト',
        config: { theme: 'vs-dark', fontSize: 14, automaticLayout: true }
      }
    })
  })

  test('コンポーネントがマウントされる', () => {
    expect(wrapper.exists()).toBe(true)
  })

  test('editorTheme computed が config.theme を返す', () => {
    expect(wrapper.vm.editorTheme).toBe('vs-dark')
  })

  test('editorTheme computed が config なしのとき "vs" を返す', async () => {
    await wrapper.setProps({ config: null })
    expect(wrapper.vm.editorTheme).toBe('vs')
  })

  test('editorOptions computed が theme を除いたオプションを返す', () => {
    const options = wrapper.vm.editorOptions
    expect(options.theme).toBeUndefined()
    expect(options.fontSize).toBe(14)
  })

  test('handleEditorDidMount でエディターが設定される', () => {
    const fakeEditor = { layout: jest.fn() }
    wrapper.vm.handleEditorDidMount(fakeEditor)
    expect(wrapper.vm.editor).toStrictEqual(fakeEditor)
  })

  test('handleChange で文字列以外は emit されない', () => {
    wrapper.vm.handleChange(123)
    const emitted = wrapper.emitted('update:source')
    expect(emitted).toBeFalsy()
  })

  test('handleChange で source と同じ値は emit されない', () => {
    wrapper.vm.handleChange('# テスト')
    const emitted = wrapper.emitted('update:source')
    expect(emitted).toBeFalsy()
  })

  test('handleChange で別の値は emit される', () => {
    wrapper.vm.handleChange('# 変更後')
    const emitted = wrapper.emitted('update:source')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toBe('# 変更後')
  })

  test('mouseenter で editorFocus を emit する', async () => {
    await wrapper.trigger('mouseenter')
    expect(wrapper.emitted('editorFocus')).toBeTruthy()
  })

  test('resize でエディターが null のとき例外が発生しない', () => {
    wrapper.vm.editor = null
    expect(() => wrapper.vm.resize()).not.toThrow()
  })

  test('resize でエディターがある場合 layout が呼ばれる', () => {
    const fakeEditor = { layout: jest.fn() }
    wrapper.vm.editor = fakeEditor
    wrapper.vm.resize()
    expect(fakeEditor.layout).toHaveBeenCalled()
  })

  test('editorScroll イベントが getVisibleRanges から発火する', () => {
    const fakeEditor = {
      getVisibleRanges: jest.fn().mockReturnValue([{ startLineNumber: 10 }]),
      onDidScrollChange: jest.fn((callback) => {
        fakeEditor._callback = callback
        return { dispose: jest.fn() }
      }),
      setScrollTop: jest.fn()
    }
    wrapper.vm.handleEditorDidMount(fakeEditor)
    fakeEditor._callback()
    expect(wrapper.emitted('editorScroll')[0][0]).toBe(10)
  })

  test('scrollToSourceLine で revealLineInCenter が呼ばれる', () => {
    wrapper.vm.editor = {
      revealLineInCenter: jest.fn(),
      revealLineNearTop: jest.fn()
    }
    wrapper.vm.scrollToSourceLine(12)
    expect(wrapper.vm.editor.revealLineInCenter).toHaveBeenCalledWith(12)
    expect(wrapper.vm.editor.revealLineNearTop).not.toHaveBeenCalled()
  })

  test('scrollToSourceLine で revealLineInCenter がない場合 revealLineNearTop が呼ばれる', () => {
    wrapper.vm.editor = {
      revealLineNearTop: jest.fn()
    }
    wrapper.vm.scrollToSourceLine(15)
    expect(wrapper.vm.editor.revealLineNearTop).toHaveBeenCalledWith(15)
  })

  test('scrollToRatio で programmatic scroll が設定される', () => {
    wrapper.vm.editor = {
      getScrollHeight: jest.fn().mockReturnValue(1000),
      getDomNode: jest.fn().mockReturnValue({ clientHeight: 200 }),
      setScrollTop: jest.fn()
    }
    wrapper.vm.scrollToRatio(0.5)
    expect(wrapper.vm.editor.setScrollTop).toHaveBeenCalledWith(400)
  })

  test('scrollToSourceLine は requestAnimationFrame 後に isProgrammaticScroll を解除する', () => {
    const originalRaf = global.requestAnimationFrame
    global.requestAnimationFrame = (callback) => {
      callback()
      return 1
    }

    wrapper.vm.editor = {
      revealLineInCenter: jest.fn()
    }
    wrapper.vm.isProgrammaticScroll = false

    wrapper.vm.scrollToSourceLine(8)

    expect(wrapper.vm.editor.revealLineInCenter).toHaveBeenCalledWith(8)
    expect(wrapper.vm.isProgrammaticScroll).toBe(false)

    global.requestAnimationFrame = originalRaf
  })

  test('beforeUnmount でエディターが null になる', () => {
    wrapper.vm.editor = { layout: jest.fn() }
    wrapper.unmount()
    expect(wrapper.vm.editor).toBeNull()
  })
})

describe('Preview.vue メソッドテスト', () => {
  let wrapper

  const defaultConfig = {
    basicOption: {
      html: true,
      breaks: false,
      linkify: true,
      typography: true
    },
    emoji: true,
    ruby: true,
    uml: false,
    multimdTable: true,
    multimdTableOption: { multiline: true, rowspan: true, headerless: true },
    checkbox: false,
    mermaid: false
  }

  test('コンポーネントがマウントされる', () => {
    wrapper = shallowMount(Preview, { props: { source: '# テスト', config: defaultConfig } })
    expect(wrapper.exists()).toBe(true)
  })

  test('compiledMarkdown が HTML を返す', async () => {
    wrapper = shallowMount(Preview, { props: { source: '# テスト', config: defaultConfig } })
    await wrapper.vm.updateCompiledMarkdown()
    const compiled = wrapper.vm.compiledMarkdown
    expect(typeof compiled).toBe('string')
    expect(compiled).toContain('DOCTYPE html')
  })

  test('iframe hover で previewFocus が emit される', async () => {
    wrapper = shallowMount(Preview, { props: { source: '# テスト', config: defaultConfig } })
    const iframe = wrapper.find('iframe')
    await iframe.trigger('mouseenter')
    expect(wrapper.emitted('previewFocus')).toBeTruthy()
  })

  test('source watcher は現在の表示行を用いて updateIframeContent を呼ぶ', () => {
    const updateSpy = jest.fn()
    Preview.watch.source.call({
      hasIframeLoaded: true,
      getVisibleSourceLine: jest.fn().mockReturnValue(12),
      updateIframeContent: updateSpy,
      refreshPreview: Preview.methods.refreshPreview
    })
    expect(updateSpy).toHaveBeenCalledWith(12)
  })

  test('autoUpdate false のとき renderMarkdown が呼ばれない', async () => {
    wrapper = shallowMount(Preview, {
      props: { source: '# テスト', autoUpdate: false, config: defaultConfig }
    })
    await wrapper.vm.updateCompiledMarkdown()
    const compiled = wrapper.vm.compiledMarkdown
    expect(compiled).not.toContain('<h1')
  })

  test('getMarkdownParser のキャッシュが使われる', () => {
    wrapper = shallowMount(Preview, { props: { source: '# テスト', config: defaultConfig } })
    const parser1 = wrapper.vm.getMarkdownParser()
    const parser2 = wrapper.vm.getMarkdownParser()
    expect(parser1).toStrictEqual(parser2)
  })

  test('config.emoji false のとき例外が発生しない', async () => {
    const cfg = { ...defaultConfig, emoji: false, ruby: false, multimdTable: false }
    wrapper = shallowMount(Preview, { props: { source: '# テスト', config: cfg } })
    await expect(wrapper.vm.renderMarkdown()).resolves.toContain('テスト')
  })

  test('config.mermaid true のとき Mermaid 記法をレンダリングできる', async () => {
    const cfg = { ...defaultConfig, mermaid: true }
    wrapper = shallowMount(Preview, {
      props: {
        source: '```mermaid\ngraph TD\n  A --> B\n```',
        config: cfg
      }
    })
    await expect(wrapper.vm.renderMarkdown()).resolves.toContain('<svg>')
    await wrapper.vm.updateCompiledMarkdown()
    const compiled = wrapper.vm.compiledMarkdown
    expect(typeof compiled).toBe('string')
    expect(compiled).toContain('mermaid')
  })

  test('config.mermaid false のとき連続レンダリングでもコードブロックが壊れない', async () => {
    wrapper = shallowMount(Preview, {
      props: {
        source: '```mermaid\ngraph TD\n  A --> B\n```',
        config: defaultConfig
      }
    })

    const firstHtml = await wrapper.vm.renderMarkdown()
    const secondHtml = await wrapper.vm.renderMarkdown()

    expect(firstHtml).toContain('<pre><code class="language-mermaid">')
    expect(secondHtml).toContain('<pre><code class="language-mermaid">')
    expect(secondHtml).toContain('</code></pre>')
  })

  test('renderMarkdown に data-source-line 属性が埋め込まれる', async () => {
    wrapper = shallowMount(Preview, { props: { source: '# 見出し\n\n本文', config: defaultConfig } })
    const html = await wrapper.vm.renderMarkdown()
    expect(html).toContain('data-source-line="1"')
    expect(html).toContain('data-source-line="3"')
  })

  test('Preview.getVisibleSourceLine が最上部要素の行番号を返す', () => {
    const fakeRefs = {
      childFrame: {
        contentWindow: { scrollY: 50 },
        contentDocument: {
          querySelectorAll: jest.fn(() => [
            { offsetTop: 0, offsetHeight: 20, getAttribute: () => '1' },
            { offsetTop: 60, offsetHeight: 20, getAttribute: () => '3' }
          ]),
          documentElement: { scrollHeight: 100, clientHeight: 100 },
          body: { scrollHeight: 100, clientHeight: 100 }
        }
      }
    }
    expect(Preview.methods.getVisibleSourceLine.call({ $refs: fakeRefs })).toBe(3)
  })

  test('Preview.getVisibleSourceLine はキャッシュされた要素を使う', () => {
    const fakeRefs = {
      childFrame: {
        contentWindow: { scrollY: 50 },
        contentDocument: {
          querySelectorAll: jest.fn(() => []),
          documentElement: { scrollHeight: 100, clientHeight: 100 },
          body: { scrollHeight: 100, clientHeight: 100 }
        }
      }
    }
    const cachedPositions = [
      { line: 1, top: 0, height: 20 },
      { line: 3, top: 60, height: 20 }
    ]
    expect(Preview.methods.getVisibleSourceLine.call({ $refs: fakeRefs, cachedLinePositions: cachedPositions })).toBe(3)
    expect(fakeRefs.childFrame.contentDocument.querySelectorAll).not.toHaveBeenCalled()
  })

  test('Preview.attachIframeScroll で連続スクロール時も 10 秒以内に処理が完了する', async () => {
    jest.setTimeout(10000)
    const emitSpy = jest.fn()
    const onIframeActivate = jest.fn()
    const fakeRefs = {
      childFrame: {
        contentWindow: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          scrollY: 0
        },
        contentDocument: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }
      }
    }

    Preview.methods.attachIframeScroll.call({
      $refs: fakeRefs,
      onIframeActivate,
      isSyncingScroll: false,
      $emit: emitSpy,
      getVisibleSourceLine: jest.fn().mockReturnValue(1),
      removeListener: Preview.methods.removeListener,
      getIframeContext: Preview.methods.getIframeContext,
      emitPreviewScroll: Preview.methods.emitPreviewScroll
    })

    const onIframeScroll = fakeRefs.childFrame.contentWindow.addEventListener.mock.calls.find(
      (args) => args[0] === 'scroll'
    )[1]

    onIframeScroll()
    onIframeScroll()
    onIframeScroll()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(emitSpy).toHaveBeenCalledTimes(1)
    expect(emitSpy).toHaveBeenCalledWith('previewScroll', 1)
  })

  test('Preview.scrollToSourceLine が iframe をスクロールする', () => {
    const scrollToMock = jest.fn()
    const fakeRefs = {
      childFrame: {
        contentWindow: { scrollTo: scrollToMock },
        contentDocument: {
          querySelectorAll: jest.fn(() => [
            { getAttribute: () => '1', offsetTop: 0, offsetHeight: 0 },
            { getAttribute: () => '5', offsetTop: 400, offsetHeight: 0 }
          ]),
          documentElement: { scrollHeight: 1000, clientHeight: 200 },
          body: { scrollHeight: 1000, clientHeight: 200 }
        }
      }
    }
    Preview.methods.scrollToSourceLine.call({ $refs: fakeRefs, isSyncingScroll: false, scheduleClearSyncing: Preview.methods.scheduleClearSyncing }, 5)
    expect(scrollToMock).toHaveBeenCalledWith(0, 400)
  })

  test('Preview.scrollToSourceLine はキャッシュされた行位置を使う', () => {
    const scrollToMock = jest.fn()
    const fakeRefs = {
      childFrame: {
        contentWindow: { scrollTo: scrollToMock },
        contentDocument: {
          querySelectorAll: jest.fn(() => [{ getAttribute: () => '1', offsetTop: 0, offsetHeight: 0 }]),
          documentElement: { scrollHeight: 1000, clientHeight: 200 },
          body: { scrollHeight: 1000, clientHeight: 200 }
        }
      }
    }
    const cachedPositions = [
      { line: 1, top: 0, height: 20 },
      { line: 5, top: 400, height: 20 }
    ]
    Preview.methods.scrollToSourceLine.call({ $refs: fakeRefs, cachedLinePositions: cachedPositions, isSyncingScroll: false, scheduleClearSyncing: Preview.methods.scheduleClearSyncing }, 5)
    expect(scrollToMock).toHaveBeenCalledWith(0, 400)
    expect(fakeRefs.childFrame.contentDocument.querySelectorAll).not.toHaveBeenCalled()
  })

  test('attachIframeScroll で iframe 内スクロールは previewScroll のみを発火する（emitは非同期）', async () => {
    const emitSpy = jest.fn()
    const onIframeActivate = jest.fn()
    const fakeRefs = {
      childFrame: {
        contentWindow: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          scrollY: 0
        },
        contentDocument: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }
      }
    }

    Preview.methods.attachIframeScroll.call({
      $refs: fakeRefs,
      onIframeActivate,
      isSyncingScroll: false,
      $emit: emitSpy,
      getVisibleSourceLine: jest.fn().mockReturnValue(1),
      removeListener: Preview.methods.removeListener,
      getIframeContext: Preview.methods.getIframeContext,
      emitPreviewScroll: Preview.methods.emitPreviewScroll
    })

    expect(fakeRefs.childFrame.contentWindow.addEventListener).toHaveBeenCalledWith(
      'scroll', expect.any(Function),
      { passive: true }
    )
    expect(fakeRefs.childFrame.contentDocument.addEventListener).toHaveBeenCalledWith(
      'pointerdown', onIframeActivate
    )

    const onIframeScroll = fakeRefs.childFrame.contentWindow.addEventListener.mock.calls.find(
      (args) => args[0] === 'scroll'
    )[1]
    onIframeScroll()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(emitSpy).not.toHaveBeenCalledWith('previewFocus')
    expect(emitSpy).toHaveBeenCalledWith('previewScroll', 1)
  })

  test('Preview.getIframeScrollRatio が iframe のスクロール比率を返す', () => {
    const fakeRefs = {
      childFrame: {
        contentWindow: { scrollY: 250, scrollTo: jest.fn() },
        contentDocument: {
          documentElement: { scrollHeight: 1000, clientHeight: 200, scrollTop: 250 },
          body: { scrollHeight: 1000, clientHeight: 200, scrollTop: 250 }
        }
      }
    }
    expect(Preview.methods.getIframeScrollRatio.call({ $refs: fakeRefs })).toBeCloseTo(0.3125)
  })

  test('Preview.scrollToRatio が iframe をスクロールする', () => {
    const scrollToMock = jest.fn()
    const fakeRefs = {
      childFrame: {
        contentWindow: { scrollTo: scrollToMock },
        contentDocument: {
          documentElement: { scrollHeight: 1000, clientHeight: 200 },
          body: { scrollHeight: 1000, clientHeight: 200 }
        }
      }
    }
    Preview.methods.scrollToRatio.call({
      $refs: fakeRefs,
      isSyncingScroll: false,
      scheduleClearSyncing: Preview.methods.scheduleClearSyncing
    }, 0.5)
    expect(scrollToMock).toHaveBeenCalledWith(0, 400)
  })
})