const path = require('path');
const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.ttf$/,
      use: ['file-loader']
    }]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new MonacoWebpackPlugin()
  ]
};