/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', isolatedModules: true }, diagnostics: false }],
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'vue', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/js/$1',
    '^monaco-editor$': '<rootDir>/tests/unit/mocks/monaco-editor.js',
    '\\.(css|scss|sass)$': '<rootDir>/tests/unit/styleMock.js',
    '^vue-i18n$': '<rootDir>/node_modules/vue-i18n/dist/vue-i18n.cjs.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.(js|ts)'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(vue-i18n|@intlify|@vue)/)'
  ],
  collectCoverageFrom: [
    'src/js/**/*.{ts,vue}',
    '!src/js/shims-vue.d.ts',
    '!src/js/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 50,
      branches: 50,
      functions: 50,
      statements: 50
    }
  }
}
