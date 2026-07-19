<template>
  <div
    class="editor"
    @mouseenter="handleEditorMouseEnter"
    @mouseleave="handleEditorMouseLeave"
  >
    <CodeEditor
      ref="codeEditor"
      :value="source"
      language="markdown"
      :theme="editorTheme"
      :options="editorOptions"
      @change="handleChange"
      @update:value="handleChange"
      @editor-did-mount="handleEditorDidMount"
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
        theme: 'vs',
        quickSuggestions: false
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
  emits: ['update:source', 'editorScroll', 'editorFocus', 'editorBlur'],
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: Monaco エディタインスタンスの初期値を設定する
   * 実装理由: エディタインスタンスをリアクティブに管理するため
   * @returns {{ editor: object|null }} 初期データ
   */
  data() {
    return {
      editor: null,
      isProgrammaticScroll: false
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

      if (typeof options.wrapping === 'boolean') {
        const wrappingColumn = Number(options.wrappingColumn)
        if (!options.wrapping) {
          options.wordWrap = 'off'
          delete options.wordWrapColumn
        } else if (!Number.isFinite(wrappingColumn) || wrappingColumn <= 0) {
          options.wordWrap = 'on'
          delete options.wordWrapColumn
        } else {
          options.wordWrap = 'wordWrapColumn'
          options.wordWrapColumn = Math.floor(wrappingColumn)
        }
      }

      delete options.wrapping
      delete options.wrappingColumn
      return options
    }
  },
  /**
   * 処理名: アンマウント前クリーンアップ
   * 処理概要: Monaco エディタインスタンスへの参照を解放する
   * 実装理由: メモリリークを防ぐためエディタ参照をクリアするため
   */
  beforeUnmount() {
    if (this.scrollDisposable && typeof this.scrollDisposable.dispose === 'function') {
      this.scrollDisposable.dispose()
    }
    if (this.focusDisposable && typeof this.focusDisposable.dispose === 'function') {
      this.focusDisposable.dispose()
    }
    if (this.blurDisposable && typeof this.blurDisposable.dispose === 'function') {
      this.blurDisposable.dispose()
    }
    this.editor = null
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

      if (typeof editor.onDidScrollChange === 'function') {
        this.scrollDisposable = editor.onDidScrollChange(() => {
          if (this.isProgrammaticScroll) return
          let lineNumber = 1
          if (typeof editor.getVisibleRanges === 'function') {
            const ranges = editor.getVisibleRanges()
            if (Array.isArray(ranges) && ranges.length > 0 && ranges[0]?.startLineNumber) {
              lineNumber = ranges[0].startLineNumber
            }
          } else if (typeof editor.getPosition === 'function') {
            const position = editor.getPosition()
            if (position && position.lineNumber) {
              lineNumber = position.lineNumber
            }
          }
          this.$emit('editorScroll', lineNumber)
        })
      }

      if (typeof editor.onDidFocusEditorText === 'function') {
        this.focusDisposable = editor.onDidFocusEditorText(() => {
          this.$emit('editorFocus')
        })
      }

      if (typeof editor.onDidBlurEditorText === 'function') {
        this.blurDisposable = editor.onDidBlurEditorText(() => {
          this.$emit('editorBlur')
        })
      }
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
    /**
     * 処理名: 先頭スクロール
     * 処理概要: Monaco エディタを先頭行へスクロールする
     * 実装理由: ノート切替時に先頭表示へ戻すため
     * @returns {void} なし
     */
    scrollToTop() {
      if (this.editor) {
        this.editor.setScrollTop(0)
      }
    },
    /**
     * 処理名: 行スクロール
     * 処理概要: 指定行が表示されるよう Monaco エディタをスクロールする
     * 実装理由: preview と editor のスクロール同期を実現するため
     * @param {number|string} line - 表示対象の行番号
     * @returns {void} なし
     */
    scrollToSourceLine(line) {
      if (!this.editor) return
      const lineNumber = Number(line) || 1
      this.isProgrammaticScroll = true
      if (typeof this.editor.revealLineInCenter === 'function') {
        this.editor.revealLineInCenter(lineNumber)
      } else if (typeof this.editor.revealLineNearTop === 'function') {
        this.editor.revealLineNearTop(lineNumber)
      } else if (typeof this.editor.getTopForLineNumber === 'function' && typeof this.editor.setScrollTop === 'function') {
        const top = this.editor.getTopForLineNumber(lineNumber)
        this.editor.setScrollTop(top)
      }
      // Monaco 側の scroll イベント処理が完了した次フレームで解除する
      requestAnimationFrame(() => {
        this.isProgrammaticScroll = false
      })
    },
    /**
     * 処理名: 比率スクロール
     * 処理概要: スクロール比率から Monaco エディタの位置を設定する
     * 実装理由: pane 間の比率同期を行うため
     * @param {number} ratio - 0.0-1.0 のスクロール比率
     * @returns {void} なし
     */
    scrollToRatio(ratio) {
      if (!this.editor) return
      const scrollHeight = this.editor.getScrollHeight()
      const clientHeight = this.editor.getDomNode()?.clientHeight || 1
      const top = ratio * Math.max(0, scrollHeight - clientHeight)
      this.isProgrammaticScroll = true
      this.editor.setScrollTop(top)
      requestAnimationFrame(() => {
        this.isProgrammaticScroll = false
      })
    },
    /**
     * 処理名: エディタホバー開始
     * 処理概要: マウス進入時にフォーカスイベントを親へ通知する
     * 実装理由: アクティブペイン判定を正しく更新するため
     * @returns {void} なし
     */
    handleEditorMouseEnter() {
      this.$emit('editorFocus')
    },
    /**
     * 処理名: エディタホバー終了
     * 処理概要: マウス離脱時にブラーイベントを親へ通知する
     * 実装理由: アクティブペイン判定を正しく解除するため
     * @returns {void} なし
     */
    handleEditorMouseLeave() {
      this.$emit('editorBlur')
    }
  }
}
</script>

<style>
.editor {
  width: 100%;
  height: 100%;
}

.editor .enable-motion,
.editor .monaco-editor,
.editor .overflow-guard {
  height: 100% !important;
}
</style>

