/** Chrome Storage API の値マップ */
export type StorageRecord = Record<string, unknown>

/** Chrome Storage から通知される変更内容 */
export interface StorageChange {
  key: string
  oldValue: unknown
  newValue: unknown
}

interface ChromeStorageArea {
  get(keys: string | string[] | null): Promise<StorageRecord>
  set(items: StorageRecord): Promise<void>
  remove(keys: string | string[]): Promise<void>
}

interface ChromeStorageApi {
  local: ChromeStorageArea
  onChanged: {
    addListener(listener: (changes: Record<string, { oldValue?: unknown, newValue?: unknown }>, areaName: string) => void): void
    removeListener(listener: (changes: Record<string, { oldValue?: unknown, newValue?: unknown }>, areaName: string) => void): void
  }
}

interface ChromeApi {
  runtime?: { lastError?: { message?: string } | undefined }
  storage?: ChromeStorageApi
}

/** Chrome Storage Local の非同期ラッパー */
export interface ChromeLocalStorage {
  get<T>(key: string): Promise<T | undefined>
  getAll(): Promise<StorageRecord>
  set(items: StorageRecord): Promise<void>
  remove(keys: string | string[]): Promise<void>
  onChanged(listener: (changes: StorageChange[]) => void): () => void
}

/**
 * 処理名: Chrome API 取得
 * 処理概要: 実行環境の Chrome Storage API を取得する
 * 実装理由: 拡張機能外での誤った永続化フォールバックを防ぐため
 * @returns {ChromeApi} 利用可能な Chrome API
 * @throws {Error} Chrome Storage API が利用できない場合
 */
function getChromeApi(): ChromeApi {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
  if (!chromeApi?.storage?.local || !chromeApi.storage.onChanged) {
    throw new Error('chrome.storage.local is unavailable')
  }
  return chromeApi
}

/**
 * 処理名: Chrome Storage 操作実行
 * 処理概要: Promise 操作の完了後に runtime.lastError を検査する
 * 実装理由: Chrome API の失敗を呼び出し元へ一貫して通知するため
 * @param {ChromeApi} chromeApi - Chrome API
 * @param {() => Promise<T>} operation - 実行するストレージ操作
 * @returns {Promise<T>} 操作結果
 * @throws {Error} Chrome API がエラーを報告した場合
 * @template T 操作結果の型
 */
async function runStorageOperation<T>(chromeApi: ChromeApi, operation: () => Promise<T>): Promise<T> {
  const result = await operation()
  const message = chromeApi.runtime?.lastError?.message
  if (message) throw new Error(message)
  return result
}

/**
 * 処理名: Chrome Storage ラッパー生成
 * 処理概要: chrome.storage.local の非同期操作をアプリ用インターフェースで公開する
 * 実装理由: Chrome API 依存とエラー処理をストア・コンポーネントから分離するため
 * @returns {ChromeLocalStorage} Chrome Storage Local ラッパー
 */
export function createChromeLocalStorage(): ChromeLocalStorage {
  const chromeApi = getChromeApi()

  return {
    /**
     * 処理名: 単一値取得
     * 処理概要: 指定キーの保存値を取得する
     * 実装理由: ストアが Chrome API の戻り値構造へ依存しないようにするため
     * @param {string} key - 取得対象キー
     * @returns {Promise<T | undefined>} 保存値
     */
    async get<T>(key: string): Promise<T | undefined> {
      const result = await runStorageOperation(chromeApi, () => chromeApi.storage!.local.get(key))
      return result[key] as T | undefined
    },
    /**
     * 処理名: 全値取得
     * 処理概要: Chrome Storage Local の全レコードを取得する
     * 実装理由: エクスポートと移行検証で一貫した読込を行うため
     * @returns {Promise<StorageRecord>} 全保存レコード
     */
    getAll(): Promise<StorageRecord> {
      return runStorageOperation(chromeApi, () => chromeApi.storage!.local.get(null))
    },
    /**
     * 処理名: 複数値保存
     * 処理概要: オブジェクト値を文字列化せずに保存する
     * 実装理由: Chrome Storage の構造化値サポートを利用するため
     * @param {StorageRecord} items - 保存するキーと値
     * @returns {Promise<void>} 保存完了時に resolve する Promise
     */
    set(items: StorageRecord): Promise<void> {
      return runStorageOperation(chromeApi, () => chromeApi.storage!.local.set(items))
    },
    /**
     * 処理名: 値削除
     * 処理概要: 指定キーを Chrome Storage Local から削除する
     * 実装理由: ノート削除と移行後の整理を非同期 API で統一するため
     * @param {string | string[]} keys - 削除対象キー
     * @returns {Promise<void>} 削除完了時に resolve する Promise
     */
    remove(keys: string | string[]): Promise<void> {
      return runStorageOperation(chromeApi, () => chromeApi.storage!.local.remove(keys))
    },
    /**
     * 処理名: 変更通知購読
     * 処理概要: local 領域の変更をアプリ用の変更配列として通知する
     * 実装理由: 複数タブ同期を window storageイベントから置換するため
     * @param {(changes: StorageChange[]) => void} listener - 変更通知の受信関数
     * @returns {() => void} 購読解除関数
     */
    onChanged(listener: (changes: StorageChange[]) => void): () => void {
      /**
       * 処理名: Chrome 変更通知変換
       * 処理概要: Chrome API の変更値をアプリ用配列へ変換する
       * 実装理由: 通知領域の絞り込みとデータ形式の統一を行うため
       * @param {Record<string, { oldValue?: unknown, newValue?: unknown }>} changes - Chrome APIの変更値
       * @param {string} areaName - 変更された保存領域
       */
      const chromeListener = (changes: Record<string, { oldValue?: unknown, newValue?: unknown }>, areaName: string) => {
        if (areaName !== 'local') return
        listener(Object.entries(changes).map(([key, change]) => ({
          key,
          oldValue: change.oldValue,
          newValue: change.newValue
        })))
      }
      chromeApi.storage!.onChanged.addListener(chromeListener)
      /**
       * 処理名: 変更通知購読解除
       * 処理概要: 登録済みの Chrome Storage リスナーを解除する
       * 実装理由: コンポーネント破棄後の通知を防ぐため
       * @returns {void} なし
       */
      return () => chromeApi.storage!.onChanged.removeListener(chromeListener)
    }
  }
}