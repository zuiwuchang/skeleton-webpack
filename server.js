const { WebpackHelper, WebpackServer } = require('./webpack.helper')
const path = require('path')

new WebpackServer({
    port: 4000,
    // hostname: '0.0.0.0',
    webpack: new WebpackHelper({
        dev: true,
        input: './src',
        output: './dist',
        data: {
            // 爲 art 模板設置網址 path 前綴
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
                return `${url}ts=${Date.now()}`
            },
        },
    }),
})
