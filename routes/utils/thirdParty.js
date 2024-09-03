const axios = require('axios')
const express = require('express')
const router = express.Router()

// 获取一言
router.get('/yiyan', async (req, res) => {
  try {
    const result = await axios.get('https://api.likepoems.com/ana/yiyan')
    res.send({ code: 200, msg: '获取成功', data: result.data })
  } catch (error) {
    res.send({ code: 500, msg: error.message })
  }
})

module.exports = router
