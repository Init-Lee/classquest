/**
 * 文件说明：模块档案（Portfolio）领域类型定义
 * 职责：ModulePortfolio 是整个应用的核心聚合根，串联所有课时数据
 *       采用"链式 Portfolio 模型"——一个学生对应一条完整记录
 * 更新触发：新增课时（如课时4+）时在此扩展；调整课时数据结构时同步更新
 */

import type { StudentProfile } from "@/domains/student/types"
import type { ProgressPointer } from "@/domains/progress/types"
import type { R1Record, GroupDiscussionEntry, GroupConsensus, GroupEvidencePlanRow } from "@/domains/group-plan/types"
import type { Lesson2Assignment, PublicEvidenceRecord, FieldEvidenceTask, QualityCheckResult } from "@/domains/evidence/types"
import type { AIAssistLog } from "@/domains/prompts/types"
import type { SnapshotMeta } from "@/domains/snapshot/types"

/** 课时1状态数据 */
export interface Lesson1State {
  /** 步骤1是否已完成引导 */
  introDone: boolean
  /** 本组所有成员的 R1 记录（每人一条，含个人辅助材料 sourceRows） */
  r1ByMember: R1Record[]
  /** 小组讨论留痕（步骤3） */
  groupDiscussion: GroupDiscussionEntry[]
  /** 小组共识卡（步骤3，组长填写） */
  groupConsensus?: GroupConsensus
  /**
   * 组长在第4关"组员登记"子步录入的小组成员姓名列表
   * 用于执行表行自动生成和负责人多选
   */
  groupMembers: string[]
  /** 证据收集清单行（步骤4，owners 支持多人） */
  evidenceRows: GroupEvidencePlanRow[]
  /** 承诺已勾选 */
  declarationAgreed: boolean
  /** AI 助手交互日志 */
  aiAssistLogs: AIAssistLog[]
  /**
   * 组员确认的"分工中对应自己的名字"（可选）
   * 新流程中用 student.studentName 直接在 owners 数组中匹配；
   * 仅在注册名与小组名单不一致时（手动选择后）有值
   */
  confirmedOwnerName?: string
  /** 课时1是否已完成 */
  completed: boolean
}

/** 课时2状态数据 */
export interface Lesson2State {
  /** 步骤1是否已恢复进度 */
  resumeDone: boolean
  /** 步骤2是否已完成组长文件同步 */
  leaderSyncDone: boolean
  /** 当前学生名下的分配任务 */
  assignments: Lesson2Assignment[]
  /** 已录入的公开资源记录 */
  publicRecords: PublicEvidenceRecord[]
  /** 现场采集任务 */
  fieldTasks: FieldEvidenceTask[]
  /** 质检结果 */
  qualityChecks: QualityCheckResult[]
  /** 课时2是否已完成 */
  completed: boolean
}

/**
 * 课时3第3关：学生筛选出来的单条入选材料
 * 来源引用课时2已录入的 publicRecords 或 fieldTasks，通过 sourceType + sourceIndex 定位
 */
export interface SelectedMaterial {
  /** 来源类型：公开资源 | 现场采集 */
  sourceType: "public" | "field"
  /** 在对应数组（publicRecords / fieldTasks）中的下标 */
  sourceIndex: number
  /** 现象说明句："这条材料说明了什么？"（必填，不能是原因判断句） */
  explanation: string
}

/**
 * 课时3第4关：一张证据卡（最小加工结果），预留供后续实现
 * 对第3关已筛选的材料做进一步加工，形成可供组长汇总的半成品
 */
export interface EvidenceCard {
  /** 对应 selectedMaterials 数组中的下标 */
  materialIndex: number
  /** 材料主类型 */
  materialType: "image" | "text" | "data" | "video"
  /** 材料标题/简述 */
  title: string
  /** 最小加工结果（文字描述） */
  processingResult: string
  /** 一句客观说明（不得包含因果推断） */
  objectiveStatement: string
  /** 可用于海报的简短表述 */
  posterExpression: string
  /** 连接句1：这条证据显示了…… */
  evidenceShows: string
  /** 连接句2：它和研究问题的关系是…… */
  relationToQuestion: string
  /** 连接句3：基于这条证据，我们目前最多只能说…… */
  limitedClaim: string
}

/** 课时3状态数据（个人素材整理与证据加工） */
export interface Lesson3State {
  // ---- 第1关：继承前序成果，明确本课任务 ----
  /** 学生已确认本课任务边界 */
  missionAcknowledged: boolean

  // ---- 第2关：材料加工方法工具箱 ----
  /** 学生已阅读并完成方法工具箱关卡 */
  toolboxCompleted: boolean

  // ---- 第3关：筛选我的材料 ----
  /** 从课时2记录中筛选出来的入选材料（含现象说明句） */
  selectedMaterials: SelectedMaterial[]

  // ---- 第4关：我的证据加工工坊（预留，后续实现） ----
  /** 已加工完成的证据卡列表 */
  evidenceCards: EvidenceCard[]
  /** "关注缘起"加工后的简洁表达文本 */
  originExpression: string

  // ---- 第5关：个人预览与导出（预留，后续实现） ----
  /** 是否已导出个人证据加工包（交给组长用） */
  personalPackageExported: boolean

  /** 课时3是否已完成 */
  completed: boolean
}

/** 模块档案——整个模块所有课时数据的聚合根 */
export interface ModulePortfolio {
  /** 档案唯一 ID（UUID） */
  id: string
  /** 模块标识，固定为 G7_M3（七年级模块三） */
  moduleId: "G7_M3"
  /** 数据模式版本，当前为 1 */
  schemaVersion: 1
  /** 应用版本号 */
  appVersion: string

  /** 学生身份信息 */
  student: StudentProfile
  /** 当前进度指针 */
  pointer: ProgressPointer

  /** 课时1数据 */
  lesson1: Lesson1State
  /** 课时2数据 */
  lesson2: Lesson2State
  /** 课时3数据 */
  lesson3: Lesson3State

  /** 已生成的快照记录 */
  snapshotHistory: SnapshotMeta[]
  /** 当前组长文件版本号（用于同步校验） */
  groupPlanVersion: number

  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/** 创建一个空的课时1初始状态 */
export function createEmptyLesson1State(): Lesson1State {
  return {
    introDone: false,
    r1ByMember: [],
    groupDiscussion: [],
    groupConsensus: undefined,
    groupMembers: [],
    evidenceRows: [],
    declarationAgreed: false,
    aiAssistLogs: [],
    completed: false,
  }
}

/** 创建一个空的课时2初始状态 */
export function createEmptyLesson2State(): Lesson2State {
  return {
    resumeDone: false,
    leaderSyncDone: false,
    assignments: [],
    publicRecords: [],
    fieldTasks: [],
    qualityChecks: [],
    completed: false,
  }
}

/** 创建一个空的课时3初始状态 */
export function createEmptyLesson3State(): Lesson3State {
  return {
    missionAcknowledged: false,
    toolboxCompleted: false,
    selectedMaterials: [],
    evidenceCards: [],
    originExpression: "",
    personalPackageExported: false,
    completed: false,
  }
}

/** 创建一个新的 ModulePortfolio */
export function createNewPortfolio(student: StudentProfile): ModulePortfolio {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    moduleId: "G7_M3",
    schemaVersion: 1,
    appVersion: "1.0.0",
    student,
    pointer: { lessonId: 1, stepId: 1, updatedAt: now },
    lesson1: createEmptyLesson1State(),
    lesson2: createEmptyLesson2State(),
    lesson3: createEmptyLesson3State(),
    snapshotHistory: [],
    groupPlanVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
