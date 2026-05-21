# ビューモード選択状態の可視化仕様書

## ドキュメント情報
- **バージョン**: 1.3.9
- **更新日**: 2026-05-22
- **ステータス**: 設計書
- **分類**: UI改善
- **関連Issue**: #89 どのモードか変わらない

---

## 1. 概要

### 1.1 背景・課題
`contents` フッターには以下 3 つの表示モード切替ボタンがある。
- show editor pane (F8)
- show editor and preview panes (F9)
- show preview pane (F10)

現状は、どのモードが選択中かを視覚的に判別しづらく、新規利用者が現在状態を把握しにくい。

### 1.2 要件
選択中モードのボタン色を `rgb(30, 135, 240)` に変更し、現在の表示モードを明確に示す。

追加要件として、表示モードの初期値と永続化を次のように定義する。
- LocalStorage の `config.general.viewMode` が未設定: `show editor and preview panes(F9)` で初期表示
- LocalStorage の `config.general.viewMode` が設定済み: 保存済みモードで初期表示
- F8/F9/F10 でモード切替: `config.general.viewMode` を更新して保存

### 1.3 追加要件（確定仕様）

本バージョンで確定した追加要件を、実装・テスト観点で再定義する。

| 条件 | 期待動作 |
|---|---|
| LocalStorage の `config.general.viewMode` が存在しない | 初期表示は `show editor and preview panes(F9)`（`both`） |
| LocalStorage の `config.general.viewMode` が存在する | 初期表示は保存値（`editor` / `both` / `preview`） |
| ユーザーが F8/F9/F10 でモード切替する | `config.general.viewMode` を最新値で上書き保存 |

補足:
- 不正値（`editor` / `both` / `preview` 以外）は `both` として扱う。
- 保存経路は `setConfig` に統一し、UI から localStorage を直接更新しない。

---

## 2. 現在の実装

### 2.1 対象コンポーネント
- `src/js/components/Contents.vue`

現在のモード切替は各ボタンの `@click` で `hideEditPane` / `hidePreviewPane` を更新している。

```vue
@click="hideEditPane = false;hidePreviewPane=true"   // F8
@click="hideEditPane = false;hidePreviewPane=false"  // F9
@click="hideEditPane = true;hidePreviewPane=false"   // F10
```

### 2.2 問題点
- 状態は内部的に切り替わっているが、選択中ボタンを示す専用スタイルがない。
- 視覚ヒントがアイコン形状だけに依存しており、状態認知に時間がかかる。

---

## 3. 実装方針

### 3.1 変更概要
1. `Contents.vue` に現在のビューモードを判定する算出プロパティを追加する。
2. 3 ボタンへ共通クラスと active クラスを付与する。
3. active クラスに `color: rgb(30, 135, 240);` を適用する。
4. F8/F9/F10 のキーボード操作でも同じ active 表示が反映されることを保証する。
5. `config.general.viewMode` を参照して初期モードを復元する。
6. モード切替時に `setConfig` 経由で `config.general.viewMode` を永続化する。

### 3.2 モード定義
`hideEditPane` / `hidePreviewPane` の組み合わせから、表示モードを次の 3 値で扱う。

| モードID | 条件 | 対応ボタン |
|---|---|---|
| `editor` | `hideEditPane === false && hidePreviewPane === true` | F8 |
| `both` | `hideEditPane === false && hidePreviewPane === false` | F9 |
| `preview` | `hideEditPane === true && hidePreviewPane === false` | F10 |

### 3.3 テンプレート反映
各ボタンに次のいずれかの方式で active クラスをバインドする。

```vue
:class="{ 'view-mode-button--active': currentViewMode === 'editor' }"
```

補足:
- `aria-label` / `title` は既存値を維持する。
- ボタンのクリック処理は単一メソッドへ集約し、同一ロジックで表示切替と保存を実施する。

### 3.4 スタイル反映
`Contents.vue` の style セクションに以下を追加する。

```css
.view-mode-button--active {
  color: rgb(30, 135, 240);
}
```

必要に応じて通常時との差分が分かるよう、非選択状態の色指定は既存デザインに合わせて最小限に調整する。

---

## 4. 影響範囲

### 4.1 変更ファイル
- `src/js/components/Contents.vue`
- `src/js/store/index.ts`

### 4.2 テスト対象
- `tests/unit/Contents.test.js`
  - 初期状態で F9 ボタンが active であること（未設定時）
  - `config.general.viewMode` が設定済みの場合に対応モードで初期表示されること
  - F9 ボタンクリックで F9 が active になること
  - F10 ボタンクリックで F10 が active になること
  - モード切替時に `setConfig` で `general.viewMode` が保存されること
- `tests/unit/storeNewInstallConfig.test.js`
  - 新規インストール時に `general.viewMode` が `both` で初期化されること
  - 既存 config の `general.viewMode` が保持されること
- `tests/unit/AppStorageSync.test.js`
  - F8/F9/F10 ホットキー起点でも active 表示が切り替わること（必要に応じて追加）

### 4.3 互換性
- 破壊的変更なし
- UI 仕様として初期モードが F8 から F9 に変更される
- モード切替時に config 保存が発生する

---

## 5. 受け入れ条件

- [ ] `config.general.viewMode` 未設定時、初期表示は F9(both) で 1 ボタンのみ active 表示される。
- [ ] `config.general.viewMode` 設定時、保存値に対応する 1 ボタンのみ active 表示される。
- [ ] F8 で editor モードに切り替えると、F8 ボタンのみ `rgb(30, 135, 240)` になる。
- [ ] F9 で both モードに切り替えると、F9 ボタンのみ `rgb(30, 135, 240)` になる。
- [ ] F10 で preview モードに切り替えると、F10 ボタンのみ `rgb(30, 135, 240)` になる。
- [ ] F8/F9/F10 の切替後、`config.general.viewMode` に選択モードが保存される。
- [ ] マウスクリック操作とキーボード操作のいずれでも表示が一致する。
- [ ] 既存のノート編集、プレビュー、削除ボタン動作に退行がない。

---

## 6. 実装チェックリスト

### Phase 1: UI状態定義
- [ ] `currentViewMode` 算出プロパティを追加
- [ ] 3 ボタンに active クラスバインドを追加

### Phase 2: スタイル適用
- [ ] active クラスへ `rgb(30, 135, 240)` を適用
- [ ] 非選択状態との視認性を確認

### Phase 3: テスト
- [ ] `Contents.test.js` を更新して active 表示を検証
- [ ] 必要に応じてホットキー起点のテストを追加

### Phase 4: 検証
- [ ] Lint 合格
- [ ] ユニットテスト合格
- [ ] ビルド成功

---

## 7. リスク・制約

| リスク | 対策 |
|---|---|
| 既存ボタン色とのコントラスト不足 | 実画面で視認性確認し、必要時にフォントウェイト等を微調整 |
| active 判定ロジックの条件漏れ | 3モード全条件をユニットテストで固定化 |
| ホットキー操作時に DOM 更新が遅延する可能性 | テストで `nextTick` 後の class 反映を確認 |

---

## 8. 修正内容サマリー

| 項目 | 現在 | 修正後 |
|---|---|---|
| モード選択状態の表示 | なし | 選択中ボタンを色で表示 |
| 選択中ボタン色 | 既定色 | `rgb(30, 135, 240)` |
| 対象モード | F8/F9/F10 で切替のみ | F8/F9/F10 の状態を常時可視化 |
| バージョン | 1.3.8 | 1.3.9 |