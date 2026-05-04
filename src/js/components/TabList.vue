<template>
  <div class="TabListMenu">
    <ul tabindex="0" class="TabList">
      <li
        v-for="item in items"
        :key="item.uri"
        class="TabListItem"
        :class="{ active: isActive(item) }"
      >
        <button
          type="button"
          class="TabListButton"
          :data-uri="item.uri"
          @click="select(item.uri)"
        >
          {{ item.name }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
/**
 * 処理名: items デフォルト値生成
 * 処理概要: タブ配列のデフォルトとして空配列を返す
 * 実装理由: prop 未指定時でも安全に描画するため
 * @returns {Array} 空配列
 */
function createDefaultItems() {
  return []
}

/**
 * 処理名: onSelect デフォルトハンドラ
 * 処理概要: 選択通知が未指定のときに何もしない
 * 実装理由: 親からハンドラが渡されない場合でも安全に動作させるため
 * @returns {void} なし
 */
function noopSelect() {}

export default {
  props: {
    items: {
      type: Array,
      required: false,
      default: createDefaultItems
    },
    onSelect: {
      type: Function,
      required: false,
      default: noopSelect
    }
  },
  methods: {
    /**
     * 処理名: アクティブ判定
     * 処理概要: タブアイテムがアクティブ状態か判定する
     * 実装理由: テンプレートの表示条件をメソッドに分離して可読性を上げるため
     * @param {object} item - 判定対象のタブアイテム
     * @returns {boolean} アクティブ状態なら true
     */
    isActive(item) {
      return !!item?.isActive
    },
    /**
     * 処理名: タブ選択
     * 処理概要: 指定 URI を親に通知する
     * 実装理由: props の直接更新を避けて状態管理責務を親へ委譲するため
     * @param {string} uri - 選択されたタブの URI
     */
    select(uri) {
      this.onSelect(uri)
    }
  }
}
</script>

<style>
.TabListMenu {
    position: relative;
    overflow: hidden;
    overflow-y: scroll;
    -ms-overflow-style: none;    /* IE, Edge 対応 */
    scrollbar-width: none;       /* Firefox 対応 */
    height: 100%;
}
.TabListMenu::-webkit-scrollbar {
    display: none;
}
.TabListItem {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,.05);
    font-size: 15px;
    height: 32px;
  list-style: none;
    box-sizing: border-box;
}

.TabListItem:hover {
    opacity: 1;
    background-color: rgba(0,0,0,.01);
}

.TabListItem.active {
    border-left: 3px solid #87f01e;
}

.TabListButton {
    display: block;
    width: 100%;
    padding: 4px 16px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    -webkit-transition: .3s;
    transition: .3s;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 14px;
    line-height: 32px;
    opacity: .6;
    color: inherit;
    box-sizing: border-box;
}

.TabListItem.active .TabListButton {
    opacity: 1
}

.TabList {
    padding: 0px 0;
  list-style: none;
    height: 100%;
    box-sizing: border-box;
    margin-block-start: 0;
    padding-inline-start: 0;
    margin-block-end: 0;
    outline: none;
}

</style>
