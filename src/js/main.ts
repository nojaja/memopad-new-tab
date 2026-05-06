import { createApp } from 'vue'
import App from '@/components/App.vue'
import store from '@/store'
import lang from '@/lang'
import UniconCompat from '@/components/UniconCompat.vue'
import './Debug'

const app = createApp(App)

app.use(store)
app.use(lang)
app.component('UniconIcon', UniconCompat)

app.mount('#app')

store.dispatch('init')
