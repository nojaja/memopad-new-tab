<template>
  <div class="editor">
    <CodeEditor
      ref="codeEditor"
      :value="source"
      language="markdown"
      :theme="editorTheme"
      :options="editorOptions"
      @change="handleChange"
      @editorDidMount="handleEditorDidMount"
    />
  </div>
</template>

<script>
import { CodeEditor } from 'monaco-editor-vue3'
import { registerCompletions } from '@/editorCompletions'

export default {
  components: {
    CodeEditor
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
      default: function(value) { console.log(value) }
    }
  },
  emits: ['update:source'],
  data() {
    return {
      editor: null
    }
  },
  computed: {
    editorTheme() {
      return this.config && this.config.theme ? this.config.theme : 'vs'
    },
    editorOptions() {
      const options = { ...(this.config || {}) }
      delete options.theme
      return options
    }
  },
  methods: {
    handleEditorDidMount(editor) {
      this.editor = editor
      registerCompletions()
    },
    handleChange(value) {
      if (value === this.source) return
      this.$emit('update:source', value)
      this.onChange(value)
    },
    resize() {
      if (this.editor) {
        this.editor.layout()
      }
    }
  },
  beforeUnmount() {
    this.editor = null
  }
}
</script>

<style>
.editor {
  width: 100%;
  height: 100%;
}

.editor :deep(.enable-motion),
.editor :deep(.monaco-editor),
.editor :deep(.overflow-guard) {
  height: 100% !important;
}
</style>

