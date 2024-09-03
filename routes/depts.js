var express = require('express')
var router = express.Router()
const { Dept, deptValidationRules, validationResult } = require('../mongodb/models/dept')
// 添加部门
router.post('/add', deptValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await Dept.create({ ...body, id: $generateUUID() }) // 创建新用户
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 删除部门
router.delete('/delete', async (req, res) => {
  const { id } = req.query
  try {
    const hasChildren = await Dept.findOne({ parentId: id })
    if (hasChildren) return res.send({ code: 500, message: '存在子部门，不允许删除' })
    await Dept.deleteOne({ id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 更新列表
router.put('/update', deptValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body } = req
  try {
    // 更新时间
    body.updateTime = new Date()
    await Dept.updateOne({ id: body.id }, { ...body })
    res.send({ code: 200, message: '修改成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 部门列表
router.post('/list', async (req, res) => {
  const { page = { page: 1, pageSize: 10, isAll: false }, ...data } = req.body
  const query = { ...data, deptName: { $regex: data.deptName ?? '' } }
  try {
    if (page.isAll) {
      const list = await Dept.find(query)
      res.send({ code: 200, message: '获取成功', data: list })
    } else {
      const list = await Dept.find(query)
        .skip((page.page - 1) * page.pageSize)
        .limit(page.pageSize)
      const total = await Dept.countDocuments(query)
      res.send({ code: 200, message: '获取成功', data: list, page: { ...page, total } })
    }
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 部门详情
router.get('/detail', async (req, res) => {
  const { id, ids } = req.query
  try {
    let role
    if (id) {
      role = await Dept.findById(id).select('-permissions')
    } else if (ids) {
      role = await Dept.find({ id: { $in: ids } }).select('-permissions')
    } else {
      return res.send({ code: 400, message: '缺少查询参数' })
    }
    res.send({ code: 200, data: role, message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
module.exports = router
