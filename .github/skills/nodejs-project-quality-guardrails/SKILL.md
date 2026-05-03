---
name: nodejs-project-quality-guardrails
description: 再利用可能なNode.js/TypeScript品質担保ガードレールを定義し、テストカバレッジ・Lint・ドキュメント・設計原則・CIゲートを網羅して、生成・修正時に一貫した高品質を維持する。
---

# Node.js/TypeScript プロジェクト 品質担保ガードレール Skill

このスキルは、Node.js（TypeScript）プロジェクトの品質担保のために
**一貫したテスト、静的解析、ドキュメント、設計ルール、CI 条件** を
AI エージェント（GitHub Copilot / Claude / OpenAI Codex）に理解させ、
**生成・修正・レビュー作業** に常に適用させることを目的とします。

## このスキルを使うべきタイミング

- 新規機能のコードを生成する際
- 既存コードをリファクタリングする際
- Unit テスト追加や修正書き換えを行う際
- CI 周りの構成や静的解析指摘を修正する際
- プロジェクト全体の品質ルールをエージェントに認識させたい場合
- 1 つのワークスペースに複数プロジェクトがある場合は、各プロジェクトごとに本スキルで示す構成（docs/typedoc-md、docs/spec/vx.y.z、src、test/unit・e2e、.dependency-cruiser.js、eslint.config.js、jest.unit.config.js、jest.e2e.config.js、typedoc.js など）を持たせ、プロジェクト単位で適用・監査すること

---

## 品質担保ルール概観

### 1. 単体テスト
- Jest + ts-jest を利用する
- カバレッジを 50%以上 にする
- テスト対象は unit テストが主、E2E は補助的に扱う
- Jest 設定は責務ごとに分割してよい（例: `jest.unit.config.js`, `jest.spec.config.js`, `jest.coverage.config.js`）
- CI では `npm run test:ci` を定義し `jest --coverage` を実行する
- coverageThreshold で 50% 未満ならエラー扱いとし必ず失敗させる

### 2. ドキュメント生成
- typedoc + typedoc-plugin-markdown を使う
- Markdown 出力先: `docs/typedoc-md/`
- public API のみ対象

### 3. 静的解析
- ESLint（flat-config）
  - TypeScript, sonarjs, jsdoc 最小構成
  - `sonarjs/no-duplicate-string`（閾値: 3回以上で違反）と `sonarjs/no-identical-functions` を有効化
- dependency-cruiser を使い依存関係ルールを強制
- `npm run depcruise` では `|| exit 0` などの失敗回避を禁止する
- jscpd によるコードブロック重複検出
  - `--min-lines 5` / `--min-tokens 50` / `--threshold 0`（1件でも失敗）

---

## 実装設計原則

### DI（Dependency Injection）
- DIコンテナは使わない
- 外部依存の差し替えは Jest のモック で対応

> ⚠ DI は避けるが、外部アクセス用ラッパーの差し替えは許容（DI コンテナを使わないという意味での「DI 回避」）

### 外部アクセス設計
- ファイルI/O や外部API は必ず ラッパー経由
- ラッパーはシングルトン & モック可能

### クラス設計とインスタンス管理
- SRP（単一責務）を最優先
- 共通基底クラスは乱用しない
- 明確な共有状態が必要な場合のみ Singleton を使用可
- Singleton は状態を限定し、テストで差し替え可能にする

### SOLID & フォルダ構成
- SRP, DIP を満たす設計
- フォルダ構成は責務が分かる形に

### コードライフサイクル
- フェールバックや後方互換・マイグレーションは考慮しない
- 不要になったコードは コメントアウトせず完全削除

### 使用言語
- TypeScript のみ
- package.jsonでは`"type": "commonjs"`を明示的に指定
- 設定ファイルは`.js`形式のみ使用（`.cjs`形式は禁止）
- 作業完了条件: `npm run test` と `npm run build` が成功していること

---

## 成果物として必須なもの

- 単体テスト（Jest + ts-jest）: カバレッジ 50%以上
- 静的解析: ESLint / dependency-cruiser
- API ドキュメント: typedoc → Markdown 出力
- バージョン付き仕様書: `docs/spec/vx.y.z/` 配下に要件または監査結果を配置

---

## プロジェクト構成（期待形）

```
プロジェクトフォルダ/
├─ docs/
│  └─ typedoc-md/              # typedoc Markdown 出力
│  └─ spec/vx.y.z/             # バージョン付き仕様・監査メモ
├─ src/                        # 本体ソース
├─ test/
│  ├─ unit/                    # 単体テスト（Jest）
│  └─ e2e/                     # E2E テスト
├─ .dependency-cruiser.js      # dependency-cruiser 設定
├─ eslint.config.js            # ESLint flat-config
├─ jest.unit.config.js         # Jest unit 設定
├─ jest.spec.config.js         # 任意: 仕様・設計テスト設定
├─ jest.coverage.config.js     # 任意: coverage 専用設定
├─ jest.e2e.config.js          # 任意: Jest を使う E2E 設定
└─ typedoc.js                  # typedoc 設定
```

