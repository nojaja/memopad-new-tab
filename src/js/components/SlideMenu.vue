<template>
  <div>
    <div v-if="panelOpen" class="slide-overlay" @click="close"></div>
    <div class="slide-panel" :class="{ 'slide-panel--open': panelOpen }">
      <template v-if="panelOpen">
        <button
          type="button"
          class="slide-close bm-cross-button"
          aria-label="Close settings"
          @click="close"
        >
          <span class="bm-cross bm-cross-a"></span>
          <span class="bm-cross bm-cross-b"></span>
        </button>
        <div class="bm-item-list">
          <slot></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SlideMenu',
  data() {
    return {
      panelOpen: false
    }
  },
  methods: {
    open(e) {
      if (e) { e.preventDefault(); e.stopPropagation() }
      this.panelOpen = true
    },
    close() {
      this.panelOpen = false
    }
  }
}
</script>

<style>
.slide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}
.slide-panel {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  background-color: rgb(63, 63, 65);
  color: #ffffff;
  overflow-x: hidden;
  padding-top: 0px;
  transition: 0.3s;
  overflow-y: auto;
}
.slide-panel--open {
  width: 100vw;
  max-width: none;
}

.slide-close {
  position: absolute;
  top: 12px;
  right: 2px;
  cursor: pointer;
  border: none;
  background: transparent;
  z-index: 1001;
  padding: 0;
}

.slide-close .bm-cross {
  position: absolute;
  top: 0;
  left: 10px;
  width: 4px;
  height: 24px;
}

.slide-close .bm-cross-a {
  transform: rotate(45deg);
}

.slide-close .bm-cross-b {
  transform: rotate(-45deg);
}
</style>
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
