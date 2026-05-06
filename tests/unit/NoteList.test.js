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

  test('タイトル先頭の日時プレフィックスを除去して表示する', () => {
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } },
      props: {
        items: [{ uri: 'note_1', name: '2026/05/04 11:22 サンプルタイトル', isActive: false, lastUpdatedTime: 0 }]
      }
    })

    expect(wrapper.find('.title').text()).toBe('サンプルタイトル')
  })

  test('lastUpdatedTime を yyyy/mm/dd hh24:mm 形式で2段目に表示する', () => {
    const value = Date.UTC(2026, 4, 4, 1, 2)
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } },
      props: {
        items: [{ uri: 'note_2', name: 'タイトル', isActive: false, lastUpdatedTime: value }]
      }
    })

    expect(wrapper.find('.lastUpdatedTime').exists()).toBe(true)
    expect(wrapper.find('.lastUpdatedTime').text()).toBe(wrapper.vm.formatLastUpdatedTime(value))
    expect(wrapper.find('.lastUpdatedTime').text()).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/)
  })

  test('サイドバーフォーカス中に ArrowDown で次ノートへ切り替える', () => {
    const onSelectMock = jest.fn()
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } },
      props: {
        onSelect: onSelectMock,
        items: [
          { uri: 'note_1', name: '1', isActive: true },
          { uri: 'note_2', name: '2', isActive: false }
        ]
      }
    })

    const preventDefault = jest.fn()
    wrapper.vm.handleSidebarKeydown({ key: 'ArrowDown', target: null, preventDefault })

    expect(preventDefault).toHaveBeenCalled()
    expect(onSelectMock).toHaveBeenCalledWith('note_2')
  })

  test('検索入力中の ArrowDown ではノート切り替えしない', () => {
    const onSelectMock = jest.fn()
    const wrapper = shallowMount(NoteList, {
      global: { plugins: [store], stubs: { unicon: true } },
      props: {
        onSelect: onSelectMock,
        items: [
          { uri: 'note_1', name: '1', isActive: true },
          { uri: 'note_2', name: '2', isActive: false }
        ]
      }
    })

    const inputElement = document.createElement('input')
    const preventDefault = jest.fn()
    wrapper.vm.handleSidebarKeydown({ key: 'ArrowDown', target: inputElement, preventDefault })

    expect(preventDefault).not.toHaveBeenCalled()
    expect(onSelectMock).not.toHaveBeenCalled()
  })
})
