<template>
  <div>
    <SlideMenu ref="slideMenu">
      <SettingPage></SettingPage>
    </SlideMenu>
    <div class="wrapper">
      <div class="sidebar" :style="{ width : '200px' }">
        <NoteList :items="fileList" :onNew="newProject" :onSelect="loadProject"></NoteList>
        <Footer backgroundColor="#fff" >
          <div  @click="settingOpen"><unicon name="setting" @click="settingOpen"></unicon></div>
        </Footer>
      </div>
      <Contents></Contents>
    </div>
  </div>
</template>

<script>
import NoteList from '@/components/NoteList.vue'
import Contents from '@/components/Contents.vue'
import Footer from '@/components/Footer.vue'
import SlideMenu from '@/components/SlideMenu.vue'
import SettingPage from '@/components/SettingPage.vue'

export default {
  components: {
    NoteList,
    Contents,
    SlideMenu,
    SettingPage,
    Footer
  },
  computed: {
    fileList() {
      return this.$store.getters.refreshFileList
    }
  },
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      items: [
        { name: 'いちご', uri: 'note_1583338656491', isActive: true },
        { name: 'りんご', uri: 'note_1583338656492', isActive: false },
        { name: 'みかん', uri: 'note_1583338656493', isActive: false },
        { name: 'Template - Weekly Planner', uri: 'note_1583338656495', isActive: false }
      ]
    }
  },
  methods: {
    handleResize: function() {
      this.width = window.innerWidth
      this.height = window.innerHeight
    },
    newProject() {
      this.$store.dispatch('newProject')
    },
    loadProject(uri) {
      setTimeout(() => {
        this.$store.dispatch('loadProject', uri)
      }, 0)
    },
    settingOpen(e) {
      this.$refs.slideMenu.open(e)
    }
  },
  mounted: function() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount: function() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style>
.wrapper {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    height: 100vh;
}
.sidebar {
  display: flex;
  flex-direction: column;
  flex: 0 0 200px;
  height: 100%;
  min-height: 0;
}
.blurIn {
    -webkit-animation: blurIn .3s ease both;
    animation: blurIn .3s ease both
}
.blurOut {
    -webkit-animation: blurOut .3s ease both;
    animation: blurOut .3s ease both
}

@-webkit-keyframes blurIn {
    0% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }

    100% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }
}

@keyframes blurIn {
    0% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }

    100% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }
}

@-webkit-keyframes blurOut {
    0% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }

    100% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }
}

@keyframes blurOut {
    0% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }

    100% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }
}
</style>
