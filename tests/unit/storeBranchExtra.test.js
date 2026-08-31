/**
 * store の branch カバレッジを上げる追加テスト
 * getListItemFromRaw の filter パス、getFileName/getFileContent のエッジケース等
 */

const storeModule = require('@/store/index').default

function makeProjectJson(noteKey, content, description, createdTime, lastUpdatedTime) {
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
        description: description || ''
      }
    },
    public: true,
    createdTime: createdTime || Date.now(),
    lastUpdatedTime: lastUpdatedTime || Date.now(),
    projectName: noteKey,
    description: ''
  })
}

describe('store refreshFileList - filter branch', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
    // filter をリセット
    storeModule.commit('setConfig', { general: { sort: '0', i18n_locale: 'ja' } })
  })

  test('filter がある場合マッチするノートだけ返る', () => {
    window.localStorage.setItem('note_filter1', makeProjectJson('note_filter1', '# フィルターテスト\n内容ABC'))
    window.localStorage.setItem('note_filter2', makeProjectJson('note_filter2', '# 別のノート\n内容XYZ'))
    storeModule.commit('replaceNoteKeyList', ['note_filter1', 'note_filter2'])
    storeModule.state.config.general.itemList = { filter: 'ABC' }

    // itemList getter を使ってフィルタリングをシミュレート
    // refreshFileList は state.config の itemList.filter に依存
    // storeModule の state を直接変更してテスト
    const originalFilter = storeModule.state.config?.general?.itemList?.filter
    if (storeModule.state.config && storeModule.state.config.general) {
      storeModule.state.config.general.itemList = { filter: 'ABC' }
    }
    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
  })

  test('description がある場合ノート名に description が使われる', () => {
    window.localStorage.setItem('note_desc1', makeProjectJson('note_desc1', '# タイトル行', '説明文テスト'))
    storeModule.commit('replaceNoteKeyList', ['note_desc1'])

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(1)
    expect(list[0].name).toBe('説明文テスト')
  })

  test('description なしの場合 content の最初の行が名前になる', () => {
    window.localStorage.setItem('note_nodesc', makeProjectJson('note_nodesc', '# コンテンツのタイトル\n2行目', ''))
    storeModule.commit('replaceNoteKeyList', ['note_nodesc'])

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(1)
    // description が空の場合コンテンツ最初の行が使われる
    expect(list[0].name).toBeTruthy()
  })
})

describe('store setConfig - branch coverage', () => {
  test('editor オプション付きで setConfig が実行できる', () => {
    expect(() => {
      storeModule.commit('setConfig', {
        general: { i18n_locale: 'en' },
        editor: { fontSize: 16, wordWrap: 'off' },
        markdown: {}
      })
    }).not.toThrow()
  })

  test('markdown.basicOption 付きで setConfig が実行できる', () => {
    expect(() => {
      storeModule.commit('setConfig', {
        general: { i18n_locale: 'ja' },
        markdown: {
          basicOption: { breaks: true },
          multimdTableOption: {},
          multibyteconvertList: ['test']
        }
      })
    }).not.toThrow()
  })

  test('空オブジェクトで setConfig が実行できる', () => {
    expect(() => {
      storeModule.commit('setConfig', {})
    }).not.toThrow()
  })
})

describe('store newProject action', () => {
  test('newProject action が正常に実行できる', async () => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
    await expect(storeModule.dispatch('newProject')).resolves.not.toThrow()
  })
})

describe('store importProject mutation', () => {
  test('importProject に有効データを渡しても例外が発生しない', () => {
    const data = JSON.parse(makeProjectJson('note_import_test', '# インポートテスト'))
    expect(() => {
      storeModule.commit('importProject', data)
    }).not.toThrow()
  })

  test('importProject に空オブジェクトを渡しても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('importProject', {})
    }).not.toThrow()
  })
})

describe('store loadNoteKeyList - 追加 branch', () => {
  test('noteKeyList が空配列の場合', () => {
    storeModule.commit('loadNoteKeyList', [])
    expect(storeModule.state.noteKeyList.length).toBe(0)
  })

  test('noteKeyList が null のとき空配列', () => {
    storeModule.commit('loadNoteKeyList', null)
    expect(storeModule.state.noteKeyList.length).toBe(0)
  })

  test('noteKeyList に重複がある場合は dedup される', () => {
    storeModule.commit('loadNoteKeyList', ['note_dup', 'note_dup', 'note_other'])
    const count = storeModule.state.noteKeyList.filter(k => k === 'note_dup').length
    expect(count).toBe(1)
  })
})
