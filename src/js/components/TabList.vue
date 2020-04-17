<template>
  <div class="TabListMenu">
    <ul tabindex="0" class="TabList">
      <li class="TabListItem" v-for="item in items" :key="item.uri" v-bind:class="{ active: item.isActive }">
        <div class="TabListItem-text" :data-uri="item.uri" @click="select(item.uri)">
            <div class="container">
              <div class="title">{{item.name}}</div>
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
  props: {
    items: {
      type: Array,
      required: false,
      default: function () { return [] }
    },
    onNew: {
      type: Function,
      required: false,
      default: function () {}
    },
    onSelect: {
      type: Function,
      required: false,
      default: function () {}
    }
  },
  methods: {
    select: function (uri) { // リスト選択時の挙動制御
      for (const i in this.items) {
        if (this.items[i].uri === uri) {
          this.items[i].isActive = true
        } else {
          this.items[i].isActive = false
        }
      }
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
    display: block;
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,.05);
    font-size: 15px;
    height: 32px;
    box-sizing: border-box;
}

.TabListItem:hover {
    opacity: 1;
    background-color: rgba(0,0,0,.01);
}

.TabListItem.active {
    border-left: 3px solid #87f01e;
}

.TabListItem-text {
    padding: 4px 16px;
    -webkit-transition: .3s;
    transition: .3s;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    height: 17px;
    font-size: 14px;
    opacity: .6
}

.TabListItem.active .noteListItem-text {
    opacity: 1
}

.TabList {
    padding: 0px 0;
    height: 100%;
    box-sizing: border-box;
    margin-block-start: 0;
    padding-inline-start: 0;
    margin-block-end: 0;
    outline: none;
}

</style>
