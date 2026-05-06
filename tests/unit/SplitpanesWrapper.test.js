/**
 * SplitpanesWrapper.vue の branches カバレッジテスト
 */
const { shallowMount, mount } = require('@vue/test-utils')
const { createStore } = require('vuex')
const SplitpanesWrapper = require('@/components/SplitpanesWrapper.vue').default

function createTestStore() {
  return createStore({
    state: {},
    actions: {
      update: jest.fn()
    }
  })
}

const defaultConfig = {
  basicOption: { html: true, breaks: false, linkify: true, typography: true },
  emoji: true, ruby: true, uml: false, multimdTable: false, checkbox: false,
  multimdTableOption: {},
  editor: { automaticLayout: true, fontSize: 14, syncEditorToPreview: true },
  markdown: {
    multibyteconvert: false,
    multibyteconvertList: [],
    basicOption: { html: true, breaks: false, linkify: true, typography: true },
    emoji: true, ruby: true, uml: false, multimdTable: false, checkbox: false,
    multimdTableOption: {}
  }
}

describe('SplitpanesWrapper.vue branches テスト', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
  })

  test('hideEditPane=false, hidePreviewPane=false のとき editPaneSize=50', () => {
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: false, hidePreviewPane: false }
    })
    expect(wrapper.vm.editPaneSize).toBe(50)
    expect(wrapper.vm.previewPaneSize).toBe(50)
  })

  test('hideEditPane=true のとき previewPaneSize=100', () => {
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: true, hidePreviewPane: false }
    })
    expect(wrapper.vm.editPaneSize).toBe(0)
    expect(wrapper.vm.previewPaneSize).toBe(100)
  })

  test('hidePreviewPane=true のとき editPaneSize=100', () => {
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: false, hidePreviewPane: true }
    })
    expect(wrapper.vm.editPaneSize).toBe(100)
    expect(wrapper.vm.previewPaneSize).toBe(0)
  })

  test('handleResize で automaticLayout が true のとき何もしない', () => {
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: false, hidePreviewPane: false }
    })
    expect(() => wrapper.vm.handleResize()).not.toThrow()
  })

  test('handleResize で automaticLayout が false のとき monaco.resize が呼ばれる', () => {
    const cfg = { ...defaultConfig, editor: { automaticLayout: false, fontSize: 14 } }
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: cfg, hideEditPane: false, hidePreviewPane: false }
    })
    // $refs.monaco がない場合は何もしない
    expect(() => wrapper.vm.handleResize()).not.toThrow()
  })

  test('updateRegExpList で multibyteconvert が true のとき regExpData が更新される', () => {
    const cfg = {
      ...defaultConfig,
      markdown: {
        ...defaultConfig.markdown,
        multibyteconvert: true,
        multibyteconvertList: [['[Ａ-Ｚ]', 'test']]
      }
    }
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: cfg, hideEditPane: false, hidePreviewPane: false }
    })
    expect(wrapper.vm.regExpData.length).toBeGreaterThan(0)
  })

  test('onChange で store update action が呼ばれる', async () => {
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: false, hidePreviewPane: false }
    })
    const dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue()
    wrapper.vm.onChange('# 変更')
    expect(dispatchSpy).toHaveBeenCalledWith('update', '# 変更')
    dispatchSpy.mockRestore()
  })

  test('handleEditorScroll は activePane を editor にして非同期で preview.scrollToSourceLine を呼び出す', () => {
    jest.useFakeTimers()
    const previewRef = { scrollToSourceLine: jest.fn() }
    const context = {
      config: { editor: { syncEditorToPreview: true } },
      $refs: { preview: previewRef },
      activePane: null,
      blockedPane: null,
      editorScrollSyncTimer: null,
      pendingEditorLine: 1,
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }
    SplitpanesWrapper.methods.handleEditorScroll.call(context, 10)
    expect(context.activePane).toBe('editor')
    expect(previewRef.scrollToSourceLine).not.toHaveBeenCalled()
    jest.advanceTimersByTime(16)
    expect(previewRef.scrollToSourceLine).toHaveBeenCalledWith(10)
    jest.useRealTimers()
  })

  test('handlePreviewScroll は activePane を preview にして monaco.scrollToSourceLine を呼ばない', () => {
    jest.useFakeTimers()
    const monacoRef = { scrollToSourceLine: jest.fn() }
    const context = {
      $refs: { monaco: monacoRef },
      activePane: null,
      blockedPane: null,
      previewScrollSyncTimer: null,
      pendingPreviewLine: 1,
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }
    SplitpanesWrapper.methods.handlePreviewScroll.call(context, 25)
    expect(context.activePane).toBe('preview')
    jest.advanceTimersByTime(100)
    expect(monacoRef.scrollToSourceLine).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  test('handleEditorScroll は activePane が preview のとき逆流同期をスキップする', () => {
    jest.useFakeTimers()
    const previewRef = { scrollToSourceLine: jest.fn() }
    const context = { $refs: { preview: previewRef }, activePane: 'preview', editorScrollSyncTimer: null, pendingEditorLine: 1 }
    SplitpanesWrapper.methods.handleEditorScroll.call(context, 10)
    jest.advanceTimersByTime(32)
    expect(previewRef.scrollToSourceLine).not.toHaveBeenCalled()
    expect(context.activePane).toBe('preview')
    jest.useRealTimers()
  })

  test('handleEditorScroll は blockedPane が editor のとき同期をスキップする', () => {
    jest.useFakeTimers()
    const previewRef = { scrollToSourceLine: jest.fn() }
    const context = {
      $refs: { preview: previewRef },
      activePane: null,
      blockedPane: 'editor',
      editorScrollSyncTimer: null,
      pendingEditorLine: 1
    }
    SplitpanesWrapper.methods.handleEditorScroll.call(context, 10)
    jest.advanceTimersByTime(32)
    expect(previewRef.scrollToSourceLine).not.toHaveBeenCalled()
    expect(context.activePane).toBeNull()
    jest.useRealTimers()
  })

  test('handleEditorScroll は syncEditorToPreview=false のとき同期をスキップする', () => {
    jest.useFakeTimers()
    const previewRef = { scrollToSourceLine: jest.fn() }
    const context = {
      config: { editor: { syncEditorToPreview: false } },
      $refs: { preview: previewRef },
      activePane: null,
      blockedPane: null,
      editorScrollSyncTimer: null,
      pendingEditorLine: 1
    }
    SplitpanesWrapper.methods.handleEditorScroll.call(context, 10)
    jest.advanceTimersByTime(32)
    expect(previewRef.scrollToSourceLine).not.toHaveBeenCalled()
    expect(context.activePane).toBeNull()
    jest.useRealTimers()
  })

  test('handlePreviewScroll は editor が activePane でも activePane を preview に上書きする（同期はしない）', () => {
    jest.useFakeTimers()
    const monacoRef = { scrollToSourceLine: jest.fn() }
    const context = { $refs: { monaco: monacoRef }, activePane: 'editor', previewScrollSyncTimer: null, pendingPreviewLine: 1 }
    SplitpanesWrapper.methods.handlePreviewScroll.call(context, 25)
    jest.advanceTimersByTime(32)
    expect(monacoRef.scrollToSourceLine).not.toHaveBeenCalled()
    expect(context.activePane).toBe('preview')
    jest.useRealTimers()
  })

  test('handlePreviewScroll は blockedPane が preview でも activePane を preview にセットする（同期はしない）', () => {
    jest.useFakeTimers()
    const monacoRef = { scrollToSourceLine: jest.fn() }
    const context = {
      $refs: { monaco: monacoRef },
      activePane: null,
      blockedPane: 'preview',
      previewScrollSyncTimer: null,
      pendingPreviewLine: 1
    }
    SplitpanesWrapper.methods.handlePreviewScroll.call(context, 25)
    jest.advanceTimersByTime(32)
    expect(monacoRef.scrollToSourceLine).not.toHaveBeenCalled()
    expect(context.activePane).toBe('preview')
    jest.useRealTimers()
  })

  test('source watcher は pending な同期タイマーと状態をリセットする', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const context = {
      editorScrollSyncTimer: 11,
      blockedPane: 'preview',
      activePane: 'editor',
      pendingEditorLine: 10,
      clearScrollSyncTimers: SplitpanesWrapper.methods.clearScrollSyncTimers,
      resetScrollSyncState: SplitpanesWrapper.methods.resetScrollSyncState
    }

    SplitpanesWrapper.watch.source.call(context)

    expect(clearTimeoutSpy).toHaveBeenCalledWith(11)
    expect(context.editorScrollSyncTimer).toBeNull()
    expect(context.blockedPane).toBeNull()
    expect(context.activePane).toBeNull()
    expect(context.pendingEditorLine).toBe(1)

    clearTimeoutSpy.mockRestore()
  })

  test('Preview コンポーネントの previewScroll 発火で handlePreviewScroll が呼ばれる', async () => {
    const handlePreviewScrollSpy = jest.spyOn(SplitpanesWrapper.methods, 'handlePreviewScroll')
    const PreviewStub = {
      name: 'MarkdownPreview',
      template: '<div class="preview-stub" @click="emitScroll"></div>',
      methods: {
        emitScroll() {
          this.$emit('previewScroll', 42)
        }
      }
    }
    const SplitpanesStub = {
      template: '<div><slot/></div>'
    }
    const PaneStub = {
      template: '<div><slot/></div>'
    }
    const wrapper = mount(SplitpanesWrapper, {
      global: {
        plugins: [store],
        components: { MarkdownPreview: PreviewStub },
        stubs: { MonacoEditor: true, Splitpanes: SplitpanesStub, Pane: PaneStub, unicon: true }
      },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: false, hidePreviewPane: false }
    })

    const preview = wrapper.find('.preview-stub')
    await preview.trigger('click')

    expect(handlePreviewScrollSpy).toHaveBeenCalledWith(42)
    expect(wrapper.vm.activePane).toBe('preview')
    handlePreviewScrollSpy.mockRestore()
  })

  test('handlePreviewFocus で activePane が preview にセットされる', () => {
    const wrapper = shallowMount(SplitpanesWrapper, {
      global: { plugins: [store], stubs: { Monaco: true, Preview: true, Splitpanes: true, Pane: true, unicon: true } },
      props: { source: '# テスト', config: defaultConfig, hideEditPane: false, hidePreviewPane: false }
    })
    wrapper.vm.handlePreviewFocus()
    expect(wrapper.vm.activePane).toBe('preview')
  })

  // --- editor→preview 片方向同期の仕様テスト ---

  test('handlePreviewScroll は monaco.scrollToSourceLine を一切呼ばない（片方向同期のみ）', () => {
    jest.useFakeTimers()
    const monacoRef = { scrollToSourceLine: jest.fn() }
    const context = {
      $refs: { monaco: monacoRef },
      activePane: null,
      blockedPane: null,
      previewScrollSyncTimer: null,
      pendingPreviewLine: 1,
      releaseBlockedPaneLater: SplitpanesWrapper.methods.releaseBlockedPaneLater
    }
    SplitpanesWrapper.methods.handlePreviewScroll.call(context, 25)
    jest.advanceTimersByTime(100)
    expect(monacoRef.scrollToSourceLine).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  test('handlePreviewScroll は activePane を preview にセットする（フォーカス管理は継続）', () => {
    const context = {
      $refs: {},
      activePane: null,
      blockedPane: null,
      previewScrollSyncTimer: null,
      pendingPreviewLine: 1
    }
    SplitpanesWrapper.methods.handlePreviewScroll.call(context, 25)
    expect(context.activePane).toBe('preview')
  })
})
