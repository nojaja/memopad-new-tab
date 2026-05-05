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
    render: jest.fn((id, code, container) => {
      return Promise.resolve({ svg: '<svg><text>mermaid</text></svg>' })
    }),
    mermaidAPI: {
      render: jest.fn((id, code, container) => {
        return Promise.resolve({ svg: '<svg><text>mermaid</text></svg>' })
      })
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

  test('beforeUnmount でエディターが null になる', () => {
    wrapper.vm.editor = { layout: jest.fn() }
    wrapper.unmount()
    // unmount 後は editor が null になる（beforeUnmount フック）
    // wrapper.vm は unmount 後も参照できる
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
    checkbox: false
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
    expect(parser1).toBe(parser2)
  })

  test('config.emoji false のとき例外が発生しない', () => {
    const cfg = { ...defaultConfig, emoji: false, ruby: false, multimdTable: false }
    wrapper = shallowMount(Preview, { props: { source: '# テスト', config: cfg } })
    expect(() => wrapper.vm.renderMarkdown()).not.toThrow()
  })

  test('config.mermaid true のとき Mermaid 記法をレンダリングできる', async () => {
    const cfg = { ...defaultConfig, mermaid: true }
    wrapper = shallowMount(Preview, {
      props: {
        source: '```mermaid\ngraph TD\n  A --> B\n```',
        config: cfg
      }
    })
    await expect(wrapper.vm.renderMarkdown()).resolves.not.toThrow()
    await wrapper.vm.updateCompiledMarkdown()
    const compiled = wrapper.vm.compiledMarkdown
    expect(typeof compiled).toBe('string')
    expect(compiled).toContain('mermaid')
  })
})
