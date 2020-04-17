<template>
  <div>
    <Slide :isOpen="this.isOpen" :burgerIcon="false" ref="slideMenu" style="width: 100%;" >
      <slot></slot>
    </Slide>
  </div>
</template>

<script>
import { Slide } from 'vue-burger-menu'

export default {
  name: 'App',
  components: {
    Slide
  },
  data () {
    return {
      width: window.innerWidth
    }
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
  },
  methods: {
    handleResize: function () {
      console.log('resize')
      this.width = window.innerWidth
      // this.$refs.slideMenu.$children[0].width = this.width
    },
    open (e) {
      // console.log('Open')
      if (e)e.preventDefault()
      if (e)e.stopPropagation()
      // this.$refs.slideMenu.openMenu()
      // console.log(this.$refs.slideMenu)
      this.$refs.slideMenu.$children[0].width = this.width
      this.$refs.slideMenu.$children[0].openMenu()
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
.bm-burger-button {
  position: fixed;
  width: 36px;
  height: 30px;
  left: 36px;
  top: 36px;
  cursor: pointer;
}
.bm-burger-bars {
  background-color: #373a47;
}
.line-style {
  position: absolute;
  height: 20%;
  left: 0;
  right: 0;
}
.cross-style {
  position: absolute;
  top: 12px;
  right: 2px;
  cursor: pointer;
}
.bm-cross {
  background: #bdc3c7;
}
.bm-cross-button {
  height: 24px;
  width: 24px;
}
.bm-menu {
  height: 100%; /* 100% Full-height */
  width: 0; /* 0 width - change this with JavaScript */
  position: fixed; /* Stay in place */
  z-index: 1000; /* Stay on top */
  top: 0;
  left: 0;
  background-color: rgb(63, 63, 65); /* Black*/
  overflow-x: hidden; /* Disable horizontal scroll */
  padding-top: 0px; /* Place content 60px from the top */
  transition: 0.5s; /*0.5 second transition effect to slide in the sidenav*/
}

.bm-overlay {
  background: rgba(0, 0, 0, 0.3);
}
.bm-item-list {
  color: #ffffff;
  margin-left: 0px;
  font-size: 20px;
}
.bm-item-list > * {
  display: flex;
  text-decoration: none;
  padding: 0.7em;
}
.bm-item-list > * > span {
  margin-left: 10px;
  font-weight: 700;
  color: white;
}
</style>
