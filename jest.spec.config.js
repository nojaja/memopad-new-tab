const baseConfig = require('./jest.config')

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/spec/**/*.test.(js|ts)']
}
