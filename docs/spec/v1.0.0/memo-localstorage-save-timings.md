# メモデータ localStorage 保存タイミング整理

## 概要
本ドキュメントは、メモデータ（`note_<id>` キーに保存される FileContainer JSON）が `localStorage` に書き込まれるタイミングを実装ベースで整理したもの。

## 対象データ
- 対象キー: `note_<id>`
- 保存値: `FileContainer#getContainerJson()` の JSON 文字列

`noteKeyList` や `config` への保存は補助情報であり、本書では「メモ本体」の保存タイミングに限定する。

## 保存タイミング一覧

### 1. 本文編集時（自動保存）
- 起点: Monaco エディタで本文を変更
- 呼び出しチェーン:
  - `Monaco.vue` `handleChange`
  - `SplitpanesWrapper.vue` `onChange`
  - `store action` `update`
  - `store mutation` `updateContent`
  - `dispatch('saveProject')`
  - `store mutation` `saveProject` -> `localStorage.setItem(noteName, ...)`
- 備考: 値が実際に変化した場合のみ `updateContent` から保存が発火する。

### 2. タイトル編集時（自動保存）
- 起点: タイトル入力欄 (`Contents.vue`) で `@input`
- 呼び出しチェーン:
  - `Contents.vue` `updateTitle`
  - `store mutation` `updateTitle`
  - `dispatch('saveProject')`
  - `store mutation` `saveProject` -> `localStorage.setItem(noteName, ...)`
- 備考: タイトル値が変化した場合のみ保存が発火する。

### 3. 手動保存時（Ctrl+S など）
- 起点: `App.vue` の保存ハンドラ `saveProject`
- 呼び出しチェーン:
  - `App.vue` `this.$store.dispatch('saveProject')`
  - `store action` `saveProject`
  - `store mutation` `saveProject` -> `localStorage.setItem(noteName, ...)`
- 備考: 編集有無に関係なく現在の `fileContainer` 状態を保存する。

### 4. 新規メモ作成時
- 起点: `store mutation` `newProject`
- 呼び出しチェーン:
  - 新規 `FileContainer` 初期化
  - `dispatch('saveProject')`
  - `store mutation` `saveProject` -> `localStorage.setItem(noteName, ...)`
- 備考: 初期本文（日時文字列入り）を含む新規メモが即時保存される。

### 5. 競合回避コピー作成時（他タブ更新検知時など）
- 起点: `store mutation` `duplicateCurrentProject`
- 呼び出しチェーン:
  - 現在プロジェクトを複製して新しい `note_<id>` を採番
  - `localStorage.setItem(newNoteName, duplicatedContainerJson)`
- 備考: この経路は `saveProject` を経由せず、ミューテーション内で直接保存する。

### 6. インポート時
- 起点: `store mutation` `importProject`
- 呼び出しチェーン:
  - インポート内容を `FileContainer` として構築
  - `localStorage.setItem(projectName, containerJson)`
- 備考: 既存形式 (`files` あり/なし) の分岐後、どちらも最終的に `setItem` で保存する。

## 参考実装
- `src/js/store/index.ts`
  - `updateContent`
  - `updateTitle`
  - `saveProject`
  - `newProject`
  - `duplicateCurrentProject`
  - `importProject`
- `src/js/components/Monaco.vue`
- `src/js/components/SplitpanesWrapper.vue`
- `src/js/components/Contents.vue`
- `src/js/components/App.vue`

## 補足
- `loadProject` は読み込み専用であり、保存は行わない。
- `deleteProject` は主に `noteKeyList` 更新を行い、メモ本体 (`note_<id>`) の `setItem` は行わない。