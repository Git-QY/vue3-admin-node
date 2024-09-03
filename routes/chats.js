const express = require('express')
const router = express.Router()
const { AiRoom, aiRoomValidationRules, validationResult, AiRoomMessage } = require('../mongodb/models/chat')
const { BaseService } = require('../utils')
const Constants = require('../constants')
const axios = require('axios')

const AiRoomService = new BaseService(AiRoom)
const AiRoomMessageService = new BaseService(AiRoomMessage)

router.post('/aiRoom/add', aiRoomValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  AiRoomService.add(req, res)
})
router.delete('/aiRoom/delete', async (req, res) => {
  const { id } = req.query
  try {
    await AiRoom.deleteOne({ id })
    await AiRoomMessage.deleteMany({ roomId: id })
    res.send({ code: 200, message: '删除成功' })
  } catch (error) {
    res.send({ code: 500, message: '删除失败' })
  }
})
router.put('/aiRoom/update', aiRoomValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  AiRoomService.update(req, res)
})
router.get('/aiRoom/detail', async (req, res) => {
  AiRoomService.detail(req, res)
})
router.post('/aiRoom/list', async (req, res) => {
  const { page = { pageSize: 10, page: 1 }, ...data } = req.body
  const query = { ...data, name: { $regex: data.name ?? '' } }
  AiRoomService.list(query, page, res)
})
router.post('/aiRoomMessage/add', async (req, res) => {
  AiRoomMessageService.add(req, res)
})
router.put('/aiRoomMessage/update', async (req, res) => {
  AiRoomMessageService.update(req, res)
})
router.post('/aiRoomMessage/list', async (req, res) => {
  const { page = { pageSize: 10, page: 1, isAll: true }, ...data } = req.body
  const query = { ...data }
  AiRoomMessageService.list(query, page, res)
})

router.post('/chatGpt', async (req, res) => {
  const { body } = req
  try {
    const response = await axios({
      method: 'post',
      url: 'https://spark-api-open.xf-yun.com/v1/chat/completions',
      data: body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Constants.XINGHUO.API_PASSWORD}`,
      },
      responseType: 'stream',
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    response.data.on('data', chunk => {
      const data = chunk.toString()
      data.split('\n').forEach(async line => {
        line.trim() && res.write(`${line}\n\n`)
      })
    })
    response.data.on('end', () => res.end())

    response.data.on('error', err => {
      console.error('Stream error:', err)
      res.send({ code: 500, message: err.message })
    })
  } catch (error) {
    res.send({ code: 500, message: error.message })
  }
})

module.exports = router
