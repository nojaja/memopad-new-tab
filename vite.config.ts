import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

export default defineConfig({
  plugins: [
    vue(),
    vueI18n({
      // only include locale message files (avoid processing index.ts)
      include: path.resolve(__dirname, 'src/js/lang/messages.json')
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/manifest.json',
          dest: '.',
          flatten: true,
          transform: (content: string) => {
            const manifest = JSON.parse(content)
            manifest.version = pkg.version
            return JSON.stringify(manifest, null, 2)
          }
        },
        {
          src: 'src/assets/_locales/en/messages.json',
          dest: '_locales/en',
          flatten: true
        },
        {
          src: 'src/assets/_locales/ja/messages.json',
          dest: '_locales/ja',
          flatten: true
        },
        {
          src: 'src/assets/icons/*',
          dest: 'icons',
          flatten: true
        },
        {
          src: 'src/css/github-markdown-css.css',
          dest: 'css',
          flatten: true
        },
        {
          src: 'public/favicon.ico',
          dest: '.',
          flatten: true
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/js')
    }
  },
  optimizeDeps: {
    exclude: ['vue-i18n']
  },
  server: {
    host: 'localhost',
    port: 3001
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
    cssMinify: 'esbuild'
  }
})
