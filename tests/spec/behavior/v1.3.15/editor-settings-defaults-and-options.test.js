/**
 * v1.3.15 Editor 設定拡張
 * - minimap.enabled default false
 * - lineNumbers: on/off
 * - insertSpaces: boolean
 * - wrapping: boolean + wrappingColumn: number
 * - autoClosingBrackets: always/never
 * の normalizeConfig 動作を検証する
 */

const storeModule = require('@/store/index').default

describe('normalizeConfig — v1.3.15 editor defaults and backward compatibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('旧設定に新規 editor 設定がない場合、v1.3.15 デフォルト値が補完される', () => {
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
    expect(config.editor.lineNumbers).toBe('on')
    expect(config.editor.insertSpaces).toBe(true)
    expect(config.editor.wrapping).toBe(false)
    expect(config.editor.wrappingColumn).toBe(300)
    expect(config.editor.autoClosingBrackets).toBe('always')
  })

  test('既存設定の v1.3.15 editor 設定値は上書きされない', () => {
    const savedConfig = JSON.stringify({
      general: { sort: '0', i18n_locale: 'ja', privacyBlur: false },
      editor: {
        automaticLayout: true,
        fontSize: 16,
        tabSize: 4,
        theme: 'vs',
        minimap: { enabled: true },
        lineNumbers: 'off',
        insertSpaces: false,
        wrapping: true,
        wrappingColumn: 0,
        autoClosingBrackets: 'never'
      },
      markdown: {}
    })
    window.localStorage.setItem('config', savedConfig)

    storeModule.commit('loadConfig')

    const config = storeModule.getters.config
    expect(config.editor.minimap.enabled).toBe(true)
    expect(config.editor.lineNumbers).toBe('off')
    expect(config.editor.insertSpaces).toBe(false)
    expect(config.editor.wrapping).toBe(true)
    expect(config.editor.wrappingColumn).toBe(0)
    expect(config.editor.autoClosingBrackets).toBe('never')
  })
})