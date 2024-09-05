// | 字段名   | 类型   | 默认值 | 限制              | 是否唯一 | 描述                                    |
// | -------- | ------ | ------ | ----------------- | -------- | --------------------------------------- |
// | id       | string | 无     | 除新增外，非空    | 是       |                                         |
// | 任务名称 | string | 无     | 非空；长度小于20  | 否       |                                         |
// | 任务描述 | string | 无     | 非空；长度小于200 | 否       |                                         |
// | 任务状态 | sring  | '0'    | 仅为'0'或'1'或‘2’ | 否       | ‘0’：未认领，‘1’：开发中，‘2’：'已完成' |
// | 设置时间 | string | 无     | 非空              | 否       |                                         |
// | 完成时间 | string | 无     | 无                | 否       |                                         |
// | 认领人   | string | 无     | 非空              | 否       | 存储用户id                              |

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { body, validationResult } = require('express-validator')
// 任务 Schema
const taskSchema = new Schema({
  id: { type: String, required: true }, // 任务ID
  taskName: { type: String, required: true }, // 任务名称
  remark: { type: String }, // 任务描述
  priority: { type: String, default: 'medium' }, // 任务优先级 'low' 低 'medium' 中等  'high' 高
  status: { type: String, default: '0' }, // 任务状态  ‘0’：未认领，‘1’：开发中，‘2’：'已完成'

  assigneeId: { type: String, required: true }, // 认领人id 查询详细的时候通过连表查询

  tags: { type: String, default: '4' }, // 关联标签  '1'：bug，'2'：优化，'3'：新功能，'4'：其他
  attachments: { type: String }, // 附件

  startTime: { type: Date }, // 开始时间
  endTime: { type: Date }, // 结束时间

  createTime: { type: Date, default: Date.now },
  createById: { type: String }, // 创建人id
  updateTime: { type: Date, default: Date.now },
  updateById: { type: String }, // 更新人id
})

// 评论 Schema
const commentSchema = new Schema({
  id: { type: String, required: true }, // 评论ID
  commentId: { type: String, required: true }, // 评论ID
  taskId: { type: String, ref: 'Task', required: true }, // 评论所属的任务ID
  content: { type: String, required: true }, // 评论内容
  commentTime: { type: Date, default: Date.now }, // 评论时间
  commentedBy: { type: String }, // 评论者
})

// task预校验规则
const taskPreValidate = () => [
  body('taskName').notEmpty().withMessage('任务名称不能为空'),
  body('priority').isString().withMessage('任务优先级必须为字符串').bail().isIn(['low', 'medium', 'high']).withMessage('任务优先级值错误'),
  body('status').isString().withMessage('任务状态必须为字符串').isIn(['0', '1', '2']).withMessage('任务状态值错误'),
  body('assigneeId').notEmpty().withMessage('认领人不能为空'),
]

// 导出模块
module.exports = {
  validationResult,
  Task: mongoose.model('Task', taskSchema),
  taskPreValidate,
  Comment: mongoose.model('Comment', commentSchema),
}
