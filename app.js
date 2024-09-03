var createError = require('http-errors') // 引入HTTP错误模块
var express = require('express') // 引入Express框架
var path = require('path') // 引入路径处理模块
var cookieParser = require('cookie-parser') // 引入处理Cookie的模块
var logger = require('morgan') // 引入日志记录模块
var { checkToken } = require('./utils/token')

require('./mongodb') // 链接mongodb
require('./utils/init') // 初始化

var app = express() // 创建Express应用程序实例

// 设置视图引擎和视图目录
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev')) // 使用开发环境下的日志记录
app.use(express.json()) // 解析JSON请求体
app.use(express.urlencoded({ extended: false })) // 解析URL编码的请求体
app.use(cookieParser()) // 使用Cookie解析中间件
app.use(express.static(path.join(__dirname, 'public'))) // 设置静态文件目录

//  跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:9000') // 允许的来源域名
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With,token')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true') // 允许携带凭据
  res.header('X-Powered-By', '3.2.1')
  next()
})
app.use(checkToken) // 验证token

require('./utils/route')(app) // 自动注册路由
require('./utils/socketIo')(app) // 链接socket

// 捕获404错误并转发到错误处理程序
app.use(function (req, res, next) {
  next(createError(404))
})

// 错误处理程序
app.use(function (err, req, res, next) {
  // 设置本地变量，仅在开发环境中提供错误信息
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // 渲染错误页面
  res.status(err.status || 500)
  res.render('error')
})

// 设置全局变量
const { generateUUID } = require('./utils')
const { verifyToken } = require('./utils/token')

require('dotenv').config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`), // 配置文件路径
  encoding: 'utf8', // 编码方式，默认utf8
  debug: false, // 是否开启debug，默认false
})
global.$generateUUID = generateUUID
global.$verifyToken = verifyToken
global.$base_url = process.env.VITE_API_BASE_URL

module.exports = app // 导出Express应用程序实例
