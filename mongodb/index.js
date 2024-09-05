const Constants = require('../constants')
// 导入 mongoose 模块
const mongoose = require('mongoose')
// 设置默认 mongoose 连接
const mongoDB = `mongodb+srv://${Constants.MONGO_DB.USER}:${Constants.MONGO_DB.PASSWORD}@qycluster.xsk1hfo.mongodb.net`
mongoose.connect(mongoDB)
// 让 mongoose 使用全局 Promise 库
mongoose.Promise = global.Promise
// 取得默认连接
const db = mongoose.connection
// 数据量链接成功
db.on('connected', () => console.log('mongodb 数据库连接成功！'))
// 将连接与错误事件绑定（以获得连接错误的提示）
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'))
