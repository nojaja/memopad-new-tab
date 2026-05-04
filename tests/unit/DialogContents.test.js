/**
 * Dialog.vue と Contents.vue のテスト
 */
const { shallowMount } = require('@vue/test-utils')
const { createStore } = require('vuex')
const Dialog = require('@/components/Dialog.vue').default
const Contents = require('@/components/Contents.vue').default

// DialogHelper モック
jest.mock('@/DialogHelper', () => ({
  default: { showDialog: jest.fn() }
}), { virtual: true })

describe('Dialog.vue メソッドテスト', () => {
  let wrapper

  test('コンポーネントがマウントされる', () => {
    wrapper = shallowMount(Dialog, {
      props: {
        subject: 'テスト題名',
        message: 'テストメッセージ',
        onPrimary: jest.fn()
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  test('handlePrimary で isShow が false になる', () => {
    const onPrimary = jest.fn()
    wrapper = shallowMount(Dialog, {
      props: { subject: 'S', message: 'M', onPrimary }
    })
    wrapper.vm.handlePrimary()
    expect(wrapper.vm.isShow).toBe(false)
    expect(wrapper.vm.pendingCallback).toBe(onPrimary)
  })

  test('handleSecondary で isShow が false になる', () => {
    const onSecondary = jest.fn()
    wrapper = shallowMount(Dialog, {
      props: { subject: 'S', message: 'M', onPrimary: jest.fn(), onSecondary }
    })
    wrapper.vm.handleSecondary()
    expect(wrapper.vm.isShow).toBe(false)
    expect(wrapper.vm.pendingCallback).toBe(onSecondary)
  })

  test('afterLeave で pendingCallback が呼ばれる', () => {
    const callback = jest.fn()
    wrapper = shallowMount(Dialog, {
      props: { subject: 'S', message: 'M', onPrimary: callback }
    })
    wrapper.vm.handlePrimary()
    wrapper.vm.afterLeave()
    expect(callback).toHaveBeenCalled()
  })

  test('afterLeave で pendingCallback がない場合は何も起きない', () => {
    wrapper = shallowMount(Dialog, {
      props: { subject: 'S', message: 'M', onPrimary: jest.fn() }
    })
    wrapper.vm.pendingCallback = null
    expect(() => wrapper.vm.afterLeave()).not.toThrow()
  })
})

describe('Contents.vue テスト', () => {
  let store
  let wrapper

  beforeEach(() => {
    store = createStore({
      state: {
        currentFile: { projectName: '', filename: '' }
      },
      getters: {
        source: () => '# テスト',
        config: () => ({
          basicOption: { html: true, breaks: false, linkify: true, typography: true },
          emoji: true, ruby: true, uml: false, multimdTable: false, checkbox: false,
          multimdTableOption: {}
        }),
        currentFile: () => ({
          file: null
        })
      },
      mutations: {
        updateTitle: jest.fn(),
        deleteProject: jest.fn()
      }
    })

    wrapper = shallowMount(Contents, {
      global: {
        plugins: [store],
        stubs: { SplitpanesWrapper: true, Footer: true, unicon: true }
      }
    })
  })

  test('コンポーネントがマウントされる', () => {
    expect(wrapper.exists()).toBe(true)
  })

  test('title computed が currentFile.file がない場合空文字を返す', () => {
    expect(wrapper.vm.title).toBe('')
  })

  test('handleResize でウィンドウサイズが更新される', () => {
    window.innerWidth = 1024
    window.innerHeight = 768
    wrapper.vm.handleResize()
    expect(wrapper.vm.width).toBe(1024)
    expect(wrapper.vm.height).toBe(768)
  })

  test('updateTitle が store commit を呼ぶ', () => {
    const commitSpy = jest.spyOn(store, 'commit')
    wrapper.vm.updateTitle({ target: { value: '新しいタイトル' } })
    expect(commitSpy).toHaveBeenCalledWith('updateTitle', '新しいタイトル')
    commitSpy.mockRestore()
  })

  test('title computed が getDescription を持つ file で description を返す', async () => {
    const storeWithFile = createStore({
      state: {},
      getters: {
        source: () => '',
        config: () => ({}),
        currentFile: () => ({
          file: { getDescription: () => '説明テキスト' }
        })
      },
      mutations: { updateTitle: jest.fn(), deleteProject: jest.fn() }
    })
    const w = shallowMount(Contents, {
      global: {
        plugins: [storeWithFile],
        stubs: { SplitpanesWrapper: true, Footer: true, unicon: true }
      }
    })
    expect(w.vm.title).toBe('説明テキスト')
  })

  test('title computed が description プロパティを持つ file で description を返す', async () => {
    const storeWithFile = createStore({
      state: {},
      getters: {
        source: () => '',
        config: () => ({}),
        currentFile: () => ({
          file: { description: 'ファイルの説明' }
        })
      },
      mutations: { updateTitle: jest.fn(), deleteProject: jest.fn() }
    })
    const w = shallowMount(Contents, {
      global: {
        plugins: [storeWithFile],
        stubs: { SplitpanesWrapper: true, Footer: true, unicon: true }
      }
    })
    expect(w.vm.title).toBe('ファイルの説明')
  })

  test('beforeUnmount でリスナーが削除される', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })
})
