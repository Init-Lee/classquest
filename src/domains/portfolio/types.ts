/**
 * 文件说明：模块档案（Portfolio）领域类型定义
 * 职责：ModulePortfolio 是整个应用的核心聚合根，串联所有课时数据
 *       采用"链式 Portfolio 模型"——一个学生对应一条完整记录
 * 更新触发：新增课时（如课时5+）时在此扩展；调整课时数据结构时同步更新
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
  /** 第2关：这条材料让我注意到什么（个人填写） */
  toolboxNoticeWhat: string
  /** 第2关：海报上的「为何关注」表述草稿 */
  toolboxWhyOnPoster: string
  /** 第2关：是否已确认「为何关注预览」进入稳定稿（解锁前左侧可继续改） */
  toolboxWhyPreviewLocked: boolean

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

/**
 * 课时4第3关：小组制作方案单
 * 由组长记录，指导第4关协作生成网页的执行说明
 */
export interface ProductionPlan {
  /** 底稿作者：选用哪位成员的网页草稿作为底稿 */
  baseAuthor: string
  /** 主操手姓名（不一定是组长） */
  operatorName: string
  /** 证据核对负责人姓名 */
  evidenceCheckerName: string
  /** 来源说明负责人姓名 */
  sourceCheckerName: string
  /** AI声明核查负责人姓名 */
  aiVerifierName: string
  /** 多媒体替换计划：哪些占位图需替换为真实内容 */
  mediaReplacementPlan: string
  /** AI使用边界：哪些地方允许AI参与局部生成 */
  aiUsageBoundary: string
  /** 必须人工核查的要点说明 */
  manualCheckPoints: string
}

/** 课时4状态数据（小组合并、个人草稿、协商生成、升级提交） */
export interface Lesson4State {
  // ---- 第1关：小组合并与补齐"可能的原因" ----
  /** 组长已导入的成员个人整理包数量（累计，含重复导入会覆盖同名） */
  memberPackagesImported: number
  /** 小组内容合并是否已完成（组长勾选确认） */
  groupMergeCompleted: boolean
  /** 小组讨论后填写的"可能的原因"（谨慎表述） */
  possibleCauses: string
  /** 组长填写的海报标题 */
  posterTitle: string
  /** 组长填写的海报副标题 */
  posterSubtitle: string
  /** 是否已导出小组网页文字骨架包 v1（供组员在第2关导入） */
  skeletonExported: boolean

  // ---- 第2关：每个人独立完成 HTML + AI 草稿 ----
  /** 是否已导入组长分发的小组骨架包 v1（仅组员在第1关导入时设为 true） */
  skeletonImported: boolean
  /**
   * 骨架包 JSON 字符串：
   * - 组员：第1关导入骨架包时写入，用于第2关展示合并内容
   * - 组长：第1关导出骨架包时同步写入，用于第2关展示同等合并内容
   */
  skeletonPackageJson: string
  /**
   * 组长在第1关已导入的成员整理包 JSON 数组字符串（PersonalPackage[]）
   * 用于页面刷新后恢复导入状态，避免重复导入
   */
  importedPackagesJson: string
  /** 个人网页草稿 HTML 内容（v0） */
  personalDraftHtml: string
  /** 个人草稿是否已完成并确认提交 */
  personalDraftCompleted: boolean

  // ---- 第3关：组长记录小组讨论与制作方案 ----
  /** 小组制作方案单（null = 尚未填写） */
  productionPlan: ProductionPlan | null
  /** 制作方案单是否已完成（组长确认） */
  planCompleted: boolean

  // ---- 第4关：按流程协商完成小组网页生成 ----
  /** 小组网页 v1 HTML 内容（协商生成版） */
  groupWebpageV1: string
  /** 组长是否已完成第4关协作流程确认 */
  collabCompleted: boolean

  // ---- 第5关：升级校验与最终导出 ----
  /** 最终 HTML 内容（升级后）*/
  finalHtml: string
  /** 可信发布校验清单是否全部通过 */
  verificationPassed: boolean
  /** 是否已导出最终提交版 HTML */
  finalExported: boolean

  /** 课时4是否已完成 */
  completed: boolean
}

/**
 * 课时5第1关：四维度反馈判断
 * 对应同伴反馈单的四个评估维度（讲解逻辑/证据支撑/结论合理性/建议可行性）
 */
export interface FeedbackDimension {
  /** 维度名称 */
  name: string
  /** 当前判断：基本清楚 | 需要修改 | 未填写 */
  status: "clear" | "needs-change" | ""
  /** 关键建议（选填） */
  suggestion: string
}

/**
 * 课时5第2关：版本改动记录行
 * 记录海报修改前后的对比，至少需要 2 行完整填写
 */
export interface ChangeRecord {
  /** 修改项目：改的是哪一块 */
  item: string
  /** 修改前：原来怎么写/怎么讲 */
  before: string
  /** 修改后：现在改成什么 */
  after: string
  /** 为什么改：依据哪条反馈/证据 */
  reason: string
}

