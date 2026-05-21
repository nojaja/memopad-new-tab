const { shallowMount } = require('@vue/test-utils')
const NoteListItemToolbar = require('@/components/NoteListItemToolbar.vue').default

describe('NoteListItemToolbar.vue', () => {
  test('ul ベースの toolbar を描画する', () => {
    const wrapper = shallowMount(NoteListItemToolbar, {
      props: {
        uri: 'note_1',
        onDelete: jest.fn()
      },
      global: {
        stubs: { unicon: true }
      }
    })

    expect(wrapper.find('ul.noteListItem-toolbar').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="delete note"]').exists()).toBe(true)
  })

  test('delete note クリックで onDelete に uri を渡す', async () => {
    const onDelete = jest.fn()
    const wrapper = shallowMount(NoteListItemToolbar, {
      props: {
        uri: 'note_99',
        onDelete
      },
      global: {
        stubs: { unicon: true }
      }
    })

    await wrapper.find('button[aria-label="delete note"]').trigger('click')
    expect(onDelete).toHaveBeenCalledWith('note_99')
  })
})
