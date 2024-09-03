const mongoose = require('mongoose')
const { db1Connection, db2Connection } = require('../index')
const { body, validationResult } = require('express-validator')
const schemaRules = {
  room: String,
  sender: String,
  message: String,
  type: String, // text, image, video, emoji
  timestamp: { type: Date, default: Date.now },
}

// ai 对话记录或者房间
const aiRoomSchema = new mongoose.Schema({
  id: { type: String, default: () => $generateUUID() }, // uuid
  name: { type: String, default: '' },
  createBy: { type: String, default: null }, // 创建者
  createTime: { type: Date, default: Date.now },
  updateBy: { type: String, default: null }, // 更新者
  updateTime: { type: Date, default: Date.now },
})
// 对话的messageList
const aiRoomMessageSchema = new mongoose.Schema({
  id: { type: String, default: () => $generateUUID() }, // uuid
  roomId: { type: String, default: '' },
  contant: { type: Object, default: {} }, // 消息内容list
  createBy: { type: String, default: null }, // 创建者
  createTime: { type: Date, default: Date.now },
  updateBy: { type: String, default: null }, // 更新者
  updateTime: { type: Date, default: Date.now },
})
const aiRoomValidationRules = () => [body('name').notEmpty().withMessage('房间名称不能为空')]

module.exports = {
  AiRoom: db2Connection.model('AiRoom', aiRoomSchema),
  aiRoomValidationRules,
  AiRoomMessage: db2Connection.model('AiRoomMessage', aiRoomMessageSchema),
  Chat: db1Connection.model('Chat', new mongoose.Schema(schemaRules)),
  validationResult,
}
