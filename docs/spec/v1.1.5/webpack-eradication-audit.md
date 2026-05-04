# Webpack 撲滅監査

## 概要

Vite 移行後にリポジトリ内へ残っていた Webpack 関連要素を監査し、実行経路・設定・案内文から不要な参照を除去した。

## 実施内容

- 未使用の Webpack 用 HTML テンプレート `src/html/main.html` を削除
- E2E セットアップの案内文を `webpack-dev-server` から Vite 開発サーバーへ修正
- README の開発手順を Vue CLI 前提から Vite 前提へ更新

## 調査結果

### 除去済みの残骸

- Webpack テンプレート変数 `htmlWebpackPlugin` と `BASE_URL`
- `webpack-dev-server` というテスト案内文
- `vue-cli-service serve` という README 記述

### 実行経路に残っていないことを確認した項目

- `package.json` の scripts は `vite` / `vite build` を使用
- ルート `index.html` が Vite のエントリポイントとして機能
- 旧 `src/html/main.html` はどこからも参照されていなかった

### 文字列だけ残る項目

- `.git/logs/**`
  - Git 履歴であり、アプリケーション実行には関与しない
- `.github/skills/nodejs-project-quality-guardrails/SKILL.md`
  - 汎用 Skill 文書の説明文であり、本プロジェクトのビルド経路ではない
- `docs/spec/v1.1.1/audit.md`
  - 過去監査の差分記録であり、現行設定ではない
- `tsconfig-paths-webpack-plugin`
  - `dependency-cruiser@17.4.0` が内部利用する開発依存
  - `npm explain tsconfig-paths-webpack-plugin` で root 直下の利用ではないことを確認

## 判断

現時点で、プロジェクト自身が管理するビルド・起動・テスト経路から Webpack は除去済みである。

残存する Webpack 文字列は、履歴資料または `dependency-cruiser` の推移的依存に限定される。後者まで完全に排除するには、品質ゲートで必須の `dependency-cruiser` を別手段へ置き換える必要がある。