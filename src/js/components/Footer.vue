<template>
  <div class="footer" v-bind:style="{ backgroundColor: this.backgroundColor }">
    <slot></slot>
  </div>
</template>

<script>

export default {
  components: {
  },
  props: {
    backgroundColor: {
      type: String,
      required: false,
      default: '#aaa'
    }
  }
}
</script>

<style>
.footer {
  min-height: 32px;
  height: auto;
  position: fixed;
  bottom: 0;
  width: 100%;
}
</style>
