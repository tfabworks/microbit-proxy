const path = require('path');

var main = {
  mode: process.env.NODE_ENV,
  target: 'electron-main',
  entry: path.join(__dirname, 'src', 'main', 'index'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist')
  },
  node: {
    __dirname: false,
    __filename: false
  },
  module: {
    rules: [{
      test: /.ts?$/,
      include: [
        path.resolve(__dirname, 'src'),
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules'),
      ],
      loader: 'ts-loader',
    }]
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  externals:  {
    serialport: 'commonjs serialport'
  }
};

var renderer = {
  mode: process.env.NODE_ENV,
  target: 'electron-renderer',
  entry: path.join(__dirname, 'src', 'renderer', 'index'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist', 'renderer')
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.css', '.ts', '.tsx']
  },
  module: {
    rules: [{
      test: /\.(tsx|ts)$/,
      use: [
        'ts-loader'
      ],
      include: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'node_modules'),
      ],
    }]
  },
};

module.exports = [
  main, renderer
];
