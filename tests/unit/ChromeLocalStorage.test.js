const { createChromeLocalStorage, isChromeStorageAvailable } = require('@/storage/ChromeLocalStorage')

function createChromeMock() {
  const data = new Map()
  const listeners = new Set()
  const emitChanges = changes => listeners.forEach(listener => listener(changes, 'local'))
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
      emitChanges(changes)
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
    },
    emitChanges
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

  test('リアクティブな保存値をプレーンなJSON互換値としてChrome Storageへ渡す', async () => {
    const noteKeyList = new Proxy(['note_1'], {})

    await storage.set({ noteKeyList })

    const savedNoteKeyList = chromeMock.storage.local.set.mock.calls[0][0].noteKeyList
    expect(savedNoteKeyList).toEqual(['note_1'])
    expect(savedNoteKeyList).not.toBe(noteKeyList)
  })

  test('全レコードをエクスポート用オブジェクトとして取得できる', async () => {
    await storage.set({ config: { general: {} }, note_1: { projectName: 'note_1' } })

    await expect(storage.getAll()).resolves.toEqual({
      config: { general: {} },
      note_1: { projectName: 'note_1' }
    })
  })

  test('同一ページの保存は通知せず、外部変更だけを通知する', async () => {
    const listener = jest.fn()
    const unsubscribe = storage.onChanged(listener)

    await storage.set({ note_1: { projectName: 'note_1' } })
    chromeMock.emitChanges({
      note_2: { oldValue: undefined, newValue: { projectName: 'note_2' } }
    })
    unsubscribe()
    chromeMock.emitChanges({
      note_3: { oldValue: undefined, newValue: { projectName: 'note_3' } }
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith([{
      key: 'note_2',
      oldValue: undefined,
      newValue: { projectName: 'note_2' }
    }])
  })

  test('連続保存の遅延通知をすべて自己通知として除外する', async () => {
    const listener = jest.fn()
    storage.onChanged(listener)
    chromeMock.storage.local.set.mockImplementation(() => Promise.resolve())

    await storage.set({ note_1: { projectName: 'note_1', description: 'first' } })
    await storage.set({ note_1: { projectName: 'note_1', description: 'second' } })
    chromeMock.emitChanges({
      note_1: { oldValue: undefined, newValue: { projectName: 'note_1', description: 'first' } }
    })
    chromeMock.emitChanges({
      note_1: { oldValue: { projectName: 'note_1', description: 'first' }, newValue: { projectName: 'note_1', description: 'second' } }
    })

    expect(listener).not.toHaveBeenCalled()
  })

  test('runtime.lastError がある場合は操作を reject する', async () => {
    chromeMock.storage.local.get.mockImplementationOnce(() => {
      chromeMock.runtime.lastError = { message: 'Storage unavailable' }
      return Promise.resolve({})
    })

    await expect(storage.get('config')).rejects.toThrow('Storage unavailable')
  })

  test('Chrome Storage がない場合は旧 localStorage 形式で保存を継続する', async () => {
    delete global.chrome
    const values = new Map([['currentVersion', '0.0.1']])
    const localStorageMock = {
      getItem: jest.fn(key => values.get(key) ?? null),
      setItem: jest.fn((key, value) => values.set(key, value)),
      removeItem: jest.fn(key => values.delete(key))
    }
    Object.defineProperty(global, 'localStorage', { configurable: true, value: localStorageMock })
    storage = createChromeLocalStorage()

    await storage.set({ config: { general: { i18n_locale: 'ja' } } })

    expect(isChromeStorageAvailable()).toBe(false)
    await expect(storage.get('config')).resolves.toEqual({ general: { i18n_locale: 'ja' } })
    await expect(storage.get('currentVersion')).resolves.toBe('0.0.1')
    expect(values.get('config')).toBe('{"general":{"i18n_locale":"ja"}}')

    await storage.remove('config')
    await expect(storage.get('config')).resolves.toBeUndefined()
  })
})