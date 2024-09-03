var express = require('express')
var router = express.Router()
const { Dict, DictItem, dictPreValidate, dictItemPreValidate, validationResult } = require('../mongodb/models/dict')
// 新增字典
router.post('/add', dictPreValidate(), async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await Dict.create({ ...body, createById: user.id })
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 字典列表
router.post('/list', async (req, res, next) => {
  const { page = { page: 1, pageSize: 10 }, ...data } = req.body
  const query = { ...data, dictName: { $regex: data.dictName ?? '' } }
  try {
    const result = await Dict.aggregate([
      { $match: query },
      { $skip: (page.page - 1) * page.pageSize },
      { $limit: page.pageSize },
      // 聚合查询 createById和updateById 关联user
      { $lookup: { from: 'users', localField: 'createById', foreignField: 'id', as: 'createdBy' } },
      { $lookup: { from: 'users', localField: 'updateById', foreignField: 'id', as: 'updatedBy' } },
      { $addFields: { createdBy: { $arrayElemAt: ['$createdBy.username', 0] }, updatedBy: { $arrayElemAt: ['$updatedBy.username', 0] } } },
    ])
    const total = await Dict.countDocuments(query) // 获取符合条件的用户总数
    res.send({ code: 200, message: '查询成功', data: result, page: { ...page, total } })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 更新字典
router.put('/update', dictPreValidate(), async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await Dict.updateOne(
      { id: body.id },
      {
        ...body,
        updateById: user.id,
        updateTime: new Date(),
      },
    )
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 删除字典
router.delete('/delete', async (req, res, next) => {
  const { id } = req.query
  try {
    const dictItem = await DictItem.find({ dictId: id }) // 判断是否有字典项
    if (dictItem.length > 0) return res.send({ code: 500, message: '该字典下有字典项，请先删除字典项' })
    await Dict.deleteOne({ id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 新增字典项
router.post('/item/add', dictItemPreValidate(), async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await DictItem.create({ ...body, createById: user.id })
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 字典项列表
router.post('/item/list', async (req, res, next) => {
  const { page = { page: 1, pageSize: 10 }, ...data } = req.body
  const query = { ...data }
  try {
    const result = await DictItem.aggregate([
      { $match: query },
      { $skip: (page.page - 1) * page.pageSize },
      { $limit: page.pageSize },
      // 聚合查询 createById和updateById 关联user
      { $lookup: { from: 'users', localField: 'createById', foreignField: 'id', as: 'createdBy' } },
      { $lookup: { from: 'users', localField: 'updateById', foreignField: 'id', as: 'updatedBy' } },
      { $addFields: { createdBy: { $arrayElemAt: ['$createdBy.username', 0] }, updatedBy: { $arrayElemAt: ['$updatedBy.username', 0] } } },
    ])
    const total = await DictItem.countDocuments(query) // 获取符合条件的用户总数
    res.send({ code: 200, message: '查询成功', data: result, page: { ...page, total } })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 更新字典项
router.put('/item/update', dictItemPreValidate(), async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await DictItem.updateOne(
      { id: body.id },
      {
        ...body,
        createById: user.id,
        updateTime: new Date(),
      },
    )
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 删除字典项
router.delete('/item/delete', async (req, res, next) => {
  const { id } = req.query
  try {
    await DictItem.deleteOne({ id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
module.exports = router
