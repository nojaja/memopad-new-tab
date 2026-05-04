import { createI18n } from 'vue-i18n'
import messages from './messages.json'

/**
 * 処理名: i18n インスタンス生成
 * 処理概要: vue-i18n の i18n インスタンスをデフォルトロケール設定付きで生成する
 * 実装理由: アプリ全体で多言語対応するために単一の i18n インスタンスをエクスポートする
 */
export default createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
})
