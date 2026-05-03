/**
 * store の normalizeStoredProject と関連関数の branch カバレッジを上げるテスト
 */

const storeModule = require('@/store/index').default

describe('store normalizeStoredProject のエッジケース', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
  })

  test('files のフィールドに型不一致がある場合も読み込める（v が数値でない）', () => {
    const raw = JSON.stringify({
      v: '不正なバージョン', // 数値でない
      id: 'note_edge1',
      gistid: null, // null
      files: {
        'index.md': {
          filename: 'index.md',
          fileType: 'md',
          type: 'text/plain',
          language: 'Markdown',
          size: 5,
          truncated: false,
          content: '# エッジケーステスト',
          description: ''
        }
      },
      public: 'notbool', // 真偽値でない
      createdTime: 'notnum', // 数値でない
      lastUpdatedTime: 'notnum',
      projectName: 123, // 文字列でない
      description: 456 // 文字列でない
    })
    window.localStorage.setItem('note_edge1', raw)
    expect(() => {
      storeModule.commit('loadProject', 'note_edge1')
    }).not.toThrow()
  })

  test('files のファイルにフォールバック値が使われる（fileType なし）', () => {
    const raw = JSON.stringify({
      v: 0.1,
      id: 'note_edge2',
      gistid: '',
      files: {
        'myfile': {
          // filename なし → key ('myfile') が使われる
          fileType: null, // null → 'txt' フォールバック
          type: null, // null → 'text/plain' フォールバック
          language: null, // null → 'Markdown' フォールバック
          size: 'abc', // 数値でない → 0
          truncated: 'yes', // truthy → true
          content: 123, // 数値 → '' フォールバック
          description: null // null → '' フォールバック
        }
      },
      public: true,
      createdTime: Date.now(),
      lastUpdatedTime: Date.now(),
      projectName: 'note_edge2',
      description: ''
    })
    window.localStorage.setItem('note_edge2', raw)
    expect(() => {
      storeModule.commit('loadProject', 'note_edge2')
    }).not.toThrow()
  })

  test('files の値が null のケース', () => {
    const raw = JSON.stringify({
      v: 0.1,
      id: 'note_edge3',
      files: {
        'a.md': null // null → スキップされる
      },
      public: true,
      createdTime: Date.now(),
      lastUpdatedTime: Date.now(),
      projectName: 'note_edge3'
    })
    window.localStorage.setItem('note_edge3', raw)
    // null ファイルはスキップされ normalizedFiles が空 → normalizeStoredProject が null → newProject
    expect(() => {
      storeModule.commit('loadProject', 'note_edge3')
    }).not.toThrow()
  })

  test('raw がオブジェクト（string でない）の場合', () => {
    // importProject に直接オブジェクトを渡す（normalizeStoredProject(raw) where typeof raw !== 'string'）
    const data = {
      v: 0.1,
      id: 'note_obj',
      gistid: '',
      files: {
        'index.md': {
          filename: 'index.md',
          fileType: 'md',
          type: 'text/plain',
          language: 'Markdown',
          size: 5,
          truncated: false,
          content: '# テスト',
          description: ''
        }
      },
      public: true,
      createdTime: Date.now(),
      lastUpdatedTime: Date.now(),
      projectName: 'note_obj',
      description: ''
    }
    expect(() => {
      storeModule.commit('importProject', data)
    }).not.toThrow()
  })
})

describe('store getListItemFromRaw - filter 分岐', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
    storeModule.state.itemList = { filter: '' }
  })

  afterEach(() => {
    storeModule.state.itemList = { filter: '' }
  })

  test('filter あり - raw が不正なJSONの場合 null が返りリストに含まれない', () => {
    window.localStorage.setItem('note_badjson', 'invalid json')
    storeModule.commit('replaceNoteKeyList', ['note_badjson'])
    storeModule.state.itemList = { filter: 'SEARCH' }

    const list = storeModule.getters.refreshFileList
    const item = list.find(i => i.uri === 'note_badjson')
    expect(item).toBeUndefined()
  })

  test('filter あり - files がないオブジェクトの場合リストに含まれない', () => {
    window.localStorage.setItem('note_nofiles', JSON.stringify({ v: 0.1, id: 'note_nofiles' }))
    storeModule.commit('replaceNoteKeyList', ['note_nofiles'])
    storeModule.state.itemList = { filter: 'SEARCH' }

    const list = storeModule.getters.refreshFileList
    const item = list.find(i => i.uri === 'note_nofiles')
    expect(item).toBeUndefined()
  })

  test('filter あり - files が空オブジェクトの場合リストに含まれない', () => {
    window.localStorage.setItem('note_emptyfiles', JSON.stringify({
      v: 0.1, id: 'note_emptyfiles', files: {}
    }))
    storeModule.commit('replaceNoteKeyList', ['note_emptyfiles'])
    storeModule.state.itemList = { filter: 'SEARCH' }

    const list = storeModule.getters.refreshFileList
    const item = list.find(i => i.uri === 'note_emptyfiles')
    expect(item).toBeUndefined()
  })

  test('filter なし - files がない場合 noteKey が name になる', () => {
    window.localStorage.setItem('note_nofil', JSON.stringify({ v: 0.1, projectName: 'note_nofil' }))
    storeModule.commit('replaceNoteKeyList', ['note_nofil'])
    storeModule.state.itemList = { filter: '' }

    const list = storeModule.getters.refreshFileList
    const item = list.find(i => i.uri === 'note_nofil')
    expect(item).toBeDefined()
    expect(item.name).toBe('note_nofil')
  })
})
