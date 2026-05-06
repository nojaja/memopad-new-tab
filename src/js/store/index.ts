import { createStore } from 'vuex'
import { markRaw } from 'vue'

import { FileContainer, FileData } from '@nojaja/filecontainer'
import { debounce } from 'lodash'

import jmd from '@/jmd.json'
import i18n from '../lang'

// import Debug from '../Debug'

/** ノートリストアイテム */
interface ListItem {
  name: string
  uri: string
  isActive: boolean
  createdTime: number
  lastUpdatedTime: number
}

/** Vuex ストアの currentFile エントリ型 */
interface CurrentFileEntry {
  filename?: string
  projectName?: string
}

/** 正規化済みファイルエントリ */
interface NormalizedFileEntry {
  filename: string
  fileType: string
  type: string
  language: string
  size: number
  truncated: boolean
  content: string
  description: string
}

let latestFileListCache: ListItem[] = []

/** ストレージキー: ノートキーリスト */
const STORAGE_KEY_NOTE_KEY_LIST = 'noteKeyList'
/** ストレージキー: アプリ設定 */
const STORAGE_KEY_CONFIG = 'config'
/** ノートキーのプレフィックス */
const NOTE_PREFIX = 'note_'

/**
 * 処理名: デフォルト設定オブジェクト
 * 処理概要: アプリのデフォルト設定値を定義する
 * 実装理由: 設定が未指定の場合のフォールバック値として使用するため
 */
const defaultConfig = {
  general: {
    sort: '0',
    cover: '-1',
    i18n_locale: 'ja',
    privacyBlur: false,
    lastExportDataAt: ''
  },
  editor: {
    automaticLayout: true,
    fontSize: 16,
    tabSize: 4,
    syncEditorToPreview: false,
    theme: 'vs',
    unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
    minimap: { enabled: true }
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
    mermaid: true,
    uml: true,
    multimdTable: true,
    multimdTableOption: {
      multiline: true,
      rowspan: true,
      headerless: true
    },
    multibyteconvert: false,
    multibyteconvertList: (jmd as { RegExpList?: unknown[] }).RegExpList || []
  }
}

/** normalizeConfig の入力用部分設定型 */
type RawConfig = {
  general?: Partial<typeof defaultConfig['general']>
  editor?: Partial<typeof defaultConfig['editor']>
  markdown?: Partial<typeof defaultConfig['markdown']> & {
    basicOption?: Partial<typeof defaultConfig['markdown']['basicOption']>
    multimdTableOption?: Partial<typeof defaultConfig['markdown']['multimdTableOption']>
    multibyteconvertList?: unknown[]
  }
}

/**
 * 処理名: ロケール正規化
 * 処理概要: ロケール文字列を正規化してサポートされた値に変換する
 * 実装理由: 旧形式のロケール文字列や未サポートのロケールを安全に扱うため
 * @param {unknown} locale - 正規化対象のロケール文字列
 * @returns {string} 正規化されたロケール（'en' または 'ja'）
 */
function normalizeLocale(locale: unknown): string {
  if (locale === 'en-US') return 'en'
  if (locale === 'ja-JP') return 'ja'
  if (locale === 'en' || locale === 'ja') return locale
  return defaultConfig.general.i18n_locale
}

/**
 * 処理名: 設定正規化
 * 処理概要: 不完全な設定オブジェクトをデフォルト値とマージして正規化する
 * 実装理由: 設定の不足・旧形式による不整合を防ぐため
 * @param {any} config - 正規化対象の設定オブジェクト
 * @returns {any} デフォルト値とマージされた正規化済み設定
 */
function normalizeConfig(config: unknown): typeof defaultConfig {
  const input = (config || {}) as RawConfig
  const normalized = {
    ...defaultConfig,
    ...input,
    general: {
      ...defaultConfig.general,
      ...(input.general || {})
    },
    editor: {
      ...defaultConfig.editor,
      ...(input.editor || {})
    },
    markdown: {
      ...defaultConfig.markdown,
      ...(input.markdown || {}),
      basicOption: {
        ...defaultConfig.markdown.basicOption,
        ...((input.markdown && input.markdown.basicOption) || {})
      },
      multimdTableOption: {
        ...defaultConfig.markdown.multimdTableOption,
        ...((input.markdown && input.markdown.multimdTableOption) || {})
      },
      multibyteconvertList: Array.isArray(input.markdown?.multibyteconvertList)
        ? input.markdown.multibyteconvertList
        : defaultConfig.markdown.multibyteconvertList
    }
  }

  normalized.general.i18n_locale = normalizeLocale(normalized.general.i18n_locale)
  return normalized as typeof defaultConfig
}

/**
 * 処理名: i18n ロケール適用
 * 処理概要: 指定ロケールを vue-i18n のグローバル設定に反映する
 * 実装理由: アプリのロケール設定を変更したときに即座に UI に反映するため
 * @param {string} locale - 適用するロケール文字列
 */
function applyI18nLocale(locale: string) {
  const target = normalizeLocale(locale)
  const globalI18n = i18n.global as unknown as { locale: string | { value: string } }
  const globalLocale = globalI18n.locale
  if (globalLocale && typeof globalLocale === 'object' && 'value' in globalLocale) {
    (globalLocale as { value: string }).value = target
    return
  }
  globalI18n.locale = target
}

/**
 * 処理名: 設定等価判定
 * 処理概要: JSON シリアライズで 2 つの設定オブジェクトが等しいか比較する
 * 実装理由: 不要なストア更新を防ぐために設定変更の有無を確認するため
 * @param {any} a - 比較元の設定オブジェクト
 * @param {any} b - 比較先の設定オブジェクト
 * @returns {boolean} 等しい場合は true
 */
