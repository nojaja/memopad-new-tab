<template>
  <div class="setting-wrapper">
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
        <Select :items="sortSelectItems" :selected="localConfig.general.sort" :onSelect="(newValue) => {localConfig.general.sort = newValue}"></Select>
        <!--
        <h3 class="h3">カバー</h3>
        <Select :items="coverSelectItems" :selected="config.general.cover"></Select>
        -->
        <h3 class="h3">Language</h3>
        <Select :items="selectItems" :selected="localConfig.general.i18n_locale" :onSelect="(newValue) => {localConfig.general.i18n_locale = newValue}"></Select>

        <h3 class="h3">Import Data</h3>
        <button class="button" @click="importLocalStorage"><unicon name="import" fill="white"></unicon>Import Data</button>
        <h3 class="h3">Export Data</h3>
        <button class="button" @click="exportLocalStorage"><unicon name="export" fill="white"></unicon>Export Data</button>
        <download ref="export"></download>
      </div>
      <div v-else-if="currentId === '2'">
        <h1 class="h1">Editor</h1>
        <h3 class="h3">FontSize</h3>
        <input class="option" type="number" v-model="localConfig.editor.fontSize" number>

        <!--
        <h3 class="h3">FontFamily</h3>
        <select class="option">
          <option value="de">更新日</option>
          <option value="en-US">作成日</option>
        </select>
        -->

        <h3 class="h3">Tab Size</h3>
        <input class="option" type="number" v-model="localConfig.editor.tabSize" number>

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
          <input type="checkbox" v-model="localConfig.markdown.basicOption.html" class="toggle-checkbox">
          <label class="label">html - Set ON to enable HTML tags in memo. </label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.basicOption.breaks" class="toggle-checkbox">
          <label class="label">breaks - Set ON to convert \n in paragraphs into &lt;br&gt;.</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.basicOption.linkify" class="toggle-checkbox">
          <label class="label">linkify - Set ON to autoconvert URL-like text to links.</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.basicOption.typography" class="toggle-checkbox">
          <label class="label">typography - Set ON to enable some language-neutral replacement + quotes beautification (smartquotes).</label>
        </div>

        <h3 class="h3">Extensions</h3>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.emoji" class="toggle-checkbox">
          <label class="label">Emoji - Set ON to enable Emoji syntax </label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.ruby" class="toggle-checkbox">
          <label class="label">Ruby - Set ON to enable ruby</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.uml" class="toggle-checkbox">
          <label class="label">UML - Set ON to enable UML</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.multimdTable" class="toggle-checkbox">
          <label class="label">Enable multimdTable</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.multimdTableOption.multiline" class="toggle-checkbox">
          <label class="label">Enable multimdTable.multiline</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.multimdTableOption.rowspan" class="toggle-checkbox">
          <label class="label">Enable multimdTable.rowspan</label>
        </div>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.multimdTableOption.headerless" class="toggle-checkbox">
          <label class="label">Enable multimdTable.headerless</label>
        </div>

        <h3 class="h3">multibyte</h3>
        <div>
          <input type="checkbox" v-model="localConfig.markdown.multibyteconvert" class="toggle-checkbox">
          <label class="label">Enable convert</label>
        </div>
        <draggable tag="ul" v-model="multibyteconvertList" item-key="id" class="list-group" handle=".handle">
          <template #item="{element, index}">
            <li class="ListItem">
              <div>
                <unicon class="handle" name="bars" fill="white"></unicon>
                <input type="text" class="form-control text" v-model="element.reg" />
                <input type="text" class="form-control text" v-model="element.val" />
                <button class="button-small del" @click="removeMultibyteconvertList(index)"><unicon name="times" fill="white" width="16px"></unicon></button>
              </div>
            </li>
          </template>
        </draggable>
        <button class="button-small-secondary" @click="addMultibyteconvertList">+ Add Record</button>
      </div>
    </div>
  </div>
</template>

