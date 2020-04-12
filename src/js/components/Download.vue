/**
  const e = this.$refs.foo.getFileLegacy()
  console.log(e)
  e.then(function (result) {
    console.log(result, result.name, result.text, result.File)
  })
***/
<template>
  <div>
  <input type="file" id="filePicker">
  </div>
</template>

<script>

export default {
  components: {
  },
  methods: {
    getFileLegacy () {
      return new Promise(function (resolve, reject) {
        const ultag = document.getElementById('filePicker')
        ultag.onchange = function (event) {
          const fileObject = event.target.files[0]
          fileObject ? resolve(fileObject) : reject(new Error('AbortError'))
        }
        ultag.click()
      })
    },
    saveAsLegacy (content, filename, contentType) {
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
