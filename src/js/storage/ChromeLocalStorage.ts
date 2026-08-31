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

const pendingLocalChanges = new Map<string, Set<string | undefined>>()

/**
 * 処理名: 自ページ変更登録
 * 処理概要: 保存または削除で発生予定の変更値をキーごとに記録する
 * 実装理由: 入力中の連続保存で通知が遅延・並び替えされても自己通知を除外するため
 * @param {string} key - 保存または削除するキー
 * @param {unknown} value - 保存する値。削除時は undefined
 * @returns {void} なし
 */
function registerPendingLocalChange(key: string, value: unknown): void {
  const pendingValues = pendingLocalChanges.get(key) || new Set<string | undefined>()
  pendingValues.add(serializeStorageValue(value))
  pendingLocalChanges.set(key, pendingValues)
}

/**
 * 処理名: 保存値シリアライズ
 * 処理概要: 保存値を Chrome Storage の構造化複製後も比較できる文字列へ変換する
 * 実装理由: 同一ページが発行した変更通知だけを識別するため
 * @param {unknown} value - 変換対象の保存値
 * @returns {string | undefined} 比較用の保存値
 */
function serializeStorageValue(value: unknown): string | undefined {
  return JSON.stringify(value)
}

/**
 * 処理名: 保存レコード正規化
 * 処理概要: VueのリアクティブProxyをJSON互換のプレーンオブジェクトへ変換する
 * 実装理由: Chrome Storageへ配列・オブジェクトを確実に保存し、再読込時の一覧消失を防ぐため
 * @param {StorageRecord} items - 保存対象のキーと値
 * @returns {StorageRecord} Chrome Storageへ渡せるプレーンレコード
 */
function normalizeStorageRecord(items: StorageRecord): StorageRecord {
  return JSON.parse(JSON.stringify(items)) as StorageRecord
}

/**
 * 処理名: 自ページ変更判定
 * 処理概要: 直前の保存操作と同じ変更を判定して追跡情報を消費する
 * 実装理由: 同一ページの保存を別タブ編集として処理しないため
 * @param {StorageChange} change - Chrome Storageから通知された変更
 * @returns {boolean} 自ページが発行した変更の場合は true
 */
function consumePendingLocalChange(change: StorageChange): boolean {
  const pendingValues = pendingLocalChanges.get(change.key)
  const changedValue = serializeStorageValue(change.newValue)
  if (!pendingValues?.has(changedValue)) return false
  pendingValues.delete(changedValue)
  if (pendingValues.size === 0) pendingLocalChanges.delete(change.key)
  return true
}

/**
 * 処理名: Chrome API 取得
 * 処理概要: 実行環境の Chrome Storage API を取得する
 * 実装理由: 拡張機能と通常ブラウザの保存先を判定するため
 * @returns {ChromeApi | undefined} 利用可能な Chrome API
 */
function getChromeApi(): ChromeApi | undefined {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeApi }).chrome
  return chromeApi?.storage?.local && chromeApi.storage.onChanged ? chromeApi : undefined
}

/**
 * 処理名: Chrome Storage 利用可否判定
 * 処理概要: chrome.storage.local と変更通知 API が利用できるか判定する
 * 実装理由: localStorage フォールバック時にデータ移行を実行しないため
 * @returns {boolean} Chrome Storage を利用できる場合は true
 */
export function isChromeStorageAvailable(): boolean {
  return getChromeApi() !== undefined
}

/**
 * 処理名: 旧保存値復元
 * 処理概要: localStorage の文字列を JSON として解析し、非JSON文字列はそのまま返す
 * 実装理由: 旧形式の currentVersion と JSON 形式のノートを両方扱うため
 * @param {string | null} value - localStorage から取得した値
 * @returns {unknown} 復元済みの保存値
 */
