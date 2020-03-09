const path = require('path');
const src = __dirname + "/src";
const dist = __dirname + "/dist";
const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyFilePlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");

module.exports = {
  devtool: 'source-map',
  context: src,
  entry: {
    main: './js/index.js',
    style: './css/index.css'
  },
  output: {
    filename: '[name].js',
    path: dist,
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [{ // MiniCssExtractPlugin.loaderÇéwíË
               loader: MiniCssExtractPlugin.loader,
               options: {
                    publicPath: '../',
               },
            },
            'css-loader'
      ]
    }, {
      test: /\.html$/,
      use: ['html-loader']
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
    new MonacoWebpackPlugin(),
    new HtmlWebpackPlugin({//htmlÇsrcîzâ∫Ç≈ä«óùâ¬î\Ç…Ç∑ÇÈ
      template: "./html/index.html"
    }),
    new MiniCssExtractPlugin({
        filename: 'css/[name].css',
    }),
    new CopyFilePlugin(
        [
            {
                context: "src",
                from: "assets/*.json",
                to: dist
            }
        ],
        { copyUnmodified: true }
    ),
    new WriteFilePlugin()
  ]
};