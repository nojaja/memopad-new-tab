const mockLocalStorage = {
  _store: new Map(),
  getItem: jest.fn(key => mockLocalStorage._store.get(key)),
  setItem: jest.fn((key, value) => mockLocalStorage._store.set(key, value)),
  clear: jest.fn(() => mockLocalStorage._store.clear()),
  _reset() {
    this._store.clear()
    this.getItem.mockClear()
    this.setItem.mockClear()
    this.clear.mockClear()
  }
}

global.localStorage = mockLocalStorage
global.mockLocalStorage = mockLocalStorage

beforeEach(() => {
  mockLocalStorage._reset()
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
