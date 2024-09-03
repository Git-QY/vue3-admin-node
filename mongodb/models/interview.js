// 面试题库
const mongoose = require('mongoose')
const { db1Connection, db2Connection } = require('../index')

const { body, validationResult } = require('express-validator')
const typeEnum = ['single_choice', 'multiple_choice', 'fill_in_the_blank', 'true_or_false', 'short_answer', 'essay']

const schemaRules = {
  id: { type: String, default: () => $generateUUID() }, // uuid
  type: { type: String, enum: typeEnum, required: true }, // 单选、多选、填空、判断、简答
  topic: { type: String, required: true }, // 题目
  description: { type: String }, // 题干描述
  tags: { type: Array }, // 所属知识点标签
  level: { type: Number, enum: [1, 2, 3, 4, 5], required: true }, // 难度级别，1-5星
  score: { type: Number, default: 0 }, // 该题目所属的分值大小
  options: [{ type: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] }, value: { type: String } }], // 选项列表 单选 多选
  source: { type: String }, // 该题目的来源渠道，可以方便快速找到该题目的相关信息
  answerId: { type: String, ref: 'Answer' }, // 答案ID
  createById: { type: String, ref: 'User' }, // 记录该题目的创建者 ID
  updateById: { type: String, ref: 'User' },
  createTime: { type: Date, default: Date.now }, // 记录该题目的创建时间
  updateTime: { type: Date, default: Date.now }, // 记录该题目的最近一次修改时间
}
// 问题schema

// 答案schema
const answerSchemaRules = {
  id: { type: String, default: () => $generateUUID() }, // uuid
  // questionId: { type: String, ref: 'Interview' }, // 所属题目 ID
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // 用户答案，对于填空题目可以使用正则表达式匹配候选答案
  analysis: { type: String }, // 答案解析，给出答案的详细说明，可能包括具体计算过程、答案原理、思考路径等内容
  createById: { type: String, ref: 'User' }, // 记录该答案的创建者 ID
  updateById: { type: String, ref: 'User' },
  createTime: { type: Date, default: Date.now }, // 记录该答案的创建时间
  updateTime: { type: Date, default: Date.now }, // 记录该题目的最近一次修改时间
}
// { checkFalsy: true } 忽略空值
const interviewValidationRules = () => [
  body('type')
    .notEmpty()
    .withMessage('题目类型不能为空')
    .bail()
    .isIn(['single_choice', 'multiple_choice', 'fill_in_the_blank', 'true_or_false', 'short_answer', 'essay'])
    .withMessage('题目类型错误'),
  body('topic').notEmpty().withMessage('题目不能为空'),
  body('tags').optional({ checkFalsy: true }).isArray().withMessage('知识点标签必须为数组'),
  body('level').notEmpty().withMessage('题目难度不能为空').bail().isIn([1, 2, 3, 4, 5]).withMessage('题目难度错误'),
  body('score').optional({ checkFalsy: true }).isNumeric().withMessage('题目分值必须为数字'),
  body('options').optional({ checkFalsy: true }).isArray().withMessage('题目选项必须为数组'),
  body('source').optional({ checkFalsy: true }).isString().withMessage('题目来源必须为字符串'),
]
const answerValidationRules = () => [
  body('answer').notEmpty().withMessage('正确答案不能为空'),
  body('analysis').optional({ checkFalsy: true }).isString().withMessage('答案解析必须为字符串'),
]

module.exports = {
  Interview: db2Connection.model('Interview', new mongoose.Schema(schemaRules)),
  Answer: db2Connection.model('Answer', new mongoose.Schema(answerSchemaRules)),
  validationResult,
  interviewValidationRules,
  answerValidationRules,
}
