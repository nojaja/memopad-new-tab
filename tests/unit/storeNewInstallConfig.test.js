describe('store config initialization for export attention', () => {
  beforeEach(() => {
    jest.resetModules()
    localStorage.clear()
  })

  test('config キーがない新規インストール時は lastExportDataAt を初期保存する', async () => {
    const storeModule = require('@/store/index').default

    await storeModule.dispatch('init')
    const storedConfig = global.mockChromeStorage._store.get('config')

    expect(typeof storedConfig.general.lastExportDataAt).toBe('string')
    expect(storedConfig.general.lastExportDataAt).not.toBe('')
    expect(storedConfig.general.viewMode).toBe('both')
    expect(storeModule.state.config.general.lastExportDataAt).toBe(storedConfig.general.lastExportDataAt)
  })

  test('config キーが存在し lastExportDataAt がない場合は空文字のまま補完される', async () => {
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
    await storeModule.dispatch('init')

    expect(storeModule.state.config.general.lastExportDataAt).toBe('')
    expect(storeModule.state.config.general.viewMode).toBe('both')
  })

  test('config.general.viewMode が保存されている場合はその値を採用する', async () => {
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
    await storeModule.dispatch('init')

    expect(storeModule.state.config.general.viewMode).toBe('preview')
  })

  test('init 実行時に config キーがない場合も初期保存される', async () => {
    const storeModule = require('@/store/index').default
    localStorage.clear()

    await storeModule.dispatch('init')

    const storedConfig = global.mockChromeStorage._store.get('config')
    expect(typeof storedConfig.general.lastExportDataAt).toBe('string')
    expect(storedConfig.general.lastExportDataAt).not.toBe('')
    expect(storeModule.state.config.general.lastExportDataAt).toBe(storedConfig.general.lastExportDataAt)
  })
})
