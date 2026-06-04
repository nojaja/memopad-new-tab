# v1.3.16 - Privacy Blur 再非アクティブ化漏れ修正（Issue #95）

## ドキュメント情報
- バージョン: 1.3.16
- 更新日: 2026-06-04
- 対象 Issue: #95
- 種別: 修正仕様・検証記録

## 背景
設定 -> 一般 -> Privacy で Privacy Blur を ON にしているとき、プレビュー画面をクリックしたあとにタブが非アクティブ化されてもブラーが掛からない。

## 原因
App の window blur 処理で、child-frame へのフォーカス移動を無条件で「非アクティブ化ではない」と扱っていた。
そのため、実際にタブが hidden 状態へ遷移した blur まで無視してしまっていた。

## 対応方針
- child-frame へのフォーカス移動を例外扱いするのは、document が visible のときだけに限定する。
- document.hidden が true の場合は通常どおり windowActive を false にし、Privacy Blur を有効化する。

## 実装内容
- 対象: src/js/components/App.vue
- 変更点:
  - handleWindowBlur 内に visible 判定を追加
  - visible かつ child-frame フォーカス時のみ blur 無視

## テスト戦略（TDD）
1. Red: 先に再現テストを追加
   - tests/unit/AppStorageSync.test.js
   - 「preview クリック後に非アクティブ化したらブラーが掛かる」を追加
2. Green: App.vue を最小修正
3. 検証: 追加テストが通ることを確認

## 受け入れ条件
- Privacy Blur ON 時、preview クリック直後の iframe フォーカス移動だけではブラーされない。
- その後タブが hidden になった場合は確実にブラーされる。
- 既存の Privacy Blur 挙動（表示復帰、F6 即時実行）を壊さない。
