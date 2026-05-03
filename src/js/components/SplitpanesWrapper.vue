<template>
  <SplitpanesLayout @resize="handleResize" firstSplitter>
    <PaneSection min-size="0" :size="editPaneSize">
      <div v-show="!hideEditPane" class="pane-body">
          <MonacoEditor ref="monaco" :source="source" :onChange="onChange" @update:source="onChange" :config="config.editor"></MonacoEditor>
      </div>
    </PaneSection>
    <PaneSection min-size="0" :size="previewPaneSize">
      <div v-if="!hidePreviewPane" class="pane-body">
        <MarkdownPreview :source="viewSource" :config="config.markdown"></MarkdownPreview>
      </div>
    </PaneSection>
  </SplitpanesLayout>
</template>

<script>
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Monaco from '@/components/Monaco.vue'
import Preview from '@/components/Preview.vue'

export default {
  components: {
    SplitpanesLayout: Splitpanes,
    PaneSection: Pane,
    MonacoEditor: Monaco,
    MarkdownPreview: Preview
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
       * 処理概要: スプリットペインのデフォルト設定を返す
       * 実装理由: prop が渡されなかった場合に標準設定を適用するため
       * @returns {object} デフォルト設定オブジェクト
       */
      () => ({
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
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: 正規表現データの初期値を設定する
   * 実装理由: 多バイト変換の正規表現リストをリアクティブに管理するため
   * @returns {{ regExpData: Array }} 初期データ
   */
  data() {
    return {
      regExpData: []
    }
  },
  computed: {
    /**
     * 処理名: 変換済みソース取得
     * 処理概要: 多バイト変換ルールをソースに適用した変換済みテキストを返す
     * 実装理由: 日本語 Markdown の多バイト変換をリアルタイムにプレビューに反映するため
     * @returns {string} 変換済み Markdown ソース
     */
    viewSource() {
      let w = this.source
      for (const i in this.regExpData) {
        w = w.replace(this.regExpData[i][0], this.regExpData[i][1])
      }
      return w
    },
    /**
     * 処理名: 編集ペインサイズ取得
     * 処理概要: 表示フラグに基づいて編集ペインのサイズ（%）を返す
     * 実装理由: ペイン表示状態に応じて動的にレイアウトを調整するため
     * @returns {number} 編集ペインの幅（%）
     */
    editPaneSize() {
      if (this.hideEditPane) return 0
      if (this.hidePreviewPane) return 100
      return 50
    },
    /**
     * 処理名: プレビューペインサイズ取得
     * 処理概要: 表示フラグに基づいてプレビューペインのサイズ（%）を返す
     * 実装理由: ペイン表示状態に応じて動的にレイアウトを調整するため
     * @returns {number} プレビューペインの幅（%）
     */
    previewPaneSize() {
      if (this.hidePreviewPane) return 0
      if (this.hideEditPane) return 100
      return 50
    }
  },
  watch: {
    'config.markdown.multibyteconvert': /**
     * 処理名: 多バイト変換設定ウォッチャー
     * 処理概要: 多バイト変換の有効フラグ変更時に正規表現リストを再構築する
     * 実装理由: 設定変更をリアルタイムにプレビューに反映するため
    * @returns {void} なし
     */
    function() {
      console.log('config.markdown.multibyteconvert')
      this.updateRegExpList()
    },
    'config.markdown.multibyteconvertList': /**
     * 処理名: 多バイト変換リストウォッチャー
     * 処理概要: 多バイト変換ルールリスト変更時に正規表現リストを再構築する
     * 実装理由: ルール追加・削除をリアルタイムにプレビューに反映するため
    * @returns {void} なし
     */
    function() {
      console.log('config.markdown.multibyteconvertList')
      this.updateRegExpList()
    }
  },
  /**
   * 処理名: 作成後初期化
   * 処理概要: コンポーネント作成時に多バイト変換リストを初期構築する
   * 実装理由: 初期表示時から正規表現変換が有効になるようにするため
   */
  created: function() {
    this.updateRegExpList()
  },
  methods: {
    /**
     * 処理名: 変更ハンドラ
     * 処理概要: エディタ内容変更をストアに dispatch する
     * 実装理由: Monaco エディタの変更をストアに伝達するため
     * @param {string} value - 変更後のエディタ内容
     */
    onChange(value) {
      this.$store.dispatch('update', value)
    },
    /**
     * 処理名: リサイズハンドラ
     * 処理概要: ペインリサイズ時に Monaco エディタのレイアウトを再計算する
     * 実装理由: ペインサイズ変更後にエディタが正しく描画されるようにするため
     */
    handleResize() {
      // Monaco automaticLayout is enabled by default and already uses ResizeObserver.
      if (this.config?.editor?.automaticLayout) return
      if (this.$refs.monaco && typeof this.$refs.monaco.resize === 'function') {
        requestAnimationFrame(/**
         * 処理名: リサイズ実行コールバック
         * 処理概要: 次のアニメーションフレームで Monaco のリサイズを実行する
         * 実装理由: DOM 更新後にリサイズを実行するため
         */
        () => {
          this.$refs.monaco.resize()
        })
      }
    },
    /**
     * 処理名: 正規表現リスト更新
     * 処理概要: 設定の多バイト変換リストから正規表現オブジェクトの配列を再構築する
     * 実装理由: 変換ルールの変更を即座に viewSource 算出プロパティに反映するため
     */
    updateRegExpList() {
      this.regExpData = []
      if (this.config.markdown.multibyteconvert) {
        this.config.markdown.multibyteconvertList.forEach(/**
         * 処理名: 変換ルール登録コールバック
         * 処理概要: 各変換ルールを正規表現オブジェクトに変換して regExpData に追加する
         * 実装理由: 設定の文字列ルールを実行可能な正規表現に変換するため
         * @param {Array} element - [パターン, 置換文字列] の配列
         */
        (element) => {
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
