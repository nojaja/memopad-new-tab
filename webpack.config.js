const path = require('path');
const src = __dirname + "/src";
const dist = __dirname + "/dist";
const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyFilePlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");
//require('jquery-ui/ui/core.js');
//require('jquery-ui/ui/widgets/resizable.js');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  context: src,
  entry: {
    main: './js/index.js',
    style: './css/index.css'
  },
  output: {
    filename: '[name].js',
    sourceMapFilename: '[name].map',
    path: dist,
  },
  module: {
    rules: [{
      test: /\.css$/,
      loaders: ["style-loader","css-loader"]
    }, {
        test: /\.(jpe?g|png|gif)$/i,
        loader:"file-loader",
        options:{
          name:'[name].[ext]',
          outputPath:'/assets/images/'
        }
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
      jQuery: 'jquery',
      "window.jQuery": "jquery'",
      "window.$": "jquery"
    }),
    new MonacoWebpackPlugin(),
    new HtmlWebpackPlugin({//htmlÇsrcîzâ∫Ç≈ä«óùâ¬î\Ç…Ç∑ÇÈ
      template: "./html/index.html"
    }),
    new CopyFilePlugin(
        [
            {
                context: "src",
                from: "assets/*.json",
                to: dist
            },
            {
                from: "css/github-markdown-css.css",
                to: dist+"/css"
            }
        ],
        { copyUnmodified: true }
    ),
    new WriteFilePlugin()
  ]
};