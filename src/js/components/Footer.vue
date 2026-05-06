<template>
  <div
    class="footer"
    :style="{ backgroundColor: backgroundColor }"
  >
    <slot />
  </div>
</template>

<script>

export default {
  name: 'AppFooter',
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
  position: relative;
  left: 0;
  width: 100%;
  flex-shrink: 0;
}
</style>
