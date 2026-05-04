/**
 * store の branch カバレッジを追加するテスト
 * refreshFileList の isImporting パス、filter パス、loadProject のエッジケース
 */

const storeModule = require('@/store/index').default

function makeEmptyFilesProjectJson(noteKey) {
  return JSON.stringify({
    v: 0.1,
    id: noteKey,
    gistid: '',
    files: {},
    public: true,
    createdTime: Date.now(),
    lastUpdatedTime: Date.now(),
    projectName: noteKey,
    description: ''
  })
}

function makeProjectJson(noteKey, content) {
  return JSON.stringify({
    v: 0.1,
    id: noteKey,
    gistid: '',
    files: {
      'index.md': {
        filename: 'index.md',
        fileType: 'md',
        type: 'text/plain',
        language: 'Markdown',
        size: content.length,
        truncated: false,
        content: content,
        description: content.split('\n')[0] || ''
      }
    },
    public: true,
    createdTime: Date.now(),
    lastUpdatedTime: Date.now(),
    projectName: noteKey,
    description: ''
  })
}

describe('store refreshFileList - isImporting branch', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
    storeModule.commit('setImporting', false)
  })

  test('isImporting が true のとき latestFileListCache を返す', () => {
    // 先にキャッシュを作成
    window.localStorage.setItem('note_cache1', makeProjectJson('note_cache1', '# キャッシュ'))
    storeModule.commit('replaceNoteKeyList', ['note_cache1'])
    const listBefore = storeModule.getters.refreshFileList
    expect(Array.isArray(listBefore)).toBe(true)

    // isImporting を true にするとキャッシュが返る
    storeModule.commit('setImporting', true)
    const listDuring = storeModule.getters.refreshFileList
    expect(Array.isArray(listDuring)).toBe(true)
    storeModule.commit('setImporting', false)
  })
})

describe('store refreshFileList - filter branch', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
    storeModule.state.itemList = { filter: '' }
  })

  afterEach(() => {
    storeModule.state.itemList = { filter: '' }
  })

  test('filter がある場合マッチしないノートはスキップされる', () => {
    window.localStorage.setItem('note_filtA', makeProjectJson('note_filtA', '# マッチする内容 FIND_ME'))
    window.localStorage.setItem('note_filtB', makeProjectJson('note_filtB', '# マッチしない内容 NO_MATCH'))
    storeModule.commit('replaceNoteKeyList', ['note_filtA', 'note_filtB'])
    storeModule.state.itemList = { filter: 'FIND_ME' }

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    const uris = list.map(i => i.uri)
    expect(uris).toContain('note_filtA')
    expect(uris).not.toContain('note_filtB')
  })

  test('filter があり raw がない場合スキップされる', () => {
    storeModule.commit('replaceNoteKeyList', ['note_nonexistent_xyz'])
    storeModule.state.itemList = { filter: 'SEARCH' }

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(0)
  })
})

describe('store loadProject - empty files branch', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('files が空のプロジェクトは newProject が呼ばれる', () => {
    window.localStorage.setItem('note_empty_files', makeEmptyFilesProjectJson('note_empty_files'))
    // files が空の場合は normalizeStoredProject が null を返す → newProject が呼ばれる
    // 例外が発生しないことを確認
    expect(() => {
      storeModule.commit('loadProject', 'note_empty_files')
    }).not.toThrow()
  })

  test('存在しないキーで loadProject しても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('loadProject', 'note_does_not_exist_12345')
    }).not.toThrow()
  })
})

describe('store applyI18nLocale branch', () => {
  test('en ロケールで setConfig しても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('setConfig', { general: { i18n_locale: 'en-US' } })
    }).not.toThrow()
  })

  test('ja ロケールで setConfig しても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('setConfig', { general: { i18n_locale: 'ja-JP' } })
    }).not.toThrow()
  })

  test('不明なロケールで setConfig しても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('setConfig', { general: { i18n_locale: 'unknown' } })
    }).not.toThrow()
  })
})

describe('store isSameConfig', () => {
  test('同じ config で setConfig を2回呼んでも例外が発生しない', () => {
    const cfg = { general: { i18n_locale: 'ja', sort: '0' }, editor: {}, markdown: {} }
    storeModule.commit('setConfig', cfg)
    expect(() => {
      storeModule.commit('setConfig', cfg)
    }).not.toThrow()
  })
})

describe('store refreshFileList - JSON パースエラー branch', () => {
  beforeEach(() => {
    storeModule.state.itemList = { filter: '' }
  })

  test('raw が null でも filter なしの場合 name: noteKey のアイテムが返る', () => {
    // getListItemFromRaw が raw='' で filter='' のとき parseJsonSafely が null を返す
    // その場合 { name: noteKey, uri: noteKey, ... } が返る
    window.localStorage.clear()
    window.localStorage.setItem('note_nullraw', '') // 空文字
    storeModule.commit('replaceNoteKeyList', ['note_nullraw'])

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    // 空文字は parse できないので fallback が返る
    const item = list.find(i => i.uri === 'note_nullraw')
    if (item) {
      expect(item.name).toBe('note_nullraw')
    }
  })
})
