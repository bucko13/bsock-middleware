// const path = require('path');

module.exports = {
  entry: './bsockMiddleware.js',
  output: {
    path: __dirname,
    libraryTarget: 'umd',
    filename: 'index.js'
  },
  resolve: {
    symlinks: false,
    extensions: ['-browser.js', '.js', '.json', '.jsx']
  },
  module: {
    rules: [
       {
         test: /\.m?js$/,
         exclude: /(node_modules|bower_components)/,
         use: {
           loader: 'babel-loader',
           options: {
             presets: ['@babel/preset-env'],
             plugins: ['@babel/plugin-proposal-object-rest-spread']
           }
         }
       }
     ]
  }
};
