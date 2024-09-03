var express = require('express')
var router = express.Router()
var path = require('path')
const fs = require('fs-extra')
const multipart = require('connect-multiparty')
const multipartMiddleware = multipart()

const CHUNK_DIR = 'public/uploads/chunks'
const UPLOADS_DIR = 'public/uploads'
// 如果初始没有改文件目录，则自动创建
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR)
if (!fs.existsSync(CHUNK_DIR)) fs.mkdirSync(CHUNK_DIR)
router.post('/', multipartMiddleware, async (req, res) => {
  try {
    const file = req.files.file
    const newPath = path.resolve(UPLOADS_DIR, file.originalFilename)

    await fs.copyFile(file.path, newPath)
    fs.unlinkSync(file.path) // 删除临时文件

    const url = `${$base_url}/uploads/${file.originalFilename}`
    res.send({ code: 200, message: '上传成功', data: { url, fileName: file.originalFilename } })
  } catch (error) {
    return res.send({ code: 500, message: '上传失败' })
  }
})
router.post('/chunk', multipartMiddleware, async (req, res) => {
  const { fileName, hash } = req.body
  try {
    const chunkDir = path.resolve(CHUNK_DIR, hash) // 拼接切片文件夹路径
    const chunkPath = path.resolve(chunkDir, fileName)

    // 检查是否已存在该分片
    if (fs.existsSync(chunkPath)) {
      return res.send({ code: 200, message: '分片已存在，无需重复上传' })
    }

    // 上传分片
    const file = req.files.file
    await createFolder(chunkDir)
    await fs.copyFile(file.path, chunkPath)
    fs.unlinkSync(file.path) // 删除临时文件

    res.send({ code: 200, message: '上传成功' })
  } catch (error) {
    console.error(error)
    res.send({ code: 500, message: '上传失败' })
  }
})
router.post('/merge', async (req, res) => {
  const { fileName, hash } = req.body
  if (!fileName || !hash) return res.send({ code: 500, message: '参数错误' })
  try {
    const chunkDir = path.resolve(CHUNK_DIR, hash) // 拼接切片文件夹路径
    const chunks = await fs.readdir(chunkDir) // 读取切片文件夹下的所有切片
    chunks.sort((a, b) => a.split('_')[0] - b.split('_')[0]) // 对切片进行排序
    const uploadsPath = path.resolve(UPLOADS_DIR, fileName) // 拼接文件路径
    fs.appendFileSync(uploadsPath, Buffer.concat(chunks.map(chunk => fs.readFileSync(path.resolve(chunkDir, chunk)))))
    // 删除切片文件
    for (let chunk of chunks) fs.unlinkSync(path.resolve(chunkDir, chunk))
    // 删除空的切片文件夹
    fs.rmdirSync(chunkDir)
    const url = `${$base_url}/uploads/${fileName}`
    res.send({ code: 200, msg: '合并成功', data: { url, fileName } })
  } catch (error) {}
})
module.exports = router
// 判断文件夹是否存在的函数
const createFolder = folderPath => {
  try {
    fs.accessSync(folderPath)
  } catch (error) {
    fs.mkdirSync(folderPath)
  }
}
