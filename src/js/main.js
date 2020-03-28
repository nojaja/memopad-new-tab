import Vue from 'vue'
import App from './App.vue'
import store from './store'
import Unicon from 'vue-unicons'
import { uniTrashAlt, uniEdit, uniColumns, uniEye } from 'vue-unicons/src/icons'
import GlobalEvents from 'vue-global-events'
import Toasted from 'vue-toasted'
import VueI18n from 'vue-i18n'
import lang from './lang'

Vue.config.productionTip = false

// register globally
Vue.component('GlobalEvents', GlobalEvents)

Unicon.add([uniTrashAlt, uniEdit, uniColumns, uniEye])
Vue.use(Unicon)
Vue.use(Toasted)
Vue.use(VueI18n)

new Vue({
  store,
  i18n: lang,
  created: function () {
    // `this` は vm インスタンスを指します
    console.log('created : ' + this.a)
    this.$store.dispatch('init')
  },
  render: h => h(App)
}).$mount('#app')
