import type { ChromeLocalStorage, StorageRecord } from './ChromeLocalStorage'

/** ストレージ移行完了を示す内部キー */
export const STORAGE_MIGRATION_COMPLETED_KEY = 'storageMigrationV1_3_17Completed'

/**
 * 処理名: 値の深い等価判定
 * 処理概要: JSON として保存可能な2値が同じ内容か判定する
 * 実装理由: 移行前の競合検知と移行後の書込検証に同じ比較を使うため
 * @param {unknown} left - 比較元の値
 * @param {unknown} right - 比較先の値
 * @returns {boolean} 値が同じ内容なら true
 */
function isDeepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/**
 * 処理名: 構造化キー判定
 * 処理概要: JSON 文字列からオブジェクトまたは配列へ変換する旧キーか判定する
 * 実装理由: Chrome Storage では通常値を文字列化せずに保存するため
 * @param {string} key - ストレージキー
 * @returns {boolean} JSON 変換対象なら true
 */
function isStructuredKey(key: string): boolean {
  return key === 'config' || key === 'noteKeyList' || key.startsWith('note_')
}

/**
 * 処理名: 旧ストレージ値変換
 * 処理概要: localStorage の文字列値を Chrome Storage 用の値へ変換する
 * 実装理由: 既存ノート・設定・ノート一覧を構造化データとして保存するため
 * @param {string} key - ストレージキー
 * @param {string} value - localStorage の文字列値
 * @returns {unknown} Chrome Storage 用の値
 * @throws {Error} JSON 変換対象の値が不正な場合
 */
function convertLegacyValue(key: string, value: string): unknown {
  if (!isStructuredKey(key)) return value
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Failed to parse legacy storage key: ${key}`)
  }
}

/**
 * 処理名: 旧ストレージスナップショット取得
 * 処理概要: localStorage のキーと値を削除前にすべてメモリへ複製する
 * 実装理由: 移行中にキー列挙結果が変化して誤削除することを防ぐため
 * @param {Storage} legacyStorage - 移行元 localStorage
 * @returns {Record<string, string>} 旧データのスナップショット
 */
function getLegacySnapshot(legacyStorage: Storage): Record<string, string> {
  const snapshot: Record<string, string> = {}
  for (let index = 0; index < legacyStorage.length; index += 1) {
    const key = legacyStorage.key(index)
    if (key == null) continue
    const value = legacyStorage.getItem(key)
    if (value != null) snapshot[key] = value
  }
  return snapshot
}

/**
 * 処理名: 移行競合確認
 * 処理概要: 既存の Chrome Storage 値が移行値と矛盾しないことを確認する
 * 実装理由: 新しい保存先のデータを旧データで上書きしないため
 * @param {StorageRecord} existing - 既存の Chrome Storage 値
 * @param {StorageRecord} converted - 旧ストレージから変換した値
 * @throws {Error} 同名キーに異なる値がある場合
 */
function assertNoMigrationConflict(existing: StorageRecord, converted: StorageRecord): void {
  for (const [key, value] of Object.entries(converted)) {
    if (Object.hasOwn(existing, key) && !isDeepEqual(existing[key], value)) {
      throw new Error(`Storage migration conflict: ${key}`)
    }
  }
}

/**
 * 処理名: 移行書込検証
 * 処理概要: Chrome Storageから再取得した移行値が書込値と一致することを確認する
 * 実装理由: 旧データ削除前に保存成功を保証するため
 * @param {ChromeLocalStorage} storage - 移行先 Chrome Storage ラッパー
 * @param {StorageRecord} converted - 書込済みの変換値
 * @returns {Promise<void>} 検証完了時に resolve する Promise
 * @throws {Error} 再取得値が書込値と異なる場合
 */
async function verifyMigratedValues(storage: ChromeLocalStorage, converted: StorageRecord): Promise<void> {
  const persisted = await storage.getAll()
  for (const [key, value] of Object.entries(converted)) {
    if (!isDeepEqual(persisted[key], value)) {
      throw new Error(`Storage migration verification failed: ${key}`)
    }
  }
}

/**
 * 処理名: 旧ストレージ移行
 * 処理概要: localStorage の値を検証付きで chrome.storage.local へ移す
 * 実装理由: 書込成功を確認する前に旧データを削除しないことでデータ消失を防ぐため
 * @param {Storage} legacyStorage - 移行元 localStorage
 * @param {ChromeLocalStorage} storage - 移行先 Chrome Storage ラッパー
 * @returns {Promise<{ migrated: boolean }>} 移行実行結果
 * @throws {Error} 変換、競合、書込または検証に失敗した場合
 */
export async function migrateLegacyStorage(
  legacyStorage: Storage,
  storage: ChromeLocalStorage
): Promise<{ migrated: boolean }> {
  const existing = await storage.getAll()
  if (existing[STORAGE_MIGRATION_COMPLETED_KEY] === true) return { migrated: false }

  const snapshot = getLegacySnapshot(legacyStorage)
  const converted = Object.fromEntries(Object.entries(snapshot)
    .map(([key, value]) => [key, convertLegacyValue(key, value)])) as StorageRecord

  assertNoMigrationConflict(existing, converted)

  if (Object.keys(converted).length > 0) {
    await storage.set(converted)
    await verifyMigratedValues(storage, converted)
    Object.keys(snapshot).forEach(key => legacyStorage.removeItem(key))
  }

  await storage.set({ [STORAGE_MIGRATION_COMPLETED_KEY]: true })
  return { migrated: true }
}