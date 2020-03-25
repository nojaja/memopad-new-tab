import Vue from 'vue'
import VueI18n from 'vue-i18n'

const messages = require('./messages.json')

Vue.use(VueI18n)

export default new VueI18n({
  locale: 'ja',
  messages
})
