const express = require('express')
const router = express.Router()
const { Role, validationResult, roleValidationRules } = require('../mongodb/models/role')
const { generateUUID } = require('../utils/index')
// 创建角色  (主要是获取菜单资源数据)
router.post('/add', roleValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await Role.create({ ...body, id: generateUUID(), createBy: user.name }) // 创建新用户
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 获取角色列表
router.post('/list', async (req, res) => {
  const { page = { pageSize: 10, page: 1 }, ...data } = req.body
  const query = { ...data, roleName: { $regex: data.roleName ?? '' } }
  try {
    const role = await Role.aggregate([
      { $match: query }, // 匹配查询条件
      { $sort: { sort: 1 } }, // 按创建时间倒序排序
      { $skip: (page.page - 1) * page.pageSize }, // 跳过指定数量的文档
      { $limit: page.pageSize }, // 限制返回的文档数量
      { $project: { field_to_exclude: 0 } }, // 排除指定字段
    ])
    const total = await Role.countDocuments(query) // 获取符合条件的用户总数
    res.send({ code: 200, data: role, page: { ...page, total }, message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 删除角色
router.delete('/delete', async (req, res) => {
  const { id, ids } = req.query
  try {
    if (id) {
      await Role.deleteOne({ id })
    } else if (ids) {
      await Role.deleteMany({ id: { $in: ids } })
    } else {
      return res.send({ code: 400, message: '缺少查询参数' })
    }
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 更新角色
router.put('/update', roleValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { id, ...body } = req.body
  try {
    await Role.updateOne({ id }, { ...body, updateTime: Date.now(), updateBy: req.user.name })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 获取角色详情
router.get('/detail', async (req, res) => {
  const { id, ids } = req.query
  try {
    let role
    if (id) {
      role = await Role.findById(id).select('-permissions')
    } else if (ids) {
      role = await Role.find({ id: { $in: ids } }).select('-permissions')
    } else {
      return res.send({ code: 400, message: '缺少查询参数' })
    }
    res.send({ code: 200, data: role, message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 单独更新某一个字段
const canUpdateField = ['status', 'permissions']
router.put('/update/field', async (req, res) => {
  const { fieldName, fieldValue, id } = req.body
  // 字段的类型格式验证(后续添加)
  if (!canUpdateField.includes(fieldName)) return res.send({ code: 500, message: '该字段不允许更新' })
  if (!fieldName || !fieldValue || !id) return res.send({ code: 500, message: '缺少参数' })
  try {
    const updateField = {}
    updateField[fieldName] = fieldValue
    await Role.updateOne({ id }, { ...updateField, updateTime: Date.now(), updateBy: req.user.name })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 根据角色集合 IDs 获取权限的合集
router.post('/aggregate/permissions', async (req, res) => {
  const { ids } = req.body
  if (!ids || !Array.isArray(ids)) return res.send({ code: 500, message: '参数错误' })
  try {
    const lists = await Role.aggregate([
      { $match: { id: { $in: ids }, status: '1' } },
      { $project: { permissions: 1, _id: 0 } }, // 投影：只返回permissions字段
      { $unwind: '$permissions' }, // 将permissions字段拆分为多个文档
      { $group: { _id: null, permissions: { $addToSet: '$permissions' } } }, // 将permissions字段合并为一个数组
      { $lookup: { from: 'menus', localField: 'permissions', foreignField: 'id', as: 'menus' } }, // 关联菜单表
    ])

    return res.send({ code: 200, data: lists.length ? lists[0] : [], message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
module.exports = router
