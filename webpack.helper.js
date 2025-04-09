const Koa = require('koa')
const KoaStatic = require('koa-static')
const webpack = require('webpack')
const MemoryFS = require('memory-fs')
const fs = require('fs')
const path = require('path')
const art = require('art-template')
const glob = require('glob')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')

// 更改 art 從 template 檔案夾中加載子模板
art.defaults.include =
    /**
     * @param   {string}    filename
     * @param   {Object}    data
     * @param   {Object}    blocks
     * @param   {Object}    options
     * @return  {string}
     */
    function (filename, data, blocks) {
        const source = fs.readFileSync(path.join(__dirname, 'template', filename), { encoding: 'utf8' })
        return art.compile(source)(data, blocks)
    }

/**
 * 對項目 webpack 進行打包，以便於同時用於生成編譯，和開發時的自動編譯
 */
class WebpackHelper {
    /**
     * @param {object} [opts] 
     * @param {boolean} [opts.dev] - 是否處於開發模式
     * @param {string} [opts.input] - 輸入檔案夾，默認爲 './src'
     * @param {string} [opts.output] - 輸出檔案夾，默認爲 './dist'
     * @param {object} [data] - 傳遞給 art 的 data.env
     */
    constructor(opts) {
        if (opts === null || opts === undefined) {
            opts = {
                dev: false,
                input: './src',
                output: './dist',
                data: {},
            }
        } else if (typeof opts == "object") {
            const input = opts.input ?? './src'
            if (typeof input !== "string") {
                throw new Error("opts.input invalid")
            }
            const output = opts.output ?? './dist'
            if (typeof output !== "string") {
                throw new Error("opts.output invalid")
            }
            const data = opts.data ?? {}
            if (typeof data !== "object") {
                throw new Error("opts.data invalid")
            }
            opts = {
                dev: opts.dev ? true : false,
                input: input,
                output: output,
                data: data,
            }
        } else {
            throw new Error("opts invalid")
        }
        /**
         * @type {object}
         * @property {boolean} [opts.dev] - 是否處於開發模式
         * @property {string} input - 輸入檔案夾，默認爲 './src'
         * @property {string} output - 輸出檔案夾，默認爲 './dist'
         * @property {object} data - 傳遞給 art 的 data.env
         */
        this.opts = opts
    }

