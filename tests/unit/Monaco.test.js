/**
 * Monaco.vue の動作テスト
 */
const { shallowMount } = require('@vue/test-utils')
const Monaco = require('@/components/Monaco.vue').default

describe('Monaco.vue', () => {
  test('source prop の更新で editor.setScrollTop が呼ばれない', async () => {
    const wrapper = shallowMount(Monaco, {
      global: { stubs: { CodeEditor: true } },
      props: { source: '# 初期', config: { automaticLayout: true, fontSize: 14, theme: 'vs', tabSize: 4 } }
    })

    wrapper.vm.editor = { setScrollTop: jest.fn() }

    await wrapper.setProps({ source: '# 初期\n変更後' })

    expect(wrapper.vm.editor.setScrollTop).not.toHaveBeenCalled()
  })
})
