# v1.3.15 - 設定項目追加と初期値変更（Issue #102）設計書

## ドキュメント情報
- バージョン: 1.3.15
- 更新日: 2026-06-04
- ステータス: 設計書
- 分類: エディター設定拡張
- 関連Issue: #102 設定項目追加と初期値の変更

---

## 1. 概要

### 1.1 背景
Issue #102 にて、エディター設定の初期値見直しと設定項目の追加が要求されている。

要求内容は以下の通り。
- ミニマップ初期値を OFF に変更する（`editor.minimap.enabled = false`）。
- Settings -> Editor に以下 4 項目を追加または明確化する。
  - 行番号表示（`lineNumbers`）
  - スペース挿入（`insertSpaces`）
  - 行の折り返し（`wrappingColumn` と有効/無効トグル）
  - 自動閉じかっこ（`autoClosingBrackets`）

### 1.2 目的
- ユーザーが Editor 設定画面から主要な編集体験を制御できるようにする。
- 初期設定を実運用寄りに見直し、初回利用時の体験を改善する。
- 既存ユーザー設定との互換性を維持しつつ、未設定項目を安全に補完する。

### 1.3 スコープ
- `defaultConfig.editor` の初期値更新（minimap）。
- Editor 設定UIへの項目追加。
- 設定値の永続化（localStorage）および起動時の補完。
- Monaco Editor オプションへの即時反映。

### 1.4 非スコープ
- エディター以外（Preview, Markdown, File, Privacy など）の設定変更。
- 設定保存先の変更（localStorage 以外への移行）。
- Monaco 本体のバージョンアップ。

---

## 2. 仕様変更サマリ

### 2.1 初期値変更
- `editor.minimap.enabled`: `true` -> `false`

### 2.2 追加設定項目
1. 行番号表示（lineNumbers）
- UI: トグル（ON/OFF）
- ON: `lineNumbers = "on"`
- OFF: `lineNumbers = "off"`
- 初期値: ON

2. スペース挿入（insertSpaces）
- UI: トグル（ON/OFF）
- ON: `insertSpaces = true`
- OFF: `insertSpaces = false`
- 初期値: OFF

3. 行の折り返し（wrappingColumn）
- UI: 折り返しトグル + 数値入力
- 折り返しON時のみ数値入力を表示
- 数値入力仕様:
  - `0`: ビューポート幅で折り返し
  - `1` 以上: 指定カラムで折り返し
- 初期値:
  - 折り返しトグル: ON
  - `wrappingColumn`: 300

4. 自動閉じかっこ（autoClosingBrackets）
- UI: トグル（ON/OFF）
- ON: `autoClosingBrackets = "always"`（または既存実装に沿った有効値）
- OFF: `autoClosingBrackets = "never"`
- 初期値: ON

---

## 3. 機能要件

### 3.1 表示要件
- Settings -> Editor タブに 4 項目を表示する。
- 折り返しトグルが OFF のとき `wrappingColumn` 入力欄を非表示にする。
- 初期表示時は保存済み値を優先し、未保存時は defaultConfig 値を表示する。

### 3.2 永続化要件
- 設定変更時に既存設定保存機構を利用して localStorage に保存する。
- 再読み込み後も設定値が維持される。

### 3.3 反映要件
- 設定変更後、Monaco Editor へ即時反映される（リロード不要）。
- 既存の Editor オプション更新フロー（watch/store経由）を利用し、反映責務を分散しない。

### 3.4 互換性要件
- 旧バージョン設定に新規項目が存在しない場合、`normalizeConfig` 相当処理でデフォルト補完する。
- 既に保存済みの値は上書きしない。

---

## 4. データ設計

### 4.1 editor 設定モデル（追加後）
`editor` 設定の論理モデルを以下とする。

```ts
type EditorConfig = {
  minimap: { enabled: boolean }
  lineNumbers: 'on' | 'off'
  insertSpaces: boolean
  wordWrapEnabled: boolean
  wrappingColumn: number
  autoClosingBrackets: 'always' | 'never'
  // 既存項目は省略
}
```

注記:
- `wordWrapEnabled` は UI トグル用の保持値として導入し、Monaco 反映時に `wordWrap`/`wordWrapColumn` へマッピングする。
- 既存で同等フィールドがある場合は新設せず流用する。

### 4.2 defaultConfig 初期値
追加・変更される初期値は以下。

