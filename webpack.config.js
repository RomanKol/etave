/* eslint-disable */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const config = {
    mode: 'development',
    entry: {
      background: path.resolve(__dirname, './src/background.js'),
      popup: path.resolve(__dirname, './src/popup/index.jsx'),
      options: path.resolve(__dirname, './src/options/index.jsx'),
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      publicPath: './',
      filename: '[name].js',
    },
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loaders: ['babel-loader'],
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          use: [
            'file-loader',
            {
              loader: 'image-webpack-loader',
              options: {
                bypassOnDebug: true,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Etave popup',
        template: path.resolve(__dirname, './src/index.html'),
        filename: 'popup.html',
        chunks: ['popup'],
      }),
      new HtmlWebpackPlugin({
        title: 'Etave options',
        template: path.resolve(__dirname, './src/index.html'),
        filename: 'options.html',
        chunks: ['options'],
      }),
      new CopyWebpackPlugin([
        { from: path.resolve(__dirname, './src/manifest.json'), to: 'manifest.json' },
        { from: path.resolve(__dirname, './src/assets/icon.png'), to: 'icon.png' },
      ]),
    ],
  };

  if (env.NODE_ENV === 'production') {
    config.mode = 'production';
    config.devtool = 'source-map';
  }

  return config;
};
