<template>
  <div class="contents-wrapper" >
    <div class="titleSection">
      <input placeholder="Title" :value="title" @input="updateTitle">
    </div>
    <SplitpanesWrapper ref="splitpanesWrapper" class="contents-main" :hideEditPane="hideEditPane" :hidePreviewPane="hidePreviewPane" :source="source" :config="config"></SplitpanesWrapper>
    <AppFooter>
      <button @click="hideEditPane = false;hidePreviewPane=true"><UniconIcon name="edit"></UniconIcon></button>
      <button @click="hideEditPane = false;hidePreviewPane=false"><UniconIcon name="columns"></UniconIcon></button>
      <button @click="hideEditPane = true;hidePreviewPane=false"><UniconIcon name="eye"></UniconIcon></button>
      <button @click="onDelete"><UniconIcon name="trash-alt"></UniconIcon></button>
    </AppFooter>
  </div>
</template>

<script>
import SplitpanesWrapper from '@/components/SplitpanesWrapper.vue'
import Footer from '@/components/Footer.vue'
import DialogHelper from '@/DialogHelper'

export default {
    name: 'NoteContents',
  components: {
    SplitpanesWrapper,
    AppFooter: Footer
  },
  computed: {
    /**
     * 処理名: ソース取得
     * 処理概要: ストアから現在のエディタソース文字列を返す
     * 実装理由: ストアの単一状態から子コンポーネントにデータを流すため
     * @returns {string} 現在のエディタソース
     */
    source() {
      return this.$store.getters.source
    },
    /**
     * 処理名: 設定取得
     * 処理概要: ストアから現在のエディタ設定を返す
     * 実装理由: ストアの設定を子コンポーネントに伝搬するため
     * @returns {object} エディタ設定オブジェクト
     */
    config() {
      return this.$store.getters.config
    },
    /**
     * 処理名: タイトル取得
     * 処理概要: ストアの現在ファイルからタイトル（description）を返す
     * 実装理由: ファイルの説明をタイトル入力欄に表示するため
     * @returns {string} ファイルタイトル
     */
    title() {
      const file = (this.$store.getters.currentFile) ? this.$store.getters.currentFile.file : null
      if (!file) return ''
      if (typeof file.getDescription === 'function') return file.getDescription() || ''
      return file.description || ''
    },
    currentFileKey() {
      return this.$store.getters.currentFile?.filename || ''
    }
  },
  watch: {
    currentFileKey(newKey, oldKey) {
      if (newKey !== oldKey && this.$refs.splitpanesWrapper) {
        this.$refs.splitpanesWrapper.scrollToTop()
      }
    }
  },
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: ペイン表示状態とウィンドウサイズの初期値を設定する
   * 実装理由: スプリットペインの表示制御に必要な状態を管理するため
   * @returns {{ hideEditPane: boolean, hidePreviewPane: boolean, width: number, height: number }} 初期データ
   */
  data() {
    return {
      hideEditPane: false,
      hidePreviewPane: true,
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  methods: {
    /**
     * 処理名: リサイズハンドラ
     * 処理概要: ウィンドウリサイズ時に現在のサイズをステートに反映する
     * 実装理由: レイアウト計算に最新のウィンドウサイズを提供するため
     */
    handleResize: function() {
      this.width = window.innerWidth
      this.height = window.innerHeight
    },
    /**
     * 処理名: タイトル更新
     * 処理概要: 入力イベントからタイトル値を取得してストアにコミットする
     * 実装理由: ユーザーのタイトル編集をリアルタイムにストアへ反映するため
     * @param {InputEvent} e - input イベント
     */
    updateTitle(e) {
      this.$store.commit('updateTitle', e.target.value)
    },
    /**
     * 処理名: 削除ハンドラ
     * 処理概要: 確認ダイアログを表示して OK の場合にプロジェクトを削除する
     * 実装理由: 誤削除を防ぐために確認ステップを挟むため
     */
    onDelete() {
      DialogHelper.showDialog(this, {
        subject: 'Delete',
        message: this.$t('message.Delete'),
        ok: /**
         * 処理名: 削除確認後コールバック
         * 処理概要: ダイアログ確認後にストアの deleteProject ミューテーションを実行する
         * 実装理由: 確認後にのみ削除を実行するため
         */
        () => {
          this.$store.commit('deleteProject')
        },
        cancel: /**
         * 処理名: 削除キャンセルコールバック
         * 処理概要: 削除をキャンセルする（何もしない）
         * 実装理由: ダイアログの cancel prop として空のハンドラを提供するため
         */
        () => {}
      })
    }
  },
  /**
   * 処理名: マウント後初期化
   * 処理概要: ウィンドウリサイズイベントリスナーを登録する
   * 実装理由: ウィンドウサイズ変更に追従するため
   */
  mounted: function() {
    window.addEventListener('resize', this.handleResize)
  },
  /**
   * 処理名: アンマウント前クリーンアップ
   * 処理概要: マウント時に登録したリサイズイベントリスナーを解除する
   * 実装理由: メモリリークを防ぐため
   */
  beforeUnmount: function() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style>
.contents-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.contents-main {
  flex: 1 1 auto;
  min-height: 0;
}

.titleSection {
    display: flex;
    height: 50px;
    width: 100%;
    border-width: 0px 0px 1px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.26);
    box-shadow: 0 4px 6px -2px rgba(0, 0, 0, .08);
    position: relative;
    z-index: 10;
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
</style>
