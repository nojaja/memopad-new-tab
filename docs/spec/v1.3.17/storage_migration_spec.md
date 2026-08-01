# v1.3.17 - chrome.storage.local 移行設計書

## ドキュメント情報
- バージョン: 1.3.17
- 更新日: 2026-08-01
- ステータス: 設計書（フェーズ1）
- 分類: 永続化基盤の移行

---

## 1. 背景と目的

現在の永続化は同期 API の `window.localStorage` に依存している。これは Manifest V3 の Service Worker 環境で利用できず、ブラウザ再起動または企業ポリシーによるサイトデータ削除の対象にもなる。

v1.3.17 では、ノート・ノートキー一覧・設定・エクスポート時のバージョン情報を、Chrome 拡張機能用の `chrome.storage.local` へ移す。Chrome 拡張機能のライフサイクルに適合した非同期 API へ統一し、既存ユーザーの保存データを失わずに引き継ぐことを目的とする。

### 1.1 スコープ

- `localStorage` の読み書きを `chrome.storage.local` 経由へ移行する。
- 初回起動時に旧 `localStorage` のデータを安全に移行する。
- 複数タブの保存変更検知を `chrome.storage.onChanged` へ置換する。
- import/export の入出力形式を、ストレージのオブジェクト値に対応させる。

### 1.2 非スコープ

- ノートのデータモデルおよび画面仕様の変更。
- クラウド同期（`chrome.storage.sync`）への保存。
- 既存のバックアップ JSON ファイル形式を破壊する変更。

---

## 2. 影響範囲の特定

### 2.1 現在の直接アクセス箇所

| ファイル | 関数・メソッド | 現在の操作 | 移行後の責務 |
| --- | --- | --- | --- |
| `src/js/store/index.ts` | `createAndPersistConfigForNewInstall` | `config` を JSON 文字列で保存 | 非同期 action から既定設定オブジェクトを保存 |
| `src/js/store/index.ts` | `loadInitialConfigFromStorage` | `config` を同期取得して state 初期値に利用 | 廃止。起動 action で非同期に設定を取得 |
| `src/js/store/index.ts` | `findLatestReadableNoteName` | 各 `note_*` を同期取得 | 非同期 action 内で取得済みノートデータを検索 |
| `src/js/store/index.ts` | `state.noteKeyList` 初期化 | `noteKeyList` を同期取得 | 空配列で初期化し、起動 action が更新 |
| `src/js/store/index.ts` | `state.config` 初期化 | `config` を同期取得 | 既定設定で初期化し、起動 action が更新 |
| `src/js/store/index.ts` | getter `refreshFileList` | 各 `note_*` を同期取得 | state のノートキャッシュだけを参照 |
| `src/js/store/index.ts` | mutation `saveProject` | 現在ノートを JSON 文字列で保存 | mutation は state 更新のみ。action がオブジェクトを保存 |
| `src/js/store/index.ts` | mutation `loadProject` | ノート JSON を同期取得・復元 | action が取得・検証後、mutation が適用 |
| `src/js/store/index.ts` | mutation `newProject` | 保存・キー一覧保存・読込を連鎖 | action が生成、保存、一覧更新、読込を順序制御 |
| `src/js/store/index.ts` | mutations `loadNoteKeyList` / `replaceNoteKeyList` / `saveNoteKeyList` | `noteKeyList` を JSON 文字列で読み書き | action が配列を直接読み書き |
| `src/js/store/index.ts` | mutation `duplicateCurrentProject` | 複製ノートとキー一覧を JSON 文字列で保存 | action が複製データと一覧を保存 |
| `src/js/store/index.ts` | mutation `deleteProject` | キー一覧を JSON 文字列で保存 | action が一覧更新を保存し、必要ならノート本体を削除 |
| `src/js/store/index.ts` | mutations `setConfig` / `loadConfig` | `config` を JSON 文字列で読み書き | action が設定オブジェクトを読み書き、mutation は反映のみ |
| `src/js/store/index.ts` | mutation `importProject` | インポートノートを JSON 文字列で保存 | action が正規化済みオブジェクトを保存 |
| `src/js/store/index.ts` | action `deleteNoteKeyList` | `noteKeyList` を JSON 文字列で保存 | 非同期 action で配列を直接保存 |
| `src/js/components/MainContents.vue` | `exportLocalStorageFromSidebar` | `currentVersion` 設定と全件エクスポート | 非同期 store action から全件取得してエクスポート |
| `src/js/components/SettingPage.vue` | `exportLocalStorage` | `currentVersion` 設定と全件エクスポート | 非同期 store action から全件取得してエクスポート |
| `src/js/components/SettingPage.vue` | `importNoteEntry` | 生のノート文字列を直接保存 | async にして値を正規化後に store action へ委譲 |
| `src/js/components/SettingPage.vue` | `importLocalStorage` | `noteKeyList` を同期取得し、同期的に各キーを処理 | 非同期に既存一覧を取得し、各保存完了を await |
| `src/js/components/App.vue` | `mounted` / `beforeUnmount` / `handleStorageEvent` | `window` の `storage` イベントを購読 | `chrome.storage.onChanged` を購読・解除し、変更 area を判定 |
| `src/js/utils/exportData.ts` | `createExportData` | `Storage` を `JSON.stringify` | `Record<string, unknown>` を受けて JSON ファイルを作成 |

