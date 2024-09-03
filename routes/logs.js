const express = require('express')
const router = express.Router()
const { Log, validationResult } = require('../mongodb/models/log')
const dayjs = require('dayjs')

// 新增日志
router.post('/add', async (req, res) => {
  const { body, user } = req
  try {
    await Log.create({ ...body, id: $generateUUID(), createById: user.id ?? null })
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: '创建失败' })
  }
})
// 删除日志
router.delete('/delete', async (req, res) => {
  const { id } = req.query
  try {
    await Log.deleteOne({ id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: '删除失败' })
  }
})
// 获取日志列表
router.post('/list', async (req, res) => {
  const { page = { pageSize: 10, page: 1 }, ...data } = req.body
  const query = { ...data, url: { $regex: data.url ?? '' } }
  try {
    const logs = await Log.aggregate([
      { $match: query }, // 匹配查询条件
      { $sort: { createTime: -1 } }, // 按照创建时间升序排序
      { $skip: (page.page - 1) * page.pageSize }, // 跳过指定数量的文档
      { $limit: page.pageSize }, // 限制返回的文档数量
      { $lookup: { from: 'users', localField: 'createById', foreignField: 'id', as: 'user' } }, // 通过 $lookup 聚合操作，将日志与用户关联起来
      { $unwind: '$user' }, // 将关联的数组拆分成单独的文档
      { $addFields: { createBy: '$user.username' } }, // 生成一个新字段  updateBy:user.username
      { $project: { user: 0 } }, // 删除 user 字段
    ])
    const total = await Log.countDocuments(query)
    res.send({ code: 200, data: logs, page: { ...page, total }, message: '获取成功' })
  } catch (error) {}
})
//  获取范围是当天 往后的一月 每天的日志个数 返回对应的数组 month
router.post('/month/count', async (req, res, next) => {
  // 获取转入的当前时间 没有则默认为当前时间
  const date = req.query.date || new Date()
  // 获取前一个月的日期
  const startDate = dayjs(date).subtract(1, 'month').startOf('day')
  // 获取 startDate 到 date 之间的所有日期数组
  const dates = getDatesBetween(startDate, date)
  // 获取所有日期的 log 数量
  try {
    const logs = await Promise.all(
      dates.map(async date => {
        const start = dayjs(date).startOf('day')
        const end = dayjs(date).endOf('day')
        const count = await Log.countDocuments({ createTime: { $gte: start, $lt: end } })
        return { [date]: count }
      }),
    )
    res.send({ code: 200, message: '查询成功', data: logs })
  } catch (error) {
    res.send({ code: 500, message: '查询失败', data: error })
  }
})
function getDatesBetween(startDate, endDate) {
  const dates = []
  let currentDate = dayjs(startDate)
  const stopDate = dayjs(endDate)
  while (currentDate <= stopDate) {
    dates.push(currentDate.format('YYYY-MM-DD'))
    currentDate = currentDate.add(1, 'day')
  }
  return dates
}
module.exports = router
