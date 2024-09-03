const express = require('express')
const router = express.Router()
const { Task, taskPreValidate, validationResult } = require('../mongodb/models/task')

// 新增任务
router.post('/add', taskPreValidate(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await Task.create({ ...body, id: $generateUUID(), createById: user.id }) // 创建新用户
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 删除任务
router.delete('/delete', async (req, res) => {
  const { id } = req.query
  try {
    await Task.deleteOne({ id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 修改任务
router.put('/update', taskPreValidate(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  const { body, user } = req
  try {
    await Task.updateOne({ id: body.id }, { ...body, updateTime: Date.now(), updateById: user.id })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 单独更新某一个字段
const canUpdateField = ['status']
router.put('/update/field', async (req, res) => {
  const { fieldName, fieldValue, id } = req.body
  // 字段的类型格式验证(后续添加)
  if (!canUpdateField.includes(fieldName)) return res.send({ code: 500, message: '该字段不允许更新' })
  if (!fieldName || !fieldValue || !id) return res.send({ code: 500, message: '缺少参数' })
  try {
    const updateField = {}
    updateField[fieldName] = fieldValue
    await Task.updateOne({ id }, { ...updateField, updateTime: Date.now(), updateBy: req.user.name })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 任务列表
router.post('/list', async (req, res) => {
  const { page = { pageSize: 10, page: 1 }, ...data } = req.body
  const query = { ...data, taskName: { $regex: data.taskName ?? '' } }
  try {
    const task = await Task.aggregate([
      { $match: query }, // 匹配查询条件
      { $sort: { createTime: 1 } }, // 按照创建时间升序排序
      { $skip: (page.page - 1) * page.pageSize }, // 跳过指定数量的文档
      { $limit: page.pageSize }, // 限制返回的文档数量
      /**
       *  assigneeId createById updateById连表users查询 对应的username值  返回结果
       * {
       * assigneeId:'id1'
       * createById:'id2'
       * updateById:'id3'
       * assignee:'id1->username1'
       * createBy:'id2->username2'
       * updateBy:'id3->username3'
       * }
       */
      {
        $lookup: {
          from: 'users', // 关联的集合名
          let: { assigneeId: '$assigneeId', createById: '$createById', updateById: '$updateById' },
          pipeline: [{ $match: { $expr: { $in: ['$id', ['$$assigneeId', '$$createById', '$$updateById']] } } }, { $project: { _id: 1, id: 1, username: 1 } }],
          as: 'users',
        },
      },
      /**
       * 把users集合中的数据，合并到task集合中，并删除users集合中的
       * {
       * assignee:'id1->username1'
       * createBy:'id2->username2'
       * updateBy:'id3->username3'
       * }
       */
    ])

    const total = await Task.countDocuments(query) // 获取符合条件的用户总数
    res.send({ code: 200, data: task, page: { ...page, total }, message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})

module.exports = router
