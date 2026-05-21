# Settings 画面説明文の i18n 対応仕様書

## ドキュメント情報
- バージョン: 1.3.12
- 更新日: 2026-05-22
- ステータス: 設計書
- 分類: i18n / UI改善
- 関連Issue: #93 Settingsのi18n対応

---

## 1. 概要

### 1.1 背景・課題
`SettingPage.vue` には、各設定項目の説明文や見出しが英語の固定文字列で直書きされている。

そのため、`general.i18n_locale` を `ja` に変更しても Settings 画面の説明は英語のまま表示され、言語設定との一貫性がない。

Issue #93 では、Settings 画面の説明を多言語対応し、言語データを `src/js/lang/messages.json` に集約することが求められている。

### 1.2 目的
- Settings 画面の説明文を言語切替に追従させる。
- 文言の管理先を `src/js/lang/messages.json` へ統一する。
- まず `en` と `ja` の 2 言語で同等の情報量を提供する。

### 1.3 スコープ
- `SettingPage.vue` の固定文字列のうち、説明文・見出し・ボタンラベルを i18n キー参照へ置換する。
- `src/js/lang/messages.json` の `en` / `ja` に `SettingPage` 用文言を拡張する。
- 既存言語切替 UI（Language セレクト）と連動した表示切替を成立させる。

非スコープ:
- `en` / `ja` 以外の翻訳追加。
- 設定項目の仕様変更、設定値・データ構造変更。
- 言語切替導線そのものの UI 改修。

---

## 2. ユースケース

### 2.1 言語が英語の場合
1. ユーザーが Language で `en` を選択する。
2. Settings 画面の見出しと説明文が英語で表示される。

### 2.2 言語が日本語の場合
1. ユーザーが Language で `ja` を選択する。
2. Settings 画面の見出しと説明文が日本語で表示される。

### 2.3 画面遷移なしでの反映
1. Settings 画面を開いたまま言語を切り替える。
2. 再読込なしで表示文言が切り替わる。

---

## 3. 機能要件

### 3.1 文言外部化要件
- `SettingPage.vue` の固定文言は i18n キー参照（`$t(...)`）で取得する。
- 文言キーは `SettingPage` 名前空間で管理する。
- ハードコード文字列を新規に追加しない。

### 3.2 翻訳データ要件
- `src/js/lang/messages.json` の `en.message.SettingPage` と `ja.message.SettingPage` に対応キーを定義する。
- `en` と `ja` は同一キーセットを持つ。
- 欠落キーがある場合は CI で検知できる形（ユニットテスト）にする。

### 3.3 対象文言要件
最低限、以下のカテゴリを i18n 化対象とする。
- ページタイトル: `Settings`, `General`, `Editor`, `markdown Settings` など
- セクション見出し: `Sort`, `Language`, `Privacy Blur`, `Import Data`, `Export Data`, `Extensions`, `multibyte` など
- 説明ラベル: 各チェックボックス横の説明文
- 操作ラベル: `Import Data`, `Export Data`, `+ Add Record`, `Enable convert` など
- 一覧項目名: タブ見出し（General / Editor / Markdown）と sort 選択肢

### 3.4 表示更新要件
- `general.i18n_locale` 更新時、Settings 表示文言は即時に切り替わる。
- 文言切替は既存の設定保存フロー（store dispatch）と競合しない。

### 3.5 互換要件
- 既存の設定読み書き（`config.general`, `config.editor`, `config.markdown`）へ影響を与えない。
- 既存の multibyte 変換設定編集 UI の挙動を変えない。

---

## 4. 非機能要件

### 4.1 パフォーマンス
- i18n 化による描画遅延を体感で悪化させない。
- 言語切替時に不要な再レンダリングを増やさない。

### 4.2 保守性
- 文言キー命名を `SettingPage.<category>.<name>` 等に統一し、意味が推測できる構造にする。
- 同一文言の重複定義を避ける。

