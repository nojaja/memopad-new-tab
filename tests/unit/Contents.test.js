import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Contents from '@/components/Contents.vue'
import { nextTick } from 'vue'

describe('Contents.vue', () => {
  let store
  let scrollToTopMock

  beforeEach(() => {
    scrollToTopMock = jest.fn()

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
        config: () => ({ editor: { automaticLayout: true, fontSize: 14, theme: 'vs', tabSize: 4 }, markdown: {} })
      }
    })
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
          AppFooter: true,
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
})
