var express = require('express')
var router = express.Router()
const { User, userValidationRules, validationResult } = require('../mongodb/models/user')
const { Role } = require('../mongodb/models/role')
const { Menu } = require('../mongodb/models/menu')
const { Token } = require('../mongodb/models/token')

// 记录登录接口的请求
const { Log } = require('../mongodb/models/log')
var { getIp } = require('../utils/auth')
const IP2Region = require('ip2region').default

const { generateUUID, sendMail } = require('../utils/index')
const { createToken, verifyToken } = require('../utils/token')
const { encryptHash, hashWithSalt } = require('../utils/auth')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: '可以访问用户的接口' })
})
// 根据邮箱获取code
// 设置一个定时器 定时清除check和邮箱的对应关系
const check = {}
/**
 * @api {get} /users/code 获取邮箱code
 * @apiGroup 用户
 * @apiParam {String} email 邮箱
 * @apiVersion 0.0.1
 */
router.get('/code', function (req, res, next) {
  let email = req.query.email
  // 获取邮箱
  if (!email) return res.send({ code: 400, message: '缺少必填参数' })
  let code = Math.random().toString().slice(2, 6)
  check[email] = code // 邮箱和验证码对应关系
  sendMail(email, code, function (result) {
    if (result) {
      // 获取邮箱成功 开启定时器
      setTimeout(() => {
        delete check[email]
        console.log(`成功清除${email}code的对应关系`)
      }, 60000)
      res.send({ code: 200, message: '验证码发送成功' })
    } else {
      res.send({ code: 400, message: '验证码发送失败' })
    }
  })
})
/**
 * @api {post} /users/register 注册用户
 * @apiGroup 用户
 * @apiBody {String} username 用户登录名
 * @apiBody {String} password 用户密码
 * @apiBody {String} email 邮箱
 * @apiBody {String} code 验证码
 * @apiVersion 0.0.1
 */
