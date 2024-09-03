const { User } = require('../mongodb/models/user')
const { Menu } = require('../mongodb/models/menu')
const { Dict, DictItem } = require('../mongodb/models/dict')

const { log } = require('console')
// 自动创建管理员账号
const menus = require('../mongodb/initData/menu')
const dicts = require('../mongodb/initData/dict')
const dictsItems = require('../mongodb/initData/dictsItem')

async function initData() {
  try {
    const users = await User.find({ isAdmin: true })
    if (users.length > 0) return console.log('已经有管理员账号了')
    await User.create({
      id: $generateUUID(),
      username: 'admin',
      password: 'fb4d9bd9ba18e4a0f7be35ec220022b86165101f80481afd5ac7ce41057786f4', // 123456
      email: 'admin@163.com',
      status: 1,
      isAdmin: true,
    })
    console.log('创建管理员账号成功！')
    await Menu.insertMany(menus)
    console.log('初始化菜单成功！')
    await Dict.insertMany(dicts)
    await DictItem.insertMany(dictsItems)
    console.log('初始化字典成功！')
  } catch (error) {
    console.log(error)
  }
}
initData()
