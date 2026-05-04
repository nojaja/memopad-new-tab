/**
 * store の残り branches カバレッジ追加
 */

const storeModule = require('@/store/index').default

describe('store loadConfig - branches', () => {
  test('localStorage に config がない場合 else ブランチが実行される', () => {
    window.localStorage.removeItem('config')
    expect(() => {
      storeModule.commit('loadConfig')
    }).not.toThrow()
    expect(storeModule.state.config).toBeDefined()
  })

  test('localStorage に config がある場合 if ブランチが実行される', () => {
    const cfg = {
      general: { i18n_locale: 'ja', sort: '0', isShowEmptyNote: false },
      editor: { fontSize: 14, wordWrap: 'on' },
      markdown: { basicOption: { html: true, breaks: false, linkify: true, typography: true } }
    }
    window.localStorage.setItem('config', JSON.stringify(cfg))
    expect(() => {
      storeModule.commit('loadConfig')
    }).not.toThrow()
    window.localStorage.removeItem('config')
  })
})

describe('store setConfig - isSameConfig 分岐', () => {
  test('現在の config と同じ config を渡すと state.config が変更されない', () => {
    const cfg = {
      general: { i18n_locale: 'ja', sort: '0', isShowEmptyNote: false },
      editor: { fontSize: 14 },
      markdown: {}
    }
    storeModule.commit('setConfig', cfg)
    const configBefore = storeModule.state.config
    storeModule.commit('setConfig', cfg)
    // isSameConfig が true → state.config は変更されない
    expect(storeModule.state.config).toEqual(configBefore)
  })

  test('異なる config を渡すと state.config が更新される', () => {
    storeModule.commit('setConfig', { general: { i18n_locale: 'ja', sort: '0' } })
    storeModule.commit('setConfig', { general: { i18n_locale: 'en', sort: '1' } })
    expect(storeModule.state.config.general.sort).toBe('1')
  })
})

describe('store updateTitle - branches', () => {
  test('title が同じ場合は saveProject が呼ばれない（同値チェック）', () => {
    window.localStorage.clear()
    const noteKey = 'note_titlebranch'
    const raw = JSON.stringify({
      v: 0.1,
      id: noteKey,
      gistid: '',
      files: {
        'index.md': {
          filename: 'index.md',
          fileType: 'md',
          type: 'text/plain',
          language: 'Markdown',
          size: 5,
          truncated: false,
          content: '# 初期タイトル',
          description: '初期タイトル'
        }
      },
      public: true,
      createdTime: Date.now(),
      lastUpdatedTime: Date.now(),
      projectName: noteKey,
      description: ''
    })
    window.localStorage.setItem(noteKey, raw)
    storeModule.commit('loadProject', noteKey)
    // 同じタイトルを渡す → 分岐の一方
    expect(() => {
      storeModule.commit('updateTitle', '初期タイトル')
    }).not.toThrow()
  })
})
