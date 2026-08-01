const { createChromeLocalStorage } = require('@/storage/ChromeLocalStorage')

function createChromeMock() {
  const data = new Map()
  const listeners = new Set()
  const storageArea = {
    get: jest.fn(keys => {
      if (keys === null) return Promise.resolve(Object.fromEntries(data))
      const keyList = Array.isArray(keys) ? keys : [keys]
      return Promise.resolve(Object.fromEntries(keyList
        .filter(key => data.has(key))
        .map(key => [key, data.get(key)])))
    }),
    set: jest.fn(items => {
      const changes = {}
      Object.entries(items).forEach(([key, value]) => {
        changes[key] = { oldValue: data.get(key), newValue: value }
        data.set(key, value)
      })
      listeners.forEach(listener => listener(changes, 'local'))
      return Promise.resolve()
    }),
    remove: jest.fn(keys => {
      const keyList = Array.isArray(keys) ? keys : [keys]
      keyList.forEach(key => data.delete(key))
      return Promise.resolve()
    })
  }
  return {
    runtime: { lastError: null },
    storage: {
      local: storageArea,
      onChanged: {
        addListener: jest.fn(listener => listeners.add(listener)),
        removeListener: jest.fn(listener => listeners.delete(listener))
      }
    }
  }
}

describe('ChromeLocalStorage', () => {
  let chromeMock
  let storage

  beforeEach(() => {
    chromeMock = createChromeMock()
    global.chrome = chromeMock
    storage = createChromeLocalStorage()
  })

  afterEach(() => {
    delete global.chrome
  })

  test('オブジェクトと配列を JSON 文字列化せずに保存して取得できる', async () => {
    const config = { general: { i18n_locale: 'ja' } }
    const noteKeyList = ['note_1']

    await storage.set({ config, noteKeyList })

    await expect(storage.get('config')).resolves.toEqual(config)
    await expect(storage.get('noteKeyList')).resolves.toEqual(noteKeyList)
  })

  test('全レコードをエクスポート用オブジェクトとして取得できる', async () => {
    await storage.set({ config: { general: {} }, note_1: { projectName: 'note_1' } })

    await expect(storage.getAll()).resolves.toEqual({
      config: { general: {} },
      note_1: { projectName: 'note_1' }
    })
  })

  test('local 領域の変更を通知し解除後は通知しない', async () => {
    const listener = jest.fn()
    const unsubscribe = storage.onChanged(listener)

    await storage.set({ note_1: { projectName: 'note_1' } })
    unsubscribe()
    await storage.set({ note_2: { projectName: 'note_2' } })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith([{
      key: 'note_1',
      oldValue: undefined,
      newValue: { projectName: 'note_1' }
    }])
  })

  test('runtime.lastError がある場合は操作を reject する', async () => {
    chromeMock.storage.local.get.mockImplementationOnce(() => {
      chromeMock.runtime.lastError = { message: 'Storage unavailable' }
      return Promise.resolve({})
    })

    await expect(storage.get('config')).rejects.toThrow('Storage unavailable')
  })
})