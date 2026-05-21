describe('store config initialization for export attention', () => {
  beforeEach(() => {
    jest.resetModules()
    localStorage.clear()
  })

  test('config キーがない新規インストール時は lastExportDataAt を初期保存する', () => {
    const storeModule = require('@/store/index').default

    const storedRaw = localStorage.getItem('config')
    expect(typeof storedRaw).toBe('string')

    const storedConfig = JSON.parse(storedRaw)
    expect(typeof storedConfig.general.lastExportDataAt).toBe('string')
    expect(storedConfig.general.lastExportDataAt).not.toBe('')
    expect(storedConfig.general.viewMode).toBe('both')
    expect(storeModule.state.config.general.lastExportDataAt).toBe(storedConfig.general.lastExportDataAt)
  })

  test('config キーが存在し lastExportDataAt がない場合は空文字のまま補完される', () => {
    localStorage.setItem('config', JSON.stringify({
      general: {
        sort: '0',
        i18n_locale: 'ja'
      },
      editor: {
        fontSize: 14
      },
      markdown: {}
    }))

    const storeModule = require('@/store/index').default

    expect(storeModule.state.config.general.lastExportDataAt).toBe('')
    expect(storeModule.state.config.general.viewMode).toBe('both')
  })

  test('config.general.viewMode が保存されている場合はその値を採用する', () => {
    localStorage.setItem('config', JSON.stringify({
      general: {
        sort: '0',
        i18n_locale: 'ja',
        viewMode: 'preview'
      },
      editor: {
        fontSize: 14
      },
      markdown: {}
    }))

    const storeModule = require('@/store/index').default

    expect(storeModule.state.config.general.viewMode).toBe('preview')
  })

  test('loadConfig 実行時に config キーがない場合も初期保存される', () => {
    const storeModule = require('@/store/index').default
    localStorage.clear()

    storeModule.commit('loadConfig')

    const storedRaw = localStorage.getItem('config')
    expect(typeof storedRaw).toBe('string')
    const storedConfig = JSON.parse(storedRaw)
    expect(typeof storedConfig.general.lastExportDataAt).toBe('string')
    expect(storedConfig.general.lastExportDataAt).not.toBe('')
    expect(storeModule.state.config.general.lastExportDataAt).toBe(storedConfig.general.lastExportDataAt)
  })
})
