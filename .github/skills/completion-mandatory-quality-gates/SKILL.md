---
name: completion-mandatory-quality-gates
description: 作業完了時に必ず品質ゲートを全通過させるためのSkill。ビルド・依存関係チェック・テスト・Lintを例外なく実行し、設定変更や除外を禁止する。
---

# 作業完了時の強制品質ゲート Skill

本Skillは、作業完了タイミングで必ず以下の品質ゲートを**設定変更・除外なし**で実行し、全て成功させることをエージェントに強制します。いずれかをスキップ・省略・設定変更することを禁止します。

## 必須実行コマンド（順不同可、全て成功が条件）
- `npm run build`
- `npm run type-check`
- `npm run depcruise`
- `npm run cpd`
- `npm run test:ci`
- `npm run lint`
- `npm run docs`

## 運用ルール
- 各ゲートの設定を変更してはならない（閾値・対象・オプションの調整禁止）。
- いかなる理由でも実行対象からの除外・スキップを禁止する。
- 期限付き・一時的・例外承認付きであっても品質ゲートの例外運用を禁止する。
- 実行結果は成功が確認できるまで対応を継続し、失敗時は設定を変えずに修正して再実行する。
- 作業完了の宣言は、上記7コマンドが全て成功した後のみ行うこと。

## ⛔ Lint 抑制・設定改変の完全禁止

ESLint エラーは**必ずソースコードを修正**して解消すること。以下の回避手段はいかなる理由でも禁止する。設定変更による回避は「作業完了」と見なさない。

- `// eslint-disable-next-line`、`/* eslint-disable */`、ファイル先頭 `eslint-disable` コメントの追加・流用禁止
- `eslint.config.js` のルール削除・閾値引き上げ・severity を `error` → `warn` / `off` へ変更禁止
- `eslint.config.js` の `ignores` パターンや `.eslintignore` へのファイル・ディレクトリ追加禁止
- `@ts-ignore` / `@ts-expect-error` による TypeScript エラー隠蔽禁止

| エラー種別 | 根本対処 |
|---|---|
| Cognitive Complexity 超過 | 関数・メソッドを分割しロジックを単純化する |
| JSDoc 未記載 | 全 public API に JSDoc を追記する |
| 未使用変数 | 変数を削除するか設計を見直す |
| 型エラー | 正しい型定義を追加・修正する |

---

## ルール概要 — Checklist

* Unit テストカバレッジ ≥ 50%
* TypeScript 型エラーなし（`tsc --noEmit`）
* ESLint エラーなし（complexity ルール含む）
* jscpd による重複コード検出なし（min-lines 5 / min-tokens 50 / threshold 0）
* typedoc で Markdown ドキュメント生成
* CI で全ての品質ゲートを通過
* 依存関係ルール違反なし
* TypeScript のみ利用
* 外部I/O はラッパー経由
* `docs/spec/vx.y.z/` に仕様または監査結果があり、受け入れ条件と設計判断が含まれる

---

## 活用例

### 新機能生成時
* このスキルを読み込ませ、コード生成に従わせる
* テスト・lint・coverage を常に同一基準で生成

### 既存コード修正時
* ESLint / type errors を修正
* テストが不足している場合は追加する

### PR 修正提案時
* ガイドライン違反を検知し改善案を提示する

## 1. 品質担保のための必須ツール

### 1.1 単体テスト
- Jest + ts-jest を採用する。
- テスト対象は unit テストが主、E2E は補助。
- カバレッジ 50%以上を必須。`npm run test:ci` で `jest --coverage` と coverageThreshold を用いて 50% 未満は失敗させる。
- Jest 設定は用途別に分割してよい。

### 1.2 ドキュメント生成
- typedoc + typedoc-plugin-markdown を使用。
- 出力形式: Markdown、出力先: `docs/typedoc-md/`。
- 対象: `src/` 配下の public API のみ。

### 1.3 静的解析
- ESLint（flat-config、TypeScript/jsdoc/sonarjs の最小構成）。
- dependency-cruiser（レイヤー間の不正依存を検知し CI で失敗）。
- フレームワーク利用時は parser / plugin の override を追加する（例: Vue なら `vue-eslint-parser` と `eslint-plugin-vue`）。

## 2. 実装ルール（品質担保ポリシー）

### 2.1 DI（Dependency Injection）
- DI コンテナやフレームワークは使用しない。
- 依存の差し替えは Jest のモック機能で行う。
- 例外: ファイル I/O、外部サービスは明示的なラッパー層を作成する。

### 2.2 外部依存の扱い
- 外部アクセスは必ずラッパー経由。
- ラッパー要件: 単一責務、シングルトン、テスト時にモック可能。
- DI は避けるが、ラッパーの差し替えは許容（DI コンテナ不使用の意味での DI 回避）。

### 2.3 クラス設計とインスタンス管理
- SRP（単一責務）を最優先。
- 共通基底クラスの乱用禁止。
- 明確な共有状態が必要な場合のみ Singleton を使用可。Singleton は状態が限定的でテストで差し替え可能であること。

### 2.4 設計原則
- SRP と DIP を常に満たす構成にする。
- フォルダ構成で責務境界を明確にする。

### 2.5 コードライフサイクル方針
- フェールバック・後方互換・マイグレーションは考慮しない。
- 不要コードはコメントアウトせず完全削除。

### 2.6 言語・ビルド制約
- TypeScript のみ使用。
- package.jsonでは`"type": "commonjs"`を明示的に指定する。
- 設定ファイルは`.js`形式のみ使用（`.cjs`形式は禁止）。
- `npm run test` と `npm run build` を必ず成功させる。

