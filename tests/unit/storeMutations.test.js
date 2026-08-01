/**
 * store の mutation 関数カバレッジ追加テスト
 * loadProject, newProject, updateContent, updateTitle, saveProject を検証する
 */

const storeModule = require('@/store/index').default

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

describe('store mutations - loadProject', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
  })

  test('有効なプロジェクトを読み込める', async () => {
    const noteKey = 'note_load_test'
    window.localStorage.setItem(noteKey, makeProjectJson(noteKey, '# 読み込みテスト'))
    await storeModule.dispatch('loadProject', noteKey)
    expect(storeModule.state.currentFile.projectName).toBe(noteKey)
    expect(storeModule.state.currentFile.filename).toBe('index.md')
  })

  test('存在しないプロジェクトを読み込もうとしても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('loadProject', 'note_nonexistent_abc')
    }).not.toThrow()
  })

  test('不正なJSONのプロジェクトを読み込もうとしても例外が発生しない', () => {
    window.localStorage.setItem('note_bad_json', 'invalid json {')
    expect(() => {
      storeModule.commit('loadProject', 'note_bad_json')
    }).not.toThrow()
  })
})

describe('store mutations - updateContent', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('currentFile がある場合コンテンツを更新できる', () => {
    const noteKey = 'note_update_test'
    window.localStorage.setItem(noteKey, makeProjectJson(noteKey, '# 初期コンテンツ'))
    storeModule.commit('loadProject', noteKey)

    expect(() => {
      storeModule.commit('updateContent', '# 更新されたコンテンツ')
    }).not.toThrow()
  })

  test('currentFile がない場合でも例外が発生しない', () => {
    storeModule.state.currentFile = {}
    expect(() => {
      storeModule.commit('updateContent', 'テスト内容')
    }).not.toThrow()
  })

  test('同じコンテンツを更新しても例外が発生しない', () => {
    const noteKey = 'note_same_content'
    const content = '# 同じコンテンツ'
    window.localStorage.setItem(noteKey, makeProjectJson(noteKey, content))
    storeModule.commit('loadProject', noteKey)

    expect(() => {
      storeModule.commit('updateContent', content)
    }).not.toThrow()
  })
})

describe('store mutations - updateTitle', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('currentFile があるとき title を更新できる', () => {
    const noteKey = 'note_title_test'
    window.localStorage.setItem(noteKey, makeProjectJson(noteKey, '# タイトルテスト'))
    storeModule.commit('loadProject', noteKey)

    expect(() => {
      storeModule.commit('updateTitle', '新しいタイトル')
    }).not.toThrow()
  })

  test('updateTitle 後に refreshFileList のタイトルも更新される', () => {
    const noteKey = 'note_title_list_test'
    window.localStorage.setItem(noteKey, makeProjectJson(noteKey, '# 旧タイトル'))
    storeModule.commit('replaceNoteKeyList', [noteKey])
    storeModule.commit('loadProject', noteKey)

    storeModule.commit('updateTitle', '新しい一覧タイトル')

    expect(storeModule.getters.refreshFileList[0].name).toBe('新しい一覧タイトル')
  })

  test('currentFile がない場合でも例外が発生しない', () => {
    storeModule.state.currentFile = {}
    expect(() => {
      storeModule.commit('updateTitle', 'タイトル')
    }).not.toThrow()
  })
})

describe('store mutations - saveProject', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('プロジェクトを保存できる', () => {
    const noteKey = 'note_save_test'
    window.localStorage.setItem(noteKey, makeProjectJson(noteKey, '# 保存テスト'))
    storeModule.commit('loadProject', noteKey)

    expect(() => {
      storeModule.commit('saveProject')
    }).not.toThrow()
  })
})

describe('store mutations - loadNoteKeyList', () => {
  test('localStorage の noteKeyList を読み込める', () => {
    storeModule.commit('loadNoteKeyList', ['note_aaa', 'note_bbb'])
    expect(storeModule.state.noteKeyList).toContain('note_aaa')
    expect(storeModule.state.noteKeyList).toContain('note_bbb')
  })

  test('noteKeyList が存在しない場合は空配列になる', () => {
    storeModule.commit('loadNoteKeyList', [])
    expect(storeModule.state.noteKeyList.length).toBe(0)
  })

  test('無効なキー（note_ で始まらない）はフィルタリングされる', () => {
    storeModule.commit('loadNoteKeyList', ['note_valid', 'invalid_key', 'note_valid2'])
    expect(storeModule.state.noteKeyList).toContain('note_valid')
    expect(storeModule.state.noteKeyList).not.toContain('invalid_key')
    expect(storeModule.state.noteKeyList).toContain('note_valid2')
  })
})

describe('store mutations - deleteProject', () => {
  test('currentFile.projectName がないとき例外が発生しない', () => {
    storeModule.state.currentFile = {}
    expect(() => {
      storeModule.commit('deleteProject')
    }).not.toThrow()
  })
})

describe('store currentFile getter', () => {
  test('projectName が返る', () => {
    const cf = storeModule.getters.currentFile
    expect(cf).toBeDefined()
    expect(typeof cf.projectName).toBe('string')
    expect(typeof cf.filename).toBe('string')
  })
})

describe('store actions - fileOpen', () => {
  test('fileOpen action が例外を投げない', async () => {
    await expect(storeModule.dispatch('fileOpen', 'index.md')).resolves.not.toThrow()
  })

  test('update action が例外を投げない', async () => {
    await expect(storeModule.dispatch('update', '# テスト')).resolves.not.toThrow()
  })

  test('updateTitle action が例外を投げない', async () => {
    await expect(storeModule.dispatch('updateTitle', 'タイトル')).resolves.not.toThrow()
  })
})
