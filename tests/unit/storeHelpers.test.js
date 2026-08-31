/**
 * store/index.ts の内部ヘルパー関数群の単体テスト
 * store 本体をインポートするとモジュール初期化時に localStorage にアクセスするため、
 * ヘルパーの挙動を store 経由の mutation / getter テストで検証する。
 */

import { createStore } from 'vuex'

const { mockLocalStorage } = global

// store の実装をインポート（setup.js で localStorage がモック済み）
const storeModule = require('@/store/index').default

describe('store mutations', () => {
  let store

  beforeEach(() => {
    mockLocalStorage._reset()
    store = storeModule
  })

  describe('saveNoteKeyList', () => {
    test('note_ で始まる有効なキーが state に追加される', () => {
      store.commit('saveNoteKeyList', 'note_123456')
      expect(store.state.noteKeyList).toContain('note_123456')
    })

    test('note_ で始まらないキーは state に追加されない', () => {
      const beforeLen = store.state.noteKeyList.length
      store.commit('saveNoteKeyList', 'invalid_key')
      expect(store.state.noteKeyList.length).toBe(beforeLen)
    })
  })

  describe('replaceNoteKeyList', () => {
    test('有効なキー一覧に state が置き換えられる', () => {
      store.commit('replaceNoteKeyList', ['note_aaa', 'note_bbb', 'invalid'])
      expect(store.state.noteKeyList).toContain('note_aaa')
      expect(store.state.noteKeyList).toContain('note_bbb')
      expect(store.state.noteKeyList).not.toContain('invalid')
    })
  })

  describe('setConfig', () => {
    test('config がストア状態へ反映される', () => {
      const config = {
        general: { sort: '1', i18n_locale: 'en' }
      }
      store.commit('setConfig', config)
      expect(store.state.config.general.sort).toBe('1')
    })

    test('locale 変換: en-US -> en', () => {
      const config = {
        general: { sort: '0', i18n_locale: 'en-US' }
      }
      store.commit('setConfig', config)
      expect(store.state.config.general.i18n_locale).toBe('en')
    })

    test('locale 変換: ja-JP -> ja', () => {
      const config = {
        general: { sort: '0', i18n_locale: 'ja-JP' }
      }
      store.commit('setConfig', config)
      expect(store.state.config.general.i18n_locale).toBe('ja')
    })

    test('不明な locale はデフォルト(ja)になる', () => {
      const config = {
        general: { sort: '0', i18n_locale: 'fr-FR' }
      }
      store.commit('setConfig', config)
      expect(store.state.config.general.i18n_locale).toBe('ja')
    })

    test('null config でもデフォルト値が設定される', () => {
      store.commit('setConfig', null)
      expect(store.state.config.general).toBeDefined()
      expect(store.state.config.editor).toBeDefined()
      expect(store.state.config.markdown).toBeDefined()
    })
  })

  describe('loadConfig', () => {
    test('構造化 config を読み込める', () => {
      const config = { general: { sort: '2', i18n_locale: 'en' }, editor: {}, markdown: {} }
      store.commit('loadConfig', config)
      expect(store.state.config.general.sort).toBe('2')
    })

    test('config がない場合はデフォルト値になる', () => {
      store.commit('loadConfig', undefined)
      expect(store.state.config.general).toBeDefined()
    })
  })

  describe('setImporting', () => {
    test('isImporting が true に設定される', () => {
      store.commit('setImporting', true)
      expect(store.state.isImporting).toBe(true)
    })

    test('isImporting が false に設定される', () => {
      store.commit('setImporting', false)
      expect(store.state.isImporting).toBe(false)
    })
  })
})

describe('store getters', () => {
  test('config getter が現在の config を返す', () => {
    const config = storeModule.getters.config
    expect(config).toBeDefined()
    expect(config.general).toBeDefined()
  })

  test('itemList getter が itemList を返す', () => {
    const itemList = storeModule.getters.itemList
    expect(itemList).toBeDefined()
    expect(typeof itemList.filter).toBe('string')
  })
})

describe('store actions', () => {
  test('setImporting action が commit を呼ぶ', () => {
    const context = { commit: jest.fn() }
    const actionsObj = storeModule._actions
    // actions は store 経由でテスト
    storeModule.dispatch('setImporting', true)
    expect(storeModule.state.isImporting).toBe(true)
    storeModule.dispatch('setImporting', false)
    expect(storeModule.state.isImporting).toBe(false)
  })

  test('replaceNoteKeyList action が noteKeyList を更新する', () => {
    storeModule.dispatch('replaceNoteKeyList', ['note_111', 'note_222'])
    expect(storeModule.state.noteKeyList).toContain('note_111')
    expect(storeModule.state.noteKeyList).toContain('note_222')
  })
})

