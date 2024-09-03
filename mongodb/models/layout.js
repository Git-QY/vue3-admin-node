const mongoose = require('mongoose')
const { db1Connection } = require('../index')

// 定义字段验证规则
const { body, validationResult } = require('express-validator')

const LayoutItem = {
  i: { type: String, required: true, comment: '模块标识符' },
  name: { type: String, required: true, comment: '模块名称' },
  x: { type: Number, required: true, comment: '模块在布局中的X坐标' },
  y: { type: Number, required: true, comment: '模块在布局中的Y坐标' },
  w: { type: Number, required: true, comment: '模块宽度' },
  h: { type: Number, required: true, comment: '模块高度' },
  display: { type: Boolean, default: false, comment: '模块是否显示' },
  moved: { type: Boolean, default: true, comment: '模块是否可移动过' },
}

const LayoutSchema = {
  id: { type: String, required: true, default: () => $generateUUID(), comment: '唯一标识' },
  userId: { type: String, required: true, comment: '用户ID' },
  viewName: { type: String, required: true, comment: '视图名称' },
  moduleList: { type: [LayoutItem], required: true, comment: '模块列表' },
  sort: { type: Number, default: 0, comment: '排序顺序' },
  createTime: { type: Number, default: Date.now, comment: '创建时间' },
  updateTime: { type: Number, default: Date.now, comment: '更新时间' },
}
// 导出布局模式和验证结果
module.exports = { Layout: db1Connection.model('Layout', new mongoose.Schema(LayoutSchema)), validationResult }
