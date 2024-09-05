// 日志
const mongoose = require('mongoose')
const { body, validationResult } = require('express-validator')
const schemaRules = {
  id: { type: String },
  content: { type: String, default: '' }, // 日志内容
  url: { type: String, default: '' }, // 日志来源URL
  method: { type: String, default: '' }, // 请求方法
  ip: { type: String, default: '' }, // 日志来源IP
  address: { type: Object, default: {} }, // ip所属地址
  createById: { type: String, default: '' }, // 提交人id (有可能不存在 当访问接口不存在的token)
  createTime: { type: Date, default: Date.now }, // 创建时间
  updateById: { type: String, default: '' }, 
  updateTime: { type: Date, default: Date.now }, // 更新时间
}

module.exports = { Log: mongoose.model('Log', new mongoose.Schema(schemaRules)), validationResult }
