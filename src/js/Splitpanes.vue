<template>
  <div>
    <div class="wrapper">
      <div style="width: 200px">
        <NoteList></NoteList>
      </div>
      <div v-bind:style="{ height: this.height-25+'px' , width : '100%' }" >
        <div class="titleSection">
          <input placeholder="Title" value="テスト">
        </div>
        <splitpanes @resize="handler" firstSplitter>
          <pane v-if="!hideEditPane" min-size="10" >
            <Monaco ref="monaco"></Monaco>
          </pane>
          <pane v-if="!hidePreviewPane">
        <Preview></Preview>
          </pane>
        </splitpanes>
        <div id="footer">
          <button @click="hideEditPane = false;hidePreviewPane=true">edit</button>
          <button @click="hideEditPane = false;hidePreviewPane=false">both</button>
          <button @click="hideEditPane = true;hidePreviewPane=false">Preview</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import NoteList from './NoteList.vue'
import Monaco from './Monaco.vue'
import Preview from './Preview.vue'

export default {
  components: {
    Splitpanes,
    Pane,
    Monaco,
    NoteList,
    Preview
  },
  data () {
    return {
      hideEditPane: false,
      hidePreviewPane: false,
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  methods: {
    handler (event) {
      this.$refs.monaco.resize()
    },
    handleResize: function () {
      this.width = window.innerWidth
      this.height = window.innerHeight
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style>
.titleSection {
    display: flex;
    height: 50px;
    width: 100%;
    border-width: 0px 0px 1px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.26);
}
.titleSection input {
    font-size: 24px;
    height: 100%;
    background-color: transparent;
    color: #2c3e50;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0px 12px;
    flex: 1 1 0%;
    outline: none;
    box-sizing: border-box;
}
.wrapper {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
}
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
#footer {
  min-height: 32px;
  height: auto;
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #aaa;
}
</style>
