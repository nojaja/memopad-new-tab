const fs = require('fs')
const path = require('path')

describe('vite config i18n plugin', () => {
  test('vite.config.ts contains vueI18n plugin include for src/js/lang', () => {
    const configPath = path.resolve(__dirname, '../../vite.config.ts')
    const content = fs.readFileSync(configPath, 'utf8')
    expect(content).toMatch(/import\s+vueI18n\s+from\s+['"]@intlify\/vite-plugin-vue-i18n['"]/) // import
    expect(content).toContain('vueI18n(') // plugin usage
    expect(content).toContain("src/js/lang/**") // include path
  })
})
