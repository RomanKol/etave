/**
 * WIP
 */

const path = require('path');
// const webpack = require('webpack');
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
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify('production'),
    // }),
    new CopyWebpackPlugin([
      { from: './popup/popup.html', to: 'popup/popup.html' },
      { from: './options/options.html', to: 'options/options.html' },
      { from: './manifest.json', to: 'manifest.json' },
      { from: './assets/icon.png', to: 'icon.png' },
    ]),
  ],
  devtool: 'sourcemap',
};
