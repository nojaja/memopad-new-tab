import { createI18n } from 'vue-i18n'

const messages = require('./messages.json')

export default createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
})
