import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Contents from '@/components/Contents.vue'
import { nextTick } from 'vue'

describe('Contents.vue', () => {
  let store
  let scrollToTopMock
  let configState
  let dispatchMock

  function getViewModeButtons(wrapper) {
    return wrapper.findAll('button').slice(0, 3)
  }

  beforeEach(() => {
    scrollToTopMock = jest.fn()
    configState = {
      general: {},
      editor: { automaticLayout: true, fontSize: 14, theme: 'vs', tabSize: 4 },
      markdown: {}
    }

    store = createStore({
      state: {
        currentFile: {
          filename: 'index.md',
          projectName: 'note-a'
        }
      },
      getters: {
        currentFile: (state) => ({ filename: state.currentFile.filename, projectName: state.currentFile.projectName, file: {} }),
        source: () => '# テスト',
        config: () => configState
      }
    })

    dispatchMock = jest.fn()
    store.dispatch = dispatchMock
  })

  function mountContents() {
    return shallowMount(Contents, {
      global: {
        plugins: [store],
        components: {
          SplitpanesWrapper: {
            template: '<div></div>',
            methods: {
              scrollToTop: scrollToTopMock
            }
          }
        },
        stubs: {
          SplitpanesWrapper: false,
          AppFooter: false,
          UniconIcon: true
        }
      }
    })
  }

  test('note を切り替えたときに scrollToTop が呼ばれる', async () => {
    const wrapper = mountContents()

    store.state.currentFile = { filename: 'index.md', projectName: 'note-b' }

    await nextTick()

    expect(scrollToTopMock).toHaveBeenCalled()
  })

  test('同じ note 内でファイルを切り替えても scrollToTop は呼ばれない', async () => {
    const wrapper = mountContents()

    store.state.currentFile = { filename: 'subpage.md', projectName: 'note-a' }

    await nextTick()

    expect(scrollToTopMock).not.toHaveBeenCalled()
  })

  test('初期状態で both(F9) モードボタンのみ active になる', () => {
    const wrapper = mountContents()
    const [editorButton, bothButton, previewButton] = getViewModeButtons(wrapper)

    expect(editorButton.classes()).not.toContain('view-mode-button--active')
    expect(bothButton.classes()).toContain('view-mode-button--active')
    expect(previewButton.classes()).not.toContain('view-mode-button--active')
  })

  test('config.general.viewMode が editor の場合は editor モードで初期表示される', async () => {
    configState.general.viewMode = 'editor'

    const wrapper = mountContents()
    await nextTick()
    const [editorButton, bothButton, previewButton] = getViewModeButtons(wrapper)

    expect(editorButton.classes()).toContain('view-mode-button--active')
    expect(bothButton.classes()).not.toContain('view-mode-button--active')
    expect(previewButton.classes()).not.toContain('view-mode-button--active')
  })

  test('F9 相当のクリックで both モードボタンのみ active になる', async () => {
    configState.general.viewMode = 'editor'
    const wrapper = mountContents()
    const [, bothButton] = getViewModeButtons(wrapper)

    await bothButton.trigger('click')
    await nextTick()

    const [editorButtonAfter, bothButtonAfter, previewButtonAfter] = getViewModeButtons(wrapper)
    expect(editorButtonAfter.classes()).not.toContain('view-mode-button--active')
    expect(bothButtonAfter.classes()).toContain('view-mode-button--active')
    expect(previewButtonAfter.classes()).not.toContain('view-mode-button--active')
    expect(dispatchMock).toHaveBeenCalledWith('setConfig', expect.objectContaining({
      general: expect.objectContaining({ viewMode: 'both' })
    }))
  })

  test('F10 相当のクリックで preview モードボタンのみ active になる', async () => {
    const wrapper = mountContents()
    const [, , previewButton] = getViewModeButtons(wrapper)

    await previewButton.trigger('click')
    await nextTick()

    const [editorButtonAfter, bothButtonAfter, previewButtonAfter] = getViewModeButtons(wrapper)
    expect(editorButtonAfter.classes()).not.toContain('view-mode-button--active')
    expect(bothButtonAfter.classes()).not.toContain('view-mode-button--active')
    expect(previewButtonAfter.classes()).toContain('view-mode-button--active')
    expect(dispatchMock).toHaveBeenCalledWith('setConfig', expect.objectContaining({
      general: expect.objectContaining({ viewMode: 'preview' })
    }))
  })

  test('contents footer に delete note ボタンが存在しない', () => {
    const wrapper = mountContents()
    expect(wrapper.find('button[aria-label="delete note"]').exists()).toBe(false)
  })
})
