<template>
  <MonacoEditor class="editor" ref="editor" v-model="source" @change="change" :options="config" language="markdown" />
</template>

<script>
import MonacoEditor from 'vue-monaco'

export default {
  components: {
    MonacoEditor
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
        automaticLayout: true,
        fontSize: 16,
        fontFamily: '',
        tabSize: 4,
        theme: 'vs'
      })
    },
    onChange: {
      type: Function,
      required: false,
      default: function (value) { console.log(value) }
    }
  },
  methods: {
    resize () {
      this.$refs.editor.getMonaco().layout()
    },
    change (value, event) {
      this.onChange(value)
      // console.log(value, event)
      // debounce(function (e) {
      //   console.log(e)
      // }, 300)
    }
  }
}
</script>

<style>
.editor {
  width: 100%;
  height: 100%;
}
</style>
