<template>
  <div>
    <select class="option" v-model="selectedInfo">
      <option v-for="item in dataItems" :value="item.value" :key="item.key">{{item.name}}</option>
    </select>
  </div>
</template>

<script>
export default {
  components: {
  },
  computed: {
    selectedInfo: {
      get: function() {
        return this.dataSelected
      },
      set: function(newValue) {
        this.dataSelected = newValue
        this.onSelect(newValue)
      }
    }
  },
  props: {
    selected: {
      type: String,
      required: false,
      default: ''
    },
    items: {
      type: Array,
      required: false,
      default: function() { return [{ name: 'test', value: '' }] }
    },
    onSelect: {
      type: Function,
      required: false,
      default: function(newValue) { console.log(newValue) }
    }
  },
  data() {
    return {
      dataSelected: this.selected,
      dataItems: this.items
    }
  },
  methods: {
  }
}
</script>

<style>
.option {
    background-color: rgba(255, 255, 255, 0.12);
    color: rgb(255, 255, 255);
    width: 200px;
    height: 40px;
    border-width: initial;
    border-style: initial;
    border-color: rgba(0, 0, 0, 0.26);
    border-image: initial;
    padding: 0px 16px;
    border-radius: 2px;
}
.option option {
    color: initial;
}
</style>
