// rollup.config.js
const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const commonjs = require('rollup-plugin-commonjs');
const autoprefixer = require('autoprefixer');
const postcss = require('rollup-plugin-postcss');
const sass = require('rollup-plugin-sass');
const scss = require('node-sass');
const compass = require('compass-importer');

const preprocessor = (content, id) => new Promise((resolve, reject) => {
  const result = scss.render({
    data: content,
    sourceMap: true,
    outputStyle: 'expanded',//'compact',
    importer: compass,
    includePaths: [ 'node_modules/', 'src/scss/', './' ]
  }, function(err, code) {
    if (err) {
      return reject(err)
    }
    resolve({code: code.css.toString()})
  })
})

module.exports = {
  input: 'src/js/index.js',
  output: {
    file: 'build/app.min.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    resolve({
      customResolveOptions: {
        moduleDirectory: ['node_modules']
      }
    }),
    postcss({
      preprocessor,
      sourceMap: true,
      extensions: ['.scss'],
      extract: true
    }),
    commonjs({
      include: 'node_modules/**'
    }),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    uglify()
  ],
  watch: {
    include: ['src/**']
  }
}