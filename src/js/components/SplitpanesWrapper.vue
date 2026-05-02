<template>
  <splitpanes @resize="handleResize" firstSplitter>
    <pane min-size="0" :size="editPaneSize">
      <div v-show="!hideEditPane" class="pane-body">
          <Monaco ref="monaco" :source="source" :onChange="onChange" :config="config.editor"></Monaco>
      </div>
    </pane>
    <pane min-size="0" :size="previewPaneSize">
      <div v-if="!hidePreviewPane" class="pane-body">
        <Preview :source="viewSource" :config="config.markdown"></Preview>
      </div>
    </pane>
  </splitpanes>
</template>

<script>
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Monaco from '@/components/Monaco.vue'
import Preview from '@/components/Preview.vue'

export default {
  components: {
    Splitpanes,
    Pane,
    Monaco,
    Preview
  },
  props: {
    source: {
      type: String,
      required: false,
      default: ''
    },
    config: {
      type: Object,
      required: false,
      default: () => ({
        editor: {
          automaticLayout: true,
          fontSize: 16,
          fontFamily: '',
          tabSize: 4,
          theme: 'vs'
        },
        markdown: {
          basicOption: {
            html: true,
            breaks: false,
            linkify: true,
            typography: true
          },
          emoji: true,
          ruby: true,
          uml: true,
          multimdTable: true,
          multimdTableOption: {
            multiline: true,
            rowspan: true,
            headerless: true
          },
          multibyteconvert: false,
          multibyteconvertList: []
        }
      })
    },
    hideEditPane: { // 編集パネルの表示非表示
      type: Boolean,
      required: false,
      default: false
    },
    hidePreviewPane: { // previewパネルの表示非表示
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      regExpData: []
    }
  },
  computed: {
    viewSource() { // 日本語markdown
      let w = this.source
      for (const i in this.regExpData) {
        w = w.replace(this.regExpData[i][0], this.regExpData[i][1])
      }
      return w
    },
    editPaneSize() {
      if (this.hideEditPane) return 0
      if (this.hidePreviewPane) return 100
      return 50
    },
    previewPaneSize() {
      if (this.hidePreviewPane) return 0
      if (this.hideEditPane) return 100
      return 50
    }
  },
  watch: {
    'config.markdown.multibyteconvert': function(val) {
      console.log('config.markdown.multibyteconvert')
      this.updateRegExpList()
    },
    'config.markdown.multibyteconvertList': function(val) {
      console.log('config.markdown.multibyteconvertList')
      this.updateRegExpList()
    }
  },
  created: function() {
    this.updateRegExpList()
  },
  methods: {
    onChange(value) {
      this.$store.dispatch('update', value)
    },
    handleResize() { // パネルリサイズ時にmonaco側にリサイズ通知する
      // Monaco automaticLayout is enabled by default and already uses ResizeObserver.
      if (this.config?.editor?.automaticLayout) return
      if (this.$refs.monaco && typeof this.$refs.monaco.resize === 'function') {
        requestAnimationFrame(() => {
          this.$refs.monaco.resize()
        })
      }
    },
    updateRegExpList() {
      this.regExpData = []
      if (this.config.markdown.multibyteconvert) {
        console.log(this.config.markdown.multibyteconvertList)
        this.config.markdown.multibyteconvertList.forEach((element, index, array) => {
          this.regExpData.push([new RegExp(element[0], 'gm'), element[1]])
        })
      }
    }
  }
}
</script>

<style>
.splitpanes {
  height: 100%;
}

.pane-body {
  width: 100%;
  height: 100%;
}

.splitpanes--vertical>.splitpanes__splitter {
    width: 7px;
    border-left: 1px solid #eee;
    margin-left: -1px;
}
.splitpanes .splitpanes__splitter {
    background-color: #fff;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    position: relative;
    -ms-flex-negative: 0;
    flex-shrink: 0;
}
.splitpanes--vertical>.splitpanes__splitter:before, .splitpanes--vertical>.splitpanes__splitter:before {
    margin-left: -2px;
}
.splitpanes--vertical>.splitpanes__splitter:after, .splitpanes--vertical>.splitpanes__splitter:before {
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    width: 1px;
    height: 30px;
}
.splitpanes .splitpanes__splitter:after, .splitpanes .splitpanes__splitter:before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: rgba(0,0,0,.15);
    -webkit-transition: background-color .3s;
    transition: background-color .3s;
}
</style>