`src/assets/manifest.json` はすでに `"storage"` 権限を持つ。実装フェーズではこれを維持する。

### 2.2 非同期化が必要な呼び出し元

Chrome Storage を mutation や getter から呼ばない。Vuex の mutation は同期的な state 更新だけとし、以下の action またはコンポーネントメソッドを `async` 化して storage 操作を await する。

- 起動経路: `src/js/main.ts` の `store.dispatch('init')` と、これに対応する `init` / `openFirst` / 設定・ノート一覧読込処理。
- ノート操作: `saveProject`、`loadProject`、`newProject`、`duplicateCurrentProject`、`deleteProject`、`update`、`updateTitle`。
- ノート一覧操作: `loadNoteKeyList`、`replaceNoteKeyList`、`saveNoteKeyList`、`deleteNoteKeyList`。
- 設定操作: `setConfig`、初期設定の作成・読込。`App.vue`、`Contents.vue`、`MainContents.vue`、`SettingPage.vue` の `setConfig` dispatch は Promise を返す前提にする。
- import/export: `exportLocalStorageFromSidebar`、`exportLocalStorage`、`importNoteEntry`、`processImportKey`、`importLocalStorage`。
- 変更通知: `App.vue` の変更ハンドラ。通知後の `loadNoteKeyList`、`loadProject`、`duplicateCurrentProject` も await 可能にする。

直接 `commit('loadProject')` / `commit('deleteProject')` を行う `MainContents.vue` の呼び出しは、実装時に対応する action dispatch へ置換する。

---

## 3. データ移行（マイグレーション）方針

### 3.1 実行契機と対象

- アプリ起動 action の最初に一度だけ実行し、通常のノート・設定読込より先に完了させる。
- `localStorage` に存在する全キーを取得対象とする。現行の対象は `config`、`noteKeyList`、`note_*`、`currentVersion` である。
- 移行済みフラグは `chrome.storage.local` の専用キー（例: `storageMigrationV1_3_17Completed`）に保存する。ユーザーデータのキー空間と衝突しない専用名称を使用する。

### 3.2 値の変換規則

| 旧キー | 旧値 | 新値 |
| --- | --- | --- |
| `config` | JSON 文字列 | 設定オブジェクト |
| `noteKeyList` | JSON 文字列 | `string[]` |
| `note_*` | FileContainer の JSON 文字列 | プロジェクトオブジェクト |
| `currentVersion` | 文字列 | 文字列 |
| その他 | 文字列 | 文字列 |

JSON として不正な `config`、`noteKeyList`、`note_*` は変換不能として扱い、旧値を削除しない。移行結果にはキーごとの失敗理由を残し、ユーザーがデータを失わない状態を優先する。

### 3.3 安全な移行手順

