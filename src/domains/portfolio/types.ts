/**
 * 文件说明：模块档案（Portfolio）领域类型定义
 * 职责：ModulePortfolio 是整个应用的核心聚合根，串联所有课时数据
 *       采用"链式 Portfolio 模型"——一个学生对应一条完整记录
 * 更新触发：新增课时（如课时3）时在此扩展；调整课时数据结构时同步更新
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
    snapshotHistory: [],
    groupPlanVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
