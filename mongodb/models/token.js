const mongoose = require('mongoose')
const { db1Connection } = require('../index')

const tokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, comment: '用户id' },
  deviceId: { type: String, required: true, comment: '设备id' },
  token: { type: String, required: true, comment: 'token' },
  expiresTime: { type: Date, required: true, comment: '过期时间' },
  createdTime: { type: Date, default: Date.now },
  updatedTime: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true, comment: '是否激活' },
  isExpired: { type: Boolean, default: false, comment: '是否过期' },
})

module.exports = {
  Token: db1Connection.model('Token', tokenSchema),
}