1. 移行済みフラグが存在する場合は、旧データに触れずに終了する。
2. `localStorage` のキーと値をメモリへ完全にスナップショットする。空の場合は移行済みフラグを保存して終了する。
3. 各値を上記規則で変換し、変換不能キーがあればエラー結果を返して終了する。この時点では旧データを削除しない。
4. 変換済みの全データを一括で `chrome.storage.local.set()` する。
5. `chrome.storage.local.get()` で書込値を再取得し、キー集合と各値の深い等価性を検証する。検証失敗時は旧データを削除せず、移行済みフラグも保存しない。
6. 検証成功後に限り、スナップショットに含まれた旧キーを個別に `localStorage.removeItem()` する。`clear()` は、移行開始後に別処理が書いた無関係キーを削除し得るため使用しない。
7. 全削除が成功した後に移行済みフラグを保存する。削除中に例外が起きた場合、フラグを保存せず、次回起動で同値書込・再検証を安全に再試行する。

Chrome Storage と Web Storage をまたぐ原子的トランザクションは作れない。そのため「Chrome Storage への書込と検証が成功するまで旧データを一切消さない」ことをデータ消失防止の不変条件とする。既に同一キーが Chrome Storage にあり値が異なる場合は上書きせず、旧キーも削除せず、競合として移行を停止する。

---

## 4. 実装方針

### 4.1 ストレージラッパー

`src/js/storage/ChromeLocalStorage.ts`（最終配置は既存の依存ルールに従い確定）に、Chrome API の非同期性・`chrome.runtime.lastError`・テストモックを閉じ込めるラッパーを追加する。

```ts
export type StorageRecord = Record<string, unknown>
export type StorageChange = {
  key: string
  oldValue: unknown
  newValue: unknown
}

export interface ChromeLocalStorage {
  get<T>(key: string): Promise<T | undefined>
  getMany<T extends StorageRecord>(keys?: string[]): Promise<Partial<T>>
  getAll(): Promise<StorageRecord>
  set(items: StorageRecord): Promise<void>
  remove(keys: string | string[]): Promise<void>
  onChanged(listener: (changes: StorageChange[]) => void): () => void
}
```

- ラッパーは callback 形式と Promise 形式の API 差異を吸収し、`chrome.runtime.lastError` を `Error` として reject する。
- `chrome.storage.local` が存在しない実行環境では明示的に失敗させる。通常動作で `localStorage` へフォールバックしない。
- `onChanged` は `areaName === 'local'` の変更だけを変換して通知し、返却関数でリスナーを確実に解除する。
- 移行処理は同ラッパーと `window.localStorage` のみを受け取る関数として分離し、単体テスト可能にする。

### 4.2 Vuex の責務分離

- state の初期値は I/O を含まない既定設定・空のノート一覧とする。
- mutation は `FileContainer`、`currentFile`、`noteKeyList`、`config`、ノートキャッシュの同期更新だけを担当する。
- action は「読み込み -> 検証/正規化 -> mutation -> 保存」の順に実行し、すべて `Promise` を返す。
- `refreshFileList` getter はストレージを読まず、action が更新するノートキャッシュから一覧を生成する。これにより getter の再評価時に非同期 I/O や古いデータ読込が発生しない。
- 起動 action は `migrateLegacyStorage()` を await してから `config` と `noteKeyList`、必要なノートを読み、最後に最初のノートを開く。画面マウント後に未初期化 state を利用しないよう、`main.ts` では起動 Promise を扱う。

### 4.3 JSON.stringify / JSON.parse の除去方針

- `chrome.storage.local.set({ config })`、`set({ noteKeyList })`、`set({ [noteName]: project })` のように、配列・設定・プロジェクトをオブジェクトのまま保存する。
- 既存の `FileContainer.getContainerJson()` は JSON 文字列を返すため、保存 action の境界で一度だけ解析・検証し、保存値をプロジェクトオブジェクトにする。
- 読込時はプロジェクトオブジェクトを検証後に `FileContainer.setContainer()` へ渡す。既存 API が文字列しか受けない場合のみ、UI/state 境界で `JSON.stringify` する。
- `parseJsonSafely` は旧 `localStorage` 移行と旧バックアップファイルの読込互換に限定して残す。通常の Chrome Storage 読み書きには使用しない。
- export は `getAll()` の戻り値を `createExportData(records, now)` に渡す。JSON ファイル化に必要な最終段の `JSON.stringify` は維持する。
- import は文字列値の旧バックアップとオブジェクト値の新バックアップの両方を受け入れ、保存前に正規化する。

### 4.4 Manifest 権限

- `src/assets/manifest.json` の既存 `