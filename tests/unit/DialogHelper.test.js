/**
 * DialogHelper.ts のカバレッジテスト
 */
const { createApp } = require('vue')

// createApp をモックして実際の DOM 操作を防ぐ
jest.mock('vue', () => ({
  createApp: jest.fn(() => ({
    mount: jest.fn(),
    unmount: jest.fn()
  }))
}))

// Dialog コンポーネントをモック
jest.mock('@/components/Dialog.vue', () => ({ default: { template: '<div/>' } }), { virtual: true })

const DialogHelper = require('@/DialogHelper').default

describe('DialogHelper', () => {
  let appendChildSpy
  let mockApp

  beforeEach(() => {
    jest.clearAllMocks()
    mockApp = { mount: jest.fn(), unmount: jest.fn() }
    createApp.mockReturnValue(mockApp)
    appendChildSpy = jest.spyOn(document.body, 'appendChild')
  })

  afterEach(() => {
    appendChildSpy.mockRestore()
  })

  test('showDialog が createApp を呼ぶ', () => {
    DialogHelper.showDialog({}, {
      subject: 'テスト',
      message: 'メッセージ',
      ok: jest.fn()
    })
    expect(createApp).toHaveBeenCalled()
    expect(mockApp.mount).toHaveBeenCalled()
  })

  test('ok コールバック付きで呼ばれる (cancel なし)', () => {
    const okFn = jest.fn()
    const { createApp: ca } = require('vue')
    let capturedProps = null
    ca.mockImplementation((_comp, props) => {
      capturedProps = props
      return mockApp
    })
    DialogHelper.showDialog({}, { subject: 'S', message: 'M', ok: okFn })
    // onPrimary を呼ぶ（ok + cleanup）
    expect(capturedProps).not.toBeNull()
    capturedProps.onPrimary()
    expect(okFn).toHaveBeenCalled()
    expect(mockApp.unmount).toHaveBeenCalled()
  })

  test('cancel コールバック付きで呼ばれる', () => {
    const okFn = jest.fn()
    const cancelFn = jest.fn()
    const { createApp: ca } = require('vue')
    let capturedProps = null
    ca.mockImplementation((_comp, props) => {
      capturedProps = props
      return mockApp
    })
    DialogHelper.showDialog({}, { subject: 'S', message: 'M', ok: okFn, cancel: cancelFn })
    expect(capturedProps.onSecondary).toBeDefined()
    capturedProps.onSecondary()
    expect(cancelFn).toHaveBeenCalled()
    expect(mockApp.unmount).toHaveBeenCalled()
  })
})
