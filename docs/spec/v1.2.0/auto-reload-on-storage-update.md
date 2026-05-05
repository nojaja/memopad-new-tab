# 他タブによるノート更新時の自動リロード機能設計

## 概要
複数タブで同じノートを表示・編集している際、他タブでノートが更新された場合に、現在のタブで自動的にリロード（再取得・再描画）を行う機能を追加する。

## 目的
- データのデグレや競合を防止し、常に最新のノート内容を表示する
- ユーザー体験の向上

## 対象バージョン
- v1.2.0

## 対象画面・コンポーネント
- ノート表示・編集画面（Monacoエディタ等）

## 仕様
### 1. 監視方法
`window.addEventListener('storage', ...)` を利用し、`localStorage`の該当キー（例: `note_12345`）の変更を監視する
- 変更イベント発生時、他タブでの更新であれば自動的にノート内容を再取得し、エディタに反映する
### 2. 反映方法
- 変更検知時、現在編集中でなければ即時リロード。
- 編集中の場合は、別noteとしてコピーを作成し、編集を続行する。
  - コピーの`files/"index.md"`や`description`は、元の`files/"index.md"`や`description`の名称に「 copy」を付与したものとする。
  - コピー作成後、ユーザーはそのまま新しいノートで編集を継続できる。
- 競合時のマージは本仕様では行わず、リロードまたはコピー作成とする。

### 3. 対象データ
- ノート本文（Markdown）
- タイトルやdescriptionなどのメタ情報（コピー時は名称に「 copy」を付与）
- `note_<id>` に格納される FileContainer JSON 全体

### 4. イベント発火例
- 他タブでノート保存時、`localStorage.setItem('note_12345', <新内容>)` を実行
- これにより全タブで`storage`イベントが発火

### 5. 例外・考慮事項
- 同一タブ内での変更は`storage`イベントが発火しないため、自己発火は考慮不要
- `note_*` の保存形式は下位互換のため変更不可。既存の `FileContainer` JSON 構造を利用し、保存ロジックをそのまま再利用する。
- フェールバックや複雑なマイグレーション処理は追加せず、既存形式が正しく読み込める前提で処理を簡潔に保つ。
- 競合時のマージは本仕様では行わず、単純な上書き・リロードとする

## 実装方針
- 既存のノート保存・取得処理に`localStorage`連携を追加
- `storage`イベントリスナーをグローバルで設置
- 変更検知時のリロード処理を共通化
- `note_*` のデータ構造は下位互換のため変更不可とし、既存の `saveProject` / `loadProject` フローを再利用する
- フェールバック処理は極力追加せず、既存形式が読み込める前提で実装を簡潔に保つ

## 現状調査と実装箇所
- `src/js/main.ts`
  - アプリ起動直後に `store.dispatch('init')` を呼び出している。
  - ここではなく、`src/js/components/App.vue` に `storage` イベントリスナーを設置するのが自然。
- `src/js/components/App.vue`
  - 既にグローバルな `window` イベントリスナーを管理している。
  - ここで `window.addEventListener('storage', ...)` / `removeEventListener('storage', ...)` を追加し、他タブ更新を検知する。
- `src/js/store/index.ts`
  - 現在の `saveProject` は `state.fileContainer` を `localStorage` の `note_<id>` に保存する。
  - `loadProject` は `localStorage.getItem(noteName)` から読み込み、`state.fileContainer` と `state.currentFile` を更新する。
  - この既存フローをそのまま「即時リロード」に利用できる。
  - さらに、現行の `newProject` / `saveNoteKeyList` と同様の仕組みで、コピー作成用の `duplicateCurrentProject` あるいは `duplicateProjectOnConflict` を追加する。
- `src/js/components/Contents.vue`
  - タイトル編集と本文編集は既にストアの `updateTitle` / `update` を通じて即時保存される。
  - そのため、storage イベント検知後の再読み込み・コピー作成はストア側で完結させ、Contents 側の修正は最小限とする。
- `src/js/components/NoteList.vue`
  - ノート一覧表示は `noteKeyList` と `refreshFileList` を使っている。
  - コピー作成後に `noteKeyList` が更新されれば、新しい note が一覧に自動追加される。

### 実装ポイント
1. `App.vue` で `storage` イベントを監視
   - 変更対象は `event.key` が `note_*` か `noteKeyList` か
   - `noteKeyList` 変更時は一覧の再取得を促す
   - `note_*` 変更時は現在開いている note の `projectName` と比較し、対象なら reload/copy 処理を実行
2. `store/index.ts` に再読み込み/コピー用の mutation/action を追加
   - `loadProject` を使って current note を再読み込み
   - `duplicateCurrentProject` では現在の `fileContainer` を複製し、新規 `note_<id>` を生成、`index.md` の description に ` copy` を付与して保存
3. 監視対象は `files/"index.md"` ではなく、`localStorage` 上の `note_<id>` キーである点に注意
   - 既存の `note_<id>` JSON 内に `files` と `description` が含まれる構造を利用する

## テスト観点
- 複数タブで同一ノートを開き、一方で編集・保存→他方で自動リロードされること
- 編集中のタブで他タブ更新を検知した際、別 note コピーが作成され、元の編集を継続できること
- 競合時のコピー作成と一覧更新の動作確認

## 今後の拡張案
- 競合時のマージUI
- 編集中の自動保存・差分検知
- WebSocket等によるリアルタイム同期