router.post('/register', async function (req, res) {
  const { username, password, email, code } = req.body // 必填账号密码邮箱
  if (!username || !password || !email || !code) return res.send({ code: 400, message: '缺少必填参数' })
  // 用户名唯一
  const user = await User.findOne({ username })
  if (user) return res.send({ code: 400, message: '用户名已存在' })
  // 一个游戏只能注册一个账号
  const emailUser = await User.findOne({ email })
  if (emailUser) return res.send({ code: 400, message: '该邮箱已注册' })
  // 判断邮箱验证码是否正确 失效时间1分钟
  if (check[email] === code) {
    await User.create({ ...req.body, id: generateUUID(), password: hashWithSalt(password) }) // 创建新用户
    res.send({ code: 200, message: '注册成功' })
  } else {
    return res.send({ code: 400, message: '验证码错误' })
  }
})
// 检验验证码
router.post('/checkCode', async function (req, res) {
  // 获取邮箱和验证码
  const { email, code } = req.body
  if (!email || !code) return res.send({ code: 400, message: '缺少必填参数' })
  // 校验用户是否注册过
  const user = await User.findOne({ email })
  if (!user) return res.send({ code: 400, message: '用户不存在' })
  // 判断邮箱验证码是否正确 失效时间1分钟
  if (check[email] === code) {
    res.send({ code: 200, message: '验证成功' })
  } else {
    return res.send({ code: 400, message: '验证码错误' })
  }
})
// 用户登录
const expiresIn = 60 * 60 * 24 * 7 // 过期时间
router.post('/login', async (req, res) => {
  console.log('开始登录')
  let { username, password } = req.body
  if (!username || !password) return res.send({ code: 500, message: '用户名或密码不能为空' })
  try {
    password = hashWithSalt(password)
    const user = await User.findOne({ username, password: password })
    if (!user) return res.send({ code: 403, message: '用户名或密码错误' })
    const { status, id } = user
    if (status == 0) return res.send({ code: 403, message: '该用户已被禁用' })
    let token = createToken({ login: true, name: username, id })
    // 登录成功 保存登录日志
    const { method } = req
    const ip = await getIp()
    const query = new IP2Region()
    const address = query.search(ip)
    await Log.create({
      id: $generateUUID(),
      ip,
      address,
      url: '/users/login',
      method,
      createTime: new Date(),
      updateTime: new Date(),
      createById: id,
    })
    // 新增维护token表
    user.deviceId = '123456'
    user.isDevice = true
    user.isMultiple = false
    // 需求
    // 同一设备限制一个账号
    let params = []
    if (user.isDevice) params.push({ deviceId: user.deviceId })
    if (user.isMultiple) params.push({ userId: user.id })
    // 查询存在deviceId和userId的共集 直接删除
    if (!user.isAdmin) await Token.deleteMany({ $and: params })
    // 新增token
    Token.create({ id: generateUUID(), userId: user.id, deviceId: user.deviceId, token, expiresTime: expiresIn })
    res.send({ code: 200, message: '登录成功', data: { token, userInfo: user } })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 忘记密码
// 1 获取邮箱验证码
// 2 校验邮箱验证码
// 3 输入新密码
// 4 修改密码
// 检验验证码
router.post('/checkEmailCode', async function (req, res, next) {
  // 获取邮箱和验证码
  const { email, code } = req.body
  if (!email || !code) return res.send({ code: 400, message: '缺少必填参数' })
  // 校验用户是否注册过
  const user = await User.findOne({ email })
  if (!user) return res.send({ code: 400, message: '用户不存在' })
  // 判断邮箱验证码是否正确 失效时间1分钟
  if (check[email] === code) {
    // 生成一个token来判断是否获取成功code
    const token = createToken({ email, code }, 'checkEmailCode')
    res.send({ code: 200, message: '验证成功', data: token })
  } else {
    return res.send({ code: 400, message: '验证码错误' })
  }
})
// 修改密码
router.post('/forget', async (req, res) => {
  const { email, token, newPassword, nextPassword } = req.body
  if (!email || !newPassword || !nextPassword || !token) return res.send({ code: 400, message: '缺少必填参数' })
  // 判断是否注册
  const user = await User.findOne({ email })
  if (!user) return res.send({ code: 400, message: '用户不存在' })
  // 判断2次密码是否一致
  if (newPassword !== nextPassword) return res.send({ code: 400, message: '两次密码不一致' })
  // 更新密码
  try {
    // 校验token
    const result = await verifyToken(token, 'checkEmailCode')
    if (result.email !== email) return res.send({ code: 400, message: 'token标识错误' })
    await User.updateOne({ id: user.id }, { ...req.body, updateTime: Date.now(), password: hashWithSalt(newPassword) })
    res.send({ code: 200, message: '密码修改成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 邮箱验证码登录
router.post('/login/email', async (req, res) => {
  // 获取邮箱验证
  const { email, code } = req.body
  // 验证邮箱验证码
  if (check[email] === code) {
    try {
      // 拿到用户信息
      const user = await User.findOne({ email })
      // 返回token
      const token = createToken({ login: true, name: user.username, id: user.id })
      res.send({ code: 200, message: '登录成功', data: { token, userInfo: user } })
    } catch (error) {
      res.send({ code: 500, message: error })
    }
  }
})
// 新增用户
router.post('/add', userValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  }
  try {
    const { body } = req
    const createTime = new Date()
    await User.create({ ...body, id: generateUUID(), createTime, password: hashWithSalt(encryptHash('123456')) }) // 创建新用户
    res.send({ code: 200, message: '创建成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 删除用户
router.delete('/delete', async (req, res) => {
  try {
    const { id, ids } = req.body
    if (id) {
      await User.deleteOne({ id })
    } else {
      await User.deleteMany({ id: { $in: ids } })
    }
    res.send({ code: 200, message: '删除成功' })
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
    await User.updateOne({ id }, { ...updateField, updateTime: Date.now() })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 修改用户
router.put('/update', userValidationRules(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.send({ code: 500, message: errors.array().map(item => item.msg) })
  try {
    const { id } = req.body
    await User.updateOne({ id }, { ...req.body, updateTime: Date.now() })
    res.send({ code: 200, message: '更新成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 查询用户列表
router.post('/list', async (req, res) => {
  const { username, email, page = { pageSize: 10, page: 1 }, ...data } = req.body
  const query = { ...data }
  // 添加 username 模糊查询条件
  if (username) query.username = { $regex: username }
  if (email) query.email = { $regex: email }
  try {
    const users = await User.find(query)
      .skip((page.page - 1) * page.pageSize)
      .limit(page.pageSize)
      .sort({ createTime: -1 }) // 按创建时间倒序排序
    const total = await User.countDocuments(query) // 获取符合条件的用户总数
    res.send({ code: 200, data: users, page: { ...page, total } })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 用户详情
router.get('/detail', async (req, res) => {
  try {
    const userId = req.query.id
    const user = await User.findOne({ id: userId }) // 根据ID查询用户
    if (!user) res.send({ code: 500, message: `没有ID为${userId}的用户信息` })
    res.send({ code: 200, data: user })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 给用户分配角色
router.post('/assign/roles', async (req, res) => {
  const { userIds, roleIds } = req.body
  if (!userIds || !roleIds || !Array.isArray(userIds) || !Array.isArray(roleIds)) {
    return res.send({ code: 500, message: '参数错误' })
  }
  // 校验userIds和roleIds是否都存在
  try {
    // 假设有一个UserModel和RoleModel，以及一个UserRole关联模型
    const users = await User.find({ id: { $in: userIds } }) // 查询用户是否存在
    const roles = await Role.find({ id: { $in: roleIds } }) // 查询角色是否存在
    // 验证查询结果，确保所有提供的ID都是有效的
    if (users.length !== userIds.length || roles.length !== roleIds.length) {
      return res.send({ code: 404, message: '部分用户或角色不存在' })
    }
    // 把roleIds分配给每个userIds对应的用户
    // 批量更新
    await User.updateMany({ id: { $in: userIds } }, { $set: { roleIds: roleIds } })
    res.send({ code: 200, message: '角色分配成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 根据用户id获取菜单权限
router.get('/menus/:userId', async (req, res) => {
  const { userId } = req.params
  try {
    const user = await User.findOne({ id: userId })
    if (!user) return res.send({ code: 404, message: '用户不存在' })
    // 如果是userId为admin时，直接返回所有权限
    if (user.isAdmin) {
      const menus = await Menu.find()
      return res.send({ code: 200, data: menus, message: '获取成功' })
    }
    const lists = await Role.aggregate([
      { $match: { id: { $in: user.roleIds }, status: '1' } },
      { $project: { permissions: 1, _id: 0 } }, // 投影：只返回permissions字段
      { $unwind: '$permissions' }, // 将permissions字段拆分为多个文档
      { $group: { _id: null, permissions: { $addToSet: '$permissions' } } }, // 将permissions字段合并为一个数组
      { $lookup: { from: 'menus', localField: 'permissions', foreignField: 'id', as: 'menus' } }, // 关联菜单表
    ])
    return res.send({ code: 200, data: lists.length ? lists[0].menus : [], message: '获取成功' })
  } catch (error) {
    res.send({ code: 500, message: error })
  }
})
// 第三方登录
const axios = require('axios')
const Constants = require('../constants')
// 目前有个问题就是如果注册的邮箱和第三方登录的邮箱相同 怎么处理
// 提示这个邮箱已经注册
router.post('/login/third', async (req, res) => {
  const { type, code } = req.body
  console.log('🚀 ~ router.post ~ req.body:', req.body)
  if (!type || !code) return res.send({ code: 500, message: '缺少必填参数' })
  try {
    const response = await axios.post('https://gitee.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: Constants.GITEE_AUTH_PARAMS.client_id,
      redirect_uri: Constants.GITEE_AUTH_PARAMS.redirect_uri,
      client_secret: Constants.GITEE_AUTH_PARAMS.client_secret,
    })
    console.log('🚀 ~ router.post ~ response:', response)
    const { access_token } = response.data
    const access_token_response = await axios.get(`https://gitee.com/api/v5/user?access_token=${access_token}`)
    const { name, avatar_url, email } = access_token_response.data || {}
    // 当前查询的第三方用户如果存在邮箱 提示邮箱已在当前系统中存在请使用邮箱登录
    if (!email) return res.send({ code: 500, message: '第三方账户邮箱不存在,不能直接创建账号' })
    const findEmailUser = await User.findOne({ email })
    if (findEmailUser) return res.send({ code: 500, message: '邮箱已存在' })
    const findNameUser = await User.findOne({ username: name })
    if (findNameUser) {
      await successLoginLog(req, findNameUser)
      const loginData = await successLogin(findNameUser)
      res.send(loginData)
    } else {
      const thirdUser = await User.create({
        id: generateUUID(),
        username: findNameUser ? `${name}${$generateUUID()}` : name,
        password: hashWithSalt(encryptHash('123456')),
        avatar: avatar_url,
        status: 1,
        email,
      })
      await successLoginLog(req, thirdUser)
      let token = createToken({ login: true, name: thirdUser.username, id: thirdUser.id })
      res.send({ code: 200, message: '登录成功', data: { token, userInfo: thirdUser } })
    }
  } catch (error) {
    res.send({ code: 500, message: error.response.data.error_description || error })
  }
})
// 微信扫码登录 2种方法 1 后台返回二维码轮询 2 ifame内嵌二维码
/**
 * 1 通过code获取access_token
 */
router.post('/login/wechat', async (req, res) => {
  const { code } = req.body
  if (!code) return res.send({ code: 500, message: '缺少必填参数' })
  try {
    const access_token_response = await axios.get(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${Constants.WECHAT_AUTH_PARAMS.APPID}&secret=${Constants.WECHAT_AUTH_PARAMS.SECRET}&code=${code}&grant_type=authorization_code`,
    )
    const { access_token, openid } = access_token_response.data || {}
    // 通过openid查询用户信息
    const wechatUser = await User.findOne({ openid })
    if (wechatUser) {
      await successLoginLog(req, wechatUser)
      const loginData = await successLogin(wechatUser)
      res.send(loginData)
    } else {
      // 目前的逻辑是直接创建一个账号就行 不需要绑定自己项目的账号
      // 通过access_token和openid查询用户信息
      const userInfon_response = await axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`)
      const { nickname, headimgurl, unionid } = userInfon_response.data
      const newUser = await User.create({
        id: generateUUID(),
        username: unionid,
        password: hashWithSalt(encryptHash('123456')),
        avatar: headimgurl,
        status: 1,
        openid,
        nickname,
      })
      await successLoginLog(req, newUser)
      let token = createToken({ login: true, name: newUser.username, id: newUser.id })
      res.send({ code: 200, message: '登录成功', data: { token, userInfo: newUser } })
    }
  } catch (error) {
    res.send({ code: 500, message: error.message || '微信登录失败' })
  }
})

const successLogin = user => {
  return new Promise(async (resolve, reject) => {
    try {
      const { username, id, status } = user
      if (status == 0) resolve({ code: 403, message: '该用户已被禁用' })
      let token = createToken({ login: true, name: username, id })
      // 新增维护token表
      user.deviceId = '123456'
      user.isDevice = true
      user.isMultiple = false
      // 需求
      // 同一设备限制一个账号
      let params = []
      if (user.isDevice) params.push({ deviceId: user.deviceId })
      if (user.isMultiple) params.push({ userId: user.id })
      // 查询存在deviceId和userId的共集 直接删除
      if (!user.isAdmin) await Token.deleteMany({ $and: params })
      Token.create({ id: generateUUID(), userId: user.id, deviceId: user.deviceId, token, expiresTime: expiresIn })
      resolve({ code: 200, message: '登录成功', data: { token, userInfo: user } })
    } catch (error) {
      reject(error)
    }
  })
}
const successLoginLog = (req, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { method } = req
      const ip = await getIp()
      const query = new IP2Region()
      const address = query.search(ip)
      await Log.create({
        id: $generateUUID(),
        ip,
        address,
        url: '/users/login',
        method,
        createTime: new Date(),
        updateTime: new Date(),
        createById: user.id,
      })
      resolve('登录日志创建成功')
    } catch (error) {
      reject(error)
    }
  })
}
module.exports = router
