<template>
  <div class="preview"><iframe ref="childFrame" id="child-frame" class="preview"></iframe></div>
</template>

<script>
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import ruby from 'markdown-it-ruby'
import multimdTable from 'markdown-it-multimd-table'
import checkbox from 'markdown-it-task-checkbox'
import uml from 'markdown-it-plantuml'

const SOURCE_LINE_ATTRIBUTE = 'data-source-line'
const CONTENT_WRAPPER_ID = 'content'

/**
 * 処理名: iframeコンテキスト解決
 * 処理概要: vm.$refs から iframe/window/document を取得する
 * 実装理由: メソッド単体呼び出し時でも同一ロジックで参照解決するため
 * @param {object} vm - コンポーネントインスタンス相当オブジェクト
 * @returns {{ iframe: HTMLIFrameElement, win: Window, doc: Document }|null} iframeコンテキスト
 */
function resolveIframeContext(vm) {
  const iframe = vm?.$refs?.childFrame
  if (!iframe || !iframe.contentWindow || !iframe.contentDocument) return null
  return { iframe, win: iframe.contentWindow, doc: iframe.contentDocument }
}

/**
 * 処理名: 行位置配列解決
 * 処理概要: キャッシュを優先し、無ければ document から行位置配列を構築する
 * 実装理由: 表示行計算の前処理を共通化して複雑度を抑えるため
 * @param {object} vm - コンポーネントインスタンス相当オブジェクト
 * @param {Document} doc - iframeのdocument
 * @returns {Array<{line:number,top:number,height:number}>} 行位置配列
 */
function resolveLinePositions(vm, doc) {
  if (Array.isArray(vm.cachedLinePositions) && vm.cachedLinePositions.length) {
    return vm.cachedLinePositions
  }
  if (typeof vm.getLinePositionsFromDocument === 'function') {
    return vm.getLinePositionsFromDocument(doc)
  }
  const elements = Array.from(doc.querySelectorAll(`[${SOURCE_LINE_ATTRIBUTE}]`))
  const positions = []
  for (const element of elements) {
    positions.push({
      line: Number(element.getAttribute(SOURCE_LINE_ATTRIBUTE)) || 1,
      top: element.offsetTop || 0,
      height: element.offsetHeight || 0
    })
  }
  return positions
}

/**
 * 処理名: 可視先頭インデックス探索
 * 処理概要: 現在のscrollTopで最初に可視となるインデックスを返す
 * 実装理由: 可視行計算を O(log n) で実行するため
 * @param {Array<{line:number,top:number,height:number}>} positions - 行位置配列
 * @param {number} scrollTop - 現在スクロール量
 * @returns {number} 可視先頭インデックス
 */
function findVisibleIndex(positions, scrollTop) {
  let low = 0
  let high = positions.length - 1
  let resultIndex = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const entry = positions[mid]
    if (entry.top + entry.height > scrollTop) {
      resultIndex = mid
      high = mid - 1
    } else {
      low = mid + 1
    }
  }
  return resultIndex
}

/**
 * 処理名: 近傍行インデックス探索
 * 処理概要: 指定行以下で最も近い行のインデックスを返す
 * 実装理由: 完全一致しない行番号でも安定して同期するため
 * @param {Array<{line:number,top:number,height:number}>} positions - 行位置配列
 * @param {number} lineNumber - 探索対象行
 * @returns {number} 近傍行インデックス
 */
