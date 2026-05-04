<template>
  <div class="noteListMenu">
    <div class="newNote" @click="onNew">+New</div>
    <ul tabindex="0" class="noteList">
      <li class="noteListItem-search">
        <div class="noteListItem-input">
          <UniconIcon class="input-icon" name="search-alt"></UniconIcon>
          <div class="input-wrapper">
            <input type="text" class="input" v-model="itemList.filter" />
          </div>
        </div>
      </li>
      <li class="noteListItem" v-for="item in items" :key="item.uri" v-bind:class="{ active: item.isActive }">
        <div class="noteListItem-text" :data-uri="item.uri" @click="select(item.uri)">
          <div class="container">
            <div class="title">{{ displayTitle(item.name) }}</div>
            <div class="lastUpdatedTime">{{ formatLastUpdatedTime(item.lastUpdatedTime) }}</div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>

export default {
  components: {
  },
  computed: {
    /**
     * 処理名: アイテムリスト取得
     * 処理概要: ストアから検索フィルター状態を含むアイテムリストを返す
     * 実装理由: フィルター状態をストアで集中管理するため
     * @returns {object} フィルター情報を含むアイテムリスト
     */
    itemList() {
      return this.$store.getters.itemList
    }
  },
  props: {
    items: {
      type: Array,
      required: false,
      default: /**
       * 処理名: items デフォルト値
       * 処理概要: ノートリストのデフォルトを空配列で初期化する
       * 実装理由: prop が渡されなかった場合の安全なデフォルト値
       * @returns {Array} 空配列
       */
        function () { return [] }
    },
    onNew: {
      type: Function,
      required: false,
      default: /**
       * 処理名: onNew デフォルトハンドラ
       * 処理概要: 新規作成イベントのデフォルトコールバック（何もしない）
       * 実装理由: prop が渡されなかった場合の安全なデフォルト実装
       */
        function () { }
    },
    onSelect: {
      type: Function,
      required: false,
      default: /**
       * 処理名: onSelect デフォルトハンドラ
       * 処理概要: 選択イベントのデフォルトコールバック（何もしない）
       * 実装理由: prop が渡されなかった場合の安全なデフォルト実装
       */
        function () { }
    }
  },
  methods: {
    /**
     * 処理名: アイテム選択
     * 処理概要: 指定 URI のノートを選択して onSelect コールバックを呼び出す
     * 実装理由: リスト選択時の挙動を親コンポーネントに委譲するため
     * @param {string} uri - 選択されたノートのキー
     */
    select: function (uri) {
      this.onSelect(uri)
    },
    /**
     * 処理名: タイトル整形
    * 処理概要: タイトル先頭が日時プレフィックス（yyyy/mm/dd hh24:mm）で続き文字列がある場合にプレフィックスを除去する
     * 実装理由: ノート一覧で重複した日時表示を避けて可読性を上げるため
     * @param {string} title - 元タイトル
     * @returns {string} 表示用タイトル
     */
    displayTitle: function (title) {
      if (typeof title !== 'string') return ''
      const matched = title.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2})\s*(.+)$/)
      if (matched && matched[2]) {
        return matched[2]
      }
      return title
    },
    /**
     * 処理名: 最終更新日時フォーマット
    * 処理概要: Unix ms を yyyy/mm/dd hh24:mm 形式の文字列に変換する
     * 実装理由: ノート一覧の2段目に統一フォーマットで更新日時を表示するため
     * @param {number} value - Unix ms の最終更新日時
     * @returns {string} フォーマット済み日時
     */
    formatLastUpdatedTime: function (value) {
      if (typeof value !== 'number' || Number.isNaN(value)) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}/${month}/${day} ${hour}:${minute}`
    }
  }
}
</script>

<style>
.noteListMenu {
  position: relative;
  overflow: hidden;
  overflow-y: scroll;
  overflow-x: hidden;
  -ms-overflow-style: none;
  /* IE, Edge 対応 */
  scrollbar-width: none;
  /* Firefox 対応 */
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.noteListMenu::-webkit-scrollbar {
  display: none;
}

.newNote {
  position: sticky;
  top: 0;
  left: auto;
  padding: 18px 16px;
  opacity: .9;
  width: 100%;
  max-width: 100%;
  background: white;
  z-index: 10;
  box-sizing: border-box;
}

.newNote,
.noteListItem {
  display: block;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, .05);
  font-size: 15px;
  min-height: 62px;
  box-sizing: border-box;
}

.newNote,
.noteListItem-search {
  display: block;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, .05);
  font-size: 15px;
  box-sizing: border-box;
}

.newNote:hover,
.noteListItem:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, .01);
}

.noteListItem.active {
  border-left: 3px solid #1e87f0
}

.noteListItem-text {
  padding: 11px 16px;
  -webkit-transition: .3s;
  transition: .3s;
  overflow: hidden;
  min-height: 40px;
  font-size: 14px;
  opacity: .6
}

.title {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.lastUpdatedTime {
  margin-top: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.2;
  opacity: .65;
}

.noteListItem.active .noteListItem-text {
  opacity: .9
}

.noteList {
  height: 100%;
  box-sizing: border-box;
  margin-block-start: 0;
  padding-inline-start: 0;
  margin-block-end: 0;
  outline: none;
}

.input-icon {
  margin-right: 6px;
  -webkit-box-flex: 1;
  -ms-flex: auto 0 0px;
  flex: auto 0 0;
  width: 16px;
  height: 16px;
  color: #2c3e50;
}

.input-wrapper {
  position: relative;
  width: 0;
  -webkit-box-flex: 1;
  -ms-flex: auto 1 1;
  flex: auto 1 1;
}

.noteListItem-input {
  border-radius: 17px;
  display: flex;
  padding: 8px 1px;
  -webkit-transition: .3s;
  transition: .3s;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  height: 17px;
  font-size: 14px;
  opacity: .6;
  position: relative;
}

.input {
  position: relative;
  z-index: 1;
  font-family: inherit;
  font-size: 14px;
  line-height: 14px;
  color: #2c3e50;
  padding: 0;
  width: 100%;
  display: block;
  border: none;
  background: 0 0;
  outline: 0;
}
</style>
