const mongoose = require('mongoose')
const { db1Connection } = require('../index')
const { body, validationResult } = require('express-validator') // 引入验证规则

const schemaRules = {
  id: { type: String }, // 用户ID，必需且唯一
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
  }, // 用户名，必需且唯一
  password: { type: String, required: true }, // 密码，必需
  createTime: { type: Date, default: Date.now }, // 创建时间
  updateTime: { type: Date, default: Date.now }, // 最后更新时间
  // 用户备注
  remark: { type: String, default: '' },
  // 邮箱
  email: { type: String, default: '' },
  // 状态
  status: { type: String, default: '1' }, // 1: 正常，0: 禁用
  // 头像
  avatar: { type: String, default: '' },
  // 性别
  sex: { type: String }, // 0: 女: 男，2: 未知
  // 角色id
  roleIds: { type: Array, default: [] },
  // 是否是管理员
  isAdmin: { type: Boolean, default: false },
  // 所属部门
  deptId: { type: String },
}

// 定义用户模型
const userSchema = new mongoose.Schema(schemaRules)

// 创建用户模型
const User = db1Connection.model('User', userSchema)

// 预校验规则
const userValidationRules = () => [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .bail()
    .isString()
    .withMessage('用户名必须为字符串')
    .bail()
    .custom(async (value, { req }) => {
      // 新增用户时候确保唯一性
      const query = { username: value }
      if (req.body.id) {
        query._id = { $ne: req.body._id }
      }
      const user = await User.findOne(query)
      if (user) {
        throw new Error('用户名已存在')
      }
    })
    .bail()
    .isLength({ min: 3, max: 50 })
    .bail()
    .withMessage('用户名长度为 3 到 50 个字符'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  // 状态
  body('state').optional().isIn([0, 1]).withMessage('状态值不合法'),
  // 性别
  body('sex').notEmpty().withMessage('性别不能为空').bail().isString().withMessage('性别必须为字符串').bail().isIn(['0', '1', '2']).withMessage('性别值不合法'),
  // 角色id集合
  body('roleIds').optional().isArray().withMessage('角色id集合必须为数组'),
  // 头像
  body('avatar').optional().isString().withMessage('头像必须为字符串').bail().isLength({ min: 1, max: 100 }).withMessage('头像长度不合法'),
]

// 导出用户模型
module.exports = { User, schemaRules, validationResult, userValidationRules }
