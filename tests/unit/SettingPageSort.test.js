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
      automaticLayout: true,
      unicodeHighlight: { ambiguousCharacters: false },
      minimap: { enabled: true }
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
    state: {
      noteKeyList: []
    },
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
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
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
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
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

describe('SettingPage.vue - Markdown Mermaid setting', () => {
  test('Markdown の設定画面に Mermaid チェックボックスが表示される', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    await wrapper.find('.TabListButton[data-uri="3"]').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Mermaid - Set ON to enable Mermaid')
    expect(wrapper.text()).toContain('PlantUML - Set ON to enable PlantUML')
  })

  test('Mermaid 設定を変更すると setConfig が dispatch される', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    wrapper.vm.localConfig.markdown.mermaid = false
    await nextTick()

    expect(storeMock.dispatch).toHaveBeenCalledWith('setConfig', expect.objectContaining({
      markdown: expect.objectContaining({ mermaid: false })
    }))
  })
})

describe('SettingPage.vue - TabList active state', () => {
  test('General -> Editor -> Markdown の順で active な TabListItem が切り替わる', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    const activeItemText = () => wrapper.find('.TabListItem.active .TabListButton').text()
    const clickTab = async (uri) => {
      await wrapper.find(`.TabListButton[data-uri="${uri}"]`).trigger('click')
      await nextTick()
    }

    expect(activeItemText()).toBe('General')

    await clickTab('2')
    expect(activeItemText()).toBe('Editor')

    await clickTab('3')
    expect(activeItemText()).toBe('Markdown')
  })
})

describe('SettingPage.vue - Import Note Entry', () => {
  test('note_ の文字列値をオブジェクトへ正規化して importProject に委譲する', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          TabList: true,
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    const rawNote = '{"v":0.1,"id":1685462439561,"gistid":"","files":{"index.md":{"filename":"index.md","content":"x"}},"public":true,"createdTime":1,"lastUpdatedTime":2,"description":"","projectName":"note_1685462439561"}'
    await wrapper.vm.importNoteEntry('note_1685462439561', {
      note_1685462439561: rawNote
    })

    expect(storeMock.dispatch).toHaveBeenCalledWith('importProject', expect.objectContaining({
      projectName: 'note_1685462439561'
    }))
  })

  test('オブジェクト値は importProject に委譲し projectName を補完する', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          TabList: true,
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    const objNote = {
      files: {
        'index.md': { filename: 'index.md', content: 'x' }
      }
    }
    wrapper.vm.importNoteEntry('note_999', {
      note_999: objNote
    })

    expect(storeMock.dispatch).toHaveBeenCalledWith('importProject', expect.objectContaining({
      projectName: 'note_999',
      files: objNote.files
    }))
  })

  test('外側のnoteキーを保存キーとして優先する', async () => {
    const storeMock = createStoreMock()
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          TabList: true,
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await wrapper.vm.importNoteEntry('note_backup_key', {
      note_backup_key: {
        projectName: 'note_different_project_name',
        files: {
          'index.md': { filename: 'index.md', content: 'x' }
        }
      }
    })

    expect(storeMock.dispatch).toHaveBeenCalledWith('importProject', expect.objectContaining({
      projectName: 'note_backup_key'
    }))
  })

  test('インポート完了後に永続化済みのノート一覧を再同期する', async () => {
    const storeMock = createStoreMock()
    const getFileLegacy = jest.fn().mockResolvedValue({})
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: storeMock,
          $t: (key) => key,
          $i18n: { locale: 'en' }
        },
        stubs: {
          TabList: true,
          FileDownload: {
            template: '<div />',
            methods: { getFileLegacy }
          },
          DraggableList: true,
          UniconIcon: true
        }
      }
    })
    wrapper.vm.readFile = jest.fn().mockResolvedValue(JSON.stringify({
      note_imported: { files: { 'index.md': { filename: 'index.md', content: 'x' } } }
    }))
    wrapper.vm.nextFrame = jest.fn().mockResolvedValue()

    await wrapper.vm.importLocalStorage()

    expect(storeMock.dispatch).toHaveBeenCalledWith('replaceNoteKeyList', ['note_imported'])
    expect(storeMock.dispatch).toHaveBeenCalledWith('loadNoteKeyList')
  })
})
