import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/manifest.json',
          dest: '.'
        },
        {
          src: 'src/assets/_locales/en/messages.json',
          dest: '_locales/en'
        },
        {
          src: 'src/assets/_locales/ja/messages.json',
          dest: '_locales/ja'
        },
        {
          src: 'src/assets/icons/*',
          dest: 'icons'
        },
        {
          src: 'src/css/github-markdown-css.css',
          dest: 'css'
        },
        {
          src: 'public/favicon.ico',
          dest: '.'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/js')
    }
  },
  server: {
    host: 'localhost',
    port: 3001
  },
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020'
  }
})
