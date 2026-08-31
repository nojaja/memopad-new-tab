const { config } = require('@vue/test-utils')

config.global.stubs = {
  ...config.global.stubs,
  UniconIcon: true
}

const mockLocalStorage = {
  _store: new Map(),
  getItem: jest.fn(key => mockLocalStorage._store.get(key)),
  setItem: jest.fn((key, value) => {
    mockLocalStorage._store.set(key, value)
    mockChromeStorage._store.set(key, parseLegacyStorageValue(key, value))
    syncActiveStoreNoteRecord(key, value)
  }),
  removeItem: jest.fn(key => {
    mockLocalStorage._store.delete(key)
    mockChromeStorage._store.delete(key)
  }),
  clear: jest.fn(() => {
    mockLocalStorage._store.clear()
    mockChromeStorage._store.clear()
    const store = global.__MEMOPAD_TEST_STORE__
    if (store?.state?.noteRecords) {
      store.state.noteRecords = {}
      store.state.sourceVersion += 1
    }
  }),
  _reset() {
    this._store.clear()
    this.getItem.mockClear()
    this.setItem.mockClear()
    this.removeItem.mockClear()
    this.clear.mockClear()
  }
}

function parseLegacyStorageValue(key, value) {
  if (key !== 'config' && key !== 'noteKeyList' && !key.startsWith('note_')) return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function syncActiveStoreNoteRecord(key, value) {
  if (!key.startsWith('note_')) return
  const store = global.__MEMOPAD_TEST_STORE__
  if (!store?.state?.noteRecords) return
  store.state.noteRecords[key] = parseLegacyStorageValue(key, value)
  store.state.sourceVersion += 1
}

const mockChromeStorage = {
  _store: new Map(),
  _listeners: new Set(),
  local: {
    get: jest.fn(keys => {
      if (keys === null) return Promise.resolve(Object.fromEntries(mockChromeStorage._store))
      const keyList = Array.isArray(keys) ? keys : [keys]
      return Promise.resolve(Object.fromEntries(keyList
        .filter(key => mockChromeStorage._store.has(key))
        .map(key => [key, mockChromeStorage._store.get(key)])))
    }),
    set: jest.fn(items => {
      const changes = {}
      Object.entries(items).forEach(([key, value]) => {
        changes[key] = { oldValue: mockChromeStorage._store.get(key), newValue: value }
        mockChromeStorage._store.set(key, value)
      })
      mockChromeStorage._listeners.forEach(listener => listener(changes, 'local'))
      return Promise.resolve()
    }),
    remove: jest.fn(keys => {
      const keyList = Array.isArray(keys) ? keys : [keys]
      keyList.forEach(key => mockChromeStorage._store.delete(key))
      return Promise.resolve()
    })
  },
  onChanged: {
    addListener: jest.fn(listener => mockChromeStorage._listeners.add(listener)),
    removeListener: jest.fn(listener => mockChromeStorage._listeners.delete(listener))
  },
  _reset() {
    this._store.clear()
    this._listeners.clear()
    this.local.get.mockClear()
    this.local.set.mockClear()
    this.local.remove.mockClear()
    this.onChanged.addListener.mockClear()
    this.onChanged.removeListener.mockClear()
  }
}

global.localStorage = mockLocalStorage
global.mockLocalStorage = mockLocalStorage
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: mockLocalStorage
})
global.chrome = { runtime: { lastError: null }, storage: mockChromeStorage }
global.mockChromeStorage = mockChromeStorage
global.__MEMOPAD_TEST_STORE__ = require('@/store/index').default

beforeEach(() => {
  mockLocalStorage._reset()
  mockChromeStorage._reset()
})

// Mock window sizes
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
})
