const express = require('express')
const router = express.Router()
const { Token } = require('../mongodb/models/token')

// 新增维护token
// router.post('/add', async (req, res) => {})
//  注销登录状态
router.post('/logout', async (req, res) => {
  const { token } = req.body
  try {
    await Token.deleteOne({ token })
    res.send({ code: 200, msg: '注销成功' })
  } catch (error) {
    res.send({ code: 500, msg: '注销失败' })
  }
})

module.exports = router
