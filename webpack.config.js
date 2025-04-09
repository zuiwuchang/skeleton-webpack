const { WebpackHelper } = require('./webpack.helper')
const path = require('path')
const fs = require('fs')

const ts = Date.now()
const helper = new WebpackHelper({
  dev: false,
  input: './src',
  output: './dist',
  data: {
    // 網址 path 前綴
    prefix: '/',
    // 爲模板返回 url
    url(s) {
      let url = path.join(this.prefix, s)
      if (s.endsWith('.html') || s.endsWith('/')) {
        return url
      }
      if (url.indexOf('?') < 0) {
        url += '?'
      } else {
        url += '&'
      }
      return `${url}ts=${ts}`
    },
  },
})
module.exports = helper.createBuilder({
  entry: helper.createEntry(),
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.done.tap('RemoveFilesAfterBuild', () => {
          fs.unlinkSync(path.join(__dirname, helper.opts.output, 'style.js'))
        })
      }
    },
    helper.createAssets(),
    helper.createCss('style.css'),
    ...helper.createHtml(),
  ],
})