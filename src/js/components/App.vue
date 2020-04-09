<template>
  <div id="app">
    <MainContents></MainContents>
    <global-events @keydown.ctrl.s="saveProject"></global-events>
  </div>
</template>

<script>
import MainContents from '@/components/MainContents.vue'
import store from '@/store'

export default {
  name: 'App',
  components: {
    MainContents
  },
  props: {
  },
  store,
  methods: {
    saveProject (e) {
      e.preventDefault()
      this.$store.dispatch('saveProject')
      this.$toasted.show('Save Project', { position: 'top-center', duration: 900 })
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=M+PLUS+1p&amp;subset=japanese');
#app {
  font-family: 'M PLUS 1p', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
/*  text-align: center;*/
/*  color: #2c3e50;*/
/*  margin-top: 60px;*/
}
body {
  margin: 0px;
}
</style>
