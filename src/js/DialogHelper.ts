import { createApp } from 'vue'
import Dialog from '@/components/Dialog.vue'

interface DialogOptions {
  subject: string
  message: string
  ok: () => void
  cancel?: () => void
}

/**
 * 処理名: ダイアログヘルパー
 * 処理概要: Vue コンポーネントとしてダイアログを動的にマウント・管理するユーティリティ
 * 実装理由: 任意のコンテキストからダイアログを表示するための共通ヘルパー
 */
const DialogHelper = {
  /**
   * 処理名: ダイアログ表示
   * 処理概要: 指定オプションでダイアログを生成しボディに動的マウントする
   * 実装理由: Vue のライフサイクル外から宣言的なダイアログを表示するため
   * @param {unknown} _context - 呼び出し元コンテキスト（現在未使用）
   * @param {DialogOptions} options - ダイアログ表示オプション
   */
  showDialog(_context: unknown, { subject, message, ok, cancel }: DialogOptions): void {
    const container = document.createElement('div')
    document.body.appendChild(container)

    /**
     * 処理名: ダイアログクリーンアップ
     * 処理概要: ダイアログアプリをアンマウントしてコンテナ要素を DOM から削除する
     * 実装理由: ダイアログ閉鎖後のメモリリークと DOM 汚染を防ぐため
     */
    const cleanup = () => {
      dialogApp.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }

    const dialogApp = createApp(Dialog, {
      subject,
      message,
      /**
       * 処理名: 確認ボタンハンドラ
       * 処理概要: OK ボタン押下時に ok コールバックを実行しダイアログを閉じる
       * 実装理由: ユーザーの確認操作を呼び出し元に伝達するため
       */
      onPrimary: () => { ok(); cleanup() },
      onSecondary: cancel
        ? /**
           * 処理名: キャンセルボタンハンドラ
           * 処理概要: キャンセルボタン押下時に cancel コールバックを実行しダイアログを閉じる
           * 実装理由: ユーザーのキャンセル操作を呼び出し元に伝達するため
           */
          () => { cancel(); cleanup() }
        : undefined
    })

    dialogApp.mount(container)
  }
}
export default DialogHelper
