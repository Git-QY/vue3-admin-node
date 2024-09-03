const express = require('express')
const router = express.Router()
const { generateUUID } = require('../utils/index')
const { Menu, menuValidationRules, validationResult } = require('../mongodb/models/menu')

// 新增菜单
router.post('/add', menuValidationRules(), async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body } = req
  try {
    await Menu.create({ ...body, id: generateUUID() })
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})

// 菜单全部列表
router.post('/list', async (req, res, next) => {
  const { page = { page: 1, pageSize: 10, isAll: false }, ...data } = req.body
  const query = { ...data, menuName: { $regex: data.menuName ?? '' } }
  try {
    if (page.isAll) {
      const list = await Menu.find(query)
      // for (const item of list) {
      //   item.path = await buildPath(item.parentId, item.menuName)
      // }
      res.send({ code: 200, message: '获取成功', data: list })
    } else {
      const list = await Menu.find(query)
        .skip((page.page - 1) * page.pageSize)
        .limit(page.pageSize)
      // for (const item of list) {
      //   item.path = await buildPath(item.parentId)
      // }
      const total = await Menu.countDocuments(query)
      res.send({ code: 200, message: '获取成功', data: list, page: { ...page, total } })
    }
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
async function buildPath(pid, name) {
  const pathItems = []
  let currentId = pid

  while (currentId) {
    const menu = await Menu.findOne({ id: currentId })
    if (!menu) break
    pathItems.unshift(menu.menuName) // 将当前菜单项的名称插入到路径数组的开头
    currentId = menu.parentId // 更新当前菜单项的父级ID为当前ID，继续向上查找
  }
  pathItems.push(name)
  return pathItems.join('-') // 将路径数组连接成以 "-" 分隔的路径字符串
}

// 更新菜单
router.put('/update', menuValidationRules(), async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body } = req
  try {
    await Menu.updateOne({ id: body.id }, { ...body })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})

// 删除菜单
router.delete('/delete', async (req, res, next) => {
  const { id } = req.query
  try {
    // 删除的时候如果数据库存在子菜单，则不允许删除
    const hasChildren = await Menu.findOne({ parentId: id })
    if (hasChildren) return res.send({ code: 500, message: '存在子菜单，不允许删除' })
    await Menu.deleteOne({ id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})

// 菜单详情
router.get('/detail', async (req, res, next) => {
  const { id, ids } = req.query
  try {
    let detail
    if (id) {
      detail = await Menu.findOne(id)
    } else if (ids) {
      detail = await Menu.find({ id: { $in: ids } })
    } else {
      return res.send({ code: 400, message: '缺少查询参数' })
    }
    res.send({ code: 200, data: detail, message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})

module.exports = router
