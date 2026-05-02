import { createApp } from 'vue'
import App from '@/components/App.vue'
import store from '@/store'
import lang from '@/lang'
import UniconCompat from '@/components/UniconCompat.vue'

const app = createApp(App)
app.config.devtools = false

app.use(store)
app.use(lang)
app.component('unicon', UniconCompat)

app.mount('#app')

store.dispatch('init')
