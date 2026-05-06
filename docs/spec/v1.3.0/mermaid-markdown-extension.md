# Mermaid 表記対応設計

## 概要
Markdown エディタで Mermaid 記法を有効化し、ユーザーが `Mermaid` フローチャートやダイアグラムを記述できるようにする。

- Settings の markdown 拡張機能一覧に `Mermaid - Set ON to enable Mermaid` を追加
- デフォルトは `ON`
- `ON` 時は `@wekanteam/markdown-it-mermaid` を利用して Mermaid 表記をレンダリング
- エディタの補完機能として Mermaid テンプレートを追加

## 対象バージョン
- v1.3.0

## 対象画面・機能
- ノート編集画面の Markdown プレビュー
- Settings 画面の Markdown 拡張設定
- エディタの suggest / スニペット提案

## 目的
- Mermaid による図表記述を Markdown 内で簡単に扱えるようにする
- マークダウン作成時の表現力を強化し、技術文書やフロー図を自然に埋め込めるようにする
- ユーザーの操作性を向上させる

## 仕様

### 1. Settings 追加
- Settings > Markdown > Extensions に以下の項目を追加する
  - `Mermaid - Set ON to enable Mermaid`
- 既存の `UML - Set ON to enable UML` 表示がある場合は、`PlantUML - Set ON to enable PlantUML` に修正する
- 初期値: `ON`
- 設定値は localStorage に保存し、アプリ再起動後も保持される
- `OFF` の場合、Mermaid 記法はレンダリングせず、通常のコードブロックとして扱う

### 2. Mermaid レンダリング対応
- Markdown 解析時に `@wekanteam/markdown-it-mermaid` を使用する
- 対象となるコードブロック言語: `mermaid`
- `Mermaid` 有効時のみ、Markdown プレビューで Mermaid を HTML/SVG に変換して表示する
- `Mermaid` 無効時は、以下のようにコードブロックをそのまま表示する
  ```
  ```mermaid
  graph TD
    A --> B
  ```
  ```

### 3. デフォルト値と設定の永続化
- デフォルト設定: `mermaidEnabled = true`
- 既存設定がない場合はデフォルトを補完する
- 既存設定が存在する場合は上書きせず、明示的に `ON/OFF` を切り替えられる

### 4. エディタの suggest テンプレート追加
- Markdown 編集時に `mermaid` または `graph` などをトリガーワードとして Mermaid テンプレートを提案する
- 提案内容例:
  - `mermaid` → Mermaid コードブロックの基本テンプレート
  - `graph TD` → 簡易フローチャートコードテンプレート
- 具体的なテンプレート例
  ```markdown
  ```mermaid
  graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[End]
    C -->|No| E[Back]
  ```
  ```
- Suggest は既存 Markdown 編集補完機能に統合し、ユーザーがコードブロック開始時や `mermaid` 入力時に候補を提示されるようにする

## 実装方針

### 1. 設定管理
- 設定の保持には既存の Settings / localStorage 仕組みを利用
- 設定キー例: `settings.markdown.mermaidEnabled`
- `normalizeConfig` にデフォルト補完ロジックを追加

### 2. Markdown レンダラー統合
- 既存の Markdown プレビュー生成ロジックに `@wekanteam/markdown-it-mermaid` を追加
- `mermaidEnabled` が `true` の場合のみプラグインを有効化
- `false` の場合は通常の `markdown-it` のみを使用

### 3. エディタ補完実装
- Monaco Editor の Markdown 用 suggest / スニペット機能に Mermaid テンプレートを追加
- 既存の補完定義ファイルがあれば、そこに Mermaid テンプレートを追加
- `mermaid` を入力した際、候補として挿入できるようにする

### 4. 依存関係
- `package.json` に `@wekanteam/markdown-it-mermaid` を追加
- パッケージバージョンは最新安定版を利用する

## 現状調査と実装箇所
- `src/js/components/SettingPage.vue`
  - 既存の Markdown 設定画面に `UML - Set ON to enable UML` があり、`localConfig.markdown.uml` を参照している
  - ここに `Mermaid - Set ON to enable Mermaid` のチェックボックスを追加する
  - 既存 `UML` ラベルは `PlantUML - Set ON to enable PlantUML` に修正する
- `src/js/components/Preview.vue`
  - Markdown プレビューで `markdown-it` と `markdown-it-plantuml` を利用している
  - 設定 `config.markdown.mermaid` を追加し、`@wekanteam/markdown-it-mermaid` を読み込んで有効化する
  - `config.markdown` が `SplitpanesWrapper.vue` から渡されているため、設定の流れは既存の仕組みを再利用できる
- `src/js/store/index.ts`
  - `defaultConfig.markdown` に `mermaid: true` を追加する
  - `normalizeConfig` で `markdown.mermaid` を既存の設定マージロジックに含め、旧設定でもデフォルトを補完する
  - `state.config` は `localStorage` の `config` キーから読み込まれる
- `src/js/editorCompletions.ts`
  - 既存の補完登録では Markdown と PlantUML 用の提示がある
  - `mermaid` を対象とした補完ロジックを `isInsideMermaidBlock` / `getMermaidSuggestions` などで追加する
  - 一般 Markdown 補完の候補として Mermaid コードブロックテンプレートも追加する

## 互換性・考慮事項
- 設定を `OFF` にした場合でも既存の Markdown 文書は壊れないように、`mermaid` コードブロックは単純なコード表示として扱う
- `Mermaid` が有効な場合でも、プラグインのエラーが発生した際には安全にフォールバックし、エディタやプレビューをクラッシュさせない
- `@wekanteam/markdown-it-mermaid` の依存先に脆弱性があった場合、必要に応じてアップデート/差し替えを検討する

## 試験観点
- Settings 画面に `Mermaid - Set ON to enable Mermaid` が表示される
- 初期値が `ON` になっている
- `ON` 時に Mermaid コードブロックが正しくプレビューされる
- `OFF` 時に Mermaid コードブロックが HTML に変換されず、コードブロックとして表示される
- エディタの補完候補に Mermaid テンプレートが含まれる
- 設定を切り替えた後、再読み込みしても設定が保持される

## 受け入れ条件
- [ ] Settings の markdown Extensions に `Mermaid - Set ON to enable Mermaid` が追加されている
- [ ] Mermaid 設定のデフォルトが `ON` である
- [ ] `ON` のときに `@wekanteam/markdown-it-mermaid` を使って Mermaid 表記がレンダリングされる
- [ ] エディタの suggest 機能として Mermaid のテンプレートが追加されている
