<template>
  <div class="preview"><iframe id="child-frame" class="preview" :srcdoc="compiledMarkdown" ></iframe></div>
</template>

<script>
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import ruby from 'markdown-it-ruby'
import multimdTable from 'markdown-it-multimd-table'
import checkbox from 'markdown-it-checkbox'
import uml from 'markdown-it-plantuml'

export default {
  components: {
  },
  props: {
    source: {
      type: String,
      required: false,
      default: '# test  \n## hoge'
    },
    config: {
      type: Object,
      required: false,
      default: () => ({
        basicOption: {
          html: true,
          breaks: false,
          linkify: true,
          typography: true
        },
        emoji: true,
        ruby: true,
        uml: true,
        multimdTable: true,
        multimdTableOption: {
          multiline: true,
          rowspan: true,
          headerless: true
        }
      })
    }
  },
  computed: {
    compiledMarkdown: function () {
      const mdInstance = md(this.config.basicOption)
      if (this.config.emoji) mdInstance.use(emoji)
      if (this.config.ruby) mdInstance.use(ruby)
      if (this.config.multimdTable) mdInstance.use(multimdTable, this.config.multimdTableOption)
      if (this.config.checkbox) mdInstance.use(checkbox)
      if (this.config.uml) mdInstance.use(uml)

      const parseData = mdInstance.render(this.source.trim())
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
