<template>
  <div class="wrapper">
    <div style="width: 200px">
      <h1 class="h1">Settings</h1>
      <div style="width: 200px">
        <TabList :items="items" :onSelect="selectItem"></TabList>
      </div>
    </div>
    <div style="width: 100%">
      <div v-if="currentId === '1'">
        <h1 class="h1">General</h1>
        <h3 class="h3">Sort</h3>
        <Select :items="sortSelectItems" :selected="config.general.sort" :onSelect="(newValue) => {config.general.sort = newValue}"></Select>
        <!--
        <h3 class="h3">カバー</h3>
        <Select :items="coverSelectItems" :selected="config.general.cover"></Select>
        -->
        <h3 class="h3">Language</h3>
        <Select :items="selectItems" :selected="config.general.i18n_locale" :onSelect="(newValue) => {config.general.i18n_locale = newValue}"></Select>

        <h3 class="h3">Import Data</h3>
        <button class="button" @click="this.importLocalStorage"><unicon name="import" fill="white"></unicon>Import Data</button>
        <h3 class="h3">Export Data</h3>
        <button class="button" @click="this.exportLocalStorage"><unicon name="export" fill="white"></unicon>Export Data</button>
        <download ref="export"></download>
      </div>
      <div v-else-if="currentId === '2'">
        <h1 class="h1">Editor</h1>
        <h3 class="h3">FontSize</h3>
        <input class="option" type="number" v-model="config.editor.fontSize" number>

        <!--
        <h3 class="h3">FontFamily</h3>
        <select class="option">
          <option value="de">更新日</option>
          <option value="en-US">作成日</option>
        </select>
        -->

        <h3 class="h3">Tab Size</h3>
        <input class="option" type="number" v-model="config.editor.tabSize" number>

        <!--
        <h3 class="h3">Font Color</h3>
        <div>
          <color-picker :colors.sync="colors" scheme="dark"></color-picker>
        </div>
        -->

      </div>
      <div v-else-if="currentId === '3'">
        <h3 class="h3">markdown Settings</h3>
        <div>
          <ToggleButton v-model="config.markdown.basicOption.html" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">html - Set ON to enable HTML tags in memo. </label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.basicOption.breaks" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">breaks - Set ON to convert \n in paragraphs into &lt;br&gt;.</label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.basicOption.linkify" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">linkify - Set ON to autoconvert URL-like text to links.</label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.basicOption.typography" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">typography - Set ON to enable some language-neutral replacement + quotes beautification (smartquotes).</label>
        </div>

        <h3 class="h3">Extensions</h3>
        <div>
          <ToggleButton v-model="config.markdown.emoji" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Emoji - Set ON to enable Emoji syntax </label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.ruby" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Ruby - Set ON to enable ruby</label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.multimdTable" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Enable multimdTable</label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.multimdTableOption.multiline" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Enable multimdTable.multiline</label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.multimdTableOption.rowspan" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Enable multimdTable.rowspan</label>
        </div>
        <div>
          <ToggleButton v-model="config.markdown.multimdTableOption.headerless" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Enable multimdTable.headerless</label>
        </div>

        <h3 class="h3">multibyte</h3>
        <div>
          <ToggleButton v-model="config.markdown.multibyteconvert" :sync="true"></ToggleButton>
          <label for="checkbox-enable-auto-sync" class="label">Enable convert</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TabList from '@/components/TabList.vue'
import Select from '@/components/Select.vue'
import Download from '@/components/Download.vue'
// import ColorPicker from 'vue-sketch-color-picker'
import { ToggleButton } from 'vue-js-toggle-button'
import store from '@/store'
import i18n from '@/lang'