### 4.3 可読性
- 設定説明文は英日ともに同等の意味を維持する。
- 英語側 typo（例: `Aesc Created`）は翻訳定義時に修正する。

---

## 5. インターフェース定義

### 5.1 翻訳キー構造（例）
```json
{
  "en": {
    "message": {
      "SettingPage": {
        "title": "Settings",
        "tab": {
          "general": "General",
          "editor": "Editor",
          "markdown": "Markdown"
        },
        "section": {
          "privacyBlur": "Privacy Blur"
        },
        "description": {
          "privacyBlur": "Privacy Blur - Set ON to blur the screen when the window is inactive."
        }
      }
    }
  }
}
```

注記:
- 実装時の最終キー名は既存命名との整合を優先して確定する。
- 必須条件は「`SettingPage` 配下に必要文言が集約されること」。

### 5.2 コンポーネント参照契約
- `SettingPage.vue` は表示文言を `$t('SettingPage....')` で参照する。
- sort セレクト・タブ項目の `name` も翻訳結果で構築する。

---

## 6. 影響範囲

### 6.1 主な変更対象
- `src/js/components/SettingPage.vue`
- `src/js/lang/messages.json`

### 6.2 テスト変更対象（想定）
- `tests/unit/SettingPageSort.test.js`
- `tests/unit` 配下の i18n 表示検証テスト（既存追記または新規）

---

## 7. 互換性と移行計画

### 7.1 互換性
- 既存設定値のマイグレーションは不要。
- locale が `en` / `ja` の場合に機能差を作らない。

### 7.2 移行
- 新規インストール: `messages.json` に追加した `SettingPage` 翻訳をそのまま利用する。
- 既存ユーザー: 保存済み `i18n_locale` を維持したまま表示文言のみ切り替わる。

---

## 8. 受け入れ条件

- [ ] Settings 画面内の対象説明文が固定文字列ではなく i18n 参照になっている。
- [ ] `src/js/lang/messages.json` に `en` / `ja` の `SettingPage` 文言が追加されている。
- [ ] `en` 選択時、対象文言が英語で表示される。
- [ ] `ja` 選択時、対象文言が日本語で表示される。
- [ ] 画面再読込なしで言語切替が反映される。
- [ ] 設定値の保存・復元（sort、privacyBlur、editor、markdown）が既存どおり動作する。
- [ ] multibyte 変換リスト編集（追加・削除・並び替え）に退行がない。

---

## 9. テストケース要約

### 9.1 Unit
- `en` / `ja` それぞれで主要見出しが期待文言になることを検証する。
- 説明ラベル（Privacy Blur、Minimap、Scroll Sync 等）が locale ごとに切り替わることを検証する。
- sort セレクト項目が locale ごとに切り替わることを検証する。
- `messages.json` の `SettingPage` キーセットが `en` / `ja` で一致することを検証する。

### 9.2 回帰
- 設定変更時の store 反映が従来どおりであること。
- import/export ボタン操作に退行がないこと。
- markdown オプション、multibyte 設定編集に退行がないこと。

---

## 10. ロールアウト/リリース計画

### 10.1 リリース方針
- v1.3.12 の patch リリースとして提供する。
- フィーチャーフラグは使用しない。

### 10.2 検証手順
1. Unit テスト追加・更新（Red/Green）。
2. `en` / `ja` の手動表示確認。
3. 既存設定保存と主要操作の回帰確認。

### 10.3 ロールバック
- 問題発生時は本変更を revert し、v1.3.11 の文言表示へ戻す。

---

## 11. 設計判断メモ

- Issue #93 の要件に合わせ、翻訳データは `src/js/lang/messages.json` を単一ソースとする。
- 対応言語はまず `en` / `ja` に限定し、キー構造は将来言語追加を前提に階層化する。
- UI 機能追加ではなく文言外部化を主目的とし、設定データ構造や保存処理には手を入れない。