const mongoose = require('mongoose')
const { db1Connection } = require('../index')
const { v4: uuidv4 } = require('uuid')
const { body, validationResult } = require('express-validator')

// 字典
const dictSchemaRules = {
  id: { type: String, default: uuidv4, unique: true },
  dictName: { type: String, required: true }, // 名称
  dictType: { type: String, required: true, unique: true }, // 类型 全局唯一
  remark: { type: String, maxlength: 200 }, // 备注
  sort: { type: Number, default: 0 }, // 排序
  status: { type: String, default: '1' }, // 状态 1:启用 0:禁用
  createTime: { type: Date, default: Date.now }, // 创建时间
  createById: { type: String, default: null, ref: 'User' }, // 创建人
  updateTime: { type: Date, default: Date.now }, // 更新时间
  updateById: { type: String, default: null, ref: 'User' }, // 更新人
}

// 字典项
const dictItemSchemaRules = {
  id: { type: String, default: uuidv4, unique: true },
  dictId: { type: String, required: true }, // 字典id
  dictType: { type: String, required: true }, // 字典code (可以更具type查询下级 则必须唯一)
  parentId: { type: String, default: null }, // 父级id(字典项可能是树形结构)
  label: { type: String, required: true }, // 名称
  value: { type: String, required: true }, // 值
  sort: { type: Number, default: 0 }, // 排序
  remark: { type: String, maxlength: 200 }, // 备注
  status: { type: String, default: '1' }, // 状态 1:启用 0:禁用
  createTime: { type: Date, default: Date.now }, // 创建时间
  createById: { type: String, default: null, ref: 'User' }, // 创建人
  updateTime: { type: Date, default: Date.now }, // 更新时间
  updateById: { type: String, default: null, ref: 'User' }, // 更新人
}

// 创建字典(项)模型
const Dict = db1Connection.model('Dict', new mongoose.Schema(dictSchemaRules))
const DictItem = db1Connection.model('DictItem', new mongoose.Schema(dictItemSchemaRules))

// 预校验
const dictPreValidate = () => [
  body('dictName').notEmpty().withMessage('名称不能为空'),
  body('dictType')
    .notEmpty()
    .withMessage('类型不能为空')
    .bail()
    .custom(async (value, { req }) => {
      const query = { dictType: value }
      if (req.body.id) query.id = { $ne: req.body.id }
      const dict = await Dict.findOne(query)
      if (dict) throw new Error('字典类型已存在')
    }),
  body('remark').optional().isLength({ max: 200 }).withMessage('备注不能超过200个字符'),
  body('status').optional().isIn(['1', '0']).withMessage('状态只能为1或0'),
  body('sort').optional().isInt().withMessage('排序必须为数字'),
]
const dictItemPreValidate = () => [
  body('dictId').notEmpty().withMessage('字典id不能为空'),
  body('dictType').notEmpty().withMessage('字典Type不能为空'),
  body('label').notEmpty().withMessage('名称不能为空'),
  body('value').notEmpty().withMessage('值不能为空'),
  body('remark').optional().isLength({ max: 200 }).withMessage('备注不能超过200个字符'),
  body('status').optional().isIn(['1', '0']).withMessage('状态只能为1或0'),
  body('sort').optional().isInt().withMessage('排序必须为数字'),
]

module.exports = { Dict, DictItem, dictPreValidate, dictItemPreValidate, validationResult }
