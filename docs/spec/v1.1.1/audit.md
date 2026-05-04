# 品質監査記録 — memopad-new-tab v1.1.1

## 概要

memopad-new-tab v1.1.1 に対して nodejs-project-quality-guardrails Skill に基づく品質基盤整備を実施した。

---

## 受け入れ条件（Acceptance Criteria）

| # | 条件 | 達成状況 |
|---|---|---|
| AC-1 | `npm run test` が成功すること | ✅ |
| AC-2 | `npm run test:ci` が成功し、カバレッジが 50% 以上であること | 対応中 |
| AC-3 | `npm run type-check` が型エラーなしで成功すること | ✅ |
| AC-4 | `npm run lint` が ESLint エラーなしで成功すること | 対応中 |
| AC-5 | `npm run depcruise` が依存関係違反なしで成功すること | ✅ |
| AC-6 | `npm run cpd` が重複コード検出なしで成功すること | ✅ |
| AC-7 | `npm run build` が成功し成果物が生成されること | ✅ |
| AC-8 | `npm run docs` が成功し `docs/typedoc-md/` が生成されること | ✅ |

---

## 設計判断（Design Decisions）

### DD-1: ESLint flat-config の採用

**判断**: `eslint.config.js`（flat-config）を採用し、`package.json#eslintConfig` の旧形式を廃止した。

**理由**: ESLint v8 以降は flat-config が推奨形式であり、`eslint-plugin-sonarjs` v4.x、`eslint-plugin-jsdoc` v62.x のいずれも flat-config を正式サポートしているため。また、`vue-eslint-parser` + `@typescript-eslint/parser` の組み合わせを明示的に制御できる利点がある。

### DD-2: babel-jest から ts-jest への移行（TypeScript ファイル）

**判断**: `.ts` ファイルのトランスフォームを `babel-jest` から `ts-jest`（`isolatedModules: true`）に変更した。

**理由**: `babel-jest + @babel/preset-typescript` は TypeScript 型情報を無視してトランスパイルするのみで、実際の型チェックは行わない。`ts-jest` はよりTypeScriptに忠実なコンパイルを行う。`isolatedModules: true` でトランスパイル速度を確保しつつ型安全性を高めた。`npm run type-check` で `vue-tsc --noEmit` による全体型チェックを別途実施する。

### DD-3: dependency-cruiser の導入

**判断**: 循環依存禁止ルール（`no-circular`）を中心とした最小限のルールセットを採用した。

**理由**: Vue 3 + Vuex の構成では `components/` が `store/` を参照するパターンは許容設計であるため、厳格なレイヤー強制よりも循環依存の防止を優先した。

### DD-4: coverageThreshold を 50% に設定

**判断**: Jest の `coverageThreshold` を lines/branches/functions/statements すべて 50% に設定した。

**理由**: スキルの要件（カバレッジ 50% 以上）に準拠するための最小閾値として設定。プロジェクトの成熟度に応じて段階的に引き上げることを想定している。

### DD-5: typedoc の Vue コンポーネント除外

**判断**: typedoc の対象から `.vue` ファイルのドキュメント自動生成は行わず、`.ts` ファイルを主対象とした。

**理由**: typedoc は Vue SFC（Single File Component）を直接解析することが難しく、誤ったドキュメントが生成されるリスクがある。TypeScript のユーティリティ・ストア・ヘルパーを優先的にドキュメント化する。

---

## 品質基盤整備内容

### 追加したスクリプト

| スクリプト | コマンド | 用途 |
|---|---|---|
| `test` | `jest` | 単体テスト実行 |
| `test:ci` | `jest --coverage` | CI 用テスト（カバレッジ計測） |
| `depcruise` | `depcruise src/js --config .dependency-cruiser.js` | 依存関係検証 |
| `cpd` | `jscpd src/js --min-lines 5 --min-tokens 50 --threshold 0` | コード重複検出 |
| `docs` | `typedoc --options typedoc.js` | API ドキュメント生成 |

### 変更した設定

| 設定 | 変更内容 |
|---|---|
| `lint` スクリプト | `vue-cli-service lint` → `cross-env ESLINT_USE_FLAT_CONFIG=true eslint src/js` |
| `jest.config.js` | ts-jest 導入、coverageThreshold 50% 設定 |
| `package.json` | `"type": "commonjs"` 追加、`eslintConfig` フィールド削除 |

### 追加した設定ファイル

- `eslint.config.js` — ESLint flat-config（sonarjs・jsdoc・Vue3 対応）
- `typedoc.js` — typedoc 設定
- `.dependency-cruiser.js` — 依存関係ルール設定
- `.github/skills/nodejs-project-quality-guardrails/SKILL.md` — 品質ガードレール Skill
- `.github/skills/completion-mandatory-quality-gates/SKILL.md` — 完了品質ゲート Skill
