const nodemailer = require('nodemailer') //引入模块
// 使用  UUID v4 生成全局唯一 ID
function generateUUID() {
  const { v4: uuidv4 } = require('uuid')
  return uuidv4()
}

// 获取邮箱验证码
let transporter = nodemailer.createTransport({
  service: 'qq', // 类型qq邮箱
  port: 465,
  secure: true,
  auth: { user: '595870773@qq.com', pass: 'usgcdcegsjunbcea' },
})
function sendMail(email, code, call) {
  // 发送的配置项
  let mailOptions = {
    from: '595870773@qq.com', // 发送者
    to: email, // 接受者,可以同时发送多个,以逗号隔开
    subject: 'vue3-admin', // 标题
    html: `<h2>欢迎登录:本次的验证码是${code}</h2>`,
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      call(false)
    } else {
      call(true) //因为是异步 所有需要回调函数通知成功结果
    }
  })
}
// 判断是否是对象
function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}
// 对数据库增删改查的基本炒作
class BaseService {
  constructor(model) {
    this.model = model
  }
  // 添加
  async add(req, res) {
    const { body, user } = req
    try {
      const data = await this.model.create({ ...body, createById: user.id })
      res.send({ code: 200, data, message: '创建成功' })
    } catch (error) {
      res.send({ code: 500, message: error })
    }
  }
  // 删除
  async delete(req, res) {
    const { id, ids } = req.query
    try {
      if (id) {
        if (!id.trim()) res.send({ code: 400, message: '无效的 id 参数' })
        await this.model.deleteOne({ id })
      } else if (ids) {
        if (!Array.isArray(ids)) res.send({ code: 400, message: 'ids 参数必须是数组' })
        await this.model.deleteMany({ id: { $in: ids.map(id => id.trim()) } })
      } else {
        res.send({ code: 400, message: '缺少必要的参数' })
      }
      res.status(200).json({ code: 200, message: '删除成功' })
    } catch (error) {
      res.send({ code: 500, message: error })
    }
  }
  // 修改
  async update(req, res) {
    const { body, user } = req
    const userId = user.id
    try {
      if (Array.isArray(body) && body.length > 0) {
        // 批量更新
        const bulkOps = body.map(item => ({
          updateOne: {
            filter: { id: item.id }, // 使用 _id 字段作为过滤条件
            update: { ...item, updateTime: new Date(), updateById: userId },
            upsert: false, // 如果不希望插入新文档
          },
        }))
        await this.model.bulkWrite(bulkOps) // 使用 bulkWrite 执行批量更新
        res.send({ code: 200, message: '批量修改成功' })
      } else if (isObject(body)) {
        await this.model.updateOne({ id: body.id }, { ...body, updateTime: new Date(), updateById: userId })
        res.send({ code: 200, message: '修改成功' })
      } else {
        res.send({ code: 400, message: '缺少必要的参数' })
      }
    } catch (error) {
      res.send({ code: 500, message: error.message || '服务器内部错误' })
    }
  }
  // 查询
  async list(query, page, res, moreQuery = []) {
    try {
      if (page.isAll) {
        const list = await this.model.aggregate([{ $match: query }, ...moreQuery])
        res.send({ code: 200, data: list, message: '获取成功' })
      } else {
        const list = await this.model.aggregate([
          { $match: query }, // 匹配查询条件
          { $sort: { createTime: -1 } }, // 按照创建时间升序排序
          { $skip: (page.page - 1) * page.pageSize }, // 跳过指定数量的文档
          { $limit: page.pageSize }, // 限制返回的文档数量
          ...moreQuery,
        ])
        const total = await this.model.countDocuments(query)
        res.send({ code: 200, data: list, page: { ...page, total }, message: '获取成功' })
      }
    } catch (error) {
      res.send({ code: 500, message: error.message || '服务器内部错误' })
    }
  }
  // 详情
  async detail(req, res) {
    const { id, ids } = req.query
    try {
      if (id) {
        if (!id.trim()) res.send({ code: 400, message: '无效的 id 参数' })
        const data = await this.model.findOne({ id })
        if (!data) res.send({ code: 400, message: '未找到该资源' })
        res.send({ code: 200, data, message: '获取成功' })
      } else if (ids) {
        if (!Array.isArray(ids)) res.send({ code: 400, message: 'ids 参数必须是数组' })
        const dataList = await this.model.find({ id: { $in: ids.map(id => id.trim()) } })
        if (dataList.length == 0) res.send({ code: 400, message: '未找到该资源' })
        res.send({ code: 200, data: dataList, message: '获取成功' })
      } else {
        res.send({ code: 400, message: '缺少必要的参数' })
      }
    } catch (error) {
      res.send({ code: 500, message: error })
    }
  }
  // 新增
  handAddSync(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.model.create(body)
        resolve({ code: 200, data, message: '创建成功' })
      } catch (error) {
        reject({ code: 500, message: error })
      }
    })
  }
  // 获取详情
  handleGetDetailasync({ id, ids }) {
    return new Promise(async (resolve, reject) => {
      try {
        if (id) {
          if (!id.trim()) reject({ code: 200, data, message: '无效的 id 参数' })
          const data = await this.model.findOne({ _id: id.trim() })
          if (!data) reject({ code: 200, data, message: '未找到该资源' })
          resolve({ code: 200, data, message: '获取成功' })
        } else if (ids) {
          if (!Array.isArray(ids)) reject({ code: 200, data, message: 'ids 参数必须是数组' })
          const cleanedIds = ids.map(id => id.trim()).filter(id => id)
          if (cleanedIds.length === 0) reject({ code: 200, data, message: '无效的 ids 参数' })
          const dataList = await this.model.find({ _id: { $in: cleanedIds } })
          if (dataList.length === 0) throw new Error('未找到该资源')
          resolve({ code: 200, data: dataList, message: '获取成功' })
        } else {
          reject({ code: 200, data, message: '缺少必要的参数' })
        }
      } catch (error) {
        reject({ code: 500, message: error.message })
      }
    })
  }
}

module.exports = {
  generateUUID,
  sendMail,
  BaseService,
}
