<template>
  <div class="preview"><iframe id="child-frame" class="preview" :srcdoc="compiledMarkdown" ></iframe></div>
</template>

<script>
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import ruby from 'markdown-it-ruby'

export default {
  components: {
  },
  props: {
    source: {
      type: String,
      required: false,
      default: '# test  \n## hoge'
    }
  },
  computed: {
    compiledMarkdown: function () {
      const parseData = md({
        html: true,
        breaks: false,
        linkify: true,
        typography: true
      })
        .use(emoji).use(ruby)
        .render(this.source.trim())
      const htmlheader = `
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link href="./css/github-markdown-css.css" rel="stylesheet"></link>
</head>
<body>
`
      const htmlfooter = `
</body>
</html>
`
      return (htmlheader + parseData + htmlfooter)
    }
  },
  methods: {
  }
}
</script>

<style>
.preview {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
