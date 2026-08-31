import type { ChromeLocalStorage, StorageRecord } from './ChromeLocalStorage'

/** ストレージ移行完了を示す内部キー */
export const STORAGE_MIGRATION_COMPLETED_KEY = 'storageMigrationV1_3_17Completed'

/**
 * 処理名: オブジェクトの深い等価判定
 * 処理概要: 2つのオブジェクトの全キーと値が等しいか判定する
 * 実装理由: プロパティ順序の違いを許容して正しく等価判定するため
 * @param {Record<string, unknown>} left - 比較元のオブジェクト
 * @param {Record<string, unknown>} right - 比較先のオブジェクト
 * @returns {boolean} 全てのキーと値が等しければ true
 */
function isObjectDeepEqual(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every(key => Object.hasOwn(right, key) && isDeepEqual(left[key], right[key]))
}

/**
 * 処理名: 配列の深い等価判定
 * 処理概要: 2つの配列の要素が順序を含めて等しいか判定する
 * 実装理由: 配列要素内のオブジェクトも含めて検証するため
 * @param {unknown[]} left - 比較元の配列
 * @param {unknown[]} right - 比較先の配列
 * @returns {boolean} 全要素が等しければ true
 */
function isArrayDeepEqual(left: unknown[], right: unknown[]): boolean {
  if (left.length !== right.length) return false
  return left.every((item, index) => isDeepEqual(item, right[index]))
}

/**
 * 処理名: 値の深い等価判定
 * 処理概要: オブジェクトのキー順序に依存せず2値が同じ内容か判定する
 * 実装理由: キー順序の違いによる偽競合や検証失敗を防ぐため
 * @param {unknown} left - 比較元の値
 * @param {unknown} right - 比較先の値
 * @returns {boolean} 値が同じ内容なら true
 */
function isDeepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (left == null || right == null || typeof left !== 'object' || typeof right !== 'object') {
    return false
  }
  if (Array.isArray(left) !== Array.isArray(right)) return false
  if (Array.isArray(left) && Array.isArray(right)) {
    return isArrayDeepEqual(left, right)
  }
  return isObjectDeepEqual(left as Record<string, unknown>, right as Record<string, unknown>)
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
 * 処理名: 重複しないキー生成
 * 処理概要: 既存および書込予定のキーと重複しない移行用キー名を生成する
 * 実装理由: 既存データを上書きせず旧データを別名で退避・移行するため
 * @param {string} baseKey - 競合した元のキー名
 * @param {(key: string) => boolean} isKeyTaken - キーが既に使用中か判定する関数
 * @returns {string} 重複しない新しいキー名
 */
function generateUniqueKey(baseKey: string, isKeyTaken: (key: string) => boolean): string {
  let candidate = `${baseKey}_migrated`
  let counter = 2
  while (isKeyTaken(candidate)) {
    candidate = `${baseKey}_migrated_${counter}`
    counter += 1
  }
  return candidate
}

/**
 * 処理名: プロジェクト名更新
 * 処理概要: 移行先キー名に合わせてオブジェクト内の projectName を更新する
 * 実装理由: ノートの保存キーとコンテナ内の projectName を一致させるため
 * @param {unknown} value - 移行する値
 * @param {string} newKey - 新しい保存キー名
 * @returns {unknown} projectName が更新された値
 */
function updateProjectName(value: unknown, newKey: string): unknown {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>), projectName: newKey }
  }
  return value
}

/**
 * 処理名: ノートキー一覧統合
 * 処理概要: 既存の noteKeyList と移行対象の noteKeyList・新規 note_* キーを重複なく統合する
 * 実装理由: リネームされたノートや未登録ノートが一覧から消失しないようにするため
 * @param {StorageRecord} existing - 既存の Chrome Storage レコード
 * @param {StorageRecord} converted - 旧ストレージから変換したレコード
 * @param {StorageRecord} toWrite - 書込予定のレコード
 * @param {Map<string, string>} keyMapping - 旧キーから新キーへの対応表
 * @returns {string[] | null} 統合後の noteKeyList（既存と同一なら null）
 */
function buildMergedNoteKeyList(
  existing: StorageRecord,
  converted: StorageRecord,
  toWrite: StorageRecord,
  keyMapping: Map<string, string>
): string[] | null {
  const existingList = Array.isArray(existing['noteKeyList']) ? (existing['noteKeyList'] as string[]) : []
  const convertedList = Array.isArray(converted['noteKeyList']) ? (converted['noteKeyList'] as string[]) : []
  const mappedConvertedList = convertedList.map(k => keyMapping.get(k) || k)
  const writtenNoteKeys = Object.keys(toWrite).filter(k => k.startsWith('note_'))

  if (existingList.length === 0 && convertedList.length === 0 && writtenNoteKeys.length === 0) {
    return null
  }

  const merged = Array.from(new Set([...existingList, ...mappedConvertedList, ...writtenNoteKeys]))
  if (isDeepEqual(existing['noteKeyList'], merged)) {
    return null
  }
  return merged
}

interface MigrationPlan {
  toWrite: StorageRecord
  safeToDeleteOriginalKeys: string[]
  keyMapping: Map<string, string>
}

/**
 * 処理名: 移行先キー使用中判定
 * 処理概要: 指定キーが既存データまたは書込予定データで既に使用されているか判定する
 * 実装理由: リネーム時の重複キー生成を防ぐため
 * @param {StorageRecord} existing - 既存の Chrome Storage レコード
 * @param {StorageRecord} toWrite - 書込予定のレコード
 * @param {string} key - 判定対象のキー
 * @returns {boolean} 使用中なら true
 */
