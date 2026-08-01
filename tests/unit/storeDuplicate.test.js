const store = require('@/store/index').default
const { mockLocalStorage } = global

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
        content,
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

describe('store duplicateCurrentProject', () => {
  beforeEach(() => {
    mockLocalStorage._reset()
    store.commit('replaceNoteKeyList', [])
    store.state.currentFile = {}
    if (typeof store.state.fileContainer.init === 'function') {
      store.state.fileContainer.init()
    }
  })

  test('duplicateCurrentProject creates a new note and loads it', async () => {
    await store.dispatch('newProject')
    const originalKey = store.state.currentFile.projectName
    expect(originalKey).toMatch(/^note_\d+$/)

    await store.dispatch('duplicateCurrentProject')
    await Promise.resolve()
    await Promise.resolve()

    expect(store.state.noteKeyList.length).toBe(2)
    const duplicateKey = store.state.noteKeyList[1]
    expect(store.state.currentFile.projectName).toBe(duplicateKey)
    const duplicateRaw = global.mockChromeStorage._store.get(duplicateKey)

    expect(duplicateRaw.projectName).toBe(duplicateKey)
    expect(duplicateRaw.files['index.md'].description).toMatch(/ copy$/)
    expect(duplicateRaw.files['index.md'].description).not.toBe('')
  })
})