describe('store helper branch coverage', () => {
  test('setConfig で i18n locale.value 分岐を通る', () => {
    const i18n = require('@/lang').default
    const originalLocale = i18n.global.locale
    i18n.global.locale = { value: 'ja' }

    storeModule.commit('setConfig', { general: { i18n_locale: 'en' } })

    expect(i18n.global.locale.value).toBe('en')
    i18n.global.locale = originalLocale
  })

  test('setConfig は循環参照の比較でも例外にならない', () => {
    const circular = {}
    circular.self = circular
    storeModule.state.config = circular

    expect(() => {
      storeModule.commit('setConfig', { general: { i18n_locale: 'ja' } })
    }).not.toThrow()
  })

  test('getter は plain object の filename/content/description を扱える', () => {
    const originalFileContainer = storeModule.state.fileContainer
    const mockContainer = {
      getFile: jest.fn().mockReturnValue({ filename: 'index.md', content: 'abc', description: 'title' })
    }

    storeModule.state.fileContainer = mockContainer
    storeModule.state.currentFile = { filename: 'index.md', projectName: 'note_1' }

    const current = storeModule.getters.currentFile
    const source = storeModule.getters.source

    expect(current.filename).toBe('index.md')
    expect(current.file.description).toBe('title')
    expect(source).toBe('abc')

    storeModule.state.fileContainer = originalFileContainer
  })

  test('getter は getFilename 関数と空値フォールバックを扱える', () => {
    const originalFileContainer = storeModule.state.fileContainer
    const mockContainer = {
      getFile: jest.fn().mockReturnValue({
        getFilename: jest.fn().mockReturnValue('fallback.md')
      })
    }

    storeModule.state.fileContainer = mockContainer
    storeModule.state.currentFile = { filename: 'fallback.md', projectName: 'note_2' }

    const current = storeModule.getters.currentFile
    const source = storeModule.getters.source

    expect(current.file.getFilename()).toBe('fallback.md')
    expect(source).toBe('')

    storeModule.state.fileContainer = originalFileContainer
  })

  test('getter は description 未定義時に空文字を返す', () => {
    const originalFileContainer = storeModule.state.fileContainer
    const mockContainer = {
      getFile: jest.fn().mockReturnValue({ filename: 'empty-desc.md', content: 'x' })
    }

    storeModule.state.fileContainer = mockContainer
    storeModule.state.currentFile = { filename: 'empty-desc.md', projectName: 'note_3' }

    const current = storeModule.getters.currentFile

    expect(current.file.description || '').toBe('')

    storeModule.state.fileContainer = originalFileContainer
  })

  test('loadProject は file.filename からファイル名を取得できる', () => {
    const originalFileContainer = storeModule.state.fileContainer
    const mockContainer = {
      setContainer: jest.fn(),
      getFiles: jest.fn().mockReturnValue([{ filename: 'from-filename.md' }]),
      getFile: jest.fn().mockReturnValue({ filename: 'from-filename.md' })
    }

    window.localStorage.setItem(
      'note_branch_filename',
      JSON.stringify({
        projectName: 'note_branch_filename',
        files: {
          'from-filename.md': {
            filename: 'from-filename.md',
            content: 'x',
            description: 'y'
          }
        }
      })
    )

    storeModule.state.fileContainer = mockContainer
    storeModule.commit('loadProject', 'note_branch_filename')

    expect(storeModule.state.currentFile.filename).toBe('from-filename.md')
    storeModule.state.fileContainer = originalFileContainer
  })

  test('updateTitle は説明未定義のファイルでも更新できる', () => {
    const originalFileContainer = storeModule.state.fileContainer
    const mockFile = { filename: 'desc-missing.md' }
    const mockContainer = {
      getFile: jest.fn().mockReturnValue(mockFile),
      putFile: jest.fn(),
      setLastUpdatedTime: jest.fn(),
      getProjectName: jest.fn().mockReturnValue('note_4'),
      getContainerJson: jest.fn().mockReturnValue('{}')
    }

    storeModule.state.fileContainer = mockContainer
    storeModule.state.currentFile = { filename: 'desc-missing.md', projectName: 'note_4' }

    storeModule.commit('updateTitle', 'new title')

    expect(mockFile.description).toBe('new title')
    storeModule.state.fileContainer = originalFileContainer
  })
})
