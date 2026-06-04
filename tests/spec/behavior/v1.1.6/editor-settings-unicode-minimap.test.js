/**
 * v1.1.6 Editor 設定拡張
 * - unicodeHighlight.ambiguousCharacters (default: false)
 * - minimap.enabled (default: false)
 * の normalizeConfig 動作を検証する
 */

const storeModule = require('@/store/index').default

describe('normalizeConfig — unicodeHighlight / minimap デフォルト値補完', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('旧設定に unicodeHighlight が存在しない場合、デフォルト値 false が補完される', () => {
    // 旧設定を localStorage へ書き込む（unicodeHighlight なし）
    const oldConfig = JSON.stringify({
      general: { sort: '0', i18n_locale: 'ja', privacyBlur: false },
      editor: { automaticLayout: true, fontSize: 16, tabSize: 4, theme: 'vs' },
      markdown: {}
    })
    window.localStorage.setItem('config', oldConfig)

    storeModule.commit('loadConfig')

    const config = storeModule.getters.config
    expect(config.editor.unicodeHighlight).toBeDefined()
    expect(config.editor.unicodeHighlight.ambiguousCharacters).toBe(false)
    expect(config.editor.unicodeHighlight.invisibleCharacters).toBe(false)
  })

  test('旧設定に minimap が存在しない場合、デフォルト値 false が補完される', () => {
    const oldConfig = JSON.stringify({
      general: { sort: '0', i18n_locale: 'ja', privacyBlur: false },
      editor: { automaticLayout: true, fontSize: 16, tabSize: 4, theme: 'vs' },
      markdown: {}
    })
    window.localStorage.setItem('config', oldConfig)

    storeModule.commit('loadConfig')

    const config = storeModule.getters.config
    expect(config.editor.minimap).toBeDefined()
    expect(config.editor.minimap.enabled).toBe(false)
  })

  test('既存設定の unicodeHighlight.ambiguousCharacters が true の場合、上書きされない', () => {
    const savedConfig = JSON.stringify({
      general: { sort: '0', i18n_locale: 'ja', privacyBlur: false },
      editor: {
        automaticLayout: true,
        fontSize: 16,
        tabSize: 4,
        theme: 'vs',
        unicodeHighlight: { ambiguousCharacters: true }
      },
      markdown: {}
    })
    window.localStorage.setItem('config', savedConfig)

    storeModule.commit('loadConfig')

    const config = storeModule.getters.config
    expect(config.editor.unicodeHighlight.ambiguousCharacters).toBe(true)
  })

  test('既存設定の minimap.enabled が false の場合、上書きされない', () => {
    const savedConfig = JSON.stringify({
      general: { sort: '0', i18n_locale: 'ja', privacyBlur: false },
      editor: {
        automaticLayout: true,
        fontSize: 16,
        tabSize: 4,
        theme: 'vs',
        minimap: { enabled: false }
      },
      markdown: {}
    })
    window.localStorage.setItem('config', savedConfig)

    storeModule.commit('loadConfig')

    const config = storeModule.getters.config
    expect(config.editor.minimap.enabled).toBe(false)
  })
})