function parseLocalStorageValue(value: string | null): unknown {
  if (value === null) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/**
 * 処理名: Web Storage 取得
 * 処理概要: 現在のブラウザの localStorage を返す
 * 実装理由: Chrome 拡張 API がない通常ブラウザで保存を継続するため
 * @returns {Storage} 利用可能な localStorage
 */
function getLocalStorage(): Storage {
  return globalThis.localStorage
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
  if (!chromeApi) return createLocalStorageFallback()

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
      const normalizedItems = normalizeStorageRecord(items)
      Object.entries(normalizedItems).forEach(([key, value]) => registerPendingLocalChange(key, value))
      return runStorageOperation(chromeApi, () => chromeApi.storage!.local.set(normalizedItems))
    },
    /**
     * 処理名: 値削除
     * 処理概要: 指定キーを Chrome Storage Local から削除する
     * 実装理由: ノート削除と移行後の整理を非同期 API で統一するため
     * @param {string | string[]} keys - 削除対象キー
     * @returns {Promise<void>} 削除完了時に resolve する Promise
     */
    remove(keys: string | string[]): Promise<void> {
      const keyList = Array.isArray(keys) ? keys : [keys]
      keyList.forEach(key => registerPendingLocalChange(key, undefined))
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
        const storageChanges = Object.entries(changes).map(([key, change]) => ({
          key,
          oldValue: change.oldValue,
          newValue: change.newValue
        })).filter(change => !consumePendingLocalChange(change))
        if (storageChanges.length > 0) listener(storageChanges)
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

/**
 * 処理名: localStorage フォールバック生成
 * 処理概要: Chrome Storage と同じ非同期インターフェースを localStorage で提供する
 * 実装理由: 拡張機能外でも既存の保存データと import/export を利用可能にするため
 * @returns {ChromeLocalStorage} localStorage を使用する保存ラッパー
 */
function createLocalStorageFallback(): ChromeLocalStorage {
  const storage = getLocalStorage()
  return {
    /**
     * 処理名: フォールバック単一値取得
     * 処理概要: localStorage の文字列を旧形式に従って復元する
     * 実装理由: Chrome Storage と同じ呼び出し契約を維持するため
     * @param {string} key - 取得対象キー
     * @returns {Promise<T | undefined>} 保存値
     */
    async get<T>(key: string): Promise<T | undefined> {
      return parseLocalStorageValue(storage.getItem(key)) as T | undefined
    },
    /**
     * 処理名: フォールバック全値取得
     * 処理概要: localStorage の全キーを復元済みレコードとして取得する
     * 実装理由: エクスポートで既存データを漏れなく扱うため
     * @returns {Promise<StorageRecord>} 全保存レコード
     */
    async getAll(): Promise<StorageRecord> {
      const records: StorageRecord = {}
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index)
        if (key !== null) records[key] = parseLocalStorageValue(storage.getItem(key))
      }
      return records
    },
    /**
     * 処理名: フォールバック複数値保存
     * 処理概要: 構造化値を旧 localStorage 形式のJSON文字列として保存する
     * 実装理由: 既存のlocalStorage保存形式との互換性を維持するため
     * @param {StorageRecord} items - 保存するキーと値
     * @returns {Promise<void>} 保存完了時に resolve する Promise
     */
    async set(items: StorageRecord): Promise<void> {
      Object.entries(items).forEach(([key, value]) => storage.setItem(key, JSON.stringify(value)))
    },
    /**
     * 処理名: フォールバック値削除
     * 処理概要: 指定キーを localStorage から削除する
     * 実装理由: Chrome Storage と同じ削除契約を維持するため
     * @param {string | string[]} keys - 削除対象キー
     * @returns {Promise<void>} 削除完了時に resolve する Promise
     */
    async remove(keys: string | string[]): Promise<void> {
      const keyList = Array.isArray(keys) ? keys : [keys]
      keyList.forEach(key => storage.removeItem(key))
    },
    /**
     * 処理名: フォールバック変更通知購読
     * 処理概要: Web Storage の変更イベントをアプリ用の変更配列へ変換する
     * 実装理由: 通常ブラウザの複数タブでも保存変更を同期するため
     * @param {(changes: StorageChange[]) => void} listener - 変更通知の受信関数
     * @returns {() => void} 購読解除関数
     */
    onChanged(listener: (changes: StorageChange[]) => void): () => void {
      /**
       * 処理名: Web Storage 変更通知変換
       * 処理概要: storage イベントをアプリ用の変更形式に変換する
       * 実装理由: Chrome Storage と同じ購読インターフェースを提供するため
       * @param {StorageEvent} event - Web Storage の変更イベント
       * @returns {void} なし
       */
      const storageListener = (event: StorageEvent): void => {
        if (event.storageArea !== storage || event.key === null) return
        listener([{
          key: event.key,
          oldValue: parseLocalStorageValue(event.oldValue),
          newValue: parseLocalStorageValue(event.newValue)
        }])
      }
      window.addEventListener('storage', storageListener)
      return () => window.removeEventListener('storage', storageListener)
    }
  }
}