    /**
     * 創建 webpack 配置
     * @param {object} opts 
     * @param {object} [opts.entry] - 輸入
     * @param {object} [opts.output] - 輸出
     * @param {object} [opts.module]
     * @param {object} [opts.resolve]
     * @param {[]} [opts.plugins] - 插件
     * @param {string} [opts.mode] - 模式，默認爲  'production'
     * @param {object} [opts.cache] - 編譯緩存
     * @param {object} [opts.optimization] - 編譯緩存
     */
    createBuilder(opts) {
        const o = this.opts
        return {
            entry: opts.entry ?? {},
            output: opts.output ?? {
                path: path.resolve(__dirname, o.output),
                filename: '[name].js',
            },
            module: opts.module ?? {
                rules: [
                    {
                        test: /\.scss$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            'css-loader',
                            'sass-loader',
                        ],
                    },
                    {
                        test: /\.ts$/,
                        exclude: /node_modules/,
                        use: 'ts-loader',
                    },
                ],
            },
            resolve: opts.resolve ?? {
                extensions: ['.ts'],
            },
            plugins: opts.plugins ?? [],
            mode: opts.mode ?? 'production',
            cache: opts.cache,
            optimization: opts.optimization,
        }
    }

    /**
     * 返回 entry 輸出路徑
     * @param {string} filepath - 要編譯的 typescript 檔案路徑
     * @returns 
     */
    getEntryPath(filepath) {
        const opts = this.opts
        const dir = opts.input
        const name = path.relative(dir, filepath).replace(/\.ts$/, '.js')
        return path.join(__dirname, opts.output, name)
    }
    /**
     * 創建 webpack 配置需要的 entry
     * @overload
     * @param {string} filepath - 要編譯的 typescript 檔案路徑
     * @returns {object}
     */
    /**
     * 查找所有需要編譯的 typescript，並爲它們創建 entry
     * @overload
     * @returns {object}
     */
    createEntry(filepath) {
        const entries = {}
        const dir = this.opts.input
        if (filepath === null || filepath === undefined) {
            let name
            for (filepath of glob.sync(`${dir}/**/*.ts`)) {
                name = path.relative(dir, filepath).replace(/\.ts$/, '')
                entries[name] = `./${filepath}`
            }
            entries['style'] = './style.scss'
        } else {
            const name = path.relative(dir, filepath).replace(/\.ts$/, '')
            entries[name] = `./${filepath}`
        }
        return entries
    }

    /**
     * 返回 html 輸出路徑
     * @param {string} template - art 檔案路徑
     * @returns 
     */
    getHtmlPath(template) {
        const opts = this.opts
        const dir = opts.input
        return path.join(__dirname, opts.output, path.relative(dir, template))
    }
    /**
     * 使用 art 渲染 html
     * @protected
     * @param {string} dir - 輸入檔案夾
     * @param {string} template - art 檔案路徑
     */
    _createHtml(dir, template, dev) {
        // 輸出檔案名
        const filename = path.relative(dir, template)
        // 模板參數檔案
        const datafile = template.replace(/\.html$/, '.js')
        return new HtmlWebpackPlugin({
            template: template,
            filename: filename,
            inject: false, // 關閉自動注入，因為我們在模板中手動處理
            minify: dev ? undefined : { // 設置各種壓縮選項
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true
            },
            templateContent: ({ htmlWebpackPlugin }) => {
                const env = {
                    dev: dev,
                    template: template,
                    filename: filename,
                    scripts: htmlWebpackPlugin.tags.headTags, // webpack 注入的 script 標籤
                }
                Object.assign(env, this.opts.data)
                const data = {}
                if (fs.existsSync(datafile)) {
                    Object.assign(data, require('./' + datafile))
                }
                data.env = env
                Object.assign(data.env, this.opts.data)
                const source = fs.readFileSync(template, { encoding: 'utf8' })
                return art.render(source, data)
            },
        })
    }

    /**
     * 使用 art 渲染 html
     * @overload
     * @param {string} template - art 檔案路徑
     * @returns {[]}
     */
    /**
     * 查找所有 art 並渲染 html
     * @overload
     * @returns {[]}
     */
    createHtml(template) {
        const opts = this.opts
        const dir = opts.input
        const dev = opts.dev
        if (template === null || template === undefined) {
            return glob.sync(`${dir}/**/*.html`).map((template) => {
                return this._createHtml(dir, template, dev)
            })
        } else {
            return this._createHtml(dir, template, dev)
        }
    }
    /**
  * 返回 css 輸出路徑
  * @param {string} filename - css 檔案名稱
  * @returns 
  */
    getCssPath(filename) {
        const opts = this.opts
        return path.join(__dirname, opts.output, filename)
    }
    /**
     * 創建 css 插件
     * @param {string} filename - 輸出的 css 檔案名稱
     * @returns 
     */
    createCss(filename) {
        return new MiniCssExtractPlugin({
            filename: filename,
        })
    }
    /**
     * 創建 copy 插件
     */
    createAssets() {
        const opts = this.opts
        return new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, opts.input, 'assets'),
                    to: path.join(__dirname, opts.output, 'assets'),
                },
            ],
        })
    }
}
module.exports.WebpackHelper = WebpackHelper

class Completer {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve_ = resolve
            this.reject_ = reject
        })
    }
    resolve(v) {
        const f = this.resolve_
        if (f) {
            this.resolve_ = undefined
            this.reject_ = undefined
            f(v)
        }
    }
    reject(e) {
        const f = this.reject_
        if (f) {
            this.resolve_ = undefined
            this.reject_ = undefined
            f(e)
        }
    }
}
class Builder {
    constructor(cfg, filename) {
        const compiler = webpack(cfg)
        compiler.outputFileSystem = new MemoryFS()
        this.compiler = compiler
        this.filename = filename
    }
    /**
     * 
     * @returns {Promise<string>}
     */
    build() {
        let c = this.c
        if (!c) {
            c = new Completer()
            this.c = c
            try {
                const compiler = this.compiler
                compiler.run((err, stats) => {
                    if (err) {
                        if (this.c == c) {
                            this.c = undefined
                        }
                        c.reject(err)
                        return
                    } else if (stats.hasErrors()) {
                        if (this.c == c) {
                            this.c = undefined
                        }
                        c.reject(stats.toString())
                        return
                    }
                    try {
                        const s = compiler.outputFileSystem.readFileSync(this.filename, { encoding: 'utf8' })
                        if (this.c == c) {
                            this.c = undefined
                        }
                        console.log(stats.toString())
                        c.resolve(s)
                    } catch (e) {
                        if (this.c == c) {
                            this.c = undefined
                        }
                        c.reject(e)
                    }
                })
            } catch (e) {
                if (this.c == c) {
                    this.c = undefined
                }
                c.reject(e)
            }
        }
        return c.promise
    }
}

