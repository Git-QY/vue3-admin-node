var express = require('express') // 引入Express框架
var path = require('path') // 引入路径处理模块
var cookieParser = require('cookie-parser') // 引入处理Cookie的模块
var { checkToken } = require('./utils/token')

var app = express() // 创建Express应用程序实例
app.use(express.json()) // 解析JSON请求体
app.use(express.urlencoded({ extended: false })) // 解析URL编码的请求体
app.use(cookieParser()) // 使用Cookie解析中间件
app.use(express.static(path.join(__dirname, 'public'))) // 设置静态文件目录
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:9000') // 允许的来源域名
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With,token')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true') // 允许携带凭据
  res.header('X-Powered-By', '3.2.1')
  next()
}) //  跨域
require('./mongodb') // 链接mongodb
require('./utils/init') // 初始化
require('./utils/global') // 设置全局变量
app.use(checkToken) // 验证token
require('./utils/route')(app) // 注册路由

module.exports = app // 导出Express应用程序实例
