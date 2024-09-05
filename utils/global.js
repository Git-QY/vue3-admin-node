const { generateUUID } = require('./index')
const { verifyToken } = require('./token')
const dotenv = require('dotenv')
const path = require('path')
dotenv.config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV}`), // 配置文件路径
  encoding: 'utf8', // 编码方式，默认utf8
  debug: false, // 是否开启debug，默认false
})
global.$generateUUID = generateUUID
global.$verifyToken = verifyToken
global.$base_url = process.env.VITE_API_BASE_URL