function isSameConfig(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

/**
 * 処理名: ファイル名取得
 * 処理概要: FileData オブジェクトからファイル名文字列を取得する
 * 実装理由: FileData の API 差異を吸収して安全にファイル名を取得するため
 * @param {any} file - ファイルオブジェクト
 * @returns {string} ファイル名（取得不能の場合は空文字）
 */
function getFileName(file: unknown): string {
  if (!file || typeof file !== 'object') return ''
  const f = file as Record<string, unknown>
  if (typeof f.name === 'string' && f.name) return f.name
  if (typeof f.filename === 'string' && f.filename) return f.filename
  if (typeof f.getFilename === 'function') return (f.getFilename as () => string)() || ''
  return ''
}

/**
 * 処理名: ファイル内容取得
 * 処理概要: FileData オブジェクトからコンテンツ文字列を取得する
 * 実装理由: FileData の API 差異を吸収して安全にコンテンツを取得するため
 * @param {any} file - ファイルオブジェクト
 * @returns {string} ファイル内容（取得不能の場合は空文字）
 */
function getFileContent(file: unknown): string {
  if (!file || typeof file !== 'object') return ''
  const f = file as Record<string, unknown>
  if (typeof f.getContent === 'function') return (f.getContent as () => string)() || ''
  if (typeof f.content === 'string') return f.content
  return ''
}

/**
 * 処理名: ファイル説明取得
 * 処理概要: FileData オブジェクトから説明文字列を取得する
 * 実装理由: FileData の API 差異を吸収して安全に説明を取得するため
 * @param {any} file - ファイルオブジェクト
 * @returns {string} ファイル説明（取得不能の場合は空文字）
 */
function getFileDescription(file: unknown): string {
  if (!file || typeof file !== 'object') return ''
  const f = file as Record<string, unknown>
  if (typeof f.getDescription === 'function') return (f.getDescription as () => string)() || ''
  if (typeof f.description === 'string') return f.description
  return ''
}

/**
 * 処理名: ファイル説明設定
 * 処理概要: FileData 互換オブジェクトへ説明文字列を設定する
 * 実装理由: ライブラリ実装差異やテスト用スタブを吸収して安全に説明を更新するため
 * @param {unknown} file - ファイルオブジェクト
 * @param {string} description - 設定する説明文字列
 * @returns {void} なし
 */
function setFileDescription(file: unknown, description: string): void {
  if (!file || typeof file !== 'object') return
  const target = file as Record<string, unknown>
  if (typeof target.setDescription === 'function') {
    ;(target.setDescription as (value: string) => void)(description)
    return
  }
  target.description = description
}

/**
 * 処理名: ファイル内容設定
 * 処理概要: FileData 互換オブジェクトへ内容文字列を設定する
 * 実装理由: ライブラリ実装差異やテスト用スタブを吸収して安全に内容を更新するため
 * @param {unknown} file - ファイルオブジェクト
 * @param {string} content - 設定する内容文字列
 * @returns {void} なし
 */
function setFileContent(file: unknown, content: string): void {
  if (!file || typeof file !== 'object') return
  const target = file as Record<string, unknown>
  if (typeof target.setContent === 'function') {
    ;(target.setContent as (value: string) => void)(content)
    return
  }
  target.content = content
}


/**
 * 処理名: 複製ファイル先頭説明更新
 * 処理概要: コンテナ内の先頭ファイル説明へ copy 接尾辞を追加して保存する
 * 実装理由: 複製ノートであることを先頭ファイル説明から識別しやすくするため
 * @param {FileContainer} container - 複製対象のコンテナ
 * @returns {void} なし
 */
function updateFirstFileDescriptionForCopy(container: FileContainer): void {
  const files = container.getFiles()
  if (!Array.isArray(files) || files.length === 0) return

  const firstFilename = getFileName(files[0])
  if (!firstFilename) return

  const file = container.getFile(firstFilename)
  if (!file) return

  const description = getFileDescription(file)
  const newDescription = description ? `${description} copy` : 'copy'
  setFileDescription(file, newDescription)
  container.putFile(file)
}

/**
 * 処理名: 複製コンテナ時刻更新
 * 処理概要: 作成日時と更新日時を指定時刻で上書きする
 * 実装理由: 複製ノートを新規作成扱いで並べ替えや表示に貢献するため
 * @param {FileContainer} container - 更新対象コンテナ
 * @param {number} now - Unix ミリ秒
 * @returns {void} なし
 */
function updateContainerTimes(container: FileContainer, now: number): void {
  if (typeof container.setCreatedTime === 'function') {
    container.setCreatedTime(now)
  }
  if (typeof container.setLastUpdatedTime === 'function') {
    container.setLastUpdatedTime(now)
  }
}
/**
 * 処理名: 安全な JSON パース
 * 処理概要: JSON 文字列を安全にパースし失敗時はフォールバック値を返す
 * 実装理由: 不正な JSON による例外を防いでフォールバック値で継続するため
 * @param {string|null} raw - パース対象の文字列
 * @param {any} fallback - パース失敗時の代替値
 * @returns {any} パース結果またはフォールバック値
 */
function parseJsonSafely(raw: string | null, fallback: unknown): unknown {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

/**
 * 処理名: 現在ファイル取得
 * 処理概要: ストア状態から現在開いているファイルオブジェクトを返す
 * 実装理由: 現在ファイルの取得ロジックを集約して重複を避けるため
 * @param state - Vuex ストア状態
 * @param state.currentFile
 * @param state.fileContainer
 * @returns {FileData|null} 現在のファイルオブジェクト（なければ null）
 */
function getCurrentFileFromState(state: { currentFile?: CurrentFileEntry; fileContainer?: FileContainer }): FileData | null {
  const filename = typeof state.currentFile?.filename === 'string' ? state.currentFile.filename : ''
  if (!filename) return null
  if (!state.fileContainer || typeof state.fileContainer.getFile !== 'function') return null
  return state.fileContainer.getFile(filename) || null
}

/**
 * 処理名: 非空文字列の選択
 * 処理概要: 値が非空文字列ならその値を返し、それ以外はフォールバック値を返す
 * 実装理由: 文字列フィールド正規化の重複条件分岐を減らすため
 * @param {any} value - 評価対象の値
 * @param {string} fallback - フォールバック文字列
 * @returns {string} 正規化された文字列
 */
function pickString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback
}

/**
 * 処理名: ファイルエントリ正規化
 * 処理概要: 単一のファイルオブジェクトをデフォルト値で補完して正規化する
 * 実装理由: 不完全なファイルデータを安全な形式に変換するため
 * @param {Record<string, any>} source - 正規化対象のファイルオブジェクト
 * @param {string} key - ファイルキー（ファイル名のフォールバックに使用）
 * @returns {Record<string, any>} 正規化されたファイルオブジェクト
 */
function normalizeFileEntry(source: Record<string, unknown>, key: string): NormalizedFileEntry {
  const filename = pickString(source.filename, key)
  return {
    filename,
    fileType: pickString(source.fileType, 'txt'),
    type: pickString(source.type, 'text/plain'),
    language: pickString(source.language, 'Markdown'),
    size: typeof source.size === 'number' ? source.size : 0,
    truncated: !!source.truncated,
    content: pickString(source.content, ''),
    description: pickString(source.description, '')
  }
}

/**
 * 処理名: ファイルマップ正規化
 * 処理概要: files オブジェクトの全エントリを正規化してマップとして返す
 * 実装理由: プロジェクトの files フィールドを一括で正規化するため
 * @param {Record<string, any>} files - 正規化対象の files オブジェクト
 * @returns {Record<string, any>|null} 正規化済みファイルマップ（空の場合は null）
 */
function normalizeFilesMap(files: Record<string, unknown>): Record<string, NormalizedFileEntry> | null {
  const result = Object.keys(files).reduce((acc: Record<string, NormalizedFileEntry>, key) => {
    const source = files[key]
    if (!source || typeof source !== 'object') return acc
    const entry = normalizeFileEntry(source as Record<string, unknown>, key)
    acc[entry.filename] = entry
    return acc
  }, {})
  if (Object.keys(result).length === 0) return null
  return result
}

/**
 * 処理名: プロジェクトID復元
 * 処理概要: id が空文字の場合のみ projectName の note_<数字> 形式から id を復元する
 * 実装理由: 移行時に空文字へ崩れた id を元の値へ戻しつつ既存 id は維持するため
 * @param {any} id - 入力 id
 * @param {any} projectName - プロジェクト名
 * @returns {any} 復元後の id
 */
function restoreProjectId(id: unknown, projectName: unknown): unknown {
  if (id !== '') return id
  if (typeof projectName !== 'string') return id
  const match = projectName.match(/^note_(\d+)$/)
  if (!match) return id
  const restored = Number(match[1])
  return Number.isFinite(restored) ? restored : id
}

/**
 * 処理名: プロジェクトメタデータ構築
 * 処理概要: パース済みプロジェクトオブジェクトからメタデータをデフォルト値付きで構築する
 * 実装理由: プロジェクトメタデータの正規化ロジックを分離するため
 * @param {Record<string, any>} parsed - パース済みプロジェクトオブジェクト
 * @returns {Record<string, any>} 正規化されたメタデータオブジェクト
 */
function buildProjectMeta(parsed: Record<string, unknown>): Record<string, unknown> {
  const restoredId = restoreProjectId(parsed.id, parsed.projectName)
  return {
    v: typeof parsed.v === 'number' ? parsed.v : 0.1,
    id: restoredId ?? null,
    gistid: parsed.gistid ?? '',
    public: typeof parsed.public === 'boolean' ? parsed.public : true,
    createdTime: typeof parsed.createdTime === 'number' ? parsed.createdTime : Date.now(),
    lastUpdatedTime: typeof parsed.lastUpdatedTime === 'number' ? parsed.lastUpdatedTime : Date.now(),
    projectName: typeof parsed.projectName === 'string' ? parsed.projectName : '',
    description: typeof parsed.description === 'string' ? parsed.description : ''
  }
}

/**
 * 処理名: 保存済みプロジェクト正規化
 * 処理概要: ローカルストレージの raw データをプロジェクトオブジェクトに正規化する
 * 実装理由: 不完全・旧形式のプロジェクトデータを安全に読み込むため
 * @param {any} raw - ローカルストレージから取得した raw 値（文字列またはオブジェクト）
 * @returns {any|null} 正規化されたプロジェクトオブジェクト（変換不能の場合は null）
 */
function normalizeStoredProject(raw: unknown): Record<string, unknown> | null {
  const parsed = typeof raw === 'string' ? parseJsonSafely(raw, null) : raw
  if (!parsed || typeof parsed !== 'object') return null
  const parsedRecord = parsed as Record<string, unknown>

  const files = parsedRecord.files
  if (!files || typeof files !== 'object') return null

  const normalizedFiles = normalizeFilesMap(files as Record<string, unknown>)
  if (!normalizedFiles) return null

  return { ...buildProjectMeta(parsedRecord), files: normalizedFiles }
}

/**
 * 処理名: ストレージからプロジェクト取得
 * 処理概要: raw データを正規化して FileContainer インスタンスとして返す
 * 実装理由: ローカルストレージのデータを FileContainer オブジェクトに変換するため
 * @param {any} raw - ローカルストレージから取得した raw 値
 * @returns {FileContainer|null} 生成した FileContainer（変換不能の場合は null）
 */
function getProjectFromStorage(raw: unknown): FileContainer | null {
  const normalizedProject = normalizeStoredProject(raw)
  if (!normalizedProject) return null

  const container = new FileContainer()
  const setContainerFn = (container as FileContainer & { setContainer?: (c: Record<string, unknown>) => void })['setContainer']
  if (typeof setContainerFn === 'function') {
    setContainerFn.call(container, normalizedProject)
  } else {
    container.setContainerJson(JSON.stringify(normalizedProject))
  }
  return container
}

/**
 * 処理名: リストアイテムオブジェクト生成
 * 処理概要: ノートリストに表示するアイテムオブジェクトを生成する
 * 実装理由: アイテム生成の重複ロジックを集約するため
 * @param {string} noteKey - ノートのストレージキー
 * @param {boolean} isActive - 現在アクティブかどうか
 * @param {string} label - 表示名
 * @param {number} createdTime - 作成日時（Unix ms）
 * @param {number} lastUpdatedTime - 最終更新日時（Unix ms）
 * @returns {object} リストアイテムオブジェクト
 */
function makeListItemEntry(noteKey: string, isActive: boolean, label: string, createdTime: number, lastUpdatedTime: number): ListItem {
  return { name: label, uri: noteKey, isActive, createdTime, lastUpdatedTime }
}

/**
 * 処理名: 先頭ファイルラベル取得
 * 処理概要: パース済みプロジェクトの先頭ファイルから表示用ラベルを抽出する
 * 実装理由: ノートリストに表示する代表テキストを安全に取得するため
 * @param {any} parsed - パース済みプロジェクトオブジェクト
 * @param {string} noteKey - フォールバック用ノートキー
 * @returns {string} 表示用ラベル
 */
function getFirstFileLabel(parsed: Record<string, unknown>, noteKey: string): string {
  const files = parsed.files
  if (!files || typeof files !== 'object') return noteKey
  const filesMap = files as Record<string, unknown>
  const fileKeys = Object.keys(filesMap)
  if (fileKeys.length === 0) return noteKey
  const first = (filesMap[fileKeys[0]] || {}) as Record<string, unknown>
  const content = typeof first.content === 'string' ? first.content : ''
  const description = typeof first.description === 'string' ? first.description : ''
  return description || content.split('\n')[0] || noteKey
}

/**
 * 処理名: フィルターなしリストアイテム取得
 * 処理概要: フィルターなしの場合に raw データからリストアイテムを生成する
 * 実装理由: getListItemFromRaw の認知複雑度を分割して下げるため
 * @param {string} raw - ローカルストレージの raw 文字列
 * @param {string} noteKey - ノートのストレージキー
 * @param {string} currentProjectName - 現在開いているプロジェクト名
 * @returns {object} リストアイテムオブジェクト
 */
function getListItemNoFilter(raw: string, noteKey: string, currentProjectName: string): ListItem {
  const rawParsed = parseJsonSafely(raw, null)
  if (!rawParsed || typeof rawParsed !== 'object') {
    return makeListItemEntry(noteKey, currentProjectName === noteKey, noteKey, 0, 0)
  }
  const parsed = rawParsed as Record<string, unknown>
  const label = getFirstFileLabel(parsed, noteKey)
  return makeListItemEntry(
    noteKey,
    currentProjectName === noteKey,
    label,
    typeof parsed.createdTime === 'number' ? parsed.createdTime : 0,
    typeof parsed.lastUpdatedTime === 'number' ? parsed.lastUpdatedTime : 0
  )
}

/**
 * 処理名: フィルターありリストアイテム取得
 * 処理概要: フィルター文字列で絞り込んでリストアイテムを生成する
 * 実装理由: getListItemFromRaw の認知複雑度を分割して下げるため
 * @param {string} raw - ローカルストレージの raw 文字列
 * @param {string} noteKey - ノートのストレージキー
 * @param {string} currentProjectName - 現在開いているプロジェクト名
 * @param {string} filter - フィルター文字列
 * @returns {object|null} リストアイテムオブジェクト（マッチしない場合は null）
 */
function getListItemWithFilter(raw: string, noteKey: string, currentProjectName: string, filter: string): ListItem | null {
  const rawParsed = parseJsonSafely(raw, null)
  if (!rawParsed || typeof rawParsed !== 'object') return null
  const parsed = rawParsed as Record<string, unknown>
  if (!parsed.files || typeof parsed.files !== 'object') return null
  const filesMap = parsed.files as Record<string, unknown>
  const fileKeys = Object.keys(filesMap)
  if (fileKeys.length === 0) return null
  const first = (filesMap[fileKeys[0]] || {}) as Record<string, unknown>
  const content = typeof first.content === 'string' ? first.content : ''
  if (content.indexOf(filter) === -1) return null
  const projectName = typeof parsed.projectName === 'string' ? parsed.projectName : ''
  const label = getFirstFileLabel(parsed, noteKey)
  return makeListItemEntry(
    noteKey,
    currentProjectName === projectName,
    label,
    typeof parsed.createdTime === 'number' ? parsed.createdTime : 0,
    typeof parsed.lastUpdatedTime === 'number' ? parsed.lastUpdatedTime : 0
  )
}

/**
 * 処理名: raw データからリストアイテム取得
 * 処理概要: フィルターの有無によって適切なリストアイテム生成関数に委譲する
 * 実装理由: ノートリストへのアイテム生成ロジックを集約するため
 * @param {string} raw - ローカルストレージの raw 文字列
 * @param {string} noteKey - ノートのストレージキー
 * @param {string} currentProjectName - 現在開いているプロジェクト名
 * @param {string} filter - フィルター文字列（空文字でフィルターなし）
 * @returns {object|null} リストアイテムオブジェクト（マッチしない場合は null）
 */
function getListItemFromRaw(raw: string, noteKey: string, currentProjectName: string, filter: string): ListItem | null {
  if (filter === '') {
    return getListItemNoFilter(raw, noteKey, currentProjectName)
  }
  return getListItemWithFilter(raw, noteKey, currentProjectName, filter)
}

/**
 * 処理名: ノートキーリスト正規化
 * 処理概要: ノートキーリストから不正な値を除去して重複排除した配列を返す
 * 実装理由: ストレージから読み込んだリストの整合性を保証するため
 * @param {any} list - 正規化対象のリスト
 * @returns {string[]} 正規化された重複排除済みノートキー配列
 */
function sanitizeNoteKeyList(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const uniq = new Set<string>()
  list.forEach((v: unknown) => {
    if (typeof v !== 'string') return
    if (!v.startsWith(NOTE_PREFIX)) return
    uniq.add(v)
  })
  return Array.from(uniq)
}

/**
 * 処理名: 最新の読み込み可能ノート名取得
 * 処理概要: ノートキーリストの末尾から最初に読み込めるノートのキーを返す
 * 実装理由: アプリ起動時に最後に開いていたノートを再表示するため
 * @param {string[]} noteKeyList - ノートキーの配列
 * @returns {string} 読み込み可能なノートキー（見つからない場合は空文字）
 */
function findLatestReadableNoteName(noteKeyList: string[]): string {
  for (let i = noteKeyList.length - 1; i >= 0; i--) {
    const key = noteKeyList[i]
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const tmp = getProjectFromStorage(raw)
    if (!tmp) continue

    const files = tmp.getFiles()
    if (files && files.length > 0 && getFileName(files[0])) {
      return key
    }
  }
  return ''
}

/**
   * 処理名: 最終更新日時降順コンパレータ
   * 処理概要: 最終更新日時で降順比較する sort コンパレータ
   * 実装理由: refreshFileList の sort 処理を分離して認知複雑度を下げるため
   * @param {any} a - 比較元アイテム
   * @param {any} b - 比較先アイテム
   * @returns {number} 比較結果（-1 / 0 / 1）
   */
function compareLastUpdatedDesc(a: ListItem, b: ListItem): number {
    if (a.lastUpdatedTime > b.lastUpdatedTime) return -1
    if (a.lastUpdatedTime < b.lastUpdatedTime) return 1
    return 0
  }

  /**
   * 処理名: 最終更新日時昇順コンパレータ
   * 処理概要: 最終更新日時で昇順比較する sort コンパレータ
   * 実装理由: refreshFileList の sort 処理を分離して認知複雑度を下げるため
   * @param {any} a - 比較元アイテム
   * @param {any} b - 比較先アイテム
   * @returns {number} 比較結果（-1 / 0 / 1）
   */
function compareLastUpdatedAsc(a: ListItem, b: ListItem): number {
    if (a.lastUpdatedTime < b.lastUpdatedTime) return -1
    if (a.lastUpdatedTime > b.lastUpdatedTime) return 1
    return 0
  }

  /**
   * 処理名: 作成日時降順コンパレータ
   * 処理概要: 作成日時で降順比較する sort コンパレータ
   * 実装理由: refreshFileList の sort 処理を分離して認知複雑度を下げるため
   * @param {any} a - 比較元アイテム
   * @param {any} b - 比較先アイテム
   * @returns {number} 比較結果（-1 / 0 / 1）
   */
function compareCreatedDesc(a: ListItem, b: ListItem): number {
    if (a.createdTime > b.createdTime) return -1
    if (a.createdTime < b.createdTime) return 1
    return 0
  }

  /**
   * 処理名: 作成日時昇順コンパレータ
   * 処理概要: 作成日時で昇順比較する sort コンパレータ
   * 実装理由: refreshFileList の sort 処理を分離して認知複雑度を下げるため
   * @param {any} a - 比較元アイテム
   * @param {any} b - 比較先アイテム
   * @returns {number} 比較結果（-1 / 0 / 1）
   */
function compareCreatedAsc(a: ListItem, b: ListItem): number {
    if (a.createdTime < b.createdTime) return -1
    if (a.createdTime > b.createdTime) return 1
    return 0
  }

  /**
   * 処理名: 並び順適用
   * 処理概要: ソート設定値に応じてアイテム配列を並び替える
   * 実装理由: refreshFileList から並び替えロジックを分離して認知複雑度を下げるため
   * @param {any[]} items - 並び替え対象のアイテム配列
   * @param {string} sort - ソート設定値（'0'〜'3'）
   */
function applySortOrder(items: ListItem[], sort: string): void {
    if (sort === '0') items.sort(compareLastUpdatedDesc)
    else if (sort === '1') items.sort(compareLastUpdatedAsc)
    else if (sort === '2') items.sort(compareCreatedDesc)
    else if (sort === '3') items.sort(compareCreatedAsc)
  }

  export default createStore({
  devtools: false,
  state: {
    itemList: { filter: '' },
    editor: null as unknown,
    currentFile: {} as CurrentFileEntry,
    currentModelId: 'source',
    sourceVersion: 0,
    fileContainer: markRaw(new FileContainer()),
    noteKeyList: sanitizeNoteKeyList(parseJsonSafely(localStorage.getItem(STORAGE_KEY_NOTE_KEY_LIST), [])) as string[],
    config: normalizeConfig(parseJsonSafely(localStorage.getItem(STORAGE_KEY_CONFIG), null)),
    isImporting: false
  },
  getters: { // state の参照
    /**
     * 処理名: 現在ファイルゲッター
     * 処理概要: ストア状態から現在開いているファイル情報をオブジェクトとして返す
     * 実装理由: ファイル情報を型安全にコンポーネントへ公開するため
     * @param {any} state - Vuex ストア状態
     * @returns {{ file: any, filename: string, projectName: string }} 現在ファイル情報
     */
    currentFile(state) {
      const file = getCurrentFileFromState(state)
      return {
        file,
        filename: state.currentFile?.filename || '',
        projectName: state.currentFile?.projectName || ''
      }
    },
    /**
     * 処理名: ソースゲッター
     * 処理概要: 現在開いているファイルの内容文字列を返す
     * 実装理由: Monaco エディタへのソース供給をストア経由で行うため
     * @param {any} state - Vuex ストア状態
     * @returns {string} 現在ファイルのコンテンツ
     */
    source(state) {
      // fileContainer is markRaw, so keep a reactive counter dependency.
      return state.sourceVersion >= 0
        ? getFileContent(getCurrentFileFromState(state))
        : ''
    },
    /**
     * 処理名: 設定ゲッター
     * 処理概要: ストアから現在のアプリ設定を返す
     * 実装理由: アプリ設定をコンポーネントへ公開するため
     * @param {any} state - Vuex ストア状態
     * @returns {object} アプリ設定オブジェクト
     */
    config(state) {
      return state.config
    },
    /**
     * 処理名: アイテムリストゲッター
     * 処理概要: フィルター情報を含むアイテムリスト状態を返す
     * 実装理由: 検索フィルターの状態をコンポーネントへ公開するため
     * @param {any} state - Vuex ストア状態
     * @returns {object} フィルター情報を含むアイテムリスト
     */
    itemList(state) {
      return state.itemList
    },
    // File一覧の更新
    /**
     * 処理名: ファイルリスト更新ゲッター
     * 処理概要: フィルターと並び順を適用したノートリストを返す
     * 実装理由: サイドバーに最新のノートリストを提供するため
     * @param {any} state - Vuex ストア状態
     * @returns {any[]} フィルター・ソート適用済みノートリスト
     */
    refreshFileList(state) {
      if (state.isImporting) {
        return latestFileListCache
      }
      const items: ListItem[] = []
      const filter = state.itemList.filter || ''
      const projectName = state.currentFile.projectName
      for (const val of state.noteKeyList) {
        const raw = localStorage.getItem(val)
        if (filter !== '' && !raw) continue
        const item = getListItemFromRaw(raw || '', val, projectName, filter)
        if (!item) continue
        items.push(item)
      }
      applySortOrder(items, state.config.general.sort)
      latestFileListCache = items
      return items
    }
  },
  mutations: { // stateを変更する為の処理(同期処理のみ)
    /**
     * 処理名: インポート状態設定ミューテーション
     * 処理概要: インポート中フラグを更新する
     * 実装理由: インポート中はファイルリストを更新しないようにするため
     * @param {any} state - Vuex ストア状態
     * @param {boolean} importing - インポート中かどうか
     */
    setImporting(state, importing) {
      state.isImporting = !!importing
    },
    /**
     * 処理名: タイトル更新ミューテーション
     * 処理概要: 現在ファイルの説明（タイトル）を更新してプロジェクトを保存する
     * 実装理由: タイトル変更を即座にファイルコンテナと永続化ストレージに反映するため
     * @param {any} state - Vuex ストア状態
     * @param {string} title - 新しいタイトル文字列
     */
    updateTitle(state, title) {
      const currentFile = getCurrentFileFromState(state)
      if (!currentFile) return

      const currentTitle = getFileDescription(currentFile)
      if (currentTitle === title) return
      setFileDescription(currentFile, title)
      state.fileContainer.putFile(currentFile)
      this.dispatch('saveProject')
    },
    /**
     * 処理名: コンテンツ更新ミューテーション
     * 処理概要: 現在ファイルの内容を更新してプロジェクトを保存する
     * 実装理由: エディタの変更を即座にファイルコンテナと永続化ストレージに反映するため
     * @param {any} state - Vuex ストア状態
     * @param {string} content - 新しいコンテンツ文字列
     */
    updateContent(state, content) {
      const currentFile = getCurrentFileFromState(state)
      if (!currentFile) return

      const currentContent = getFileContent(currentFile)
      if (currentContent === content) return
      setFileContent(currentFile, content)
      state.fileContainer.putFile(currentFile)
      state.sourceVersion += 1
      this.dispatch('saveProject')
    },
    /**
     * 処理名: プロジェクト保存ミューテーション
     * 処理概要: 現在のプロジェクト状態をローカルストレージに書き込む
     * 実装理由: ファイルコンテナの状態をローカルストレージに永続化するため
     * @param {any} state - Vuex ストア状態
     */
    saveProject(state) {
      // console.log('mutations saveProject')
      // state.currentFile をfileContainerに格納
      // ローカルストレージに最新の状態を保存
      state.fileContainer.setLastUpdatedTime(new Date().getTime())
      const noteName = state.fileContainer.getProjectName()
      localStorage.setItem(noteName, state.fileContainer.getContainerJson())
      // console.log(state.fileContainer.getProjectName() + ':' + state.fileContainer.getContainerJson())
      // refreshFileList();
      // return cb ? cb() : true
    },
    // プロジェクトの読み込み処理
    /**
     * 処理名: プロジェクト読み込みミューテーション
     * 処理概要: 指定ノート名のプロジェクトをローカルストレージから読み込んでファイルコンテナに設定する
     * 実装理由: ノート選択時に対応するプロジェクトをエディタに表示するため
     * @param {any} state - Vuex ストア状態
     * @param {string} noteName - 読み込むノートのキー
     */
    loadProject(state, noteName) {
      // console.log('loadProject:' + noteName)
      const raw = localStorage.getItem(noteName)
      if (!raw) { // 存在しない場合は新規作成する
        this.dispatch('newProject')
        return
      }

      const normalizedProject = normalizeStoredProject(raw)
      if (!normalizedProject) {
        console.warn('Failed to load project, recreate project:', noteName)
        this.dispatch('newProject')
        return
      }

      const setContainerFn = (state.fileContainer as FileContainer & { setContainer?: (c: Record<string, unknown>) => void })['setContainer']
      if (typeof setContainerFn === 'function') {
        setContainerFn.call(state.fileContainer, normalizedProject)
      } else {
        state.fileContainer.setContainerJson(JSON.stringify(normalizedProject))
      }

      const files = state.fileContainer.getFiles()
      if (!files || files.length === 0) {
        console.warn('Project has no files, recreate project:', noteName)
        this.dispatch('newProject')
        return
      }

      const firstFilename = getFileName(files[0])
      if (!firstFilename) {
        console.warn('Project first file has no filename, recreate project:', noteName)
        this.dispatch('newProject')
        return
      }

      const file = state.fileContainer.getFile(firstFilename) || null
      state.currentFile = {
        filename: file ? firstFilename : '',
        projectName: file ? noteName : ''
      }
    },
    // プロジェクトの新規作成処理
    /**
     * 処理名: 新規プロジェクト作成ミューテーション
     * 処理概要: 新しいノートを作成してファイルコンテナを初期化しストレージに保存する
     * 実装理由: 新規ノート作成時の一連の初期化処理を集約するため
     * @param {any} state - Vuex ストア状態
     */
    newProject(state) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      const noteName = NOTE_PREFIX + noteId
      const today = new Date()
      const content = '' + today.getFullYear() + '/' + ('0' + (today.getMonth() + 1)).slice(-2) + '/' + ('0' + today.getDate()).slice(-2) + ' ' + ('0' + today.getHours()).slice(-2) + ':' + ('0' + today.getMinutes()).slice(-2) + '\n'

      // console.log('state.fileContainer:' + state.fileContainer)
      state.fileContainer.init()
      state.fileContainer.setCreatedTime(new Date().getTime())
      state.fileContainer.setLastUpdatedTime(new Date().getTime())
      const file = new FileData()
      file.setFilename('index.md')
      file.setContent(content)
      file.setDescription(content)
      state.fileContainer.putFile(file)
      // console.log('fileContainer:' + state.fileContainer.getContainerJson())

      state.fileContainer.setId(noteId)
      state.fileContainer.setProjectName(noteName)

      this.dispatch('saveProject')// プロジェクトの保存
      this.dispatch('saveNoteKeyList', noteName)// ファイル一覧の保存
      this.dispatch('loadProject', noteName)
      // console.log('noteKeyList:' + state.noteKeyList)
    },
    // プロジェクト内のFileを開く
    /**
     * 処理名: ファイルオープンミューテーション
     * 処理概要: ファイルコンテナ内の指定ファイルを現在ファイルとして設定する
     * 実装理由: タブや一覧からファイルを切り替えるため
     * @param {any} state - Vuex ストア状態
     * @param {string} filename - 開くファイル名
     */
    fileOpen(state, filename) {
      const file = state.fileContainer.getFile(filename) || null
      state.currentFile = {
        filename: file ? filename : '',
        projectName: file ? state.fileContainer.getProjectName() : ''
      }
    },
    /**
     * 処理名: ノートキーリスト読み込みミューテーション
     * 処理概要: ローカルストレージからノートキーリストを読み込んでステートを更新する
     * 実装理由: ページ読み込み時にノートリストを復元するため
     * @param {any} state - Vuex ストア状態
     */
    loadNoteKeyList(state) {
      state.noteKeyList = []
      const stored = localStorage.getItem(STORAGE_KEY_NOTE_KEY_LIST)
      if (stored) {
        state.noteKeyList = sanitizeNoteKeyList(parseJsonSafely(stored, []))
      }
      localStorage.setItem(STORAGE_KEY_NOTE_KEY_LIST, JSON.stringify(state.noteKeyList))
    },
    /**
     * 処理名: ノートキーリスト置換ミューテーション
     * 処理概要: ノートキーリストを新しいリストで置換してローカルストレージを更新する
     * 実装理由: インポート後のマージ済みリストを一括で反映するため
     * @param {any} state - Vuex ストア状態
     * @param {any} list - 新しいノートキーリスト
     */
    replaceNoteKeyList(state, list) {
      const sanitized = sanitizeNoteKeyList(list)
      state.noteKeyList = sanitized
      localStorage.setItem(STORAGE_KEY_NOTE_KEY_LIST, JSON.stringify(sanitized))
    },
    /**
     * 処理名: ノートキー保存ミューテーション
     * 処理概要: 新しいノートキーをリストに追加してローカルストレージを更新する
     * 実装理由: 新規ノート作成時にキーリストを永続化するため
     * @param {any} state - Vuex ストア状態
     * @param {string} noteName - 追加するノートキー
     */
    saveNoteKeyList(state, noteName) {
      if (typeof noteName !== 'string' || !noteName.startsWith(NOTE_PREFIX)) return
      if (state.noteKeyList.indexOf(noteName) === -1) {
        state.noteKeyList.push(noteName)
      }
      localStorage.setItem(STORAGE_KEY_NOTE_KEY_LIST, JSON.stringify(state.noteKeyList))
    },
    /**
     * 処理名: プロジェクト複製ミューテーション
     * 処理概要: 現在のプロジェクトを新しい note_ キーで複製して localStorage に保存し noteKeyList を更新する
     * 実装理由: 他タブによる更新競合時にコピーを作成して編集中の内容を保護するため
     * @param {any} state - Vuex ストア状態
     */
    duplicateCurrentProject(state) {
      const currentProjectName = state.currentFile?.projectName
      if (typeof currentProjectName !== 'string' || currentProjectName === '') return
      const rawJson = state.fileContainer.getContainerJson()
      if (!rawJson) return

      const duplicatedContainer = new FileContainer()
      duplicatedContainer.setContainerJson(rawJson)

      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      const noteName = NOTE_PREFIX + noteId
      duplicatedContainer.setId(noteId)
      duplicatedContainer.setProjectName(noteName)
      updateFirstFileDescriptionForCopy(duplicatedContainer)
      updateContainerTimes(duplicatedContainer, Date.now())

      localStorage.setItem(noteName, duplicatedContainer.getContainerJson())
      if (state.noteKeyList.indexOf(noteName) === -1) {
        state.noteKeyList.push(noteName)
      }
      localStorage.setItem(STORAGE_KEY_NOTE_KEY_LIST, JSON.stringify(state.noteKeyList))
    },
    /**
     * 処理名: プロジェクト削除ミューテーション
     * 処理概要: 現在のプロジェクトをキーリストから除去してストレージを更新しアプリを初期化する
     * 実装理由: ノート削除後にリストと表示を整合させるため
     * @param {any} state - Vuex ストア状態
     */
    deleteProject(state) {
      const noteName = state.currentFile.projectName
      state.noteKeyList = state.noteKeyList.filter((v: string) => v !== noteName)
      localStorage.setItem(STORAGE_KEY_NOTE_KEY_LIST, JSON.stringify(state.noteKeyList))
      this.dispatch('init')
    },
    /**
     * 処理名: 最初のプロジェクト表示ミューテーション
     * 処理概要: 最後に読み込めるノートを開くか、存在しなければ新規作成する
     * 実装理由: アプリ起動時に最後のノートを自動表示するため
     * @param {any} state - Vuex ストア状態
     */
    openFirst(state) {
      const readableNoteName = findLatestReadableNoteName(state.noteKeyList)
      if (!readableNoteName) {
        this.dispatch('newProject')
        return
      }
      this.dispatch('loadProject', readableNoteName)
    },
    /**
     * 処理名: 設定変更ミューテーション
     * 処理概要: 設定を正規化してステートを更新しローカルストレージに保存する
     * 実装理由: 設定変更を永続化してロケールを即座に反映するため
     * @param {any} state - Vuex ストア状態
     * @param {any} config - 新しい設定オブジェクト
     */
    setConfig(state, config) {
      const normalized = normalizeConfig(config)
      if (!isSameConfig(state.config, normalized)) {
        state.config = normalized
      }
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(normalized))
      applyI18nLocale(normalized.general.i18n_locale)
    },
    /**
     * 処理名: 設定読み込みミューテーション
     * 処理概要: ローカルストレージから設定を読み込んでステートを更新する
     * 実装理由: ページ再読み込み時に設定を復元するため
     * @param {any} state - Vuex ストア状態
     */
    loadConfig(state) {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG)
      if (stored) {
        state.config = normalizeConfig(parseJsonSafely(stored, null))
      } else {
        state.config = normalizeConfig(state.config)
      }
      applyI18nLocale(state.config.general.i18n_locale)
    },
    /**
     * 処理名: プロジェクトインポートミューテーション
     * 処理概要: インポートデータからプロジェクトを作成してローカルストレージに保存する
     * 実装理由: 外部データからノートを復元するため
     * @param {any} state - Vuex ストア状態
     * @param {any} pjdata - インポートするプロジェクトデータ
     */
    importProject(state, pjdata) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      pjdata.id = restoreProjectId(pjdata.id, pjdata.projectName)
      if (pjdata.id == null) pjdata.id = noteId
      pjdata.projectName = pjdata.projectName || 'note_' + pjdata.id
      const tmpfileContainer = new FileContainer()
      tmpfileContainer.setId(pjdata.id)
      tmpfileContainer.setProjectName(pjdata.projectName)
      if (pjdata.createdTime) tmpfileContainer.setCreatedTime(pjdata.createdTime)
      if (pjdata.lastUpdatedTime) tmpfileContainer.setLastUpdatedTime(pjdata.lastUpdatedTime)
      if (pjdata.files) {
        const importedContainer = getProjectFromStorage({
          ...pjdata,
          files: pjdata.files
        })
        if (importedContainer) {
          localStorage.setItem(pjdata.projectName, importedContainer.getContainerJson())
          return
        }
      } else {
        const file = new FileData()
        file.setFilename('index.md')
        if (pjdata.text) file.setContent(pjdata.text)
        const label = file.getDescription() || file.getContent().split('\n')[0] || pjdata.projectName
        file.setDescription(label)
        tmpfileContainer.putFile(file)
      }
      localStorage.setItem(pjdata.projectName, tmpfileContainer.getContainerJson())
    }
  },
  actions: { // ミューテーションをコミットする関数(外部APIとの連携や非同期処理もここ)
    /**
     * 処理名: インポート状態設定アクション
     * 処理概要: インポート中フラグを更新するアクション
     * 実装理由: インポート中の UI 制御をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {boolean} importing - インポート中かどうか
     */
    setImporting(context, importing) {
      context.commit('setImporting', importing)
    },
    /**
     * 処理名: ノートキーリスト読み込みアクション
     * 処理概要: loadNoteKeyList ミューテーションをコミットする
     * 実装理由: ページ読み込み時の初期化フローを統一するため
     * @param {any} context - Vuex アクションコンテキスト
     */
    loadNoteKeyList(context) {
      context.commit('loadNoteKeyList')
    },
    /**
     * 処理名: ノートキーリスト置換アクション
     * 処理概要: replaceNoteKeyList ミューテーションをコミットする
     * 実装理由: インポート後のリスト一括更新をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {any} list - 新しいノートキーリスト
     */
    replaceNoteKeyList(context, list) {
      context.commit('replaceNoteKeyList', list)
    },
    // ファイル一覧の保存処理
    /**
     * 処理名: ノートキー保存アクション
     * 処理概要: saveNoteKeyList ミューテーションをコミットする
     * 実装理由: 新規ノート作成時のキー保存をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {string} noteName - 保存するノートキー
     */
    saveNoteKeyList(context, noteName) {
      context.commit('saveNoteKeyList', noteName)
    },
    // ファイル一覧の削除処理
    /**
     * 処理名: ノートキー削除アクション
     * 処理概要: 指定ノートキーをキーリストから削除してローカルストレージを更新する
     * 実装理由: ノート削除時のキーリスト管理をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {string} noteName - 削除するノートキー
     */
    deleteNoteKeyList(context, noteName) {
      context.state.noteKeyList = context.state.noteKeyList.filter((v: string) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify(context.state.noteKeyList))
    },
    // プロジェクトの読み込み処理
    /**
     * 処理名: プロジェクト読み込みアクション
     * 処理概要: Promise.resolve().then() で loadProject ミューテーションを非同期コミットする
     * 実装理由: Vue のリアクティブ更新を適切なタイミングで行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {string} noteName - 読み込むノートキー
     * @returns {Promise<void>} コミット完了後に resolve する Promise
     */
    loadProject(context, noteName) {
      Promise.resolve().then(() => {
        context.commit('loadProject', noteName)
      })
    },
    /**
     * 処理名: プロジェクト複製アクション
     * 処理概要: 現在のプロジェクトを複製して新しい note_ キーで読み込み直す
     * 実装理由: 他タブ更新競合時にコピーを作成して編集中の内容を保持するため
     * @param {any} context - Vuex アクションコンテキスト
     */
    duplicateCurrentProject(context) {
      context.commit('duplicateCurrentProject')
      const latest = context.state.noteKeyList[context.state.noteKeyList.length - 1]
      if (typeof latest === 'string') {
        context.dispatch('loadProject', latest)
      }
    },
    // プロジェクトの保存処理
    /**
     * 処理名: プロジェクト保存アクション
     * 処理概要: saveProject ミューテーションをコミットする
     * 実装理由: プロジェクト保存をアクション経由で外部から呼べるようにするため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {Function} [cb] - 保存後のコールバック（未使用）
     */
    saveProject(context, cb?: () => void) {
      context.commit('saveProject', cb)
      debounce(/**
       * 処理名: デバウンス保存ログ
       * 処理概要: 3 秒デバウンスでコンソールにログを出力する
       * 実装理由: 頻繁な保存時のデバッグ出力を間引くため
       */
      function() {
        console.log('saveProject')
      }, 3000)()
    },
    /**
     * 処理名: ファイルオープンアクション
     * 処理概要: fileOpen ミューテーションをコミットする
     * 実装理由: ファイル切り替えをアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {string} filename - 開くファイル名
     */
    fileOpen(context, filename) {
      context.commit('fileOpen', filename)
    },
    /**
     * 処理名: 新規プロジェクト作成アクション
     * 処理概要: newProject ミューテーションをコミットする
     * 実装理由: 新規ノート作成をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     */
    newProject(context) {
      context.commit('newProject')
    },
    /**
     * 処理名: タイトル更新アクション
     * 処理概要: updateTitle ミューテーションをコミットする
     * 実装理由: タイトル変更をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {string} title - 新しいタイトル
     */
    updateTitle(context, title) {
      context.commit('updateTitle', title)
    },
    /**
     * 処理名: コンテンツ更新アクション
     * 処理概要: updateContent ミューテーションをコミットする
     * 実装理由: エディタの変更をアクション経由でストアに反映するため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {string} content - 新しいコンテンツ
     */
    update(context, content) {
      context.commit('updateContent', content)
    },
    /**
     * 処理名: プロジェクト削除アクション
     * 処理概要: deleteProject ミューテーションをコミットする
     * 実装理由: ノート削除をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     */
    deleteProject(context) {
      context.commit('deleteProject')
    },
    /**
     * 処理名: アプリ初期化アクション
     * 処理概要: openFirst ミューテーションをコミットしてアプリを初期状態にする
     * 実装理由: アプリ起動時と削除後の初期化を統一するため
     * @param {any} context - Vuex アクションコンテキスト
     */
    init(context) {
      context.commit('openFirst')
    },
    /**
     * 処理名: 設定変更アクション
     * 処理概要: setConfig ミューテーションをコミットする
     * 実装理由: 設定変更をアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {any} config - 新しい設定オブジェクト
     */
    setConfig(context, config) {
      context.commit('setConfig', config)
    },
    /**
     * 処理名: プロジェクトインポートアクション
     * 処理概要: importProject ミューテーションをコミットする
     * 実装理由: プロジェクトインポートをアクション経由で行うため
     * @param {any} context - Vuex アクションコンテキスト
     * @param {any} pjdata - インポートするプロジェクトデータ
     */
    importProject(context, pjdata) {
      context.commit('importProject', pjdata)
    }
  }
})
