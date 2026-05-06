/**
  const e = this.$refs.foo.getFileLegacy()
  console.log(e)
  e.then(function (result) {
    console.log(result, result.name, result.text, result.File)
  })
***/
<template>
  <div>
    <input
      id="filePicker"
      type="file"
    >
  </div>
</template>

<script>

export default {
    name: 'FileDownload',
  components: {
  },
  methods: {
    /**
     * 処理名: ファイル選択（レガシー）
     * 処理概要: input[type=file] を使ってユーザーにファイルを選択させ Promise で返す
     * 実装理由: 旧ブラウザ互換のファイル選択 API を提供するため
     * @returns {Promise<File>} 選択されたファイルオブジェクト
     */
    getFileLegacy() {
      return new Promise(/**
       * 処理名: ファイル選択 Promise エグゼキュータ
       * 処理概要: input 要素のイベントを監視しファイル選択結果を resolve/reject する
       * 実装理由: Promise ベースの API でファイル選択を非同期化するため
       * @param {Function} resolve - 選択成功時のリゾルバ
       * @param {Function} reject - キャンセル・エラー時のリジェクタ
       */
      function(resolve, reject) {
        const ultag = document.getElementById('filePicker')
        // Reset so selecting the same file again still triggers change.
        ultag.value = ''
        ultag.onchange = /**
         * 処理名: ファイル変更イベントハンドラ
         * 処理概要: 選択されたファイルを resolve または AbortError を reject する
         * 実装理由: ユーザーのファイル選択を Promise チェーンに接続するため
         * @param {Event} event - input change イベント
         */
        function(event) {
          const fileObject = event.target.files[0]
          fileObject ? resolve(fileObject) : reject(new Error('AbortError'))
          ultag.onchange = null
        }
        ultag.click()
      })
    },
    /**
     * 処理名: ファイル保存（レガシー）
     * 処理概要: Blob を生成しアンカータグを使ってブラウザにファイルをダウンロードさせる
     * 実装理由: File System Access API 非対応ブラウザ向けのダウンロード実装
     * @param {string} content - 保存するファイル内容
     * @param {string} filename - ダウンロードファイル名
     * @param {string} contentType - ファイルの MIME タイプ
     */
    saveAsLegacy(content, filename, contentType) {
      contentType = contentType || 'text/plain'
      filename = filename || 'Untitled.txt'

      // const blob = new File([content], '', { type: contentType })
      const blob = new Blob([content], { type: contentType })

      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename)
        // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
        // window.navigator.msSaveOrOpenBlob(blob, filename)
      } else {
        const dltag = document.createElement('a')
        document.body.appendChild(dltag)

        dltag.href = window.URL.createObjectURL(blob)
        dltag.setAttribute('download', filename)
        dltag.click()
        dltag.remove()
      }
    }
  }
}
</script>

<style>
#filePicker {
  display: none
}
</style>