```ts
editor: {
  minimap: { enabled: false },
  lineNumbers: 'on',
  insertSpaces: false,
  wordWrapEnabled: true,
  wrappingColumn: 300,
  autoClosingBrackets: 'always'
}
```

### 4.3 Monaco 反映マッピング
- `lineNumbers`
  - `'on'` / `'off'` をそのまま適用
- `insertSpaces`
  - `true` / `false` をそのまま適用
- `wordWrapEnabled`
  - `true` -> `wordWrap = 'wordWrapColumn'`
  - `false` -> `wordWrap = 'off'`
- `wrappingColumn`
  - `wordWrapEnabled = true` 時のみ `wordWrapColumn` に適用
  - `0` はビューポート折り返しとして扱う（既存実装に合わせ `wordWrap = 'on'` 等に変換）
- `autoClosingBrackets`
  - `'always'` / `'never'` を適用

---

## 5. UI設計

### 5.1 画面項目
Editor 設定セクションに以下の順で表示する。
1. Minimap
2. Line Numbers
3. Insert Spaces
4. Word Wrap
5. Wrapping Column（Word Wrap ON のときのみ表示）
6. Auto Closing Brackets

### 5.2 入力制約
- `wrappingColumn` は整数のみ許可。
- 最小値は `0`。
- 不正入力時は保存せず、直前有効値へ戻す（または既存バリデーション仕様に従う）。

### 5.3 i18n
- 追加ラベルは `ja`/`en` 両方に文言キーを追加する。
- 既存翻訳キー命名規則に従う。

---

## 6. 影響範囲

### 6.1 主な変更対象（想定）
- 設定初期値定義（store/config）
- Settings 画面コンポーネント（Editor セクション）
- Monaco オプション適用処理
- 言語リソース（設定ラベル）
- 単体テスト（config 正規化、UI 表示、反映処理）

### 6.2 既存機能への影響
- 既存の fontSize/tabSize/theme 等の設定機能は維持する。
- localStorage 既存データを破壊しない。

---

## 7. 受け入れ条件

- [ ] 初回起動（config未保存）時、`minimap.enabled` が `false` で反映される。
- [ ] Settings -> Editor に `lineNumbers` トグルが表示される。
- [ ] `lineNumbers` OFF で Monaco の行番号表示が無効化される。
- [ ] Settings -> Editor に `insertSpaces` トグルが表示され、ON/OFFが反映される。
- [ ] Settings -> Editor に `Word Wrap` トグルが表示される。
- [ ] Word Wrap ON 時のみ `wrappingColumn` 数値入力が表示される。
- [ ] `wrappingColumn = 0` でビューポート基準の折り返しになる。
- [ ] `wrappingColumn` 初期値は 300 である。
- [ ] Settings -> Editor に `autoClosingBrackets` トグルが表示される。
- [ ] `autoClosingBrackets` の初期値は ON である。
- [ ] 変更した設定が localStorage に保存され、再読み込み後も維持される。

---

## 8. テスト計画

### 8.1 Unit
- `normalizeConfig` が旧設定に対して新規項目を補完すること。
- 既存保存値が補完処理で上書きされないこと。
- `minimap.enabled` の既定値が `false` であること。
- `wrappingColumn = 0` のマッピングが仕様どおりであること。

### 8.2 Component
- Settings 画面で各トグル・数値入力が表示されること。
- Word Wrap トグルに応じて `wrappingColumn` 入力表示が切り替わること。
- 入力操作で store/config 更新イベントが発火すること。

### 8.3 Integration
- 設定変更が Monaco 描画へ即時反映されること。
- リロード後に表示値と実際の editor オプションが一致すること。

---

## 9. リスクと対策

### 9.1 リスク
- `wordWrap` 系の Monaco オプション変換を誤ると、`wrappingColumn` が無効化される可能性。
- 既存 config 構造と新規キーの競合により保存不整合が起きる可能性。

### 9.2 対策
- マッピング関数単体テストを追加して `0` と `>0` の分岐を固定化する。
- `normalizeConfig` テストで旧データ互換を担保する。

---

## 10. ロールアウト方針

- v1.3.15 のパッチリリースとして提供する。
- 破壊的変更は含まないため段階リリースは行わない。
- 問題発生時は設定項目追加差分を revert し、v1.3.14 相当へロールバックする。