## 3. 成果物として必須なもの
- 単体テスト（Jest + ts-jest、カバレッジ ≥ 50%）。
- 静的解析（ESLint、dependency-cruiser）。
- API ドキュメント（typedoc → Markdown 出力）。
- バージョン付き仕様書または監査記録（`docs/spec/vx.y.z/`）。

## 4. プロジェクト構成（期待形）

```
プロジェクト/
├─ docs/
│  └─ typedoc-md/
│  └─ spec/vx.y.z/
├─ src/
├─ test/
│  ├─ unit/
│  └─ e2e/
├─ .dependency-cruiser.js
├─ eslint.config.js
├─ jest.unit.config.js
├─ jest.spec.config.js
├─ jest.coverage.config.js
├─ jest.e2e.config.js
└─ typedoc.js
```

## 5. テストカバレッジ & CI ゲート
- `npm run test:ci`（jest --coverage、50% 未満で失敗）。
- `npm run type-check`（tsc --noEmit、型エラーで失敗）。
- `npm run lint`（ESLint エラーで失敗）。
- `npm run depcruise`（dependency-cruiser 依存違反で失敗）。
- `npm run cpd`（jscpd 重複検出で失敗、min-lines 5 / min-tokens 50 / threshold 0）。
- `npm run docs`（typedoc Markdown 生成失敗で失敗）。
- `npm run depcruise` に `|| exit 0` などの失敗回避を含めない。
- `npm run cpd` に失敗回避オプションを含めない。

## 6. ESLint ルール（必須要件）

### 方針
- 可読性・保守性を重視。
- 複雑度を機械的に制限。
- ドキュメント未記載をエラー扱い。
- 文字列・関数の重複をエラー扱い。

### 必須ルール
- Cognitive Complexity ≤ 10。
- 重複文字列リテラル: `sonarjs/no-duplicate-string`（threshold: 3）。
- 同一実装関数: `sonarjs/no-identical-functions`。
- JSDoc 必須（param / returns 必須）。
- フレームワーク利用時は parser / plugin の override を追加する。

```js
// eslint.config.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:sonarjs/recommended',
    'plugin:jsdoc/recommended'
  ],
  plugins: ['sonarjs', 'jsdoc'],
  rules: {
    'sonarjs/cognitive-complexity': ['error', 10],
    'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
    'sonarjs/no-identical-functions': 'error',
    'no-unused-vars': ['warn'],

    'jsdoc/require-jsdoc': [
      'error',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true
        }
      }
    ],
    'jsdoc/require-param': 'error',
    'jsdoc/require-returns': 'error'
  }
};
```

### ⛔ Lint 抑制・設定改変の完全禁止

ESLint エラーは**必ずソースコードを修正**して解消すること。以下の回避手段はいかなる理由でも禁止する。設定変更による回避は「作業完了」と見なさない。

- `// eslint-disable-next-line`、`/* eslint-disable */`、ファイル先頭 `eslint-disable` コメントの追加・流用禁止
- `eslint.config.js` のルール削除・閾値引き上げ・severity を `error` → `warn` / `off` へ変更禁止
- `eslint.config.js` の `ignores` パターンや `.eslintignore` へのファイル・ディレクトリ追加禁止
- `@ts-ignore` / `@ts-expect-error` による TypeScript エラー隠蔽禁止

| エラー種別 | 根本対処 |
|---|---|
| Cognitive Complexity 超過 | 関数・メソッドを分割しロジックを単純化する |
| JSDoc 未記載 | 全 public API に JSDoc を追記する |
| 未使用変数 | 変数を削除するか設計を見直す |
| 型エラー | 正しい型定義を追加・修正する |

## 7. typedoc / JSDoc ルール

### 基本方針
- すべて日本語で記載。
- public / internal を問わず全 function / method / class / interface に必須。

### 必須記載項目
1. 処理名（短いタイトル）
2. 処理概要（何をするか）
3. 実装理由（なぜ必要か・設計判断）

```ts
/**
 * 処理名: タスク保存
 *
 * 処理概要:
 * WebView から受け取ったタスク差分を永続化する
 *
 * 実装理由:
 * ユーザーの編集内容をワークスペースに保存し、
 * 再起動後に状態を復元する必要があるため
 */
function saveTasks(...) {}
```

## 8. dependency-cruiser ルール

### 目的
- レイヤー間の不適切依存を防止する。

### 例
- 依存は interface / contract 経由のみ許可。
- 設定ファイル: `.dependency-cruiser.js`。
- 違反時は CI 失敗。
- 失敗回避のための `|| exit 0` や対象除外の追加は禁止。

## 9. テスト & 受け入れ基準

### テスト要件

* Unit Test
  * Jest
  * 外部通信・I/O はすべてモック
* E2E Test
  * docker-compose で起動
  * Playwright を使用

### 機能受け入れ条件（例）

* 入力受入: 100 行の断片データをインポートし、UI で編集可能。
* 重複検出: サンプルデータで 80%以上の論理的重複を検出。
* 分解提案: 10 件中 7 件以上で適切な分割候補を提示。
* 状態抽出: 「ユーザー登録」マトリクスから主要状態遷移を自動生成。
* コラボレーション: 複数ユーザーの同時編集を競合なくマージ可能。

### 最終ゲート

* `npm run test:ci` 成功
* `npm run type-check` 型エラーなし
* `npm run lint` エラーなし
* `npm run depcruise` 違反なし
* `npm run cpd` 重複検出なし
* `npm run build` 成功
* `npm run docs` 成功
* `docs/spec/vx.y.z/` に仕様または監査記録があり、受け入れ条件と設計判断が記載されていること