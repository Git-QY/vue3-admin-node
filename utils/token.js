const jwt = require('jsonwebtoken')
const { Token } = require('../mongodb/models/token')
//生成token
function createToken(playload, screat = '123456') {
  playload.ctime = Date.now()
  playload.exps = 24 * 60 * 60 * 1000 // 手动设置过期时间 60s
  return jwt.sign(playload, screat)
}
// 验证token
function verifyToken(token, screat = '123456') {
  return new Promise((resolve, reject) => {
    jwt.verify(token, screat, async (err, data) => {
      if (!token) return reject({ code: 401, msg: '请携带token请求' })
      if (err) return reject({ code: 401, msg: 'token 验证失败' })
      const beforeTime = data.ctime + data.exps
      const nowTime = Date.now()
      if (nowTime > beforeTime) return reject({ code: 401, msg: 'token 过期' }) // 比对当前时间戳  jwt创建的时间+有效期  前端收到重新获取token
      // 判断token是否过期或者存在
      const tokens = await Token.find({ token, isExpired: false })
      if (!tokens.length) return reject({ code: 401, msg: 'token 已失效' })
      resolve(data)
    })
  })
}

// 定义全局校验 token 的中间件
async function checkToken(req, res, next) {
  // 定义不需要 token 验证的接口路径
  const whiteList = [
    '/users/login',
    '/users/code',
    '/users/register',
    '/users/checkCode',
    '/users/checkEmailCode',
    '/users/forget',
    '/users/login/email',
    '/users/login/third',
    // '/users/code',
    // '/users/code',
    // '/users/code',
    // '/users/code',
    // '/users/code',
    // '/users/code',
    /^\/utils/,
  ] // 使用正则表达式来匹配 /xx 开头的路径
  const path = req.path
  // 如果当前请求路径在白名单内，则不需要 token 验证，直接通过
  if (whiteList.some(item => (item instanceof RegExp ? item.test(path) : item === path))) {
    return next()
  }
  // 是否可以设置一个headers参数 可以直接跳过token校验 但是要考虑到安全问题怎么处理
  // 检查是否存在 skipToken 参数
  const skipToken = req.headers.skipToken
  if (skipToken) {
    return next()
  }
  // 否则，检查请求头是否包含 token
  const token = req.headers.token
  if (!token) {
    return res.json({ code: 401, message: '请先登录' })
  }
  try {
    // 验证 token 是否有效
    const data = await verifyToken(token)
    req.user = data
    next()
  } catch (err) {
    return res.json({ code: 401, message: err.msg })
  }
}

module.exports = {
  createToken,
  verifyToken,
  checkToken,
}
