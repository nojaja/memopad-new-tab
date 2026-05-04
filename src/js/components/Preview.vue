<template>
  <div class="preview"><iframe id="child-frame" class="preview" :srcdoc="compiledMarkdown" ></iframe></div>
</template>

<script>
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import ruby from 'markdown-it-ruby'
import multimdTable from 'markdown-it-multimd-table'
import checkbox from 'markdown-it-task-checkbox'
import uml from 'markdown-it-plantuml'

export default {
    name: 'MarkdownPreview',
  components: {
  },
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: パーサーキャッシュとパーサーインスタンスの初期値を設定する
   * 実装理由: Markdown パーサーのキャッシュを管理するため
   * @returns {{ parserCacheKey: string, parser: object|null }} 初期データ
   */
  data() {
    return {
      parserCacheKey: '',
      parser: null
    }
  },
  props: {
    autoUpdate: {
      type: Boolean,
      required: false,
      default: true
    },
    source: {
      type: String,
      required: false,
      default: '# test  \n## hoge'
    },
    config: {
      type: Object,
      required: false,
      default: /**
       * 処理名: config デフォルト値
       * 処理概要: Markdown パーサー設定のデフォルト値を返す
       * 実装理由: prop が渡されなかった場合に標準的な設定を適用するため
       * @returns {object} デフォルト Markdown 設定
       */
      () => ({
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
        }
      })
    }
  },
  computed: {
    /**
     * 処理名: コンパイル済み Markdown
     * 処理概要: Markdown ソースを HTML に変換して iframe 用の完全な HTML ドキュメントを返す
     * 実装理由: プレビュー iframe に安全な HTML を srcdoc として渡すため
     * @returns {string} iframe の srcdoc 用 HTML 文字列
     */
    compiledMarkdown: function() {
      const parseData = this.autoUpdate ? this.renderMarkdown() : ''
      const htmlheader = `
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link href="./css/github-markdown-css.css" rel="stylesheet"></link>
</head>
<body>
`
      const htmlfooter = `
</body>
</html>
`
      return (htmlheader + parseData + htmlfooter)
    }
  },
  methods: {
    /**
     * 処理名: Markdown パーサー取得
     * 処理概要: 設定をキーとしてパーサーをキャッシュし再利用する
     * 実装理由: 設定が変わらない限りパーサーを再生成しないことでパフォーマンスを向上するため
     * @returns {object} markdown-it インスタンス
     */
    getMarkdownParser() {
      const cacheKey = JSON.stringify(this.config || {})
      if (this.parser && this.parserCacheKey === cacheKey) {
        return this.parser
      }

      const mdInstance = md(this.config.basicOption)
      if (this.config.emoji) mdInstance.use(emoji)
      if (this.config.ruby) mdInstance.use(ruby)
      if (this.config.multimdTable) mdInstance.use(multimdTable, this.config.multimdTableOption)
      if (this.config.checkbox) mdInstance.use(checkbox)
      if (this.config.uml) mdInstance.use(uml)

      this.parser = mdInstance
      this.parserCacheKey = cacheKey
      return mdInstance
    },
    /**
     * 処理名: Markdown レンダリング
     * 処理概要: ソースを Markdown パーサーで HTML に変換して返す
     * 実装理由: ソースを HTML に変換してプレビューに表示するため
     * @returns {string} レンダリング済み HTML 文字列
     */
    renderMarkdown() {
      const mdInstance = this.getMarkdownParser()
      return mdInstance.render(this.source.trim())
    }
  }
}
</script>

<style>
.preview {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
