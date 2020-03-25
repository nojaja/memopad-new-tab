import Vue from 'vue'
import App from './App.vue'
import store from './store'
import Unicon from 'vue-unicons'
import { uniTrashAlt, uniEdit, uniColumns, uniEye } from 'vue-unicons/src/icons'
import GlobalEvents from 'vue-global-events'
import Toasted from 'vue-toasted'

Vue.config.productionTip = false
Vue.config.keyCodes.F9 = 120
Vue.config.keyCodes.SKEY = 83

// register globally
Vue.component('GlobalEvents', GlobalEvents)

Unicon.add([uniTrashAlt, uniEdit, uniColumns, uniEye])
Vue.use(Unicon)
Vue.use(Toasted)

new Vue({
  store,
  created: function () {
    // `this` は vm インスタンスを指します
    console.log('created : ' + this.a)
    this.$store.dispatch('init')
  },
  render: h => h(App)
}).$mount('#app')