function isKeyTaken(existing: StorageRecord, toWrite: StorageRecord, key: string): boolean {
  return Object.hasOwn(existing, key) || Object.hasOwn(toWrite, key)
}

/**
 * 処理名: 単一キーの移行解決
 * 処理概要: 1件の変換済みキーについて、書込・削除・リネームのいずれで扱うかを決定し計画へ反映する
 * 実装理由: キー単位の競合判定ロジックを分離し、移行計画作成の複雑度を抑えるため
 * @param {string} key - 変換済みストレージキー
 * @param {unknown} value - 変換済みの値
 * @param {StorageRecord} existing - 既存の Chrome Storage レコード
 * @param {StorageRecord} toWrite - 書込予定のレコード（この関数内で更新される）
 * @param {Map<string, string>} keyMapping - 旧キーから新キーへの対応表（この関数内で更新される）
 * @param {string[]} safeToDeleteOriginalKeys - 削除可能な旧キー一覧（この関数内で更新される）
 * @returns {void} 戻り値なし
 */
function resolveKeyEntry(
  key: string,
  value: unknown,
  existing: StorageRecord,
  toWrite: StorageRecord,
  keyMapping: Map<string, string>,
  safeToDeleteOriginalKeys: string[]
): void {
  if (!Object.hasOwn(existing, key)) {
    toWrite[key] = value
    keyMapping.set(key, key)
    return
  }
  if (isDeepEqual(existing[key], value)) {
    safeToDeleteOriginalKeys.push(key)
    keyMapping.set(key, key)
    return
  }
  if (key === 'config') {
    safeToDeleteOriginalKeys.push(key)
    return
  }
  const newKey = generateUniqueKey(key, candidate => isKeyTaken(existing, toWrite, candidate))
  toWrite[newKey] = key.startsWith('note_') ? updateProjectName(value, newKey) : value
  keyMapping.set(key, newKey)
}

/**
 * 処理名: 移行計画作成
 * 処理概要: 既存データとの競合を判定し、リネームやキー一覧統合を含む書込計画を作成する
 * 実装理由: 既存データを保護しつつ、旧データを別キーで安全に移行するため
 * @param {StorageRecord} existing - 既存の Chrome Storage レコード
 * @param {StorageRecord} converted - 旧ストレージから変換したレコード
 * @returns {MigrationPlan} 移行計画
 */
function planMigration(existing: StorageRecord, converted: StorageRecord): MigrationPlan {
  const toWrite: StorageRecord = {}
  const safeToDeleteOriginalKeys: string[] = []
  const keyMapping = new Map<string, string>()

  for (const [key, value] of Object.entries(converted)) {
    if (key === 'noteKeyList') continue
    resolveKeyEntry(key, value, existing, toWrite, keyMapping, safeToDeleteOriginalKeys)
  }

  const mergedNoteKeys = buildMergedNoteKeyList(existing, converted, toWrite, keyMapping)
  if (mergedNoteKeys !== null) {
    toWrite['noteKeyList'] = mergedNoteKeys
    if (Object.hasOwn(converted, 'noteKeyList')) {
      keyMapping.set('noteKeyList', 'noteKeyList')
    }
  } else if (Object.hasOwn(converted, 'noteKeyList')) {
    safeToDeleteOriginalKeys.push('noteKeyList')
  }

  return { toWrite, safeToDeleteOriginalKeys, keyMapping }
}

/**
 * 処理名: 移行書込検証
 * 処理概要: Chrome Storageから再取得した移行値が書込値と一致することを確認する
 * 実装理由: 旧データ削除前に保存成功を保証するため
 * @param {ChromeLocalStorage} storage - 移行先 Chrome Storage ラッパー
 * @param {StorageRecord} written - 書き込んだレコード
 * @returns {Promise<string[]>} 検証に成功したキー一覧
 */
async function verifyWrittenValues(storage: ChromeLocalStorage, written: StorageRecord): Promise<string[]> {
  const persisted = await storage.getAll()
  const verifiedKeys: string[] = []
  for (const [key, value] of Object.entries(written)) {
    if (isDeepEqual(persisted[key], value)) {
      verifiedKeys.push(key)
    }
  }
  return verifiedKeys
}

/**
 * 処理名: 旧ストレージ移行
 * 処理概要: localStorage の値を検証付きで chrome.storage.local へ安全に移す
 * 実装理由: 書込成功を確認する前に旧データを削除しないことでデータ消失を防ぐため
 * @param {Storage} legacyStorage - 移行元 localStorage
 * @param {ChromeLocalStorage} storage - 移行先 Chrome Storage ラッパー
 * @returns {Promise<{ migrated: boolean }>} 移行実行結果
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

  const { toWrite, safeToDeleteOriginalKeys, keyMapping } = planMigration(existing, converted)

  if (Object.keys(toWrite).length > 0) {
    await storage.set(toWrite)
    const verifiedKeys = new Set(await verifyWrittenValues(storage, toWrite))
    for (const [origKey, targetKey] of keyMapping.entries()) {
      if (verifiedKeys.has(targetKey)) {
        legacyStorage.removeItem(origKey)
      }
    }
  }

  safeToDeleteOriginalKeys.forEach(key => legacyStorage.removeItem(key))

  await storage.set({ [STORAGE_MIGRATION_COMPLETED_KEY]: true })
  return { migrated: true }
}