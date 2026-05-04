const path = require('path')
const dist = __dirname + '/dist'
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const CopyFilePlugin = require('copy-webpack-plugin')
// require('jquery-ui/ui/core.js');
// require('jquery-ui/ui/widgets/resizable.js');
module.exports = {
  lintOnSave: false,
  devServer: {
    allowedHosts: 'all',
    port: 3001,
    host: 'localhost',
    client: {
      overlay: {
        runtimeErrors: (error) => {
          return !(error && error.message === 'ResizeObserver loop completed with undelivered notifications.')
        }
      }
    }
  },
  pages: {
    index: {
      entry: 'src/js/main.ts',
      title: 'New Tab'
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/js/')
      },
      extensions: ['.ts', '.js', '.vue', '.json'],
      fallback: {
        punycode: false
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@vue/cli-plugin-babel/preset',
                  '@babel/preset-typescript'
                ]
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new MonacoWebpackPlugin({
        // https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        // webpack5 compatible version (v7.x)
        languages: ['javascript', 'css', 'html', 'typescript'],
        filename: '[name].worker.js'
      }),
      new CopyFilePlugin({
        patterns: [
          {
            from: 'src/assets/*.json',
            to: dist
          },
          {
            from: 'src/assets/_locales/**/*.*',
            to: dist
          },
          {
            from: 'src/assets/icons/*.*',
            to: dist
          },
          {
            from: 'src/css/github-markdown-css.css',
            to: dist + '/css/github-markdown-css.css'
          }
        ],
        options: {
          concurrency: 100
        }
      })
    ]
  }
}