<script>
import TabList from '@/components/TabList.vue'
import Select from '@/components/Select.vue'
import Download from '@/components/Download.vue'
// import ColorPicker from 'vue-sketch-color-picker'
import draggable from 'vuedraggable'

export default {
  name: 'App',
  components: {
    TabList,
    Select,
    Download,
    draggable
  },
  data() {
    return {
      dragging: true,
      isSyncingStoreConfig: false,
      currentId: '1',
      localConfig: {
        general: {
          sort: '0',
          i18n_locale: 'ja'
        },
        editor: {
          fontSize: 16,
          tabSize: 4
        },
        markdown: {
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
          },
          multibyteconvert: false,
          multibyteconvertList: []
        }
      },
      items: [
        { id: 1, name: 'General', uri: '1', isActive: true },
        { id: 2, name: 'Editor', uri: '2', isActive: false },
        { id: 3, name: 'Markdown', uri: '3', isActive: false }
      ],
      sortSelectItems: [
        { name: 'Desc LastUpdated', value: '0' },
        { name: 'Asc LastUpdated', value: '1' },
        { name: 'Desc Created', value: '2' },
        { name: 'Asc Created', value: '3' }
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
  computed: {
    storeConfig() {
      return this.$store.getters.config
    },
    multibyteconvertList: {
      get: function() {
        const list = this.localConfig.markdown.multibyteconvertList || []
        const ret = list.map((value, index) => {
          return { id: index, reg: value[0], val: value[1] }
        })
        return ret
      },
      set: function(newValue) {
        const ret = newValue.map((value, index) => {
          return [value.reg, value.val]
        })
        this.localConfig.markdown.multibyteconvertList = ret
      }
    }
  },
  created() {
    this.syncLocalConfig(this.storeConfig)
  },
  watch: {
    storeConfig: {
      handler: function(val) {
        this.syncLocalConfig(val)
      },
      deep: false
    },
    localConfig: {
      handler: function(val) {
        if (this.isSyncingStoreConfig) return
        this.$store.dispatch('setConfig', this.cloneConfig(val))
      },
      deep: true
    }
  },
  methods: {
    nextFrame() {
      return new Promise((resolve) => {
        setTimeout(resolve, 0)
      })
    },
    parseJsonSafe(raw, fallback) {
      if (typeof raw !== 'string') return fallback
      try {
        const parsed = JSON.parse(raw)
        return parsed == null ? fallback : parsed
      } catch (e) {
        return fallback
      }
    },
    mergeNoteKeyList(...lists) {
      const set = new Set()
      lists.forEach((list) => {
        if (!Array.isArray(list)) return
        list.forEach((key) => {
          if (typeof key !== 'string') return
          if (!key.startsWith('note_')) return
          set.add(key)
        })
      })
      return Array.from(set)
    },
    isLikelyProjectContainer(raw) {
      if (typeof raw !== 'string') return false
      return raw.indexOf('"files"') !== -1 && raw.indexOf('"projectName"') !== -1
    },
    cloneConfig(config) {
      return JSON.parse(JSON.stringify(config || {}))
    },
    syncLocalConfig(config) {
      this.isSyncingStoreConfig = true
      this.localConfig = this.cloneConfig(config)
      Promise.resolve().then(() => {
        this.isSyncingStoreConfig = false
      })
    },
    removeMultibyteconvertList(idx) {
      this.localConfig.markdown.multibyteconvertList.splice(idx, 1)
    },
    addMultibyteconvertList() {
      this.localConfig.markdown.multibyteconvertList.push(['', ''])
    },
    selectItem(uri) {
      this.currentId = uri
    },
    exportLocalStorage() {
      localStorage.setItem('currentVersion', '0.0.1')
      this.$refs.export.saveAsLegacy(JSON.stringify(localStorage))
    },
    async importLocalStorage() {
      const cmp = this
      try {
        await cmp.$store.dispatch('setImporting', true)
        const selectedFile = await this.$refs.export.getFileLegacy()
        const result = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            resolve(event.target.result)
          }
          reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
          reader.readAsText(selectedFile)
        })

        const importData = cmp.parseJsonSafe(result, {})
        const currentVersion = importData.currentVersion || '0.0.1'
        const existingNoteKeyList = cmp.parseJsonSafe(localStorage.getItem('noteKeyList'), [])
        const importedNoteKeyList = cmp.parseJsonSafe(importData.noteKeyList, [])
        const importedNoteKeys = []
        const allKeys = Object.keys(importData)

        for (let i = 0; i < allKeys.length; i++) {
          const key = allKeys[i]
          if (key === 'config') {
            cmp.$store.dispatch('setConfig', cmp.parseJsonSafe(importData[key], {}))
          } else if (key.indexOf('note_') !== -1) {
            if (currentVersion === '0.1.4') {
              if (cmp.isLikelyProjectContainer(importData[key])) {
                localStorage.setItem(key, importData[key])
              } else {
                const parsed = cmp.parseJsonSafe(importData[key], null)
                cmp.$store.dispatch('importProject', parsed || {})
              }
            } else {
              localStorage.setItem(key, importData[key])
            }
            importedNoteKeys.push(key)
          }

          // Yield on every entry so heavy imports do not block the UI thread.
          if (i < allKeys.length - 1) {
            await cmp.nextFrame()
          }
        }

        const mergedNoteKeyList = cmp.mergeNoteKeyList(existingNoteKeyList, importedNoteKeyList, importedNoteKeys)
        cmp.$store.dispatch('replaceNoteKeyList', mergedNoteKeyList)
      } catch (e) {
        console.warn('Import canceled or failed:', e)
      } finally {
        await cmp.nextFrame()
        await cmp.$store.dispatch('setImporting', false)
      }
    }
  }
}
</script>

