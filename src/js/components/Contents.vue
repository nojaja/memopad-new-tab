<template>
  <div v-bind:style="{ height: this.height-20-50+'px' , width : '100%' }" >
    <div class="titleSection">
      <input placeholder="Title" :value="title" @input="updateTitle">
    </div>
    <SplitpanesWrapper :hideEditPane="hideEditPane" :hidePreviewPane="hidePreviewPane" :source="source" :config="config"></SplitpanesWrapper>
    <Footer>
      <button @click="hideEditPane = false;hidePreviewPane=true"><unicon name="edit"></unicon></button>
      <button @click="hideEditPane = false;hidePreviewPane=false"><unicon name="columns"></unicon></button>
      <button @click="hideEditPane = true;hidePreviewPane=false"><unicon name="eye"></unicon></button>
      <button @click="this.delete"><unicon name="trash-alt"></unicon></button>
    </Footer>
  </div>
</template>

<script>
import SplitpanesWrapper from '@/components/SplitpanesWrapper.vue'
import Footer from '@/components/Footer.vue'
import DialogHelper from '@/DialogHelper.js'
import store from '@/store'
import i18n from '@/lang'

export default {
  components: {
    SplitpanesWrapper,
    Footer
  },
  store,
  computed: {
    source () {
      return this.$store.getters.source
    },
    config () {
      return this.$store.getters.config
    },
    title () {
      const file = this.$store.getters.currentFile.file
      return (file ? file.description : '')
    }
  },
  data () {
    return {
      hideEditPane: false,
      hidePreviewPane: false,
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  methods: {
    handleResize: function () {
      this.width = window.innerWidth
      this.height = window.innerHeight
    },
    updateTitle (e) {
      this.$store.commit('updateTitle', e.target.value)
    },
    delete () {
      DialogHelper.showDialog(this, {
        subject: 'Delete',
        message: i18n.tc('message.Delete'),
        ok: () => {
          this.$store.commit('deleteProject')
        },
        cancel: () => {}
      })
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style>
.titleSection {
    display: flex;
    height: 50px;
    width: 100%;
    border-width: 0px 0px 1px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.26);
}
.titleSection input {
    font-size: 24px;
    height: 100%;
    background-color: transparent;
    color: #2c3e50;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0px 12px;
    flex: 1 1 0%;
    outline: none;
    box-sizing: border-box;
}
</style>
