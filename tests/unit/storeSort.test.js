/**
 * store refreshFileList getter のソート機能テスト
 * localStorage にデータを設定して getter のブランチカバレッジを上げる
 */

const storeModule = require('@/store/index').default

function makeProjectJson(noteKey, content, createdTime, lastUpdatedTime) {
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
    createdTime: createdTime,
    lastUpdatedTime: lastUpdatedTime,
    projectName: noteKey,
    description: ''
  })
}

describe('store refreshFileList - ソート機能', () => {
  beforeEach(() => {
    window.localStorage.clear()
    storeModule.commit('replaceNoteKeyList', [])
  })

  test('sort: 0 (lastUpdatedTime 降順) でリストが返る', () => {
    const now = Date.now()
    window.localStorage.setItem('note_a', makeProjectJson('note_a', '# Aノート', now - 2000, now - 1000))
    window.localStorage.setItem('note_b', makeProjectJson('note_b', '# Bノート', now - 1000, now - 2000))
    storeModule.commit('replaceNoteKeyList', ['note_a', 'note_b'])
    storeModule.commit('setConfig', { general: { sort: '0', i18n_locale: 'ja' } })

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(2)
    // note_a の lastUpdatedTime が新しいので先頭
    expect(list[0].uri).toBe('note_a')
  })

  test('sort: 1 (lastUpdatedTime 昇順) でリストが返る', () => {
    const now = Date.now()
    window.localStorage.setItem('note_c', makeProjectJson('note_c', '# Cノート', now - 2000, now - 1000))
    window.localStorage.setItem('note_d', makeProjectJson('note_d', '# Dノート', now - 1000, now - 2000))
    storeModule.commit('replaceNoteKeyList', ['note_c', 'note_d'])
    storeModule.commit('setConfig', { general: { sort: '1', i18n_locale: 'ja' } })

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(2)
    // note_d の lastUpdatedTime が古いので先頭
    expect(list[0].uri).toBe('note_d')
  })

  test('sort: 2 (createdTime 降順) でリストが返る', () => {
    const now = Date.now()
    window.localStorage.setItem('note_e', makeProjectJson('note_e', '# Eノート', now - 2000, now))
    window.localStorage.setItem('note_f', makeProjectJson('note_f', '# Fノート', now - 1000, now))
    storeModule.commit('replaceNoteKeyList', ['note_e', 'note_f'])
    storeModule.commit('setConfig', { general: { sort: '2', i18n_locale: 'ja' } })

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(2)
    // note_f の createdTime が新しいので先頭
    expect(list[0].uri).toBe('note_f')
  })

  test('sort: 3 (createdTime 昇順) でリストが返る', () => {
    const now = Date.now()
    window.localStorage.setItem('note_g', makeProjectJson('note_g', '# Gノート', now - 2000, now))
    window.localStorage.setItem('note_h', makeProjectJson('note_h', '# Hノート', now - 1000, now))
    storeModule.commit('replaceNoteKeyList', ['note_g', 'note_h'])
    storeModule.commit('setConfig', { general: { sort: '3', i18n_locale: 'ja' } })

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(2)
    // note_g の createdTime が古いので先頭
    expect(list[0].uri).toBe('note_g')
  })

  test('filter が設定されているときフィルタリングされる', () => {
    const now = Date.now()
    window.localStorage.setItem('note_i', makeProjectJson('note_i', '# フィルターテスト マッチ', now, now))
    window.localStorage.setItem('note_j', makeProjectJson('note_j', '# 別のノート', now, now))
    storeModule.commit('replaceNoteKeyList', ['note_i', 'note_j'])
    storeModule.commit('setConfig', { general: { sort: '0', i18n_locale: 'ja' } })
    storeModule.state.itemList.filter = 'マッチ'

    const list = storeModule.getters.refreshFileList
    expect(list.some(item => item.uri === 'note_i')).toBe(true)
    expect(list.some(item => item.uri === 'note_j')).toBe(false)

    // フィルターをリセット
    storeModule.state.itemList.filter = ''
  })

  test('localStorage に存在しないキーはスキップされる', () => {
    storeModule.commit('replaceNoteKeyList', ['note_nonexistent_xyz'])
    storeModule.commit('setConfig', { general: { sort: '0', i18n_locale: 'ja' } })

    const list = storeModule.getters.refreshFileList
    expect(Array.isArray(list)).toBe(true)
  })

  test('description がある場合はそれが name になる', () => {
    const now = Date.now()
    const data = JSON.stringify({
      v: 0.1,
      id: 'note_desc',
      gistid: '',
      files: {
        'index.md': {
          filename: 'index.md',
          fileType: 'md',
          type: 'text/plain',
          language: 'Markdown',
          size: 10,
          truncated: false,
          content: 'コンテンツ内容',
          description: '説明テキスト'
        }
      },
      public: true,
      createdTime: now,
      lastUpdatedTime: now,
      projectName: 'note_desc',
      description: ''
    })
    window.localStorage.setItem('note_desc', data)
    storeModule.commit('replaceNoteKeyList', ['note_desc'])
    storeModule.commit('setConfig', { general: { sort: '0', i18n_locale: 'ja' } })

    const list = storeModule.getters.refreshFileList
    const item = list.find(i => i.uri === 'note_desc')
    expect(item).toBeDefined()
    expect(item.name).toBe('説明テキスト')
  })
})
