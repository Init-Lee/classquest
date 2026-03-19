/**
 * 文件说明：小组计划领域类型定义
 * 职责：定义小组讨论、共识卡、证据清单等小组协作相关的数据结构
 * 更新触发：课时1的小组协作流程发生变化时；新增小组协作字段时
 */

/** 个人 R1 记录 */
export interface R1Record {
  /** 填写者姓名 */
  author: string
  /** 主题包选择：A / B / C */
  themePack: "A" | "B" | "C"
  /** 观察范围描述 */
  scope: string
  /** 研究问题候选 */
  researchQuestionDraft: string
  /** 最低可行证据建议 */
  minEvidenceIdea: string
  /** 记录思路（粗粒度，如"先记时间地点现象"） */
  roughRecordIdea: string
  /** 跑偏提醒摘要列表 */
  driftWarnings: string[]
  /** AI 助手输入内容（可选，来自学生粘贴的提示词） */
  aiPrompt?: string
  /** AI 助手输出内容（可选，来自学生粘贴的 AI 回复） */
  aiResponse?: string
  /** 保存时间 */
  savedAt: string
}

/** 小组讨论留痕：每位成员一条 */
export interface GroupDiscussionEntry {
  /** 成员姓名 */
  memberName: string
  /** 该成员的 R1 问题候选 */
  r1Question: string
  /** 该成员的证据建议（最多2条） */
  r1EvidenceIdeas: string[]
  /** 是否采纳：完全采纳 / 部分采纳 / 未采纳 */
  adopted: "yes" | "partial" | "no"
  /** 讨论备注 */
  note: string
}

/** 小组共识卡：小组讨论后形成的最终方案 */
export interface GroupConsensus {
  /** 最终主题包 */
  themePack: "A" | "B" | "C"
  /** 最终观察范围 */
  scope: string
  /** 最终研究问题 */
  finalResearchQuestion: string
  /** 选定的一手证据想法（最多2条） */
  firstHandEvidenceIdeas: string[]
  /** 选定的二手来源想法（最多1条） */
  secondHandSourceIdeas: string[]
  /** 粗粒度记录思路 */
  roughRecordIdeas: string[]
  /** 为什么选择这个方案 */
  whyThisPlan: string
  /** 确认时间 */
  confirmedAt?: string
}

/** 辅助材料来源行 */
export interface GroupSourceRow {
  /** 来源标题/出处/时间/链接等元信息 */
  meta: string
  /** 可核查的事实 */
  fact: string
  /** 对本组计划的启发 */
  inspire: string
}

/** 证据收集清单行 */
export interface GroupEvidencePlanRow {
  /** 证据项名称 */
  item: string
  /** 证据类型：一手 / 二手 */
  type: "first-hand" | "second-hand"
  /** 计划采集的地点与时间 */
  whereWhen: string
  /** 采集方法与工具 */
  method: string
  /** 记录思路（粗粒度，课时1阶段不做严格约束） */
  recordIdea: string
  /** 负责人姓名 */
  owner: string
}
