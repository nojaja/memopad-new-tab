import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettingPage from '@/components/SettingPage.vue'

function createStoreMock() {
  return {
    getters: {
      config: {
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
            breaks: false,
            linkify: true,
            typography: true
          },
          emoji: true,
          ruby: true,
          uml: true,
          mermaid: true,
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
    },
    dispatch: jest.fn(() => Promise.resolve())
  }
}

describe('SettingPage.vue - v1.3.15 editor options', () => {
  test('lineNumbers を off にすると setConfig に反映される', async () => {
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

    wrapper.vm.localConfig.editor.lineNumbers = 'off'
    await nextTick()

    expect(storeMock.dispatch).toHaveBeenCalledWith('setConfig', expect.objectContaining({
      editor: expect.objectContaining({ lineNumbers: 'off' })
    }))
  })

  test('normalizeWrappingColumn は 0 未満を 0 に補正する', async () => {
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

    wrapper.vm.localConfig.editor.wrappingColumn = -5
    wrapper.vm.normalizeWrappingColumn()

    expect(wrapper.vm.localConfig.editor.wrappingColumn).toBe(0)
  })
})