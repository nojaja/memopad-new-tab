import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettingPage from '@/components/SettingPage.vue'

function createStoreMock(configOverride = {}) {
  const baseConfig = {
    general: {
      sort: '0',
      i18n_locale: 'ja',
      privacyBlur: false,
      lastExportDataAt: ''
    },
    editor: {
      fontSize: 16,
      tabSize: 4,
      theme: 'vs',
      automaticLayout: true,
      unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
      minimap: { enabled: false },
      lineNumbers: 'on',
      insertSpaces: true,
      wrapping: false,
      wrappingColumn: 300,
      autoClosingBrackets: 'always',
      syncEditorToPreview: false
    },
    markdown: {
      basicOption: {
        html: true,
        breaks: true,
        linkify: true,
        typography: true
      },
      emoji: true,
      ruby: true,
      mermaid: true,
      uml: true,
      multimdTable: true,
      multimdTableOption: {
        multiline: true,
        rowspan: true,
        headerless: true
      },
      multibyteconvert: true,
      multibyteconvertList: [['^a$', 'b']],
      multibytePresetSelected: 'プリセット',
      multibytePresetList: [
        { name: 'プリセット', rules: [['^a$', 'b']] },
        { name: 'work', rules: [['^x$', 'y']] }
      ]
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
        },
        editor: {
          ...baseConfig.editor,
          ...(configOverride.editor || {})
        },
        markdown: {
          ...baseConfig.markdown,
          ...(configOverride.markdown || {})
        }
      }
    },
    dispatch: jest.fn(() => Promise.resolve())
  }
}

function mountSettingPage(storeMock) {
  return mount(SettingPage, {
    global: {
      mocks: {
        $store: storeMock,
        $t: (key) => key,
        $i18n: { locale: 'ja' }
      },
      stubs: {
        FileDownload: true,
        DraggableList: true,
        UniconIcon: true
      }
    }
  })
}

describe('SettingPage.vue - multibyte preset v1.3.16', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('Markdown タブにプリセットUIが表示される', async () => {
    const wrapper = mountSettingPage(createStoreMock())

    await Promise.resolve()
    await nextTick()
    await wrapper.find('.TabListButton[data-uri="3"]').trigger('click')
    await nextTick()

    expect(wrapper.find('.multibyte-preset-select').exists()).toBe(true)
    expect(wrapper.find('.multibyte-preset-load').exists()).toBe(true)
    expect(wrapper.find('.multibyte-preset-save').exists()).toBe(true)
    expect(wrapper.find('.multibyte-preset-delete').exists()).toBe(true)
  })

  test('読み込みで選択プリセットのルールに洗い替えされる', async () => {
    const wrapper = mountSettingPage(createStoreMock())

    await Promise.resolve()
    await nextTick()

    wrapper.vm.localConfig.markdown.multibytePresetSelected = 'work'
    wrapper.vm.localConfig.markdown.multibyteconvertList = [['^from$', 'old']]

    jest.spyOn(window, 'confirm').mockReturnValue(true)

    wrapper.vm.loadSelectedMultibytePreset()
    await nextTick()

    expect(wrapper.vm.localConfig.markdown.multibyteconvertList).toEqual([['^x$', 'y']])
  })

  test('保存で同名プリセットを上書きできる', async () => {
    const wrapper = mountSettingPage(createStoreMock())

    await Promise.resolve()
    await nextTick()

    wrapper.vm.localConfig.markdown.multibyteconvertList = [['^new$', 'value']]

    jest.spyOn(window, 'prompt').mockReturnValue('work')
    jest.spyOn(window, 'confirm').mockReturnValue(true)

    wrapper.vm.saveCurrentMultibytePreset()
    await nextTick()

    const saved = wrapper.vm.localConfig.markdown.multibytePresetList.find((preset) => preset.name === 'work')
    expect(saved.rules).toEqual([['^new$', 'value']])
    expect(wrapper.vm.localConfig.markdown.multibytePresetSelected).toBe('work')
  })

  test('削除で プリセット は保護される', async () => {
    const wrapper = mountSettingPage(createStoreMock())

    await Promise.resolve()
    await nextTick()

    wrapper.vm.localConfig.markdown.multibytePresetSelected = 'プリセット'

    jest.spyOn(window, 'confirm').mockReturnValue(true)

    wrapper.vm.deleteSelectedMultibytePreset()
    await nextTick()

    const names = wrapper.vm.localConfig.markdown.multibytePresetList.map((preset) => preset.name)
    expect(names).toContain('プリセット')
  })
})
