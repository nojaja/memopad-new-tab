import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import SettingPage from '@/components/SettingPage.vue'
import messages from '@/lang/messages.json'

function createStoreMock(locale = 'ja') {
  return {
    getters: {
      config: {
        general: {
          sort: '0',
          i18n_locale: locale,
          privacyBlur: false
        },
        editor: {
          fontSize: 16,
          tabSize: 4,
          theme: 'vs',
          automaticLayout: true,
          unicodeHighlight: { ambiguousCharacters: false },
          minimap: { enabled: true },
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

function createI18nPlugin(locale) {
  return createI18n({
    locale,
    fallbackLocale: 'en',
    messages
  })
}

describe('SettingPage.vue - i18n', () => {
  test('ja ロケールで日本語の見出しと説明が表示される', async () => {
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: createStoreMock('ja')
        },
        plugins: [createI18nPlugin('ja')],
        stubs: {
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    expect(wrapper.text()).toContain('設定')
    expect(wrapper.text()).toContain('言語')
    expect(wrapper.text()).toContain('Privacy Blur - ウィンドウが非アクティブの間、画面をぼかします。')
  })

  test('Settings 画面で言語を ja -> en に切り替えると文言が即時反映される', async () => {
    const wrapper = mount(SettingPage, {
      global: {
        mocks: {
          $store: createStoreMock('ja')
        },
        plugins: [createI18nPlugin('ja')],
        stubs: {
          FileDownload: true,
          DraggableList: true,
          UniconIcon: true
        }
      }
    })

    await Promise.resolve()
    await nextTick()

    const selects = wrapper.findAll('select.option')
    await selects.at(1).setValue('en')
    await nextTick()

    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Language')
    expect(wrapper.text()).toContain('Privacy Blur - Set ON to blur the screen when the window is inactive.')
  })

  test('messages.json の SettingPage キーセットは en/ja で一致する', () => {
    const flatten = (obj, base = '', out = []) => {
      Object.keys(obj).forEach((key) => {
        const next = base ? `${base}.${key}` : key
        if (obj[key] && typeof obj[key] === 'object') {
          flatten(obj[key], next, out)
        } else {
          out.push(next)
        }
      })
      return out
    }

    const enKeys = flatten(messages.en.message.SettingPage).sort()
    const jaKeys = flatten(messages.ja.message.SettingPage).sort()

    expect(jaKeys).toEqual(enKeys)
  })
})
