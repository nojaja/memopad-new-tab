/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['src/js'],
  entryPointStrategy: 'expand',
  out: 'docs/typedoc-md',
  plugin: ['typedoc-plugin-markdown'],
  exclude: [
    '**/node_modules/**',
    '**/*.d.ts',
    '**/model/**'
  ],
  tsconfig: './tsconfig.json',
  readme: 'none',
  skipErrorChecking: true
}
