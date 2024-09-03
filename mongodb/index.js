// const mongoose = require('mongoose')
// mongoose.set('strictQuery', true) // 开启严格模式
// // mongoose.connect("mongodb://127.0.0.1:27017/vue3admin", {});
// mongoose.connect('mongodb+srv://qinyu:13512319102.@qycluster.xsk1hfo.mongodb.net/vue3admin')
// const db = mongoose.connection

// db.on('error', console.error.bind(console, 'connection error:'))
// db.once('open', res => console.log('db ok'))
// mongodb+srv://595870773:hAOxUTXHyxNApZfL@cluster0.luetbep.mongodb.net/

var mongoose = require('mongoose')

const connections = [
  // { name: 'db1Connection', url: 'mongodb://127.0.0.1:27017' }, // 本地
  // { name: 'db2Connection', url: 'mongodb://127.0.0.1:27017' }, // 本地
  { name: 'db1Connection', url: 'mongodb+srv://qinyu:13512319102.@qycluster.xsk1hfo.mongodb.net' }, // 线上
  // { name: 'db2Connection', url: 'mongodb+srv://yuqin:13512319102.@cluster0.eb5ss.mongodb.net' }, // 线上
  { name: 'db2Connection', url: 'mongodb+srv://qinyu:13512319102.@qycluster.xsk1hfo.mongodb.net' }, // 线上
]

mongoose.Promise = global.Promise

// 创建连接并导出
const connectionObjects = {}
connections.forEach(connection => retryConnect(connection))
// 重试机制函数 能重试次数
function retryConnect(connection, retryCount = 3) {
  const name = connection.name
  connectionObjects[name] = mongoose.createConnection(connection.url)
  connectionObjects[name].on('connected', function () {
    console.log(`Mongoose 连接成功，连接到 ${name}: ${connection.url}`)
  })
  connectionObjects[name].on('error', function (err) {
    console.log(`Mongoose 连接错误 ${name}: ${err}`)
    if (retryCount > 0) {
      console.log('🚀 ~ retryCount:', retryCount)
      console.log(`Mongoose 正在重试连接 ${name}...`)
      setTimeout(() => retryConnect(connection, retryCount - 1), 5000)
    } else {
      console.log(`Mongoose 连接失败 ${name}`)
      // process.exit(1)
    }
  })
}

module.exports = connectionObjects
