# エディタ自動補完オンデマンド化仕様書

## ドキュメント情報
- **バージョン**: 1.3.7
- **更新日**: 2026-05-19
- **ステータス**: 設計書
- **分類**: 機能改善

---

## 1. 概要

### 1.1 背景・課題
現在のエディタ（Monaco Editor）では、Markdown編集時に以下の文字を入力するたびに補完候補が自動表示される：
- 見出し記号 (`#`)
- リスト記号 (`*`, `-`)
- コードブロック記号 (`` ` ``)
- テーブル記号 (`|`)
- リンク・画像記号 (`[`, `!`)
- PlantUML記号 (`@`, `:`)

**問題点**：これらの文字を単に入力したい場合にも補完候補がポップアップ表示され、入力の流れが中断される。
例：
- `#`で見出し作成したい → 補完候補が邪魔
- `---`で水平線を引きたい → 補完候補が邪魔

### 1.2 要件
ユーザーが明示的に**Ctrl+Space**キーを押したときのみ補完候補を表示する。

---

## 2. 現在の実装

### 2.1 補完登録コンポーネント
**ファイル**: `src/js/editorCompletions.ts`

```typescript
monaco.languages.registerCompletionItemProvider('markdown', {
  triggerCharacters: ['#', '*', '`', '[', '!', '-', '>', '|', '@', ':'],
  provideCompletionItems(model, position) {
    // 補完候補を返す
  }
})
```

**問題**：`triggerCharacters`配列に複数の文字が登録されているため、これらの文字入力時に自動的に補完が表示される。

### 2.2 エディタ設定コンポーネント
**ファイル**: `src/js/components/Monaco.vue`

現在のデフォルト設定には、自動補完関連の設定は明示的に指定されていない。

---

## 3. 実装方針

### 3.1 変更概要
1. `editorCompletions.ts`の`triggerCharacters`を空配列に変更
2. Monaco Editorの`quickSuggestions`設定を無効化
3. Ctrl+Spaceキーでのみ補完候補を表示するようにする

### 3.2 詳細設計

#### 3.2.1 editorCompletions.ts の変更
```typescript
// 現在
triggerCharacters: ['#', '*', '`', '[', '!', '-', '>', '|', '@', ':'],

// 修正後
triggerCharacters: [],  // 自動補完を無効化
```

#### 3.2.2 Monaco.vue のエディタ設定追加
`editorOptions`計算プロパティにて、明示的に自動補完を無効化する設定を追加：

```typescript
{
  automaticLayout: true,
  fontSize: 16,
  fontFamily: '',
  tabSize: 4,
  theme: 'vs',
  quickSuggestions: false,  // 自動補完を無効化
}
```

**補足**：Monaco Editorはデフォルトで自動補完が有効なため、明示的に無効化する必要がある。

#### 3.2.3 Ctrl+Space トリガー
Monaco Editorではキーバインディング設定により、Ctrl+Spaceで補完表示をトリガー可能：
- ユーザーがCtrl+Spaceを押す
- Monaco Editor内部の`trigger`機能により`provideCompletionItems`が呼ばれる
- 補完候補が表示される

**実装方法**：
- `triggerCharacters: []`に設定した場合、自動トリガーはなくなる
- Monaco Editorは標準でCtrl+Spaceキーバインディングを持つため、追加実装不要

---

## 4. 影響範囲

### 4.1 変更ファイル
- `src/js/editorCompletions.ts`
- `src/js/components/Monaco.vue`

### 4.2 テスト対象
- [tests/unit/editorCompletions.test.js](tests/unit/editorCompletions.test.js)
  - `triggerCharacters`の検証（空配列に変更）
- [tests/unit/Monaco.test.js](tests/unit/Monaco.test.js)
  - `quickSuggestions`設定の検証
- [tests/e2e/](tests/e2e/) - E2Eテスト
  - `#`入力時に補完が表示されないことを確認
  - `---`入力時に補完が表示されないことを確認
  - Ctrl+Space時に補完が表示されることを確認

### 4.3 互換性
- **破壊的変更**: なし（ユーザーにとっては改善）
- **既存機能**: 補完候補自体は削除されない（オンデマンド化のみ）

---

## 5. 実装チェックリスト

### Phase 1: コアロジック変更
- [ ] `editorCompletions.ts`の`triggerCharacters`を空配列に変更
- [ ] `Monaco.vue`の`editorOptions`に`quickSuggestions: false`を追加

### Phase 2: テスト更新
- [ ] ユニットテストの`triggerCharacters`検証を更新
- [ ] エディタ設定テストを追加
- [ ] E2Eテストで Ctrl+Space 動作確認

### Phase 3: 検証
- [ ] 手動検証（`#`, `---`入力時に補完表示なし）
- [ ] 手動検証（Ctrl+Space時に補完表示あり）
- [ ] Lint・型チェック合格
- [ ] 全テスト合格
- [ ] ビルド成功

### Phase 4: リリース
- [ ] `package.json`バージョン更新（1.3.7）
- [ ] ドキュメント更新

---

## 6. 参考資料

### 6.1 Monaco Editor API
- `registerCompletionItemProvider(language, provider)`
  - `triggerCharacters[]`: 補完をトリガーする文字リスト
  - `quickSuggestions`: 自動補完の有効/無効（boolean|object）

### 6.2 キーバインディング
- **Ctrl+Space**: Monaco Editor標準の補完トリガー（IntelliSense）
- 追加の明示的キーバインディング設定は不要

---

## 7. リスク・制約

| リスク | 対策 |
|--------|------|
| ユーザーがCtrl+Spaceを知らない | README/ヘルプにショートカットキーを記載 |
| キーボード配置による地域差 | Cmd+Space対応（Mac）も検討 |
| 補完機能が使われなくなる可能性 | アナリティクスで使用状況を追跡 |

---

## 8. 修正内容サマリー

| 項目 | 現在 | 修正後 |
|------|------|--------|
| 補完トリガー方法 | 自動（複数文字）+ Ctrl+Space | Ctrl+Spaceのみ |
| triggerCharacters | ['#', '*', `` ` ``, '[', '!', '-', '>', '\|', '@', ':'] | [] |
| quickSuggestions | デフォルト（有効） | false（無効） |
| バージョン | 1.3.6 | 1.3.7 |
