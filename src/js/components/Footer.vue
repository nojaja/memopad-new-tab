<template>
  <div class="footer">
    <slot></slot>
  </div>
</template>

<script>

export default {
  components: {
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
  background-color: #aaa;
}
</style>
