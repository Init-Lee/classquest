/**
 * 文件说明：证据记录领域类型定义
 * 职责：定义课时2中证据采集、入库、质检相关的标准化数据结构
 * 更新触发：课时2的记录字段发生变化；新增证据类型时
 */

/** 证据来源类型 */
export type EvidenceSourceType = "public" | "field"

/** 课时2任务分配条目（来自组长文件的分工） */
export interface Lesson2Assignment {
  /** 对应课时1证据清单行的索引 */
  planIndex: number
  /** 证据项名称 */
  item: string
  /** 负责人姓名 */
  owner: string
  /** 预计来源类型 */
  expectedSourceType: EvidenceSourceType | "mixed"
  /** 来源的组长文件版本号 */
  fromLeaderVersion: number
}

/** 公开资源证据记录（课堂必做） */
export interface PublicEvidenceRecord {
  planIndex: number
  item: string
  owner: string
  sourceType: "public"

  /** 来源平台（如"国家气象局官网"） */
  sourcePlatform: string
  /** 发布机构/来源主体 */
  sourceOrg: string
  /** 资料 URL */
  url: string
  /** 发布时间/更新时间 */
  publishedAt: string
  /** 获取时间 */
  capturedAt: string
  /** 素材类型（可多选，如"图表、统计数据"） */
  materialTypes: string[]
  /** 获取方法与工具 */
  methodTool: string
  /** 定位信息（网页标题、截图编号等） */
  locator: string
  /** 摘要/引用笔记 */
  quoteOrNote: string

  /** 自动生成的完整引用格式 */
  citationFull: string
  /** 记录状态 */
  status: "draft" | "checked"
}

/** 现场采集任务（课后完成） */
export interface FieldEvidenceTask {
  planIndex: number
  item: string
  owner: string
  sourceType: "field"

  /** 计划地点 */
  plannedLocation: string
  /** 计划时间窗口 */
  plannedTimeWindow: string
  /** 计划方法工具 */
  plannedMethodTool: string
  /** 计划素材类型 */
  plannedMaterialTypes: string[]

  /** 实际地点（课后填写） */
  actualLocation?: string
  /** 实际时间窗口 */
  actualTimeWindow?: string
  /** 实际方法工具 */
  actualMethodTool?: string
  /** 实际素材类型 */
  actualMaterialTypes?: string[]
  /** 素材定位信息 */
  locator?: string
  /** 合规确认 */
  complianceConfirmed?: boolean

  /** 任务状态 */
  status: "todo" | "in-progress" | "done"
}

/** 质检结果条目 */
export interface QualityCheckResult {
  /** 对应的公开资源记录索引 */
  recordIndex: number
  /** 是否有来源与时间 */
  hasSourceAndTime: boolean
  /** 是否能证明研究问题 */
  provesSomething: boolean
  /** 素材是否可定位 */
  isLocatable: boolean
  /** 质检是否通过 */
  passed: boolean
  /** 检查时间 */
  checkedAt: string
}
