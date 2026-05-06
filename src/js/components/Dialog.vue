<template>
  <transition
    name="dialog"
    @after-leave="afterLeave"
  >
    <div v-show="isShow">
      <div class="overlay" />
      <div class="dialog">
        <div class="dialog__inner">
          <h2 class="dialog__header">
            {{ subject }}
          </h2>
          <div class="dialog__body">
            {{ message }}
          </div>
          <div class="dialog__footer button-set">
            <button
              v-if="onSecondary"
              type="button"
              class="button button--base button--base-secondary"
              @click.prevent="handleSecondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              class="button button--base button--base-primary"
              @click.prevent="handlePrimary"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
    name: 'AppDialog',
  props: {
    subject: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    onPrimary: {
      type: Function,
      default: null
    },
    onSecondary: {
      type: Function,
      default: null
    }
  },
  /**
   * 処理名: 初期データ生成
   * 処理概要: ダイアログ表示状態と保留コールバックを初期化する
   * 実装理由: 表示制御とトランジション後実行コールバックを state で管理するため
   * @returns {{ isShow: boolean, pendingCallback: Function|null }} 初期データ
   */
  data() {
    return {
      isShow: true,
      pendingCallback: null
    }
  },
  methods: {
    /**
     * 処理名: 確認ボタン処理
     * 処理概要: 確認ボタン押下時にコールバックを保存しダイアログを非表示にする
     * 実装理由: トランジション終了後にコールバックを呼ぶため afterLeave で実行する
     */
    handlePrimary() {
      this.pendingCallback = this.onPrimary
      this.isShow = false
    },
    /**
     * 処理名: キャンセルボタン処理
     * 処理概要: キャンセルボタン押下時にコールバックを保存しダイアログを非表示にする
     * 実装理由: トランジション終了後にコールバックを呼ぶため afterLeave で実行する
     */
    handleSecondary() {
      this.pendingCallback = this.onSecondary
      this.isShow = false
    },
    /**
     * 処理名: トランジション完了後処理
     * 処理概要: フェードアウト完了後に保留中のコールバックを実行する
     * 実装理由: アニメーション中にコールバックが呼ばれると UI が乱れるため
     */
    afterLeave() {
      if (this.pendingCallback) {
        this.pendingCallback()
      }
    }
  }
}
</script>

<style lang="css" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  filter:alpha(opacity=50);
  -moz-opacity: 0.5;
  opacity: 0.5;
  z-index: 100;
}
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 101;
}
.dialog__inner {
  z-index: 101;
  width: 70vw;
  padding: 20px;
  background-color: #fff;
}
.button-set {
    display: flex;
}
.button--base {
    flex: 1;
    margin: 10px 10px 0;
    border: 1px solid #808080;
    border-radius: 8px;
}
.dialog-enter-active, .dialog-leave-active {
  transition: opacity .3s;
}
.dialog-leave, .dialog-enter-to {
  filter:alpha(opacity=100);
  -moz-opacity: 1;
  opacity: 1;
}
.dialog-enter, .dialog-leave-to {
  filter:alpha(opacity=0);
  -moz-opacity: .0;
  opacity: .0;
}
</style>
