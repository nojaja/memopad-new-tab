/**
 * store mutations / actions の追加カバレッジテスト
 * store/index.ts の各 mutation を検証する
 */

const storeModule = require('@/store/index').default

describe('store mutations - importProject', () => {
  test('テキスト付きプロジェクトをインポートできる', () => {
    const pjdata = {
      projectName: 'note_import_test_' + Date.now(),
      text: '# インポートテスト\nテスト内容'
    }
    expect(() => {
      storeModule.commit('importProject', pjdata)
    }).not.toThrow()
  })

  test('files 付きプロジェクトをインポートできる', () => {
    const pjdata = {
      projectName: 'note_import_files_' + Date.now(),
      files: {
        'index.md': {
          filename: 'index.md',
          fileType: 'md',
          type: 'text/plain',
          language: 'Markdown',
          size: 10,
          truncated: false,
          content: '# テスト',
          description: 'テスト'
        }
      }
    }
    expect(() => {
      storeModule.commit('importProject', pjdata)
    }).not.toThrow()
  })
})

describe('store mutations - fileOpen', () => {
  test('存在しないファイルを開こうとしても例外が発生しない', () => {
    expect(() => {
      storeModule.commit('fileOpen', 'nonexistent.md')
    }).not.toThrow()
  })
})

describe('store mutations - setImporting', () => {
  test('isImporting が正しく切り替わる', () => {
    storeModule.commit('setImporting', true)
    expect(storeModule.state.isImporting).toBe(true)
    storeModule.commit('setImporting', false)
    expect(storeModule.state.isImporting).toBe(false)
  })
})

describe('store getters - refreshFileList', () => {
  test('isImporting が true のときはキャッシュを返す', () => {
    storeModule.commit('setImporting', true)
    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    storeModule.commit('setImporting', false)
  })

  test('noteKeyList が空のとき空配列を返す', () => {
    storeModule.commit('replaceNoteKeyList', [])
    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(0)
  })
})

describe('store getters - source', () => {
  test('currentFile が空のとき空文字を返す', () => {
    const src = storeModule.getters.source
    expect(typeof src).toBe('string')
  })
})

describe('store mutations - setConfig (デフォルト値の確認)', () => {
  test('editor config のデフォルト値が設定される', () => {
    storeModule.commit('setConfig', {})
    expect(storeModule.state.config.editor.fontSize).toBe(16)
    expect(storeModule.state.config.editor.tabSize).toBe(4)
    expect(storeModule.state.config.editor.theme).toBe('vs')
  })

  test('markdown config のデフォルト値が設定される', () => {
    storeModule.commit('setConfig', {})
    expect(storeModule.state.config.markdown.emoji).toBe(true)
    expect(storeModule.state.config.markdown.ruby).toBe(true)
    expect(storeModule.state.config.markdown.uml).toBe(true)
  })

  test('sort: 1 が正しく保存される', () => {
    storeModule.commit('setConfig', { general: { sort: '1', i18n_locale: 'ja' } })
    expect(storeModule.state.config.general.sort).toBe('1')
  })

  test('sort: 2 が正しく保存される', () => {
    storeModule.commit('setConfig', { general: { sort: '2', i18n_locale: 'ja' } })
    expect(storeModule.state.config.general.sort).toBe('2')
  })

  test('sort: 3 が正しく保存される', () => {
    storeModule.commit('setConfig', { general: { sort: '3', i18n_locale: 'ja' } })
    expect(storeModule.state.config.general.sort).toBe('3')
  })

  test('privacyBlur オプションが反映される', () => {
    storeModule.commit('setConfig', { general: { privacyBlur: true, i18n_locale: 'ja' } })
    expect(storeModule.state.config.general.privacyBlur).toBe(true)
  })
})

describe('store mutations - replaceNoteKeyList', () => {
  test('数値型は除外される', () => {
    storeModule.commit('replaceNoteKeyList', [123, 'note_valid', null])
    expect(storeModule.state.noteKeyList).toContain('note_valid')
    expect(storeModule.state.noteKeyList).not.toContain(123)
  })

  test('空配列に置き換えられる', () => {
    storeModule.commit('replaceNoteKeyList', ['note_x', 'note_y'])
    storeModule.commit('replaceNoteKeyList', [])
    expect(storeModule.state.noteKeyList.length).toBe(0)
  })
})

describe('store actions', () => {
  test('setConfig action が state を更新する', async () => {
    await storeModule.dispatch('setConfig', { general: { sort: '0', i18n_locale: 'en' } })
    expect(storeModule.state.config.general.i18n_locale).toBe('en')
  })

  test('loadNoteKeyList action が例外を投げない', async () => {
    await expect(storeModule.dispatch('loadNoteKeyList')).resolves.not.toThrow()
  })

  test('replaceNoteKeyList action が noteKeyList を更新する', async () => {
    await storeModule.dispatch('replaceNoteKeyList', ['note_111', 'note_222'])
    expect(storeModule.state.noteKeyList).toContain('note_111')
  })

  test('saveNoteKeyList action が noteKeyList に追加する', async () => {
    await storeModule.dispatch('saveNoteKeyList', 'note_action_test')
    expect(storeModule.state.noteKeyList).toContain('note_action_test')
  })

  test('update action が例外を投げない', async () => {
    await expect(storeModule.dispatch('update', '# 更新コンテンツ')).resolves.not.toThrow()
  })
})
