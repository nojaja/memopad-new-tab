const { migrateLegacyStorage, STORAGE_MIGRATION_COMPLETED_KEY } = require('@/storage/LegacyStorageMigration')

function createLegacyStorage(initialValues) {
  const values = new Map(Object.entries(initialValues))
  return {
    get length() {
      return values.size
    },
    key: jest.fn(index => Array.from(values.keys())[index] || null),
    getItem: jest.fn(key => values.has(key) ? values.get(key) : null),
    removeItem: jest.fn(key => values.delete(key)),
    values
  }
}

function createStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues))
  return {
    getAll: jest.fn(async () => Object.fromEntries(values)),
    set: jest.fn(async items => {
      Object.entries(items).forEach(([key, value]) => values.set(key, value))
    }),
    values
  }
}

describe('LegacyStorageMigration', () => {
  test('検証済みの旧データだけをオブジェクトとして移行してから削除する', async () => {
    const legacyStorage = createLegacyStorage({
      config: JSON.stringify({ general: { i18n_locale: 'ja' } }),
      noteKeyList: JSON.stringify(['note_1']),
      note_1: JSON.stringify({ projectName: 'note_1', files: {} }),
      currentVersion: '0.0.1'
    })
    const storage = createStorage()

    await expect(migrateLegacyStorage(legacyStorage, storage)).resolves.toEqual({ migrated: true })

    expect(storage.values.get('config')).toEqual({ general: { i18n_locale: 'ja' } })
    expect(storage.values.get('noteKeyList')).toEqual(['note_1'])
    expect(storage.values.get('note_1')).toEqual({ projectName: 'note_1', files: {} })
    expect(storage.values.get('currentVersion')).toBe('0.0.1')
    expect(storage.values.get(STORAGE_MIGRATION_COMPLETED_KEY)).toBe(true)
    expect(legacyStorage.values.size).toBe(0)
  })

  test('書込に失敗した場合は旧データと移行済みフラグを残す', async () => {
    const legacyStorage = createLegacyStorage({ config: JSON.stringify({ general: {} }) })
    const storage = createStorage()
    storage.set.mockRejectedValueOnce(new Error('Storage unavailable'))

    await expect(migrateLegacyStorage(legacyStorage, storage)).rejects.toThrow('Storage unavailable')

    expect(legacyStorage.values.get('config')).toBe(JSON.stringify({ general: {} }))
    expect(storage.values.has(STORAGE_MIGRATION_COMPLETED_KEY)).toBe(false)
  })

  test('変換できない JSON がある場合は旧データを削除しない', async () => {
    const legacyStorage = createLegacyStorage({ config: '{broken' })
    const storage = createStorage()

    await expect(migrateLegacyStorage(legacyStorage, storage)).rejects.toThrow('Failed to parse legacy storage key: config')

    expect(legacyStorage.values.get('config')).toBe('{broken')
    expect(storage.values.size).toBe(0)
  })

  test('同一ノートキーが既に存在し内容が異なる場合は別キーにリネームして移行しロストを防ぐ', async () => {
    const legacyStorage = createLegacyStorage({
      noteKeyList: JSON.stringify(['note_1']),
      note_1: JSON.stringify({ projectName: 'note_1', content: 'legacy version' })
    })
    const storage = createStorage({
      noteKeyList: ['note_1'],
      note_1: { projectName: 'note_1', content: 'chrome storage version' }
    })

    await expect(migrateLegacyStorage(legacyStorage, storage)).resolves.toEqual({ migrated: true })

    expect(storage.values.get('note_1')).toEqual({ projectName: 'note_1', content: 'chrome storage version' })
    expect(storage.values.get('note_1_migrated')).toEqual({ projectName: 'note_1_migrated', content: 'legacy version' })
    expect(storage.values.get('noteKeyList')).toEqual(['note_1', 'note_1_migrated'])
    expect(storage.values.get(STORAGE_MIGRATION_COMPLETED_KEY)).toBe(true)
    expect(legacyStorage.values.size).toBe(0)
  })

  test('リネーム先キーも既に存在する場合は連番サフィックスを付与して移行する', async () => {
    const legacyStorage = createLegacyStorage({
      note_1: JSON.stringify({ projectName: 'note_1', content: 'legacy version' })
    })
    const storage = createStorage({
      note_1: { projectName: 'note_1', content: 'v1' },
      note_1_migrated: { projectName: 'note_1_migrated', content: 'v2' }
    })

    await expect(migrateLegacyStorage(legacyStorage, storage)).resolves.toEqual({ migrated: true })

    expect(storage.values.get('note_1_migrated_2')).toEqual({ projectName: 'note_1_migrated_2', content: 'legacy version' })
    expect(storage.values.get('noteKeyList')).toEqual(['note_1_migrated_2'])
    expect(legacyStorage.values.size).toBe(0)
  })

  test('設定が競合した場合は既存の Chrome Storage 設定を維持しつつ移行を完了する', async () => {
    const legacyStorage = createLegacyStorage({
      config: JSON.stringify({ general: { i18n_locale: 'ja' } }),
      note_1: JSON.stringify({ projectName: 'note_1', files: {} })
    })
    const storage = createStorage({ config: { general: { i18n_locale: 'en' } } })

    await expect(migrateLegacyStorage(legacyStorage, storage)).resolves.toEqual({ migrated: true })

    expect(legacyStorage.values.size).toBe(0)
    expect(storage.values.get('config')).toEqual({ general: { i18n_locale: 'en' } })
    expect(storage.values.get('note_1')).toEqual({ projectName: 'note_1', files: {} })
    expect(storage.values.get(STORAGE_MIGRATION_COMPLETED_KEY)).toBe(true)
  })

  test('プロパティ順序が異なるオブジェクトも等価と判定して移行を完了する', async () => {
    const legacyStorage = createLegacyStorage({
      note_1: JSON.stringify({ a: 1, b: { c: 2, d: 3 } })
    })
    const storage = createStorage({
      note_1: { b: { d: 3, c: 2 }, a: 1 }
    })

    await expect(migrateLegacyStorage(legacyStorage, storage)).resolves.toEqual({ migrated: true })

    expect(legacyStorage.values.size).toBe(0)
    expect(storage.values.get('note_1')).toEqual({ b: { d: 3, c: 2 }, a: 1 })
    expect(storage.values.get(STORAGE_MIGRATION_COMPLETED_KEY)).toBe(true)
  })

  test('移行済みフラグが存在する場合は何もしない', async () => {
    const legacyStorage = createLegacyStorage({ config: JSON.stringify({ general: {} }) })
    const storage = createStorage({ [STORAGE_MIGRATION_COMPLETED_KEY]: true })

    await expect(migrateLegacyStorage(legacyStorage, storage)).resolves.toEqual({ migrated: false })

    expect(legacyStorage.values.has('config')).toBe(true)
  })
})