<style>
.setting-wrapper {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  width: 100%;
  box-sizing: border-box;
  color: #ffffff;
}

.setting-wrapper > div:first-child {
  -webkit-box-flex: 0;
  -ms-flex: 0 0 200px;
  flex: 0 0 200px;
}

.setting-wrapper > div:nth-child(2) {
  -webkit-box-flex: 1;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  min-width: 0;
}

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
    background-color: rgb(72, 201, 160);
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
.button:hover {
    background-color: rgb(3, 197, 136);
}
.button-small {
    background-color: rgb(72, 201, 160);
    color: rgb(255, 255, 255);
    font-size: 11px;
    height: 20px;
    cursor: pointer;
    vertical-align: middle;
    -webkit-box-align: center;
    align-items: center;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0px 8px;
    border-radius: 2px;
}
.button-small:hover {
    background-color: rgb(3, 197, 136);
}
.button-small-secondary {
    background-color: rgb(128, 128, 128);
    color: rgb(255, 255, 255);
    font-size: 11px;
    height: 20px;
    cursor: pointer;
    vertical-align: middle;
    -webkit-box-align: center;
    align-items: center;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0px 8px;
    border-radius: 2px;
}
.button-small-secondary:hover {
    background-color: rgb(71, 71, 71);
}
.ListItem {
    display: block;
    border-bottom: 1px solid rgba(0,0,0,.05);
    font-size: 15px;
    height: 34px;
    box-sizing: border-box;
}
.handle {
  cursor: pointer;
}
.del {
  margin-left: 5px;
  padding: 1px 1px;
}
.text {
  display: inline-block;
  margin-left: 5px;
  font-size: 16px;
  height: 30px;
  border-width: initial;
  border-style: none;
  border-color: initial;
  -o-border-image: initial;
  border-image: initial;
  -webkit-box-flex: 1;
  -ms-flex: 1 1 0%;
  flex: 1 1 0%;
  outline: none;
  box-sizing: border-box;
  -moz-box-sizing: border-box; /* Firefox */
  -webkit-box-sizing: border-box; /* Chrome, Safari */
  border-radius: 2px;
}
</style>
