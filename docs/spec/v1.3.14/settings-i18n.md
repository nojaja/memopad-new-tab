# v1.3.14 - Settings 画面の i18n と CSP 対応設計

## ドキュメント情報
- バージョン: 1.3.14
- 更新日: 2026-05-23
- ステータス: 設計書
- 分類: i18n / セキュリティ（CSP）
- 関連Issue: (CSP: `unsafe-eval` による EvalError 対応)

---

## 1. 概要

### 1.1 背景
Settings 画面を開くとコンソールに以下のような EvalError が発生していました：

```
EvalError: Evaluating a string as JavaScript violates the following Content Security Policy directive because 'unsafe-eval' is not an allowed source of script: script-src 'self'.
    at Function (<anonymous>)
    ...
```

スタックから、`Function(<anonymous>)` によるランタイム生成（`new Function` / `eval` 相当）が発生しており、これはブラウザの CSP（`script-src 'self'`）によりブロックされています。実際の発生箇所は `SettingPage.vue` の `translateSettingText()` が呼ぶ `this.$t()`（`vue-i18n`）の内部で、メッセージのランタイムコンパイルが行われていることが原因です。

### 1.2 目的
- ランタイムで `eval` / `new Function` を発生させず CSP を満たすこと
- Settings 画面の i18n を保ちつつ、ブラウザでの EvalError を解消すること

---

## 2. 根本原因
- `vue-i18n` はメッセージの一部（フォーマットやプラグイン機能）を実行時にコンパイルして関数化することがある。
- その実行時コンパイル処理が `Function(<code>)` を内部で生成し、CSP によりブロックされていた。
- 翻訳データは `src/js/lang/messages.json` に存在し、`src/js/lang/index.ts` で `createI18n({ messages })` に渡されている。

---

## 3. 対応方針（推奨）

ビルド時に翻訳メッセージ／コンパイルを完了させ、ランタイムで `new Function` を発生させないようにします。
Vite 環境では `@intlify/vite-plugin-vue-i18n` を導入し、`src/js/lang/**` を事前コンパイル（ビルド／dev 時にトランスフォーム）するのが最も安全で簡潔です。

この方針により、CSP 側で `script-src 'unsafe-eval'` を許可する必要がなくなります（許可は非推奨）。

---

## 4. 実装手順（例）

1. 開発依存としてプラグインを追加

```bash
npm install -D @intlify/vite-plugin-vue-i18n
# または
pnpm add -D @intlify/vite-plugin-vue-i18n
```

2. `vite.config.ts` を編集してプラグインを読み込み、`plugins` に追加します。

追加例（抜粋）:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/vite-plugin-vue-i18n'
import path from 'node:path'
// 既存の import ...

export default defineConfig({
  plugins: [
    vue(),
    vueI18n({
      // 翻訳ファイルのパスをプロジェクトに合わせて指定
      include: path.resolve(__dirname, 'src/js/lang/**')
    }),
    // 既存プラグイン (viteStaticCopy 等)
  ],
  // 既存設定...
})
```

ポイント:
- `include` は `src/js/lang/messages.json` を含むように指定する（ワイルドカード形式が便利）。
- プラグインは `vue()` の直後に置くのが一般的で問題ない。

3. ビルド / 開発サーバー実行

```bash
npm run build
# または開発時は
npm run serve
```

4. 動作確認: Settings を開き、コンソールに `EvalError` が出ないことを確認する。

---

## 5. 追加検討事項

- CI/CD（ビルド環境）でも `@intlify/vite-plugin-vue-i18n` を利用できるように devDependencies として確実にインストールされること。
- `messages.json` を直接 JS モジュールに置換するオプションもあるが、Intlify プラグイン導入が手間少なく推奨。
- Chrome 拡張や WebExtension 等で CSP ポリシーが厳格に運用される場合、この事前コンパイル対応が必要不可欠。

---

## 6. テスト & 検証手順

1. `npm i` で依存を導入。
2. `vite.config.ts` を上記のとおり修正。
3. `npm run serve` で開発サーバーを起動し、Settings を開いてコンソール確認。
4. `npm run build` を実行し、生成物を配布対象に組み込み（拡張として配布する場合はパッケージ化して動作確認）。
5. 回帰確認:
   - i18n の `en` / `ja` 切替が想定どおりに動作すること
   - `SettingPage.vue` の `translateSettingText()` を通じた表示が正常であること

期待結果: `Function(<anonymous>)` によるスタックが消え、CSP（`script-src 'self'`）違反が発生しない。

---

## 7. ロールバック案

- 変更を revert して `vite.config.ts` を元に戻す。
- 一時的回避として CSP に `'unsafe-eval'` を追加可能だが、セキュリティ上非推奨かつ拡張ストア等で許可されないかもしれないため避ける。

---

## 8. 変更対象ファイル（想定）
- `src/js/lang/messages.json` （既存）
- `src/js/lang/index.ts` （i18n インスタンス初期化）
- `vite.config.ts` （プラグイン追加）
- `package.json` （devDependencies にプラグイン追加）

---

## 9. リリースノート（案）
- v1.3.13: Settings 画面の i18n 関連で発生していた CSP（`unsafe-eval`）による EvalError を解消するため、i18n メッセージの事前コンパイルを導入しました（`@intlify/vite-plugin-vue-i18n` を使用）。これにより CSP を緩和せず安全に翻訳を利用できます。

---

## 10. 参考（内部備考）
- 発生したエラーは `SlideMenu.vue` から Settings を開いたときに顕在化していた（`translateSettingText()` 経由で `$t()` が評価される箇所がトリガー）。
- 既存の `messages.json` を活かしたまま、ビルド段階で安全に処理する方針が簡潔で導入コストが低い。

---

## 11. 動作確認手順とロールアウト注意点

### 動作確認手順（開発）
1. 依存インストール

```bash
npm install
```

2. 単体テスト（TDD サイクル確認）

```bash
npm run test:unit -- tests/unit/vite-i18n-plugin.test.js
```

3. 開発サーバーで動作確認

```bash
npm run serve
# ブラウザでアプリを開き、Settings を開いてコンソールに CSP/EvalError が出ないことを確認
```

4. 本番ビルド検証

```bash
npm run build
# 生成物を配布先へ配置して、同様に Settings を開きコンソールで CSP エラーが出ないことを確認
```

確認ポイント:
- ブラウザコンソールに `EvalError`（`unsafe-eval`）が出ないこと
- `SettingPage` の英日切替が即時に反映されること

### ロールアウト注意点
- CI 環境でも `npm ci` や `npm install` によって `@intlify/vite-plugin-vue-i18n` がインストールされることを確認する。
- Chrome 拡張等で配布する場合、拡張の CSP が厳格であるため本対応（事前コンパイル）は必須である。配布後に CSP 関連のコンソールエラーがないか確認すること。
- 依存バージョンの互換性: `vue-i18n` とプラグインの互換性を CI で検証する（依存アップデート時に回帰する可能性あり）。
- 問題発生時は `vite.config.ts` の追加行を revert し、リリースを差し止める。

