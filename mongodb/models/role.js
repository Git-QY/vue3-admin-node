const mongoose = require('mongoose')
const { body, validationResult } = require('express-validator') // 引入验证规则
// 角色
const schemaRules = {
  id: { type: String }, // id
  roleName: { type: String, required: true }, // 角色名称
  permissions: { type: Array, default: [] }, // 菜单id集合
  remark: { type: String, default: '' }, // 备注
  status: { type: String, default: '1' }, // 状态 1:启用 0:禁用
  // 标识 不知道有啥用全局唯一么 但是我有id可以不需要这个？
  perms: { type: String, required: true },
  // 排序
  sort: { type: Number, default: 0 },
  // 创建人（解析token 获取）
  createBy: { type: String, default: '' },
  // 更新人
  updateBy: { type: String, default: '' },
  createTime: { type: Date, default: Date.now },
  updateTime: { type: Date, default: Date.now },
}

// 创建用户模型
const Role = mongoose.model('Role', new mongoose.Schema(schemaRules))

// 预校验规则
const roleValidationRules = () => [
  body('roleName').notEmpty().withMessage('角色名称不能为空'),
  body('permissions').optional().isArray().withMessage('权限id集合必须为数组'),
  body('remark').optional().isLength({ max: 100 }).withMessage('备注不能超过100个字符'),
  body('status').optional().isString().withMessage('状态必须为字符串').bail().isIn(['0', '1']).withMessage('状态值错误'),
  body('perms')
    .notEmpty()
    .withMessage('标识不能为空')
    .bail()
    .custom(async (value, { req }) => {
      // 必需唯一 如果有id则排除当前id
      const query = { perms: value }
      if (req.body.id) {
        query.id = { $ne: req.body.id }
      }
      const role = await Role.findOne(query)
      if (role) {
        throw new Error('角色标识存在')
      }
    }),
]

module.exports = { Role, schemaRules, validationResult, roleValidationRules }
