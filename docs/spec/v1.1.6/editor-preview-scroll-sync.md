# Editor - Preview スクロール同期設計

## 概要

エディタとプレビューのスクロール同期は、表示位置の厳密一致よりも、まず操作不能や相互再入によるフリーズを防ぐことを優先する。
本設計では、短期安定化策として「片方向ロック + 停止後同期」を採用し、その上で将来的にノード単位マッピングへ段階移行できる構成に更新する。

---

## ユースケース / 利用シナリオ

- エディタをスクロールしたときに、プレビューがおおむね同じ内容位置を表示する。
- プレビューをスクロールしても、エディタ側は動かない（プレビューは独立してスクロール可能）。
- ノート切り替えや再描画を挟んでも、スクロール同期が再入ループを起こさず継続動作する。
- 長い文書、画像、テーブル、コードブロックを含む Markdown でも全体が固まらない。

---

## 目的

1. preview 側スクロール後でも note 切り替えが遅延なく完了する。
2. editor 側スクロール後でも全体フリーズが発生しない。
3. preview→editor 方向の同期イベントを完全に排除し、往復連鎖の根本原因を取り除く。
4. 既存の `splitpanes` と `iframe` 構造を維持したまま段階的に改善できる。
5. 将来的に高精度同期へ移行できる拡張余地を残す。

---

## 現状の問題点

- editor と preview が双方の scroll を即時反映するため、プログラムスクロールが逆方向イベントを再度発火させやすい。
- `requestAnimationFrame` や `setTimeout` の解除タイミング次第で、同期中フラグが早く外れ、相互再入ループが発生しうる。
- note 切り替え直後の再描画と scroll 同期が競合し、長時間応答しない状態を引き起こす。
- 比率同期だけでは高さ差の補正精度が足りないが、精度向上だけを優先するとイベント制御が複雑化しやすい。

---

## 採用方式

### 中心方針: editor→preview 片方向同期のみ

preview 側のスクロールをエディタへ反映する処理を完全に削除する。
editor→preview 方向のみ同期を行い、往復連鎖によるフリーズを根本から排除する。

#### 1. editor→preview のみ同期する
- エディタをスクロールしたとき、プレビューへ位置を反映する。
- プレビューをスクロールしても、エディタへは一切同期しない。
- `previewScroll` イベントはフォーカス管理目的でのみ使用し、エディタへの同期には使わない。

#### 2. プログラムスクロールの逆流遮断
- editor から preview をスクロールした直後は、preview 起点の scroll を抑止する。
- `blockedPane = 'preview'` を設定し、解除は次フレーム以降に行う。

#### 3. 停止後同期
- ユーザーのスクロール中は毎イベントで相手側へ反映しない。
- 最後の scroll から短時間経過後に、保留中の最新位置だけを 1 回同期する。
- 同期対象はキューの末尾だけを残し、中間イベントはまとめて破棄する。

#### 4. 同期中フラグの解除を描画完了へ寄せる
- プログラムスクロールの解除は即時に行わず、少なくとも次の描画フレームまで持ち越す。
- DOM 更新や iframe 内再配置が終わる前にフラグを解除しない。

#### 5. 比率同期は暫定補助として残す
- 相手側の目標位置計算は既存の比率または行近傍推定を利用してよい。

---

## 将来拡張

### 第2段階: ノード単位マッピングへの移行

短期安定化後、必要に応じて TOAST UI Editor 型のノード単位同期へ拡張する。

- preview の主要ブロック要素に `data-source-line` または `data-nodeid` を付与する。
- editor の可視先頭行またはカーソル位置から対応ノードを特定する。
- preview 側では対象ノードの `offsetTop` と `height` を利用して補間する。
- preview 起点でも最寄りノードから editor 行位置を逆算する。

この段階では精度向上を狙うが、イベント制御の主軸は引き続き「片方向ロック + 停止後同期」とする。

---

## コンポーネント別方針

### `SplitpanesWrapper.vue`

- 同期制御の司令塔とする。
- `activePane`、`blockedPane`、保留中同期情報を管理する。
- editor / preview から受け取った scroll イベントを直接即時転送せず、短い遅延で集約する。
- note 切り替え中は同期キューを破棄し、切り替え完了後に新状態から再開する。
- プログラムスクロール起点を明示し、逆流イベントを破棄する。

### `Monaco.vue`

- ユーザー起点の scroll とプログラム起点の scroll を区別して emit する。
- `scrollToRatio` や `scrollToSourceLine` の内部では、解除タイミングを次フレームまで遅らせる。
- scroll 開始時点で editor を操作元として通知できるようにする。

### `Preview.vue`

- iframe 内 scroll を監視し、ユーザー操作由来のイベントだけを wrapper へ通知する。
- `previewScroll` emit は残すが、wrapper 側でエディタへの同期には使わない。
- `scrollToRatio` や `scrollToSourceLine` 実行中は、preview 起点イベントを抑止する。
- 将来拡張用として `data-source-line` 取得ロジックは残す。

