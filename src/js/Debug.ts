/**
 * 処理名: Debug ユーティリティクラス
 * 処理概要: 循環参照を持つオブジェクトを安全に文字列化するためのデバッグ用クラス
 * 実装理由: JSON.stringify の循環参照エラーを回避してデバッグを容易にするため
 */
class Debug {
  /**
   * 処理名: コンストラクタ
   * 処理概要: Debug インスタンスを初期化する
   * 実装理由: クラスインスタンス生成のデフォルトコンストラクタ
   */
  constructor() {}

  /**
   * 処理名: 安全な JSON 文字列化
   * 処理概要: 循環参照を除去しながらオブジェクトを JSON 文字列に変換する
   * 実装理由: 循環参照を含むオブジェクトでも JSON.stringify が安全に動作するようにするため
   * @param {unknown} str - 文字列化対象の値
   * @returns {string} インデント付き JSON 文字列
   */
  stringify(str: unknown): string {
    const cache: object[] = []
    return JSON.stringify(
      str,
      /**
       * 処理名: JSON.stringify リプレイサー
       * 処理概要: 循環参照と parentNode を除去するカスタムリプレイサー
       * 実装理由: 循環参照によるスタックオーバーフローを防ぐため
       * @param {string} key - プロパティキー
       * @param {unknown} value - プロパティ値
       * @returns {unknown} シリアライズ対象の値（循環参照・parentNode は除外）
       */
      function(key: string, value: unknown) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value as object) !== -1) {
            return
          }
          cache.push(value as object)
        }
        if (key === 'parentNode') return
        return value
      },
      '\t'
    )
  }
}

export default Debug

if (typeof window !== 'undefined') {
  const win = window as Window & { Debug?: typeof Debug }
  if (!win.Debug) {
    win.Debug = Debug
  }
}
