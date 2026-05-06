# Memopad New Tab

[link-cws]: https://chrome.google.com/webstore/detail/iohinadgijcpmclidcgalomljfabkpde "Version published on Chrome Web Store"

[![Licence](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE) 
[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/nojaja/memopad-new-tab) 
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/iohinadgijcpmclidcgalomljfabkpde.svg?label=chrome%20users&style=flat-square)][link-cws]

Memopad New Tabは、Google Chromeの新しいタブをMarkdownエディタに変えるChrome拡張機能です。

新しいタブを開くだけで、🗒️ メモの記録、⏰ リマインダーの保存、🔗 リンクの貼り付け、表の作成などがすぐに行えます。
「新しいタブ」をシンプルかつスマートに活用したい方に向けて、素早く・すっきりと使えることを大切に設計しています。

![screenshot](/assets/screenshots/memopad-new-tab.png)

![Demo GIF](/assets/demo.gif)


## Install

- [**Chrome** extension][link-cws] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/iohinadgijcpmclidcgalomljfabkpde.svg?label=%20">][link-cws]


### {Features|特徴}

* シンプルで使いやすい
新しいタブを開いてそのまま書き始めるだけ。
次にタブを開いても、前回の内容がそのまま残っています。

* ノートの一覧管理
用途に合わせて複数のノートを作成し、切り替えながら使うことができます。

* Markdownで表現力アップ
Markdown記法を使えば、見出し・リスト・表・コードブロックなど、豊富な書式で自由に書き残せます。
Markdownの書き方は [こちらの公式ガイド](https://github.github.com/gfm/) をご参照ください。

* オフラインでも使える
Memopad New Tabのデータはサーバーではなくブラウザ内に保存されます。
インターネット接続がなくても、ノートの作成・編集が可能です。

* VS Codeと同じエディタを採用
VS Codeでもおなじみの高機能エディタ「Monaco Editor」を搭載しています。
Markdown記法のシンタックスハイライトや補完など、快適な編集体験をそのままブラウザで。

* PlantUMLでダイアグラムを描ける
テキストからシーケンス図・クラス図・フローチャートなどを作成できるPlantUMLに対応。
コードを書くだけで、図を即座に表現できます。

* プレビューをリアルタイムで確認
入力した内容がプレビューエリアにすぐ反映されます。
書きながら仕上がりをその場で確認できるので、ノート作成がスムーズです。

### {update|更新}

#### v1.3.0（2026/05/07）
* Mermaid でダイアグラムを描けるようになりました
フローチャートやシーケンス図などを描ける Mermaid 記法に対応しました。設定から ON/OFF を切り替えることができます。

#### v1.2.0（2026/05/05）
* 他タブで更新されたノートを自動リロード
複数タブで同じノートを開いているとき、他のタブで更新があると自動的にリロードされます。編集中の場合はコピーを作成して編集を継続できます。

* サイドバーの操作性を向上
サイドバーの開閉ボタンを追加し、上下キーでノートを切り替えられるようになりました。

* エディタ設定に Unicode Highlight・Minimap を追加
エディタ設定画面に「Unicode Highlight（曖昧文字ハイライト）」と「Minimap」の ON/OFF 設定を追加しました。

#### v1.1.5（2026/05/04）
* 内部ライブラリを更新し、安全性を向上
使用している内部ライブラリを最新版に更新し、セキュリティ面での安全性を高めました。

* プライバシーモードを導入（Privacy Blur）
ウィンドウが非アクティブになったときに画面をぼかして、周囲からの覗き見を防ぐ「Privacy Blur」機能を追加しました。
設定からONにすることで、席を外したときなどにノートの内容を自動的に隠すことができます。

### {todo|今後の予定}

* リビジョン管理  
リビジョンの履歴を自動的に保存（および削除）、過去バージョンへの切り替え

* [キーボードショートカット](#Usage) を使用してノートの編集とプレビューを切り替える

* ログインしているすべてのChromeブラウザ間でノート、改訂履歴、設定を同期

* gistと連携

* プライバシー機能として、Open時と5分間操作がなかった場合に画面をぼやかす機能

* 計算  
  式の即時計算

* カスタマイズ  
  フォントや背景のカスタマイズ

* ライブプレビューを表示するための分割編集

## Usage

* メモの編集とプレビューは下のボタンを押す

* メモの保存は他のメモに切り替えるか
ショートカットキー<kbd>Ctrl</kbd> + <kbd>S</kbd> (または Mac の <kbd>Cmd</kbd> + <kbd>S</kbd>) 
で保存することができる。

## Development

1. このrepoをClone します。

```sh
$ git clone https://github.com/nojaja/memopad-new-tab.git
```


2. 依存関係のインストール
```
$ cd memopad-new-tab
$ npm install
```

3. アプリケーション起動
「npm run serve」によって起動します。
```
$ npm run serve
```
「npm run」は「package.jsonのscripts」に追加されているコマンドが実行されるので、
「serve」に書かれたVite開発サーバーが起動します。

4. ブラウザでアクセス
コンソールにURLが表示されるので、それを開く

5. コーディング

6. ビルド
```
$ npm run build
```
7. Chromeを開き、`chrome://extensions`に移動します。
8. チェックボックス（ページ上部）にチェックを入れて「Developer Mode」を有効にします。
9. 「Load Unpacked Extension」 ボタンをクリックして、クローンしたリポジトリの `dist/`フォルダを選択します。
10. これで拡張機能がロードされ、'New Tab' ページが Memopad New Tab になっているはずです。🎉


## License

Licensed under the [MIT](LICENSE) License.