---

## 同期アルゴリズム

### editor → preview

1. editor scroll を受信したら `activePane = 'editor'` を設定する。
2. `blockedPane === 'editor'` の間は処理しない。
3. 最新位置だけを `pendingEditorLine` に保存する。
4. 一定時間追加 scroll がなければ preview へ同期する。
5. preview への反映中は `blockedPane = 'preview'` とし、解除は次フレーム以降に行う。

### preview → editor（同期しない）

- `previewScroll` イベントを受信してもエディタへの同期は行わない。
- `activePane = 'preview'` のフォーカス状態管理のみ行う。
- `blockedPane` の設定・解除も行わない。

### note 切り替え時

1. 切り替え開始時に pending な同期タイマーを破棄する。
2. 古い note に紐づく scroll 状態を引き継がない。
3. 新しい note の editor / preview 描画が落ち着くまで同期を抑止する。
4. 初期表示後に必要なら 1 回だけ整列同期する。

---

## API / 状態定義

### 状態

| 名前 | 型 | 意味 |
|------|----|------|
| `activePane` | `'editor' \| 'preview' \| null` | 現在の操作元（フォーカス管理用） |
| `blockedPane` | `'preview' \| null` | editor→preview 同期中に preview からの逆流を抑止する |
| `pendingEditorLine` | `number` | 停止後同期の保留行番号（editor→preview 用） |
| `editorScrollSyncTimer` | `number \| null` | 保留同期実行用タイマー |

### イベント

- `editorScroll(payload: number)` — editor→preview 同期に使用
- `previewScroll(payload: number)` — フォーカス管理のみ。エディタへの同期には使わない
- `editorFocus()`
- `previewFocus()`
- `scrollToRatio(ratio: number)`
- `scrollToSourceLine(lineNumber: number)`

`payload` は短期段階では ratio または line のいずれでもよいが、wrapper 側で同一インターフェースとして扱えることを優先する。

---

## 機能要件

1. preview 側スクロール後でも note 切り替えが 10 秒以上停止しないこと。
2. editor 側スクロール後でも note 切り替えが 10 秒以上停止しないこと。
3. preview→editor 方向の同期は行わないこと（previewScroll はエディタ同期に使わない）。
4. editor→preview 方向の連続 scroll は集約し、最新位置のみ同期すること。
5. note 切り替え時は旧 note の pending な同期処理を持ち越さないこと。
6. 将来 `data-source-line` / `data-nodeid` ベース同期へ移行できる構造を維持すること。

---

## 非機能要件

- スクロール中のメインスレッド負荷を抑えること。
- イベント再入により無限ループや UI フリーズを起こさないこと。
- 既存の `splitpanes`、`iframe`、Monaco ラッパー構造を大きく崩さないこと。
- 同期精度の改善より、操作不能の防止を優先すること。

---

## 受け入れ条件

- [ ] preview を複数回強くスクロールした後でも、2回目の note 切り替えが 10 秒以上停止しない。
- [ ] editor を複数回強くスクロールした後でも、2回目の note 切り替えが 10 秒以上停止しない。
- [ ] `handlePreviewScroll` がモナコの `scrollToSourceLine` を呼び出さない。
- [ ] `handleEditorScroll` 経由で preview へのスクロール同期が正しく動作する。
- [ ] programmatic scroll により発生した逆方向 scroll (preview→editor 方向) が追加同期を起こさない。
- [ ] note 切り替え直後に古い同期タイマーや保留データが残らない。
- [ ] 既存の編集、保存、プレビュー表示機能に退行がない。

---

## テストケース要約

- `handlePreviewScroll` は `monaco.scrollToSourceLine` を呼び出さない。
- `handleEditorScroll` は `blockedPane === 'editor'` の間は preview 同期をスキップする。
- `SplitpanesWrapper` で editor 側の連続 scroll が 1 件の pending 同期に集約される。
- `Monaco.vue` の programmatic scroll 中に `editorScroll` が再同期を起こさない。
- note 切り替え開始時に pending タイマーが破棄される。
- Playwright 観測で preview 起点シナリオがフリーズしない（エディタは動かないが操作は継続できる）。

---

## ロールアウト / 移行計画

1. 第1段階で `activePane` と `blockedPane` を導入し、停止後同期へ切り替える。
2. 第2段階で必要に応じて `data-source-line` を用いた補助同期を追加する。
3. 第3段階で `data-nodeid` ベースのノード補間へ拡張し、精度を高める。
4. 各段階で Playwright による freeze 観測を再実行し、回帰を確認する。

---

## 参考実装

- TOAST UI Editor:
  - ノード対応付け、オフセットキャッシュ、blocked scroll を組み合わせた高精度同期
- react-markdown-editor-lite:
  - 比率同期に `isSyncingScroll`、`shouldSyncScroll`、`requestAnimationFrame` を組み合わせた軽量同期
- EasyMDE 系:
  - side-by-side 同期をオプション化し、必要時のみ有効化する構成