---

## テストカバレッジ & CI ゲート

- `npm run test:ci` で `jest --coverage` を実行し、coverage 50% 未満は失敗
- `npm run type-check` で `tsc --noEmit` を実行し、型エラーがあれば CI を失敗させる
- `npm run lint` で ESLint を実行し、エラーがあれば CI を失敗させる
- `npm run depcruise` の違反があれば CI を失敗させる
- `npm run cpd` で jscpd を実行し、重複コード検出時は CI を失敗させる
- `npm run docs` で typedoc の Markdown 生成を実行し、失敗時は CI を失敗させる
- CI でのテスト実行は `npm run test` ではなく `npm run test:ci` を利用する
- `npm run depcruise` に失敗回避オプションを含めてはならない

---

## CI/品質ゲート要件

1. `npm run test` が成功すること
2. `npm run type-check` が型エラーなし（`tsc --noEmit`、esbuild/webpack 等でビルドする場合も必須）
3. `npm run lint` がエラーを出さないこと
4. `npm run depcruise` が違反なし
5. `npm run cpd` が重複コード検出なし（jscpd、min-lines 5 / min-tokens 50 / threshold 0）
6. `npm run build` が成功しバンドル生成されること
7. CI の自動テストは `npm run test:ci` を利用すること
8. `npm run docs` が成功し、`docs/typedoc-md/` が生成されること
9. `docs/spec/vx.y.z/` に仕様または監査記録が存在し、受け入れ条件と設計判断が記載されていること

---

## ESLint ルール / 必須条件

- Cognitive Complexity ≤ 10
- 文字列重複: `sonarjs/no-duplicate-string`（threshold: 3）
- 関数重複: `sonarjs/no-identical-functions`

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
- フレームワーク利用時は parser / plugin の override を追加する（例: Vue なら `vue-eslint-parser` と `eslint-plugin-vue`）
- JSDoc コメント必須
- JSDoc 内で param / returns を記載

### ⛔ Lint 抑制・設定改変の完全禁止

ESLint エラーは**必ずソースコードを修正**して解消すること。以下の回避手段はいかなる理由でも禁止する。

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

## typedoc / JSDoc ガイドライン

### JSDoc 必須記載項目
1. 処理名（短いタイトル）
2. 処理概要（何をするか）
3. 実装理由（設計判断）

### 記述方針
- すべて日本語で記載
- public / internal を問わず 全 function / method / class / interface に必須

```ts
/**
 * 処理名: タスク保存
 *
 * 処理概要: WebView から受け取ったタスク差分を永続化する
 *
 * 実装理由: ユーザーの編集内容を保存し再起動時に復元するため
 */
function saveTasks(...) {}
```

---

## dependency-cruiser ルール

- レイヤー間の不適切な依存を防止するため `.dependency-cruiser.js` を用意する
- 依存は interface / contract 経由のみ許可するなど、ルール違反時は CI で失敗させる
- `depcruise --config ... src || exit 0` のような失敗回避は許可しない

---

## jscpd（コード重複検出）

- コードブロック単位の重複（コピペ）を検出するため jscpd を導入する
- `package.json` に `"cpd": "jscpd src --min-lines 5 --min-tokens 50 --threshold 0"` を定義する
- threshold 0 は「1件でも重複があれば失敗」を意味する
- 重複が検出された場合はコードを共通化・抽象化してから再実行する
- `|| exit 0` などの失敗回避は禁止する

| オプション | 意味 | 設定値 |
|---|---|---|
| `--min-lines` | 重複とみなす最小行数 | 5 |
| `--min-tokens` | 重複とみなす最小トークン数 | 50 |
| `--threshold` | 失敗とみなす重複率（%）| 0（1件でも失敗） |

---

## テスト & 受け入れ基準

### テスト要件
- Unit Test: Jest。外部通信・I/O はすべてモック
- E2E Test: docker-compose で起動し Playwright を使用

### 機能受け入れ条件（例）
- 入力受入: 100 行の断片データをインポートし UI で編集可能
- 重複検出: サンプルデータで 80%以上の論理的重複を検出
- 分解提案: 10 件中 7 件以上で適切な分割候補を提示
- 状態抽出: 「ユーザー登録」マトリクスから主要状態遷移を自動生成
- コラボレーション: 複数ユーザーの同時編集を競合なくマージ可能

### 最終ゲート
- `npm run test` 成功
- `npm run lint` エラーなし
- `npm run build` 成功
- `dist/index.bundle.js` が生成されていること
