# Editor 設定拡張 — Unicode Highlight Ambiguous Characters / Minimap

## 概要
Settings の Editor タブに以下の 2 設定項目を追加する。

| 設定名 | デフォルト | 対応 Monaco オプション |
|--------|-----------|----------------------|
| Unicode Highlight: Ambiguous Characters | OFF (false) | `unicodeHighlight.ambiguousCharacters` |
| Minimap | ON (true) | `minimap.enabled` |

---

## ユースケース / 利用シナリオ
- **Unicode Highlight**: 日本語などのマルチバイト文字を多用するメモ作成時に、曖昧文字ハイライトが煩わしい場合にOFFにしたい。
- **Minimap**: 長いメモを書く際にミニマップが不要な場合や、画面幅を節約したい場合にOFFにしたい。

---

## 機能要件
1. Settings > Editor タブにチェックボックスで両設定を表示する。
2. チェックボックス変更後、即座（リロード不要）にエディタへ反映される。
3. 設定値は localStorage に永続化される（既存の設定保存機構を利用）。
4. デフォルト値: `unicodeHighlight.ambiguousCharacters = false`、`minimap.enabled = true`。
5. 既存設定（旧バージョンの localStorage データ）には新設定が存在しないため、`normalizeConfig` でデフォルト値を補完する。

---

## 非機能要件
- パフォーマンス: 設定変更は既存の watch/dispatch 機構を経由し、追加の非同期処理を行わない。
- 後方互換: 旧 localStorage データは `normalizeConfig` のスプレッド演算子で補完されるため移行不要。

---

## API / インターフェース定義
### store の `defaultConfig.editor` への追加
```ts
editor: {
  // 既存
  automaticLayout: true,
  fontSize: 16,
  tabSize: 4,
  theme: 'vs',
  // 追加
  unicodeHighlight: { ambiguousCharacters: false },
  minimap: { enabled: true }
}
```

### SettingPage.vue の `localConfig.editor` への追加
```js
editor: {
  // 既存
  fontSize: 16,
  tabSize: 4,
  // 追加
  unicodeHighlight: { ambiguousCharacters: false },
  minimap: { enabled: true }
}
```

---

## 互換性・移行計画
- 既存データへの移行は不要。`normalizeConfig` が `...defaultConfig.editor` でデフォルト値を補完する。
- `unicodeHighlight` / `minimap` はオブジェクト型のため、`normalizeConfig` の単純スプレッドで補完される。

---

## 受け入れ条件 (Acceptance Criteria)
- [ ] Settings > Editor タブに "Unicode Highlight: Ambiguous Characters" チェックボックスが表示される。
- [ ] Settings > Editor タブに "Minimap" チェックボックスが表示される。
- [ ] チェックボックスの初期値がそれぞれ OFF (false) / ON (true) である。
- [ ] チェックボックスを変更すると即座にエディタの表示に反映される。
- [ ] 設定値が localStorage に保存され、ページ再読み込み後も維持される。

---

## テストケース要約
- `normalizeConfig` が `unicodeHighlight` / `minimap` を持たない旧設定にデフォルト値を補完する。
- `normalizeConfig` が既存の `unicodeHighlight` / `minimap` 値を上書きしない。

---

## ロールアウト計画
- パッチリリース v1.1.6 として即時リリース。ロールバックは LocalStorage の既存設定により自然に旧状態へ戻る。
