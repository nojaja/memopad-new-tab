module.exports = {
  root: true,
  env: {
    node: true,
    webextensions: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: {
      ts: '@typescript-eslint/parser',
      tsx: '@typescript-eslint/parser',
      js: 'babel-eslint',
      jsx: 'babel-eslint'
    },
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    'no-trailing-spaces': ['error', {
      skipBlankLines: true,
      ignoreComments: true
    }]
  }
}
