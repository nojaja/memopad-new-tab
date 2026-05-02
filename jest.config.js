/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'vue', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/js/$1',
    '^monaco-editor$': '<rootDir>/tests/unit/mocks/monaco-editor.js',
    '\\.(css|scss|sass)$': '<rootDir>/tests/unit/styleMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.(js|ts)'],
  testPathIgnorePatterns: ['/node_modules/']
}
