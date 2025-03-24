<template>
  <div class="noteListMenu">
    <div class="newNote"  @click="onNew">+New</div>
    <ul tabindex="0" class="noteList">
      <li class="noteListItem-search">
        <div class="noteListItem-input">
            <unicon class="input-icon" name="search-alt"></unicon>
            <div class="input-wrapper">
              <input type="text" class="input" v-model="itemList.filter"/>
            </div>
        </div>
      </li>
      <li class="noteListItem" v-for="item in items" :key="item.uri" v-bind:class="{ active: item.isActive }">
        <div class="noteListItem-text" :data-uri="item.uri" @click="select(item.uri)">
            <div class="container">
              <div class="title">{{item.name}}</div>
            </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import store from '@/store'

export default {
  components: {
  },
  store,
  computed: {
    itemList() {
      return this.$store.getters.itemList
    }
  },
  props: {
    items: {
      type: Array,
      required: false,
      default: function() { return [] }
    },
    onNew: {
      type: Function,
      required: false,
      default: function() {}
    },
    onSelect: {
      type: Function,
      required: false,
      default: function() {}
    }
  },
  methods: {
    select: function(uri) { // リスト選択時の挙動制御
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
.noteListMenu {
    position: relative;
    overflow: hidden;
    overflow-y: scroll;
    -ms-overflow-style: none;    /* IE, Edge 対応 */
    scrollbar-width: none;       /* Firefox 対応 */
    height: 100%;
    width: 200px;
}
.noteListMenu::-webkit-scrollbar {
    display: none;
}
.newNote {
    position: fixed;
    top: 0;
    left: 0;
    padding: 18px 16px;
    opacity: .9;
    width: 200px;
    background: white;
    z-index: 10;
}
.newNote, .noteListItem {
    display: block;
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,.05);
    font-size: 15px;
    height: 54px;
    box-sizing: border-box;
}
.newNote, .noteListItem-search {
    display: block;
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,.05);
    font-size: 15px;
    box-sizing: border-box;
}
.newNote:hover, .noteListItem:hover {
    opacity: 1;
    background-color: rgba(0,0,0,.01);
}

.noteListItem.active {
    border-left: 3px solid #1e87f0
}

.noteListItem-text {
    padding: 18px 16px;
    -webkit-transition: .3s;
    transition: .3s;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    height: 17px;
    font-size: 14px;
    opacity: .6
}

.noteListItem.active .noteListItem-text {
    opacity: .9
}

.noteList {
    padding: 54px 0;
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
