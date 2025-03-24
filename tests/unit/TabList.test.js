import { shallowMount, createLocalVue } from '@vue/test-utils'
import TabList from '@/js/components/TabList.vue'

describe('TabList.vue', () => {
  let wrapper
  const mockItems = [
    { uri: 'tab1', name: 'タブ1', isActive: false },
    { uri: 'tab2', name: 'タブ2', isActive: false },
    { uri: 'tab3', name: 'タブ3', isActive: true }
  ]
  
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    wrapper = shallowMount(TabList, {
      propsData: {
        items: mockItems,
        onSelect: mockOnSelect
      }
    })
  })

  test('コンポーネントが正しくマウントされる', () => {
    expect(wrapper.exists()).toBe(true)
  })

  test('すべてのタブが表示される', () => {
    const tabs = wrapper.findAll('.TabListItem')
    expect(tabs.length).toBe(3)
  })

  test('アクティブなタブが正しく表示される', () => {
    const activeTab = wrapper.findAll('.TabListItem.active')
    expect(activeTab.length).toBe(1)
    expect(activeTab.at(0).find('.title').text()).toBe('タブ3')
  })

  test('タブをクリックすると選択イベントが発火する', async () => {
    const firstTab = wrapper.findAll('.TabListItem-text').at(0)
    await firstTab.trigger('click')
    
    expect(mockOnSelect).toHaveBeenCalledWith('tab1')
    expect(wrapper.vm.items[0].isActive).toBe(true)
    expect(wrapper.vm.items[2].isActive).toBe(false)
  })

  test('propsのデフォルト値が正しく設定される', () => {
    const wrapper = shallowMount(TabList)
    expect(wrapper.props('items')).toEqual([])
    expect(typeof wrapper.props('onNew')).toBe('function')
    expect(typeof wrapper.props('onSelect')).toBe('function')
  })
})
