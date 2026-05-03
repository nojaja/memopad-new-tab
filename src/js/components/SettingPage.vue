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
        <FilterSelect :items="sortSelectItems" :selected="localConfig.general.sort" :onSelect="(newValue) => {localConfig.general.sort = newValue}"></FilterSelect>
        <!--
        <h3 class="h3">カバー</h3>
        <Select :items="coverSelectItems" :selected="config.general.cover"></Select>
        -->
        <h3 class="h3">Language</h3>
        <FilterSelect :items="selectItems" :selected="localConfig.general.i18n_locale" :onSelect="(newValue) => {localConfig.general.i18n_locale = newValue}"></FilterSelect>

        <h3 class="h3">Privacy Blur</h3>
        <div>
          <input type="checkbox" v-model="localConfig.general.privacyBlur" class="toggle-checkbox">
          <label class="label">Privacy Blur - Set ON to blur the screen when the window is inactive.</label>
        </div>

        <h3 class="h3">Import Data</h3>
        <button class="button" @click="importLocalStorage"><UniconIcon name="import" fill="white"></UniconIcon>Import Data</button>
        <h3 class="h3">Export Data</h3>
        <button class="button" @click="exportLocalStorage"><UniconIcon name="export" fill="white"></UniconIcon>Export Data</button>
        <FileDownload ref="export"></FileDownload>
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
        <DraggableList tag="ul" v-model="multibyteconvertList" item-key="id" class="list-group" handle=".handle">
          <template #item="{element, index}">
            <li class="ListItem">
              <div>
                <UniconIcon class="handle" name="bars" fill="white"></UniconIcon>
                <input type="text" class="form-control text" v-model="element.reg" />
                <input type="text" class="form-control text" v-model="element.val" />
                <button class="button-small del" @click="removeMultibyteconvertList(index)"><UniconIcon name="times" fill="white" width="16px"></UniconIcon></button>
              </div>
            </li>
          </template>
        </DraggableList>
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
  name: 'SettingPage',
  components: {
    TabList,
    FilterSelect: Select,
    FileDownload: Download,
    DraggableList: draggable
  },
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: 設定ページで管理するローカル設定状態と UI 状態を初期化する
   * 実装理由: ストア設定を直接変更せずローカルコピーで編集するため
   * @returns {object} 初期データオブジェクト
   */
  data() {
    return {
      dragging: true,
      isSyncingStoreConfig: false,
      currentId: '1',
      localConfig: {
        general: {
          sort: '0',
          i18n_locale: 'ja',
          privacyBlur: false
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
    /**
     * 処理名: ストア設定取得
     * 処理概要: ストアから現在のアプリ設定を返す
     * 実装理由: ストア設定の変更を watch で検知してローカル設定に同期するため
     * @returns {object} アプリ設定オブジェクト
     */
    storeConfig() {
      return this.$store.getters.config
    },
    multibyteconvertList: {
      get: /**
       * 処理名: 多バイト変換リストゲッター
       * 処理概要: localConfig の多バイト変換リストをドラッグ可能な形式に変換する
       * 実装理由: vuedraggable が必要とする id フィールドを付加するため
       * @returns {Array} id・reg・val を持つオブジェクト配列
       */
      function() {
        const list = this.localConfig.markdown.multibyteconvertList || []
        const ret = list.map((value, index) => {
          return { id: index, reg: value[0], val: value[1] }
        })
        return ret
      },
      set: /**
       * 処理名: 多バイト変換リストセッター
       * 処理概要: ドラッグ後のリストを元の [パターン, 置換] 形式に変換して保存する
       * 実装理由: ドラッグによる並び替え後のデータをストア形式に戻すため
       * @param {Array} newValue - ドラッグ後の新しいリスト
       */
      function(newValue) {
        const ret = newValue.map((value) => {
          return [value.reg, value.val]
        })
        this.localConfig.markdown.multibyteconvertList = ret
      }
    }
  },
  /**
   * 処理名: 作成時初期化
   * 処理概要: ストア設定をローカル設定へ同期して初期表示状態を整える
   * 実装理由: 初回表示時にフォームとストア設定を一致させるため
   * @returns {void} なし
   */
  created() {
    this.syncLocalConfig(this.storeConfig)
  },
  watch: {
    storeConfig: {
      handler: /**
       * 処理名: ストア設定変更ウォッチャー
       * 処理概要: ストア設定が変更されたときにローカル設定を同期する
       * 実装理由: 外部からの設定変更をローカル状態に反映するため
       * @param {object} val - 新しい設定値
       */
      function(val) {
        this.syncLocalConfig(val)
      },
      deep: false
    },
    localConfig: {
      handler: /**
       * 処理名: ローカル設定変更ウォッチャー
       * 処理概要: ローカル設定変更時にストアへ設定をディスパッチする（同期中は無視）
       * 実装理由: ユーザーの設定変更をリアルタイムにストアへ反映するため
       * @param {object} val - 新しいローカル設定値
       */
      function(val) {
        if (this.isSyncingStoreConfig) return
        this.$store.dispatch('setConfig', this.cloneConfig(val))
      },
      deep: true
    }
  },
  methods: {
    /**
     * 処理名: 次フレーム待機
     * 処理概要: setTimeout(0) を Promise でラップして 1 フレーム待機する
     * 実装理由: 重い処理中に UI スレッドをブロックしないよう yield するため
     * @returns {Promise<void>} 次フレームで resolve する Promise
     */
    nextFrame() {
      return new Promise(/**
       * 処理名: フレーム待機エグゼキュータ
       * 処理概要: setTimeout で次のイベントループに resolve を遅延する
       * 実装理由: Promise ベースの非同期処理として実装するため
       * @param {Function} resolve - Promise リゾルバ
       */
      (resolve) => {
        setTimeout(resolve, 0)
      })
    },
    /**
     * 処理名: 安全な JSON パース
     * 処理概要: JSON 文字列を安全にパースし失敗時はフォールバック値を返す
     * 実装理由: 不正な JSON による例外を防いでフォールバック値で継続するため
     * @param {*} raw - パース対象の値
     * @param {*} fallback - パース失敗時の代替値
     * @returns {*} パース結果またはフォールバック値
     */
    parseJsonSafe(raw, fallback) {
      if (typeof raw !== 'string') return fallback
      try {
        const parsed = JSON.parse(raw)
        return parsed == null ? fallback : parsed
      } catch {
        return fallback
      }
    },
    /**
     * 処理名: ノートキーリストマージ
     * 処理概要: 複数のノートキーリストを重複排除して統合する
     * 実装理由: インポート時に既存・インポート済みのキーを一つのリストにまとめるため
     * @param {...Array} lists - マージ対象のノートキー配列
     * @returns {Array} 重複排除された統合ノートキー配列
     */
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
    /**
     * 処理名: プロジェクトコンテナ判定
     * 処理概要: 文字列が files・projectName を含むプロジェクトコンテナ形式か判定する
     * 実装理由: インポート時にデータ形式を識別して適切な処理に分岐するため
     * @param {*} raw - 検査対象の値
     * @returns {boolean} プロジェクトコンテナ形式なら true
     */
    isLikelyProjectContainer(raw) {
      if (typeof raw !== 'string') return false
      return raw.indexOf('"files"') !== -1 && raw.indexOf('"projectName"') !== -1
    },
    /**
     * 処理名: 設定ディープコピー
     * 処理概要: 設定オブジェクトを JSON シリアライズ経由でディープコピーする
     * 実装理由: ストア設定への直接参照を避けてローカル編集するため
     * @param {object} config - コピー元の設定オブジェクト
     * @returns {object} ディープコピーされた設定オブジェクト
     */
    cloneConfig(config) {
      return JSON.parse(JSON.stringify(config || {}))
    },
    /**
     * 処理名: ローカル設定同期
     * 処理概要: ストア設定をローカル設定にコピーし同期中フラグを管理する
     * 実装理由: ストア変更時に watch ループを起こさずローカル設定を更新するため
     * @param {object} config - 同期元のストア設定
     */
    syncLocalConfig(config) {
      this.isSyncingStoreConfig = true
      this.localConfig = this.cloneConfig(config)
      Promise.resolve().then(() => {
        this.isSyncingStoreConfig = false
      })
    },
    /**
     * 処理名: 多バイト変換ルール削除
     * 処理概要: 指定インデックスの変換ルールをリストから削除する
     * 実装理由: ユーザーが不要な変換ルールを削除できるようにするため
     * @param {number} idx - 削除対象のインデックス
     */
    removeMultibyteconvertList(idx) {
      this.localConfig.markdown.multibyteconvertList.splice(idx, 1)
    },
    /**
     * 処理名: 多バイト変換ルール追加
     * 処理概要: 空のパターン・置換ペアを変換ルールリストに追加する
     * 実装理由: ユーザーが新しい変換ルールを追加できるようにするため
     */
    addMultibyteconvertList() {
      this.localConfig.markdown.multibyteconvertList.push(['', ''])
    },
    /**
     * 処理名: タブアイテム選択
     * 処理概要: 選択されたタブの URI を currentId に設定して表示を切り替える
     * 実装理由: 設定タブ間の切り替えを管理するため
     * @param {string} uri - 選択されたタブの URI
     */
    selectItem(uri) {
      this.currentId = uri
    },
    /**
     * 処理名: データエクスポート
     * 処理概要: localStorage の全データを JSON 文字列としてファイルダウンロードする
     * 実装理由: ユーザーがメモデータをバックアップできるようにするため
     */
    exportLocalStorage() {
      localStorage.setItem('currentVersion', '0.0.1')
      this.$refs.export.saveAsLegacy(JSON.stringify(localStorage))
    },
    /**
     * 処理名: ファイル読み込み
     * 処理概要: FileReader で選択ファイルをテキストとして読み込む Promise を返す
     * 実装理由: FileReader の非同期 API を Promise ベースでラップするため
     * @param {File} selectedFile - 読み込むファイルオブジェクト
     * @returns {Promise<string>} ファイル内容の文字列
     */
    readFile(selectedFile) {
      return new Promise(/**
       * 処理名: FileReader Promise エグゼキュータ
       * 処理概要: FileReader のイベントを監視して読み込み結果を resolve/reject する
       * 実装理由: コールバック API を Promise チェーンに変換するため
       * @param {Function} resolve - 読み込み成功時のリゾルバ
       * @param {Function} reject - 読み込み失敗時のリジェクタ
       */
      (resolve, reject) => {
        const reader = new FileReader()
        reader.onload = /**
         * 処理名: 読み込み完了ハンドラ
         * 処理概要: 読み込み完了時にファイル内容で Promise を resolve する
         * 実装理由: FileReader の onload イベントを Promise に接続するため
         * @param {ProgressEvent} event - ファイル読み込みイベント
         * @returns {void} なし
         */
        (event) => { resolve(event.target.result) }
        reader.onerror = /**
         * 処理名: 読み込みエラーハンドラ
         * 処理概要: 読み込みエラー時に Promise を reject する
         * 実装理由: FileReader のエラーを Promise チェーンで処理するため
         * @returns {void} なし
         */
        () => reject(reader.error || new Error('Failed to read file'))
        reader.readAsText(selectedFile)
      })
    },
    /**
     * 処理名: バージョン 0.1.4 ノートインポート
     * 処理概要: バージョン 0.1.4 形式のノートを適切な方法でストレージにインポートする
     * 実装理由: バージョン固有のインポートロジックを分離して複雑度を下げるため
     * @param {string} key - ノートのストレージキー
     * @param {object} importData - インポートデータオブジェクト
     */
    importNote0_1_4(key, importData) {
      if (this.isLikelyProjectContainer(importData[key])) {
        localStorage.setItem(key, importData[key])
      } else {
        const parsed = this.parseJsonSafe(importData[key], null)
        this.$store.dispatch('importProject', parsed || {})
      }
    },
    /**
     * 処理名: インポートキー処理
     * 処理概要: インポートデータの 1 エントリを種別に応じて処理する
     * 実装理由: ループ本体を抽出して importLocalStorage の認知複雑度を下げるため
     * @param {string} key - 処理対象のキー
     * @param {object} importData - インポートデータオブジェクト
     * @param {string} currentVersion - インポートデータのバージョン文字列
     * @param {Array} importedNoteKeys - インポート済みノートキーを収集する配列
     * @returns {void} なし
     */
    processImportKey(key, importData, currentVersion, importedNoteKeys) {
      if (key === 'config') {
        this.$store.dispatch('setConfig', this.parseJsonSafe(importData[key], {}))
      } else if (key.indexOf('note_') !== -1) {
        if (currentVersion === '0.1.4') {
          this.importNote0_1_4(key, importData)
        } else {
          localStorage.setItem(key, importData[key])
        }
        importedNoteKeys.push(key)
      }
    },
    /**
     * 処理名: データインポート
     * 処理概要: ファイル選択ダイアログからデータをインポートしてストアを更新する
     * 実装理由: ユーザーがバックアップデータを復元できるようにするため
     * @returns {Promise<void>} インポート完了後に resolve する Promise
     */
    async importLocalStorage() {
      const cmp = this
      try {
        await cmp.$store.dispatch('setImporting', true)
        const selectedFile = await this.$refs.export.getFileLegacy()
        const result = await this.readFile(selectedFile)

        const importData = cmp.parseJsonSafe(result, {})
        const currentVersion = importData.currentVersion || '0.0.1'
        const existingNoteKeyList = cmp.parseJsonSafe(localStorage.getItem('noteKeyList'), [])
        const importedNoteKeyList = cmp.parseJsonSafe(importData.noteKeyList, [])
        const importedNoteKeys = []
        const allKeys = Object.keys(importData)

        for (let i = 0; i < allKeys.length; i++) {
          cmp.processImportKey(allKeys[i], importData, currentVersion, importedNoteKeys)
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