/** 课时5状态数据（预演展示与反馈优化） */
export interface Lesson5State {
  // ---- 第1关：意见入池 ----
  /** 四维度反馈（讲解逻辑/证据支撑/结论合理性/建议可行性） */
  feedbackDimensions: FeedbackDimension[]
  /** 优先修改点列表（第1、2条必填，第3条选填） */
  priorityChanges: string[]
  /** 总体建议（选填） */
  overallSuggestion: string
  /** 第1关文本是否已导出到剪贴板 */
  feedbackExported: boolean
  /** 第1关是否已完成（满足至少2条优先修改点） */
  feedbackCompleted: boolean

  // ---- 第2关：改动落地 ----
  /** 改动说明记录（至少2行四列完整才可导出） */
  changeRecords: ChangeRecord[]

  /** 课时5是否已完成 */
  completed: boolean
}

/**
 * 课时6第2关：路演四步中的单步路径
 * 顺序固定为 1-4，不可拖拽或删除
 */
export interface RoadshowStep {
  /** 步骤编号（1-4，只读） */
  step: number
  /** 步骤名称（只读） */
  name: string
  /** 对应海报位置（必填；如"左上角标题区"） */
  posterArea: string
  /** 必说句：所有成员都要守住的核心句（必填） */
  mustSay: string
  /** 可展开点：不同成员可以自由详略（选填） */
  expand: string
}

/** 课时6状态数据（终版海报路演与表达设计） */
export interface Lesson6State {
  // ---- 第1关：示例拆解与路径定标 ----
  /** 已确认理解四步讲解流程 */
  exampleAcknowledged: boolean

  // ---- 第2关：讲解路径定稿与轮流试讲 ----
  /** 四步讲解路径（固定四行，顺序锁定） */
  roadshowSteps: RoadshowStep[]
  /** 最可能被追问的问题（必填） */
  challengeQuestion: string
  /** 准备回到哪条证据（必填） */
  evidenceBack: string
  /** 最后一句收束话（必填） */
  closingSentence: string
  /** 路径单文本是否已导出 */
  pathExported: boolean

  /** 课时6是否已完成 */
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
  /** 课时4数据 */
  lesson4: Lesson4State
  /** 课时5数据 */
  lesson5: Lesson5State
  /** 课时6数据（预埋；lesson-6-dev 开发时填充） */
  lesson6: Lesson6State

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
    toolboxNoticeWhat: "",
    toolboxWhyOnPoster: "",
    toolboxWhyPreviewLocked: false,
    selectedMaterials: [],
    evidenceCards: [],
    originExpression: "",
    personalPackageExported: false,
    completed: false,
  }
}

/** 创建一个空的课时4初始状态 */
export function createEmptyLesson4State(): Lesson4State {
  return {
    memberPackagesImported: 0,
    groupMergeCompleted: false,
    possibleCauses: "",
    posterTitle: "",
    posterSubtitle: "",
    skeletonExported: false,
    skeletonImported: false,
    skeletonPackageJson: "",
    importedPackagesJson: "",
    personalDraftHtml: "",
    personalDraftCompleted: false,
    productionPlan: null,
    planCompleted: false,
    groupWebpageV1: "",
    collabCompleted: false,
    finalHtml: "",
    verificationPassed: false,
    finalExported: false,
    completed: false,
  }
}

/** 创建一个空的课时5初始状态 */
export function createEmptyLesson5State(): Lesson5State {
  return {
    feedbackDimensions: [
      { name: "讲解逻辑", status: "", suggestion: "" },
      { name: "证据支撑", status: "", suggestion: "" },
      { name: "结论合理性", status: "", suggestion: "" },
      { name: "建议可行性", status: "", suggestion: "" },
    ],
    priorityChanges: ["", "", ""],
    overallSuggestion: "",
    feedbackExported: false,
    feedbackCompleted: false,
    changeRecords: [
      { item: "", before: "", after: "", reason: "" },
      { item: "", before: "", after: "", reason: "" },
      { item: "", before: "", after: "", reason: "" },
    ],
    completed: false,
  }
}

/** 创建一个空的课时6初始状态（预埋，lesson-6-dev 开发时完善） */
export function createEmptyLesson6State(): Lesson6State {
  return {
    exampleAcknowledged: false,
    roadshowSteps: [
      { step: 1, name: "点题", posterArea: "", mustSay: "", expand: "" },
      { step: 2, name: "指证据", posterArea: "", mustSay: "", expand: "" },
      { step: 3, name: "说判断与建议", posterArea: "", mustSay: "", expand: "" },
      { step: 4, name: "应追问并收束", posterArea: "", mustSay: "", expand: "" },
    ],
    challengeQuestion: "",
    evidenceBack: "",
    closingSentence: "",
    pathExported: false,
    completed: false,
  }
}

/**
 * 将档案中的 lesson3~lesson6 与当前默认结构合并（IndexedDB/旧包缺字段时补齐）
 */
export function normalizeModulePortfolio(p: ModulePortfolio): ModulePortfolio {
  return {
    ...p,
    lesson3: { ...createEmptyLesson3State(), ...p.lesson3 },
    lesson4: { ...createEmptyLesson4State(), ...(p.lesson4 ?? {}) },
    lesson5: { ...createEmptyLesson5State(), ...(p.lesson5 ?? {}) },
    lesson6: { ...createEmptyLesson6State(), ...(p.lesson6 ?? {}) },
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
    lesson4: createEmptyLesson4State(),
    lesson5: createEmptyLesson5State(),
    lesson6: createEmptyLesson6State(),
    snapshotHistory: [],
    groupPlanVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
