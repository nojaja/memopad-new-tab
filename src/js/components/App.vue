<template>
  <div id="app">
    <div v-if="isBlurred" class="privacy-blur-overlay"></div>
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
  data() {
    return {
      windowActive: true
    }
  },
  computed: {
    privacyBlurEnabled() {
      return this.$store.getters.config?.general?.privacyBlur === true
    },
    isBlurred() {
      return this.privacyBlurEnabled && !this.windowActive
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('blur', this.handleWindowBlur)
    window.addEventListener('focus', this.handleWindowFocus)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('blur', this.handleWindowBlur)
    window.removeEventListener('focus', this.handleWindowFocus)
  },
  methods: {
    handleWindowBlur() {
      this.windowActive = false
    },
    handleWindowFocus() {
      this.windowActive = true
    },
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
.privacy-blur-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 99999;
  pointer-events: none;
}
</style>
