const mongoose = require('mongoose')
const { body, validationResult } = require('express-validator') // 引入验证规则
// 菜单
const schemaRules = {
  id: { type: String }, // id
  parentId: { type: String }, // 父级id 默认为0表示顶级
  menuName: { type: String, required: true }, // 菜单名称
  menuType: { type: String, required: true }, // 菜单类型 0目录 1菜单 2按钮
  icon: { type: String, required: false }, // 菜单图标
  path: { type: String, required: false }, // 路由路径
  component: { type: String, required: false }, // 页面路径
  sort: { type: Number, default: true }, // 排序
  perms: { type: String, default: true }, // 权限标识
  createTime: { type: Date, default: Date.now }, // 创建时间，默认为当前时间
  updateTime: { type: Date, default: Date.now }, // 最后更新时间，默认为当前时间
  status: { type: String, default: '1' }, // 状态 1正常 0停用
  isHidden: { type: Boolean, default: true }, // 是否隐藏
  isLink: { type: String, default: '' }, // 外链地址 存在则是外联
  isKeepAlive: { type: Boolean, default: true }, // 是否缓存 1缓存 0不缓存
  isFold: { type: Boolean, default: true }, // 是否折叠
  remark: { type: String, default: '' }, // 备注
}
// 定义用户模型
const menuSchema = new mongoose.Schema(schemaRules)

// 创建用户模型
const Menu = mongoose.model('Menu', menuSchema)

// 预校验规则
const menuValidationRules = () => [
  // 菜单名称
  body('menuName').notEmpty().withMessage('菜单名称不能为空').bail().isLength({ min: 2, max: 20 }).withMessage('菜单名称长度在2-20之间'),
  // 菜单类型
  body('menuType').notEmpty().withMessage('菜单类型不能为空').bail().isIn(['0', '1', '2']).withMessage('菜单类型只能是0,1,2'),
  // 权限标识
  body('perms')
    .notEmpty()
    .withMessage('权限标识不能为空')
    .bail()
    .custom(async (value, { req }) => {
      // 必需唯一 如果有id则排除当前id
      const query = { perms: value }
      if (req.body.id) {
        query.id = { $ne: req.body.id }
      }
      const menu = await Menu.findOne(query)
      if (menu) {
        throw new Error('权限标识已存在')
      }
    }),
  // 排序
  body('sort').notEmpty().withMessage('排序不能为空').bail().isNumeric().withMessage('排序必须为数字'),
  // 状态
  body('status').notEmpty().withMessage('状态不能为空').bail().isString().withMessage('状态必须为字符串').bail().isIn(['1', '0']).withMessage('状态只能是1,0'),
  // 是否隐藏
  body('isHidden').notEmpty().withMessage('是否隐藏不能为空').bail().isBoolean().withMessage('是否隐藏必须为布尔值'),
  // isKeepAlive Boolean
  body('isKeepAlive').optional().isBoolean().withMessage('是否缓存必须为布尔值'),
  // isFold Boolean
  body('isFold').optional().bail().isBoolean().withMessage('是否折叠必须为布尔值'),
]

module.exports = { Menu, schemaRules, menuValidationRules, validationResult }
