const { shallowMount } = require('@vue/test-utils')
const Monaco = require('@/components/Monaco.vue').default

jest.mock('monaco-editor-vue3', () => ({
  CodeEditor: { template: '<div />' }
}), { virtual: true })

describe('Monaco.vue - v1.3.15 editor option mapping', () => {
  test('wrapping=false のとき wordWrap=off へ変換される', () => {
    const wrapper = shallowMount(Monaco, {
      props: {
        source: '',
        config: {
          theme: 'vs',
          wrapping: false,
          wrappingColumn: 120
        }
      }
    })

    expect(wrapper.vm.editorOptions.wordWrap).toBe('off')
    expect(wrapper.vm.editorOptions.wordWrapColumn).toBeUndefined()
    expect(wrapper.vm.editorOptions.wrapping).toBeUndefined()
    expect(wrapper.vm.editorOptions.wrappingColumn).toBeUndefined()
  })

  test('wrapping=true かつ wrappingColumn=0 のとき wordWrap=on へ変換される', () => {
    const wrapper = shallowMount(Monaco, {
      props: {
        source: '',
        config: {
          theme: 'vs',
          wrapping: true,
          wrappingColumn: 0
        }
      }
    })

    expect(wrapper.vm.editorOptions.wordWrap).toBe('on')
    expect(wrapper.vm.editorOptions.wordWrapColumn).toBeUndefined()
  })

  test('wrapping=true かつ wrappingColumn>0 のとき wordWrapColumn に変換される', () => {
    const wrapper = shallowMount(Monaco, {
      props: {
        source: '',
        config: {
          theme: 'vs',
          wrapping: true,
          wrappingColumn: 140
        }
      }
    })

    expect(wrapper.vm.editorOptions.wordWrap).toBe('wordWrapColumn')
    expect(wrapper.vm.editorOptions.wordWrapColumn).toBe(140)
  })
})