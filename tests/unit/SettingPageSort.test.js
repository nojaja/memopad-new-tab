import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettingPage from '@/components/SettingPage.vue'

function createStoreMock(configOverride = {}) {
  const baseConfig = {
    general: {
      sort: '0',
      i18n_locale: 'ja',
      privacyBlur: false
    },
    editor: {
      fontSize: 16,
      tabSize: 4,
      theme: 'vs',
      automaticLayout: true
    },
    markdown: {
      basicOption: {
        html: true,
        breaks: false,
        linkify: true,
        typography: true
      },
      emoji: true,
      ruby: true,
      uml: true,
      multimdTable: true,
      multimdTableOption: {
        multiline: true,
        rowspan: true,
        headerless: true
      },
      multibyteconvert: false,
      multibyteconvertList: []
    }
  }

  return {
    getters: {
      config: {
        ...baseConfig,
        ...configOverride,
        general: {
          ...baseConfig.general,
          ...(configOverride.general || {})
        }
      }
    },
    dispatch: jest.fn(() => Promise.resolve())
  }
}

describe('SettingPage.vue - General Sort', () => {
  test('General の Sort に Desc Created が表示される', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock
        },
        stubs: {
          TabList: true,
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    const sortOptions = wrapper.findAll('select.option').at(0).findAll('option')
    const sortOptionTexts = sortOptions.map(option => option.text())

    expect(sortOptionTexts).toContain('Desc Created')
    expect(sortOptions.map(option => option.element.value)).toContain('2')
  })

  test('General の Sort で Desc Created を選ぶと setConfig に sort: 2 が渡る', async () => {
    const storeMock = createStoreMock({ general: { sort: '0' } })
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock
        },
        stubs: {
          TabList: true,
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    const sortSelect = wrapper.findAll('select.option').at(0)
    await sortSelect.setValue('2')
    await nextTick()

    expect(storeMock.dispatch).toHaveBeenCalledWith('setConfig', expect.objectContaining({
      general: expect.objectContaining({ sort: '2' })
    }))
  })
})