export default {
  name: 'App',
  components: {
    TabList,
    Select,
    Download,
    // ColorPicker,
    ToggleButton
  },
  data () {
    return {
      currentId: '1',
      items: [
        { id: 1, name: 'General', uri: '1', isActive: true },
        { id: 2, name: 'Editor', uri: '2', isActive: false },
        { id: 3, name: 'Markdown', uri: '3', isActive: false }
      ],
      sortSelectItems: [
        { name: i18n.tc('SettingPage.sortSelectItems.desc_lastUpdatedTime'), value: '0' },
        { name: i18n.tc('SettingPage.sortSelectItems.asc_lastUpdatedTime'), value: '1' },
        { name: i18n.tc('SettingPage.sortSelectItems.desc_createdTime'), value: '2' },
        { name: i18n.tc('SettingPage.sortSelectItems.asc_createdTime'), value: '3' }
      ],
      coverSelectItems: [
        { name: '5min', value: '5' },
        { name: '10min', value: '10' },
        { name: '60min', value: '60' },
        { name: 'none', value: '-1' }
      ],
      fintSizeSelectItems: [
        { name: '16', value: '16' },
        { name: '10min', value: '10' },
        { name: '60min', value: '60' },
        { name: 'none', value: '-1' }
      ],
      selectItems: [
        // { name: '🇩🇪Deutsch', value: 'de' },
        { name: '🇺🇸English (US)', value: 'en' },
        // { name: '🇺🇸English (US)', value: 'en-US' },
        // { name: '🇪🇸Español (España)', value: 'es-ES' },
        // { name: '🇫🇷Français (France)', value: 'fr-FR' },
        { name: '🇯🇵日本語', value: 'ja' }
        // { name: '🇰🇷한국어', value: 'ko' },
        // { name: '🇧🇷Português(BR)', value: 'pt-BR' },
        // { name: '🇺🇦Українська', value: 'uk-UA' },
        // { name: '🇨🇳中文 (CN)', value: 'zh-CN' },
        // { name: '🇭🇰中文 (HK)', value: 'zh-HK' },
        // { name: '🇹🇼中文 (TW)', value: 'zh-TW' }
      ],
      colors: {
        hex: '#194d33',
        hsl: {
          h: 150,
          s: 0.5,
          l: 0.2,
          a: 1
        },
        hsv: {
          h: 150,
          s: 0.66,
          v: 0.30,
          a: 1
        },
        rgba: {
          r: 25,
          g: 77,
          b: 51,
          a: 1
        },
        a: 1
      }
    }
  },
  store,
  computed: {
    config () {
      return this.$store.getters.config
    }
  },
  watch: {
    config: {
      handler: function (val, oldVal) {
        console.log('Config changed', val, oldVal)
        this.$store.dispatch('setConfig', val)
      },
      deep: true
    }
  },
  methods: {
    selectItem (uri) {
      this.currentId = uri
    },
    exportLocalStorage () {
      localStorage.setItem('currentVersion', '0.0.1')
      this.$refs.export.saveAsLegacy(JSON.stringify(localStorage))
    },
    importLocalStorage () {
      const cmp = this
      const e = this.$refs.export.getFileLegacy()
      e.then(function (result) {
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            resolve(event.target.result)
          }
          reader.readAsText(result)
        }).then((result) => {
          const importData = JSON.parse(result)
          const currentVersion = importData.currentVersion || '0.0.1'
          if (currentVersion === '0.0.1') {
            for (const key in importData) {
              if (key === 'config') {
                console.log('import config', importData[key])
                // localStorage.setItem(key, importData[key])
                cmp.$store.dispatch('setConfig', JSON.parse(importData[key]))
              } else if (key.indexOf('note_') !== -1) {
                localStorage.setItem(key, importData[key])
              } else if (key === 'noteKeyList') {
                const array = JSON.parse(localStorage.getItem('noteKeyList')).concat(JSON.parse(importData[key]))
                // 重複を削除したリスト
                const noteKeyList = array.filter(function (x, i, self) {
                  return self.indexOf(x) === i
                })
                localStorage.setItem(key, JSON.stringify(noteKeyList))
              } else {
                console.log('ignore key:' + key + ' value:' + importData[key])
              }
            }
          } else if (currentVersion === '0.1.4') {
            for (const key in importData) {
              if (key.indexOf('note_') !== -1) {
                const note = JSON.parse(importData[key])
                console.log(note)
                // localStorage.setItem(key, importData[key])
                cmp.$store.dispatch('importProject', JSON.parse(importData[key]))
              } else if (key === 'noteKeyList') {
                const array = JSON.parse(localStorage.getItem('noteKeyList')).concat(JSON.parse(importData[key]))
                // 重複を削除したリスト
                const noteKeyList = array.filter(function (x, i, self) {
                  return self.indexOf(x) === i
                })
                localStorage.setItem(key, JSON.stringify(noteKeyList))
              } else {
                console.log('ignore key:' + key + ' value:' + importData[key])
              }
            }
          }
          cmp.$store.dispatch('loadNoteKeyList')
        })
      })
    }
  }
}
</script>

<style>
.h1 {
    margin: 0px;
    padding: 10px 0px;
    font-size: 24px;
}
.h3 {
    font-size: 18px;
}
.checkbox {
    margin-top: 0px;
    margin-right: 0.3125rem;
    margin-left: 0px;
}
.label {
    display: inline-block;
    margin-left: 5px;
    margin-bottom: 0px;
    font-size: 16px;
}
.button {
    background-color: rgb(3, 197, 136);
    color: rgb(255, 255, 255);
    font-size: 16px;
    height: 40px;
    cursor: pointer;
    vertical-align: middle;
    -webkit-box-align: center;
    align-items: center;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0px 16px;
    border-radius: 2px;
}
</style>
