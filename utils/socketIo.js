const { Server } = require('socket.io')
const mongoose = require('mongoose')
const { Chat } = require('../mongodb/models/chat')
const http = require('http')
module.exports = function (app) {
  const server = http.createServer(app) // 创建一个 HTTP 服务器并传入 Express 应用
  const io = new Server(server) // 使用 socket.io 绑定到服务器
  // io.use((socket, next) => {
  //   // 在这里使用 Express 中间件进行身份验证
  //   authenticateToken(socket.request, {}, err => {
  //     if (err) return next(new Error('Authentication error'))
  //     return next()
  //   })
  // })
  // 当有新的连接建立时
  io.on('connection', socket => {
    // 处理加入房间的事件
    socket.on('joinRoom', ({ room, username }) => {
      socket.join(room) // 加入指定房间
      // 发送加入消息给房间内其他用户
      socket.to(room).emit('message', { user: 'admin', text: `${username} has joined!` })

      // 处理发送消息的事件
      socket.on('sendMessage', async ({ message, type }) => {
        // 创建新的聊天记录并保存到数据库
        const msg = await Chat.create({ room, sender: username, message, type })
        // 向房间内所有用户广播消息
        io.to(room).emit('message', msg)
      })

      // 处理断开连接的事件
      socket.on('disconnect', () => {
        // 发送用户离开消息给房间内所有用户
        io.to(room).emit('message', { user: 'admin', text: `${username} has left.` })
      })
    })

    // 处理获取历史消息的事件
    socket.on('getHistory', async room => {
      // 查询指定房间的聊天记录并按时间戳排序
      const messages = await Chat.find({ room }).sort('timestamp')
      // 将历史消息发送给发起请求的客户端
      socket.emit('history', messages)
    })
  })
}
