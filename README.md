# Memopad New Tab

[link-cws]: https://chrome.google.com/webstore/detail/iohinadgijcpmclidcgalomljfabkpde "Version published on Chrome Web Store"

[![Licence](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE) 
[![Chrome Web Store](https://img.shields.io/chrome-web-store/users/iohinadgijcpmclidcgalomljfabkpde.svg?label=chrome%20users&style=flat-square)][link-cws]

> Google Chromeの「新規タブ」の拡張機能。  
> 新しいタブを開いて🗒️メモを取ったり、⏰リマインダーを保存したり、🔗リンクを貼り付けたり、または表を作成したりできます。    
> デフォルトの「新規タブ」の代わりとして素早く綺麗で、シンプルに使える事に重点を置いています。


<h2 align="center">
  <a href="./">Preview it!</a>
</h2>

![screenshot](/assets/memopad-new-tab.png)

![Demo GIF](/assets/demo.gif)


## Install

- [**Chrome** extension][link-cws] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/iohinadgijcpmclidcgalomljfabkpde.svg?label=%20">][link-cws]

## About
Memopad New Tabでは、Google Chromeのデフォルトの「新規タブ」の代わりとしてMarkdownエディタになります。

### {Features|特徴}

* 簡単  
新しいタブを開いて、好きなことを書き込めばいいのです。  
次に新しいタブを開いたときには、前回入力した内容が残っています。

* ノートリスト  
必要に応じて複数のメモを作成することができます。

* 強力  
Markdown構文を利用して記載することで、多彩な表現が可能になります。  
Markdownの構文については[この素晴らしいガイド](https://github.github.com/gfm/)を参照してください。

* オフラインで記述  
Memopad New Tabは、サーバー上ではなくブラウザ上に保存してます。  
オフライン環境でもノートの作成や編集が可能です。

### {Upcoming|今後の予定}

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


2. Vue CLIのインストール
今回の開発はVue CLIを使って行いました。
今回はVue CLI 4を使っています。 npmを使ってグローバルにVue CLI 4をインストールします．
```
$ npm install -g @vue/cli
$ vue --version
4.2.3
```

3. VueUI Project Dashboardの起動
何かと便利なので起動しておく
```
$ vue ui
```

4. アプリケーション起動
「npm run serve」によって起動します。
```
$ cd memopad-new-tab
$ npm run serve
```
「npm run」は「packeage.jsonのscripts」に追加されているコマンドが実行されるので、 
「serve」に書かれた「vue-cli-service serve」が実行されます。

5. ブラウザでアクセス
コンソールにURLが表示されるので、それを開く

6. コーディング

7. ビルド
```
$ npm run build
```
8. Chromeを開き、`chrome://extensions`に移動します。
9. チェックボックス（ページ上部）にチェックを入れて「Developer Mode」を有効にします。
10. 「Load Unpacked Extension」 ボタンをクリックして、クローンしたリポジトリの `dist/`フォルダを選択します。
11. これで拡張機能がロードされ、'New Tab' ページが Memopad New Tab になっているはずです。🎉


## License

Licensed under the [MIT](LICENSE) License.
