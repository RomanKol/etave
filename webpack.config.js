/**
 * WIP
 */

/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}] */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: path.join(__dirname, '/src'),
  entry: {
    background: './background.js',
    'popup/popup': './popup/popup.jsx',
    'options/options': './options/options.jsx',
  },
  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name].js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        // Babel options are in .babelrc
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
  // resolve: {
  //     // This allows you to import modules just like you would in a NodeJS app.
  //     extensions: ['.js', '.jsx'],
  //     root: [
  //         path.resolve(__dirname),
  //     ],
  //     modules: [
  //         'src',
  //         'node_modules',
  //     ],
  // },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Etave popup',
      template: path.join(__dirname, '/src/index.html'),
      filename: 'popup/popup.html',
      chunks: ['popup/popup'],
    }),
    new HtmlWebpackPlugin({
      title: 'Etave options',
      template: path.join(__dirname, '/src/index.html'),
      filename: 'options/options.html',
      chunks: ['options/options'],
    }),
    new CopyWebpackPlugin([
      { from: './manifest.json', to: 'manifest.json' },
      { from: './assets/icon.png', to: 'icon.png' },
    ]),
  ],
};
