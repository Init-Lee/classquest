/**
 * 文件说明：AI 助手提示词领域类型定义
 * 职责：定义 AI 助手交互日志和助手类型，记录学生与 AI 工具的交互轨迹
 * 更新触发：新增 AI 助手类型（R4等）时；调整日志字段时
 */

/** AI 助手类型：R2=计划生成助手，R3=风控体检助手 */
export type AIAssistKind = "R2" | "R3"

/** AI 助手交互日志 */
export interface AIAssistLog {
  /** 助手类型 */
  kind: AIAssistKind
  /** 输入摘要（学生填写的背景信息概要） */
  inputSummary: string
  /** 输出内容（学生粘贴回来的 AI 回复） */
  outputText: string
  /** 是否采纳了该 AI 建议 */
  adopted: boolean
  /** 采纳备注（如"采纳了前3条建议"） */
  adoptedNote?: string
  /** 记录时间 */
  createdAt: string
}
