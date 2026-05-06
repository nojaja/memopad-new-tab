const baseConfig = require('./jest.config')

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.(js|ts)',
    '<rootDir>/tests/spec/**/*.test.(js|ts)'
  ]
}
