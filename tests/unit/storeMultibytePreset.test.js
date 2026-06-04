const storeModule = require('@/store/index').default

describe('store multibyte preset normalize v1.3.16', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('setConfig で multibyte preset 未指定時に初期値を補完する', () => {
    storeModule.commit('setConfig', {
      general: { sort: '0', i18n_locale: 'ja' },
      editor: {},
      markdown: {
        multibyteconvert: true,
        multibyteconvertList: [['^a$', 'b']]
      }
    })

    const markdown = storeModule.state.config.markdown
    expect(markdown.multibytePresetSelected).toBe('プリセット')
    expect(Array.isArray(markdown.multibytePresetList)).toBe(true)
    expect(markdown.multibytePresetList.length).toBeGreaterThan(0)
    expect(markdown.multibytePresetList[0].name).toBe('プリセット')
    expect(Array.isArray(markdown.multibytePresetList[0].rules)).toBe(true)
  })

  test('setConfig で選択プリセットが不正な場合は プリセット に戻す', () => {
    storeModule.commit('setConfig', {
      general: { sort: '0', i18n_locale: 'ja' },
      editor: {},
      markdown: {
        multibyteconvert: true,
        multibyteconvertList: [['^a$', 'b']],
        multibytePresetSelected: 'missing',
        multibytePresetList: [
          { name: 'work', rules: [['^x$', 'y']] }
        ]
      }
    })

    const markdown = storeModule.state.config.markdown
    expect(markdown.multibytePresetSelected).toBe('プリセット')
    expect(markdown.multibytePresetList.some((preset) => preset.name === 'プリセット')).toBe(true)
  })

  test('setConfig で有効な選択プリセットは維持される', () => {
    storeModule.commit('setConfig', {
      general: { sort: '0', i18n_locale: 'ja' },
      editor: {},
      markdown: {
        multibyteconvert: true,
        multibyteconvertList: [['^a$', 'b']],
        multibytePresetSelected: 'work',
        multibytePresetList: [
          { name: 'work', rules: [['^x$', 'y']] }
        ]
      }
    })

    const markdown = storeModule.state.config.markdown
    expect(markdown.multibytePresetSelected).toBe('work')
    expect(markdown.multibytePresetList.find((preset) => preset.name === 'work')).toBeDefined()
  })
})
