const fs = require('fs')
const path = require('path')

module.exports = function (app) {
  // const routesDir = path.join(__dirname, '../routes') // 路由文件所在目录
  // const routeFiles = fs.readdirSync(routesDir) // 获取所有路由文件
  // routeFiles.forEach(file => {
  //   const router = require(path.join(routesDir, file))
  //   let routerPath = `/${file.split('.')[0]}` // 根据文件名生成访问路径
  //   routerPath = routerPath == '/index' ? '/' : routerPath // 将 "/index" 路径映射为根路径 "/"
  //   app.use(routerPath, router) // 注册路由
  // })
  // const routesDir = dir => `${path.join(__dirname, '../routes')}/${dir}.js`
  // app.use('/', require(routesDir('index')))
  // app.use('/depts', require(routesDir('depts')))
  // app.use('/dicts', require(routesDir('dicts')))
  // app.use('/layouts', require(routesDir('layouts')))
  // app.use('/logs', require(routesDir('logs')))
  // app.use('/menus', require(routesDir('menus')))
  // app.use('/roles', require(routesDir('roles')))
  // app.use('/tasks', require(routesDir('tasks')))
  // app.use('/users', require(routesDir('users')))
  // app.use('/interviews', require(routesDir('interviews')))
  // app.use('/utils', require(routesDir('utils/index')))
  // app.use('/utils/uploads', require(routesDir('utils/uploads')))
  // app.use('/utils/thirdParty', require(routesDir('utils/thirdParty')))
  // app.use('/chats', require(routesDir('chats')))

  app.use('/', require('../routes/index'))
  app.use('/depts', require('../routes/depts'))
  app.use('/dicts', require('../routes/dicts'))
  app.use('/layouts', require('../routes/layouts'))
  app.use('/logs', require('../routes/logs'))
  app.use('/menus', require('../routes/menus'))
  app.use('/roles', require('../routes/roles'))
  app.use('/tasks', require('../routes/tasks'))
  app.use('/users', require('../routes/users'))
  app.use('/interviews', require('../routes/interviews'))
  app.use('/utils', require('../routes/utils/index'))
  app.use('/utils/uploads', require('../routes/utils/uploads'))
  app.use('/utils/thirdParty', require('../routes/utils/thirdParty'))
  app.use('/chats', require('../routes/chats'))
}
