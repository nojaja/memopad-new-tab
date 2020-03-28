<template>
  <splitpanes @resize="handleResize" firstSplitter>
    <pane v-if="!hideEditPane" min-size="10" >
      <Monaco ref="monaco" :source="source" :onChange="onChange"></Monaco>
    </pane>
    <pane v-if="!hidePreviewPane">
      <Preview :source="source"></Preview>
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
  methods: {
    onChange (value) {
      this.$store.dispatch('update', value)
    },
    handleResize (event) { // パネルリサイズ時にmonaco側にリサイズ通知する
      this.$refs.monaco.resize()
    }
  }
}
</script>

<style>
.splitpanes .splitpanes__pane {
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
