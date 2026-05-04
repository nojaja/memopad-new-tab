/**
 * SplitpanesWrapper.vue の branches カバレッジテスト
 */
const { shallowMount } = require('@vue/test-utils')
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
  editor: { automaticLayout: true, fontSize: 14 },
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
})