function findClosestIndex(positions, lineNumber) {
  let low = 0
  let high = positions.length - 1
  let closestIndex = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const entryLine = positions[mid].line
    if (entryLine === lineNumber) {
      return mid
    }
    if (entryLine < lineNumber) {
      closestIndex = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return Math.min(Math.max(0, closestIndex), positions.length - 1)
}

/**
 * 処理名: iframeスクロールイベント処理
 * 処理概要: 同期中でなければ previewScroll 通知を非同期予約する
 * 実装理由: attachIframeScroll で this 依存のメソッド欠如時も動作させるため
 * @returns {void} なし
 */
function handleIframeScrollEvent() {
  if (this.isSyncingScroll || this.scrollEventPending) return
  this.scrollEventPending = true
  if (typeof this.emitPreviewScroll === 'function') {
    setTimeout(this.emitPreviewScroll.bind(this), 0)
    return
  }
  setTimeout(function() {
    this.$emit('previewScroll', this.getVisibleSourceLine())
    this.scrollEventPending = false
  }.bind(this), 0)
}

export default {
  name: 'MarkdownPreview',
  emits: ['previewScroll', 'previewFocus', 'previewBlur'],
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: preview 同期と iframe イベント管理に必要な状態を初期化する
   * 実装理由: 描画・スクロール同期・イベント解除を一元管理するため
   * @returns {object} 初期データ
   */
  data() {
    return {
      parserCacheKey: '',
      parser: null,
      hasIframeLoaded: false,
      isSyncingScroll: false,
      scrollEventPending: false,
      cachedLineElements: [],
      cachedLinePositions: [],
      onIframeLoad: null,
      onIframeScroll: null
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
      /**
       * 処理名: preview設定デフォルト値
       * 処理概要: markdown-it の各種オプション既定値を返す
       * 実装理由: 親から設定未指定でも安定した描画を行うため
       * @returns {object} preview設定デフォルト値
       */
      default: () => ({
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
     * 処理名: コンパイル済みMarkdown取得
     * 処理概要: source を HTML に変換し iframe 全体ドキュメントとして返す
     * 実装理由: iframe の srcdoc 更新を単一経路に集約するため
     * @returns {string} iframe へ設定する HTML 文字列
     */
    compiledMarkdown() {
      const content = this.autoUpdate ? this.renderMarkdown() : ''
      return this.buildIframeDocument(content)
    }
  },
  /**
   * 処理名: マウント後初期化
   * 処理概要: iframe のフォーカス・ロード・スクロール関連イベントを登録する
   * 実装理由: preview の操作状態とスクロール同期を有効化するため
   * @returns {void} なし
   */
  mounted() {
    const iframe = this.$refs.childFrame
    if (!iframe) return

    this.onIframeFocus = this.handleIframeFocus.bind(this)
    this.onIframeBlur = this.handleIframeBlur.bind(this)
    this.onIframeHover = this.handleIframeHover.bind(this)
    this.onIframeActivate = this.handleIframeActivate.bind(this)
    iframe.setAttribute('tabindex', '0')
    iframe.addEventListener('focus', this.onIframeFocus)
    iframe.addEventListener('blur', this.onIframeBlur)
    iframe.addEventListener('mouseenter', this.onIframeHover)
    iframe.addEventListener('mouseleave', this.onIframeBlur)
    iframe.addEventListener('pointerdown', this.onIframeActivate)

    this.onIframeLoad = this.handleIframeLoad.bind(this)
    iframe.addEventListener('load', this.onIframeLoad)
    iframe.srcdoc = this.buildIframeDocument(this.renderMarkdown())
  },
  /**
   * 処理名: アンマウント前クリーンアップ
   * 処理概要: iframe に登録したイベントを全て解除する
   * 実装理由: コンポーネント破棄後のイベントリークを防止するため
   * @returns {void} なし
   */
  beforeUnmount() {
    const iframe = this.$refs.childFrame
    if (!iframe) return

    this.removeListener(iframe, 'load', this.onIframeLoad)
    this.removeListener(iframe, 'focus', this.onIframeFocus)
    this.removeListener(iframe, 'blur', this.onIframeBlur)
    this.removeListener(iframe, 'mouseenter', this.onIframeHover)
    this.removeListener(iframe, 'pointerdown', this.onIframeActivate)
    this.removeListener(iframe.contentDocument, 'pointerdown', this.onIframeActivate)
    this.removeListener(iframe.contentWindow, 'scroll', this.onIframeScroll)
  },
  watch: {
    /**
     * 処理名: ソース変更ウォッチャー
     * 処理概要: source 変更時に表示内容を再描画し同位置へ復元する
     * 実装理由: 編集中の視点を維持したまま preview を更新するため
     * @returns {void} なし
     */
    source() {
      if (!this.hasIframeLoaded) return
      const currentLine = this.getVisibleSourceLine()
      this.updateIframeContent(currentLine)
    },
    config: {
      deep: true,
      /**
       * 処理名: 設定変更ウォッチャー
       * 処理概要: markdown 設定変更時に再描画し同位置へ復元する
       * 実装理由: 設定変更を即時 preview に反映するため
       * @returns {void} なし
       */
      handler() {
        if (!this.hasIframeLoaded) return
        const currentLine = this.getVisibleSourceLine()
        this.updateIframeContent(currentLine)
      }
    }
  },
  methods: {
    /**
     * 処理名: iframe コンテキスト取得
     * 処理概要: iframe/window/document をまとめて取得する
     * 実装理由: null チェックを共通化し各メソッドの分岐を減らすため
     * @returns {{ iframe: HTMLIFrameElement, win: Window, doc: Document }|null} iframe コンテキスト
     */
    getIframeContext() {
      const iframe = this.$refs.childFrame
      if (!iframe || !iframe.contentWindow || !iframe.contentDocument) return null
      return {
        iframe,
        win: iframe.contentWindow,
        doc: iframe.contentDocument
      }
    },
    /**
     * 処理名: iframe ロード後処理
     * 処理概要: ロード完了フラグを立て、行情報キャッシュとスクロール監視を開始する
     * 実装理由: 初回描画後にのみ同期処理を有効化するため
     * @returns {void} なし
     */
    handleIframeLoad() {
      this.hasIframeLoaded = true
      this.cacheSourceLineElements()
      this.attachIframeScroll()
    },
    /**
     * 処理名: iframe フォーカス通知
     * 処理概要: previewFocus イベントを親へ通知する
     * 実装理由: アクティブペイン判定に preview 側操作を反映するため
     * @returns {void} なし
     */
    handleIframeFocus() {
      this.$emit('previewFocus')
    },
    /**
     * 処理名: iframe ブラー通知
     * 処理概要: previewBlur イベントを親へ通知する
     * 実装理由: アクティブペイン判定を解除できるようにするため
     * @returns {void} なし
     */
    handleIframeBlur() {
      this.$emit('previewBlur')
    },
    /**
     * 処理名: iframe ホバー通知
     * 処理概要: ホバー開始時に previewFocus を通知する
     * 実装理由: iframe 内操作開始を早期に検知するため
     * @returns {void} なし
     */
    handleIframeHover() {
      this.$emit('previewFocus')
    },
    /**
     * 処理名: iframe 操作開始通知
     * 処理概要: pointerdown 時に previewFocus を通知する
     * 実装理由: ドラッグやクリック開始時点でアクティブ状態に反映するため
     * @returns {void} なし
     */
    handleIframeActivate() {
      this.$emit('previewFocus')
    },
    /**
     * 処理名: イベント解除ユーティリティ
     * 処理概要: target と handler が有効な場合のみ removeEventListener を実行する
     * 実装理由: beforeUnmount の分岐を簡素化して可読性を上げるため
     * @param {EventTarget|null|undefined} target - イベント解除対象
     * @param {string} eventName - イベント名
     * @param {Function|null|undefined} handler - 解除対象ハンドラ
     * @returns {void} なし
     */
    removeListener(target, eventName, handler) {
      if (!target || !handler) return
      target.removeEventListener(eventName, handler)
    },
    /**
     * 処理名: iframeドキュメント構築
     * 処理概要: プレビュー本文を iframe 用の完全HTMLに包んで返す
     * 実装理由: srcdoc 更新時に必須ヘッダー/スタイルを常に含めるため
     * @param {string} content - body 内へ挿入するHTML
     * @returns {string} iframeへ設定するHTML文書
     */
    buildIframeDocument(content = '') {
      const htmlheader = `
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link href="./css/github-markdown-css.css" rel="stylesheet"></link>
  <style>
    html, body {
      min-height: 100%;
      margin: 0;
      padding-bottom: 100vh;
      box-sizing: border-box;
    }
    body {
      overflow-x: hidden;
    }
  </style>
</head>
<body>
<div id="content">
`
      const htmlfooter = `
</div>
</body>
</html>
`
      return htmlheader + content + htmlfooter
    },
    /**
     * 処理名: Markdownパーサー取得
     * 処理概要: 設定に応じた markdown-it インスタンスをキャッシュして返す
     * 実装理由: 再生成コストを抑えつつ設定変更時のみ再構築するため
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
     * 処理名: Markdownレンダリング
     * 処理概要: source を HTML に変換し行番号属性を埋め込む
     * 実装理由: editor と preview の行単位同期に必要な属性を付与するため
     * @returns {string} 変換後 HTML
     */
    renderMarkdown() {
      const mdInstance = this.getMarkdownParser()
      const env = {}
      const tokens = mdInstance.parse(this.source.trim(), env)
      for (const token of tokens) {
        if (token.nesting === 1 && Array.isArray(token.map) && token.map.length > 0) {
          if (!token.attrIndex || token.attrIndex('data-source-line') === -1) {
            token.attrPush([SOURCE_LINE_ATTRIBUTE, String(token.map[0] + 1)])
          }
        }
      }
      return mdInstance.renderer.render(tokens, mdInstance.options, env)
    },
    /**
     * 処理名: iframeスクロール監視登録
     * 処理概要: iframe 側の scroll イベントを登録して行番号を通知する
     * 実装理由: preview スクロールを editor へ反映するため
     * @returns {void} なし
     */
    attachIframeScroll() {
      let context = null
      if (typeof this.getIframeContext === 'function') {
        context = this.getIframeContext()
      } else {
        const iframe = this.$refs?.childFrame
        if (iframe && iframe.contentWindow && iframe.contentDocument) {
          context = { iframe, win: iframe.contentWindow, doc: iframe.contentDocument }
        }
      }
      if (!context) return

      this.onIframeScroll = handleIframeScrollEvent.bind(this)
      context.win.addEventListener('scroll', this.onIframeScroll, { passive: true })

      if (this.onIframeActivate) {
        context.doc.addEventListener('pointerdown', this.onIframeActivate)
      }
    },
    /**
     * 処理名: iframeスクロール処理
     * 処理概要: プログラムスクロール中でなければ行番号通知を予約する
     * 実装理由: 高頻度 scroll を間引いて UI ブロックを防ぐため
     * @returns {void} なし
     */
    handleIframeScroll() {
      if (this.isSyncingScroll || this.scrollEventPending) return
      this.scrollEventPending = true
      if (typeof this.emitPreviewScroll === 'function') {
        setTimeout(this.emitPreviewScroll.bind(this), 0)
        return
      }
      setTimeout(/**
       * 処理名: previewスクロール通知フォールバック
       * 処理概要: helperが無いコンテキストでもscroll通知とpending解除を実行する
       * 実装理由: メソッド単体テストで最小コンテキストでも互換動作させるため
       */
      function() {
        this.$emit('previewScroll', this.getVisibleSourceLine())
        this.scrollEventPending = false
      }.bind(this), 0)
    },
    /**
     * 処理名: previewスクロール通知
     * 処理概要: 現在表示行を算出して previewScroll を emit する
     * 実装理由: 非同期で同期イベントを発火しメインスレッド負荷を下げるため
     * @returns {void} なし
     */
    emitPreviewScroll() {
      this.$emit('previewScroll', this.getVisibleSourceLine())
      this.scrollEventPending = false
    },
    /**
     * 処理名: 行要素位置配列生成
     * 処理概要: data-source-line 属性を持つ要素の位置情報配列を生成する
     * 実装理由: 行番号ベース同期を高速に行うため
     * @param {Document} doc - iframe の document
     * @returns {Array<{line:number,top:number,height:number}>} 行位置配列
     */
    getLinePositionsFromDocument(doc) {
      const elements = Array.from(doc.querySelectorAll(`[${SOURCE_LINE_ATTRIBUTE}]`))
      const positions = []
      for (const element of elements) {
        const line = Number(element.getAttribute(SOURCE_LINE_ATTRIBUTE)) || 1
        positions.push({
          line,
          top: element.offsetTop || 0,
          height: element.offsetHeight || 0
        })
      }
      return positions
    },
    /**
     * 処理名: 可視行取得
     * 処理概要: 現在の iframe スクロール位置から可視先頭行を返す
     * 実装理由: preview 側スクロール位置を editor へ同期するため
     * @returns {number} 可視先頭行
     */
    getVisibleSourceLine() {
      const context = typeof this.getIframeContext === 'function'
        ? this.getIframeContext()
        : resolveIframeContext(this)
      if (!context) return 1
      const scrollTop = Number(context.win.scrollY || context.doc.documentElement.scrollTop || context.doc.body.scrollTop || 0)
      const positions = resolveLinePositions(this, context.doc)
      if (positions.length === 0) return 1
      const resultIndex = findVisibleIndex(positions, scrollTop)
      return positions[resultIndex]?.line || 1
    },
    /**
     * 処理名: 行要素キャッシュ再構築
     * 処理概要: source-line 要素配列と位置配列を再構築して保持する
     * 実装理由: 再描画後の位置情報を同期計算に使うため
     * @returns {Array<{line:number,top:number,height:number}>} 行位置配列
     */
    cacheSourceLineElements() {
      let context = null
      if (typeof this.getIframeContext === 'function') {
        context = this.getIframeContext()
      } else {
        const iframe = this.$refs?.childFrame
        if (iframe && iframe.contentWindow && iframe.contentDocument) {
          context = { iframe, win: iframe.contentWindow, doc: iframe.contentDocument }
        }
      }
      if (!context) return []
      const elements = Array.from(context.doc.querySelectorAll(`[${SOURCE_LINE_ATTRIBUTE}]`))
      const positions = []
      for (const element of elements) {
        const line = Number(element.getAttribute(SOURCE_LINE_ATTRIBUTE)) || 1
        positions.push({
          line,
          top: element.offsetTop || 0,
          height: element.offsetHeight || 0
        })
      }
      this.cachedLineElements = elements
      this.cachedLinePositions = positions
      return positions
    },
    /**
     * 処理名: iframeスクロール比率取得
     * 処理概要: 現在のスクロール位置を 0-1 の比率で返す
     * 実装理由: 比率ベース同期を行うため
     * @returns {number} スクロール比率
     */
    getIframeScrollRatio() {
      let context = null
      if (typeof this.getIframeContext === 'function') {
        context = this.getIframeContext()
      } else {
        const iframe = this.$refs?.childFrame
        if (iframe && iframe.contentWindow && iframe.contentDocument) {
          context = { iframe, win: iframe.contentWindow, doc: iframe.contentDocument }
        }
      }
      if (!context) return 0
      const scrollTop = Number(context.win.scrollY || context.doc.documentElement.scrollTop || context.doc.body.scrollTop || 0)
      const scrollHeight = Number(context.doc.documentElement.scrollHeight || context.doc.body.scrollHeight || 0)
      const clientHeight = Number(context.doc.documentElement.clientHeight || context.doc.body.clientHeight || 1)
      return clientHeight < scrollHeight ? scrollTop / (scrollHeight - clientHeight) : 0
    },
    /**
     * 処理名: 同期スクロール解除
     * 処理概要: プログラムスクロール中フラグを解除する
     * 実装理由: 同期後に通常の scroll 通知を再開するため
     * @returns {void} なし
     */
    clearSyncingScroll() {
      this.isSyncingScroll = false
    },
    /**
     * 処理名: 行スクロール
     * 処理概要: 指定行に最も近い preview 行位置までスクロールする
     * 実装理由: editor から preview への行同期を実現するため
     * @param {number|string} line - 表示対象の行番号
     * @returns {void} なし
     */
    scrollToSourceLine(line) {
      const context = typeof this.getIframeContext === 'function'
        ? this.getIframeContext()
        : resolveIframeContext(this)
      if (!context) return
      const lineNumber = Number(line) || 1
      const positions = resolveLinePositions(this, context.doc)
      if (positions.length === 0) return
      const candidateIndex = findClosestIndex(positions, lineNumber)
      const top = positions[candidateIndex].top || 0
      this.isSyncingScroll = true
      context.win.scrollTo(0, top)
      // scroll イベント発火を待ってから isSyncingScroll をリセット
      // requestAnimationFrame で次のリペイント前にリセットし、
      // スクロール同期イベントの相互参照を正しく処理する
      const clearSyncing = typeof this.clearSyncingScroll === 'function'
        ? this.clearSyncingScroll.bind(this)
        : function() {
          this.isSyncingScroll = false
        }.bind(this)
      requestAnimationFrame(clearSyncing)
    },
    /**
     * 処理名: 比率スクロール
     * 処理概要: 0-1 の比率で preview のスクロール位置を設定する
     * 実装理由: pane 間の比率同期を可能にするため
     * @param {number} ratio - 0.0-1.0 のスクロール比率
     * @returns {void} なし
     */
    scrollToRatio(ratio) {
      let context = null
      if (typeof this.getIframeContext === 'function') {
        context = this.getIframeContext()
      } else {
        const iframe = this.$refs?.childFrame
        if (iframe && iframe.contentWindow && iframe.contentDocument) {
          context = { iframe, win: iframe.contentWindow, doc: iframe.contentDocument }
        }
      }
      if (!context) return
      const scrollHeight = Number(context.doc.documentElement.scrollHeight || context.doc.body.scrollHeight || 0)
      const clientHeight = Number(context.doc.documentElement.clientHeight || context.doc.body.clientHeight || 1)
      const ratioNumber = Number(ratio) || 0
      const top = ratioNumber * Math.max(0, scrollHeight - clientHeight)
      this.isSyncingScroll = true
      context.win.scrollTo(0, top)
      // scroll イベント発火を待ってから isSyncingScroll をリセット
      const clearSyncing = typeof this.clearSyncingScroll === 'function'
        ? this.clearSyncingScroll.bind(this)
        : function() {
          this.isSyncingScroll = false
        }.bind(this)
      requestAnimationFrame(clearSyncing)
    },
    /**
     * 処理名: iframe内容更新
     * 処理概要: 現在表示行を維持したまま preview の本文を再描画する
     * 実装理由: source/config 変更時の視点ジャンプを防ぐため
     * @param {number} sourceLine - 復元先の行番号
     * @returns {void} なし
     */
    updateIframeContent(sourceLine) {
      let context = null
      if (typeof this.getIframeContext === 'function') {
        context = this.getIframeContext()
      } else {
        const iframe = this.$refs?.childFrame
        if (iframe && iframe.contentWindow && iframe.contentDocument) {
          context = { iframe, win: iframe.contentWindow, doc: iframe.contentDocument }
        }
      }
      if (!context) return
      const currentLine = sourceLine || this.getVisibleSourceLine()
      const contentWrapper = context.doc.getElementById(CONTENT_WRAPPER_ID)
      if (contentWrapper) {
        contentWrapper.innerHTML = this.renderMarkdown()
      } else {
        context.doc.body.innerHTML = this.renderMarkdown()
      }
      this.cacheSourceLineElements()
      this.scrollToSourceLine(currentLine)
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
