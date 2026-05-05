<template>
  <div class="preview">
    <iframe
      id="child-frame"
      class="preview"
      :srcdoc="compiledMarkdown"
    />
  </div>
</template>

<script>
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import ruby from 'markdown-it-ruby'
import multimdTable from 'markdown-it-multimd-table'
import checkbox from 'markdown-it-task-checkbox'
import uml from 'markdown-it-plantuml'
import mermaid from 'mermaid'

export default {
    name: 'MarkdownPreview',
  components: {
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
        mermaid: true,
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
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: パーサーキャッシュとパーサーインスタンスの初期値を設定する
   * 実装理由: Markdown パーサーのキャッシュを管理するため
   * @returns {{ parserCacheKey: string, parser: object|null, compiledMarkdown: string }} 初期データ
   */
  data() {
    return {
      parserCacheKey: '',
      parser: null,
      compiledMarkdown: ''
    }
  },
  watch: {
    source: 'updateCompiledMarkdown',
    config: {
      handler: 'updateCompiledMarkdown',
      deep: true
    },
    autoUpdate: 'updateCompiledMarkdown'
  },
  /**
   * 処理名: 生成済み Markdown の初期更新
   * 処理概要: マウント時に preview 用 HTML を生成する
   */
  mounted() {
    this.updateCompiledMarkdown()
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
     * 処理名: HTML ドキュメントの構築
     * 処理概要: iframe の srcdoc に渡す完全な HTML を組み立てる
     * @param {string} bodyContent HTML 本体の文字列
     * @returns {string} 完成した HTML 文字列
     */
    buildHtmlDocument(bodyContent) {
      return `\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset='UTF-8'>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>New Tab</title>\n  <link href="./css/github-markdown-css.css" rel="stylesheet"></link>\n</head>\n<body>\n${bodyContent}\n</body>\n</html>\n`
    },
    /**
     * 処理名: プレビュー HTML の更新
     * 処理概要: Markdown をレンダリングし、srcdoc に渡す HTML を再生成する
     */
    async updateCompiledMarkdown() {
      if (!this.autoUpdate) {
        this.compiledMarkdown = this.buildHtmlDocument('')
        return
      }

      try {
        const body = await this.renderMarkdown()
        this.compiledMarkdown = this.buildHtmlDocument(body)
      } catch (e) {
        const escaped = md().utils.escapeHtml(e && e.message ? e.message : String(e))
        this.compiledMarkdown = this.buildHtmlDocument(`<pre>${escaped}</pre>`)
      }
    },
    /**
     * 処理名: Markdown レンダリング
     * 処理概要: Markdown ソースを HTML に変換し、Mermaid ブロックを SVG に置換して返す
     * @returns {Promise<string>} レンダリング済み HTML 文字列
     */
    async renderMarkdown() {
      const mdInstance = this.getMarkdownParser()
      const mermaidBlocks = []
      if (this.config.mermaid) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
          flowchart: {
            htmlLabels: false,
            useMaxWidth: true
          }
        })
        const defaultFence = mdInstance.renderer.rules.fence.bind(mdInstance.renderer.rules)
        /**
         * Mermaid fenced code renderer
         * @param {Array} tokens Markdown-it token list
         * @param {number} idx 現在のトークンインデックス
         * @param {object} options Markdown-it レンダラーオプション
         * @param {object} env 環境オブジェクト
         * @param {object} slf レンダラー自身
         * @returns {string} HTML 文字列
         */
        mdInstance.renderer.rules.fence = (tokens, idx, options, env, slf) => {
          const token = tokens[idx]
          const info = token.info ? token.info.trim() : ''
          if (info === 'mermaid') {
            const code = token.content.trim()
            const placeholder = `<div class="mermaid-placeholder" data-mermaid-id="mermaid-${idx}-${Math.random().toString(36).slice(2)}">${md().utils.escapeHtml(code)}</div>`
            mermaidBlocks.push({ id: placeholder.match(/data-mermaid-id="([^"]+)"/)[1], code, placeholder })
            return placeholder
          }
          return defaultFence(tokens, idx, options, env, slf)
        }
      }

      const html = mdInstance.render(this.source.trim())
      if (mermaidBlocks.length === 0) {
        return html
      }

      return this.renderMermaidBlocks(html, mermaidBlocks)
    },

    /**
     * 処理名: Mermaid ブロックの SVG 生成
     * @param {string} html Markdown から生成された HTML
     * @param {Array<{id:string,code:string,placeholder:string}>} mermaidBlocks Mermaid プレースホルダ情報
     * @returns {Promise<string>} Mermaid SVG を差し替えた HTML
     */
    async renderMermaidBlocks(html, mermaidBlocks) {
      const renderContainer = document.createElement('div')
      renderContainer.style.position = 'absolute'
      renderContainer.style.visibility = 'hidden'
      renderContainer.style.pointerEvents = 'none'
      if (document.body) {
        document.body.appendChild(renderContainer)
      }

      try {
        for (const block of mermaidBlocks) {
          try {
            const result = await mermaid.render(block.id, block.code, renderContainer)
            html = html.replace(block.placeholder, `<div class="mermaid">${result.svg}</div>`)
          } catch (error) {
            const escaped = md().utils.escapeHtml(error && error.message ? error.message : String(error))
            html = html.replace(block.placeholder, `<pre>${escaped}</pre>`)
          }
        }
      } finally {
        if (renderContainer.parentNode) {
          renderContainer.parentNode.removeChild(renderContainer)
        }
      }

      return html
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
