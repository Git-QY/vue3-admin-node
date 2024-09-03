const express = require('express')
const { User } = require('../mongodb/models/user')
const router = express.Router()
const { Interview, validationResult, interviewValidationRules, Answer, answerValidationRules } = require('../mongodb/models/interview')
const { BaseService } = require('../utils')
const InterviewService = new BaseService(Interview)
router.post('/add', interviewValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  InterviewService.add(req, res)
})
router.delete('/delete', async (req, res) => {
  const { id, ids } = req.query
  InterviewService.delete(req, res)
})
router.put('/update', interviewValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  InterviewService.update(req, res)
})
router.get('/detail', async (req, res) => {
  const { id, ids } = req.query
  try {
    if (id) {
      if (!id.trim()) res.send({ code: 400, message: '无效的 id 参数' })
      // const data = await Interview.findOne({ id })
      // 连表查询 answerId
      // const data = await Interview.findOne({ id }).populate('answerId', 'answer')
      const data = await Interview.aggregate([
        { $match: { id } },
        { $lookup: { from: 'answers', localField: 'answerId', foreignField: 'id', as: 'answer' } },
        { $unwind: '$answer' },
      ])
      if (data.length == 0) res.send({ code: 400, message: '未找到该资源' })
      res.send({ code: 200, data: data[0], message: '获取成功' })
    } else if (ids) {
      if (!Array.isArray(ids)) res.send({ code: 400, message: 'ids 参数必须是数组' })
      const dataList = await Interview.find({ id: { $in: ids.map(id => id.trim()) } })
      if (dataList.length == 0) res.send({ code: 400, message: '未找到该资源' })
      res.send({ code: 200, data: dataList, message: '获取成功' })
    } else {
      res.send({ code: 400, message: '缺少必要的参数' })
    }
  } catch (error) {
    res.send({ code: 500, message: error.message })
  }
})
router.post('/list', async (req, res) => {
  const { page = { pageSize: 10, page: 1 }, ...data } = req.body
  const query = { ...data, topic: { $regex: data.topic ?? '' } }

  try {
    const list = await Interview.aggregate([
      { $match: query }, // 匹配查询条件
      { $sort: { updateTime: 1 } }, // 按更新时间倒序排序
      { $skip: (page.page - 1) * page.pageSize }, // 跳过指定数量的文档
      { $limit: page.pageSize }, // 限制返回的文档数量
    ])
    // 循环查询
    // 提取所有面试文档中涉及的唯一用户 id
    const userIds = [...new Set(list.map(item => item.createById).concat(list.map(item => item.updateById)))]
    // 并行获取所有用户信息
    const users = await User.find({ id: { $in: userIds } }).lean()
    // 创建用户 id 到用户名的映射，以便快速查找
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user.username
      return acc
    }, {})
    list.forEach(item => {
      item.createBy = userMap[item.createById] || 'Unknown'
      item.updateBy = userMap[item.updateById] || 'Unknown'
    })
    const total = await Interview.countDocuments(query) // 获取符合条件的用户总数
    res.send({ code: 200, data: list, page: { ...page, total }, message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
const AnswerService = new BaseService(Answer)
router.post('/answer/add', answerValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  AnswerService.add(req, res)
})
router.delete('/answer/delete', async (req, res) => {
  AnswerService.delete(req, res)
})
router.put('/answer/update', answerValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  AnswerService.update(req, res)
})
router.get('/answer/detail', async (req, res) => {
  AnswerService.detail(req, res)
})

module.exports = router
