<template>
  <div id="app">
    <MainContents></MainContents>
  </div>
</template>

<script>
import MainContents from '@/components/MainContents.vue'

export default {
  name: 'App',
  components: {
    MainContents
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    handleKeydown(e) {
      if (e.ctrlKey && e.key === 's') {
        this.saveProject(e)
      }
    },
    saveProject(e) {
      e.preventDefault()
      this.$store.dispatch('saveProject')
      this.showToast('Save Project')
    },
    showToast(message, duration = 900) {
      const toast = document.createElement('div')
      toast.textContent = message
      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:8px 16px;border-radius:4px;z-index:9999;font-size:14px'
      document.body.appendChild(toast)
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast)
      }, duration)
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