/**
 * 一個 web 服務器，動態調用 webpack 編譯內容以方便開發
 */
class WebpackServer {
    /**
     * @param {object} opts
     * @param {string} [opts.port] - 監聽端口，默認爲 9000
     * @param {string} [opts.hostname] - 監聽地址，默認爲 '127.0.0.1'
     * @param {WebpackHelper} opts.webpack - WebpackHelper 實例用於動態編譯
     */
    constructor(opts) {
        if (!(opts.webpack instanceof WebpackHelper)) {
            throw new Error("opts.webpack invalid")
        }
        const port = opts.port ?? 9000
        if (typeof port !== "number") {
            throw new Error("opts.port invalid")
        }
        const hostname = opts.hostname ?? '127.0.0.1'
        if (typeof hostname !== "string") {
            throw new Error("opts.hostname invalid")
        }
        const webpack = opts.webpack
        /**
         * @type WebpackHelper
         * @readonly
         */
        this.webpack = webpack

        // 創建 web 服務器
        const app = new Koa()

        const keys = new Map()

        // 攔截需要動態編譯的內容
        app.use(async (ctx, next) => {
            await next()
            if (ctx.method != 'GET') {
                return
            }
            try {
                const url = ctx.URL
                let template = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname
                if (template.endsWith('.html')) {// 使用 art 渲染 html
                    template = path.join(webpack.opts.input, template)
                    if (fs.existsSync(template)) {
                        let builder = keys.get(template)
                        if (!builder) {
                            builder = new Builder(
                                webpack.createBuilder({
                                    plugins: [
                                        webpack.createHtml(template),
                                    ],
                                    cache: {
                                        type: 'memory',
                                    },
                                }),
                                webpack.getHtmlPath(template),
                            )
                            keys.set(template, builder)
                        }
                        const s = await builder.build()
                        ctx.type = 'text/html; charset=utf-8'
                        ctx.body = s
                        return
                    }
                } else if (template.endsWith('.js') && !template.startsWith('/assets/')) {
                    template = path.join(webpack.opts.input, template.replace(/\.js$/, '.ts'))
                    if (fs.existsSync(template)) {
                        let builder = keys.get(template)
                        if (!builder) {
                            builder = new Builder(
                                webpack.createBuilder({
                                    entry: webpack.createEntry(template),
                                    cache: {
                                        type: 'memory',
                                    },
                                    optimization: {
                                        minimize: false,
                                    },
                                }),
                                webpack.getEntryPath(template),
                            )
                            keys.set(template, builder)
                        }
                        const s = await builder.build()
                        ctx.type = 'application/javascript; charset=utf-8'
                        ctx.body = s
                        return
                    }
                } else if (template == '/style.scss') {
                    let builder = keys.get(template)
                    if (!builder) {
                        const filename = 'style.css'
                        builder = new Builder(
                            webpack.createBuilder({
                                entry: {
                                    'style': './style.scss'
                                },
                                plugins: [
                                    webpack.createCss(filename),
                                ],
                                cache: {
                                    type: 'memory',
                                },
                            }),
                            webpack.getCssPath(filename),
                        )
                        keys.set(template, builder)
                    }
                    const s = await builder.build()
                    ctx.type = 'text/css; charset=utf-8'
                    ctx.body = s
                    return
                }
            } catch (e) {
                console.warn(e)
                ctx.status = 500

                ctx.body = art.render(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>webpack fail</title>
</head>
<body>
<pre>{{e}}</pre>
</body>
</html>`, {
                    e: `${e}`,
                })
                return
            }
        })

        // 返回靜態資產
        app.use(KoaStatic(path.join(__dirname, webpack.opts.input)))

        // 監聽
        app.listen(port, hostname, () => {
            let url = hostname.indexOf(':') < 0 ? hostname : `[${hostname}]`
            if (port != 80) {
                url = `${url}:${port}`
            }
            url = `http://${url}`

            console.log(url)
        })
    }
}
module.exports.WebpackServer = WebpackServer
