<template>
  <div class="editor">
    <CodeEditor
      ref="codeEditor"
      :value="source"
      language="markdown"
      :theme="editorTheme"
      :options="editorOptions"
      @change="handleChange"
      @update:value="handleChange"
      @editorDidMount="handleEditorDidMount"
    />
  </div>
</template>

<script>
import { CodeEditor } from 'monaco-editor-vue3'
import { registerCompletions } from '@/editorCompletions'

export default {
    name: 'MonacoEditor',
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
      default: /**
       * 処理名: config デフォルト値
       * 処理概要: エディタ設定のデフォルト値を返す
       * 実装理由: prop が渡されなかった場合に標準設定を適用するため
       * @returns {object} デフォルトエディタ設定
       */
      () => ({
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
      default: /**
       * 処理名: onChange デフォルトハンドラ
       * 処理概要: 変更イベントのデフォルトコールバック（コンソール出力）
       * 実装理由: prop が渡されなかった場合の安全なデフォルト実装
       * @param {string} value - 変更後のエディタ内容
       */
      function(value) { console.log(value) }
    }
  },
  emits: ['update:source'],
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: Monaco エディタインスタンスの初期値を設定する
   * 実装理由: エディタインスタンスをリアクティブに管理するため
   * @returns {{ editor: object|null }} 初期データ
   */
  data() {
    return {
      editor: null
    }
  },
  computed: {
    /**
     * 処理名: エディタテーマ取得
     * 処理概要: config からテーマ名を返しデフォルトは 'vs' にする
     * 実装理由: テーマ設定を安全に算出して子コンポーネントに渡すため
     * @returns {string} テーマ名
     */
    editorTheme() {
      return this.config && this.config.theme ? this.config.theme : 'vs'
    },
    /**
     * 処理名: エディタオプション取得
     * 処理概要: config からテーマを除いたオプションオブジェクトを返す
     * 実装理由: theme は別プロパティで渡すため config から分離するため
     * @returns {object} テーマを除いたエディタオプション
     */
    editorOptions() {
      const options = { ...(this.config || {}) }
      delete options.theme
      return options
    }
  },
  methods: {
    /**
     * 処理名: エディタマウント後処理
     * 処理概要: エディタインスタンスを保存して補完候補を登録する
     * 実装理由: エディタ初期化後に Markdown 補完機能を有効化するため
     * @param {object} editor - Monaco エディタインスタンス
     */
    handleEditorDidMount(editor) {
      this.editor = editor
      registerCompletions()
    },
    /**
     * 処理名: エディタ変更ハンドラ
     * 処理概要: エディタ内容変更時に親コンポーネントへ通知する
     * 実装理由: エディタの変更をストアに伝搬するため
     * @param {string} value - 変更後のエディタ内容
     */
    handleChange(value) {
      if (typeof value !== 'string') return
      if (value === this.source) return
      this.$emit('update:source', value)
      this.onChange(value)
    },
    /**
     * 処理名: エディタリサイズ
     * 処理概要: Monaco エディタのレイアウトを再計算してリサイズする
     * 実装理由: ペインサイズ変更時にエディタが正しい大きさで描画されるようにするため
     */
    resize() {
      if (this.editor) {
        this.editor.layout()
      }
    },
    scrollToTop() {
      if (this.editor) {
        this.editor.setScrollTop(0)
      }
    }
  },
  /**
   * 処理名: アンマウント前クリーンアップ
   * 処理概要: Monaco エディタインスタンスへの参照を解放する
   * 実装理由: メモリリークを防ぐためエディタ参照をクリアするため
   */
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

