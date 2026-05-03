/**
 * NoteList.vue のメソッドカバレッジ追加テスト
 */
const { shallowMount } = require('@vue/test-utils')
const { createStore } = require('vuex')
const NoteList = require('@/components/NoteList.vue').default

function createTestStore() {
  return createStore({
    state: {},
    getters: {
      itemList: () => ({ filter: '' })
    }
  })
}

describe('NoteList.vue メソッドテスト', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
  })

  test('コンポーネントがマウントされる', () => {
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })

  test('select メソッドが onSelect を呼ぶ', () => {
    const onSelectMock = jest.fn()
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } },
      props: { onSelect: onSelectMock, items: [{ uri: 'note_test', name: 'テスト', isActive: false }] }
    })
    wrapper.vm.select('note_test')
    expect(onSelectMock).toHaveBeenCalledWith('note_test')
  })

  test('onNew のデフォルトは空関数', () => {
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } },
      props: {}
    })
    expect(() => wrapper.vm.onNew()).not.toThrow()
  })
})
