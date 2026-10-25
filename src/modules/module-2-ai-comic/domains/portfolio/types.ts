/**
 * 文件说明：模块 2 学习档案数据契约 v1 的 TypeScript 类型与空档案工厂。
 * 职责：按 build_Plan data-contract 第 1、2 节定义 Module2PortfolioV1 及其来源快照、候选草稿、课时一状态、选景、视觉方向、图片版本、修改记录与本机资产记录；提供 createNewModule2Portfolio 生成身份可全空的首次草稿。
 * 更新触发：数据契约字段、枚举、schemaVersion、资产记录字段或空档案初值变化时，需要同步更新本文件，并同步 validate.ts 与回归测试。
 *
 * 注意：这里只是静态类型；外部输入（数据库读回、学习包）必须经 validate.ts 运行时校验，禁止用类型断言冒充校验。
 */

export type Module2LessonId = 1 | 2 | 3 | 4 | 5 | 6

export type Module2Lesson1StepId = 1 | 2 | 3 | 4

export const MODULE2_MODULE_ID = "module-2-ai-comic" as const
export const MODULE2_SCHEMA_VERSION = 1 as const

export const MODULE2_FOUR_PARTS = ["opening", "development", "turn", "ending"] as const
export type FourPart = (typeof MODULE2_FOUR_PARTS)[number]

export const MODULE2_SOURCE_ORIGINS = [
  "classquest-html-v1",
  "classquest-html-legacy",
  "classquest-md-legacy",
  "manual",
] as const
export type SourceOrigin = (typeof MODULE2_SOURCE_ORIGINS)[number]

export const MODULE2_IMAGE_SLOTS = ["character-reference", ...MODULE2_FOUR_PARTS, "other"] as const
export type ImageSlot = (typeof MODULE2_IMAGE_SLOTS)[number]

export const MODULE2_SELECTABLE_SLOTS = [...MODULE2_FOUR_PARTS, "character-reference"] as const
export type SelectableSlot = (typeof MODULE2_SELECTABLE_SLOTS)[number]

/** 'sha256:' + 64 位小写十六进制；摘要基于图片实际二进制字节。 */
export type AssetId = string

export const MODULE2_SUPPORTED_IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const
export type Module2ImageMime = (typeof MODULE2_SUPPORTED_IMAGE_MIMES)[number]

export interface StudentIdentity {
  clazz: string
  studentName: string
  classSeatCode: string
}

export interface SourceSnapshot {
  id: string
  origin: SourceOrigin
  filename: string | null
  sourceFileSha256: string | null
  importedAt: string
  /** 本模块中学生确认的时间。 */
  studentConfirmedAt: string
  /** 原文件确有元数据才有，绝不以导入时间补造。 */
  sourceConfirmedAt: string | null
  /** 文件原有身份副本；当前档案身份在 portfolio.student。 */
  student: StudentIdentity
  storyTitle: string
  parts: Record<FourPart, string>
  isTeachingSample: boolean
  /** 人工核对 / 身份更正等来源说明，不冒充原文件字段。 */
  importNote: string
}

/** 未确认候选：纯文本字段允许为空，学生确认后才成为 SourceSnapshot。 */
export type SourceImportDraft = Omit<SourceSnapshot, "id" | "studentConfirmedAt">

export interface Module2Lesson1State {
  contentVersion: 1
  step: Module2Lesson1StepId
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  completed: boolean
  completedAt: string | null
  sampleObservation: string
  sampleViewed: boolean
  reviewNeeded: { storyboard: boolean; visualDirection: boolean }
}

export interface Storyboard {
  sourceSnapshotId: string | null
  frames: Record<FourPart, { sceneSentence: string }>
  confirmedAt: string | null
}

export interface VisualDirection {
  /** 2—3 个；仅去空白 / 去重，不限定预设词。 */
  words: string[]
  reason: string
  /** 参考风格可不选；自定义仍有效。 */
  referenceStyleId: string | null
  confirmedAt: string | null
}

export interface ImageVersion {
  id: string
  slot: ImageSlot
  sourceSnapshotId: string
  mainAssetId: AssetId
  /** 首版默认保留原图；未压缩时与 mainAssetId 相同。 */
  originalAssetId: AssetId
  prompt: string
  referenceAssetIds: AssetId[]
  createdAt: string
  /** 外部工具名称，可空；不伪造模型版本。 */
  toolLabel: string
  note: string
}

export interface Iteration {
  id: string
  problem: string
  evidence: string
  changedConditions: string
  beforeVersionId: string
  afterVersionId: string
  judgment: string
  /** before 或 after；可记录改善失败。 */
  selectedVersionId: string
  createdAt: string
}

export interface Module2PortfolioV1 {
  schemaVersion: 1
  id: string
  moduleId: typeof MODULE2_MODULE_ID
  /** 每次成功保存单调增加，导出快照用。 */
  revision: number
  createdAt: string
  updatedAt: string
  student: StudentIdentity
  sourceSnapshot: SourceSnapshot | null
  /** 未确认候选，也随学习包备份。 */
  sourceImportDraft: SourceImportDraft | null
  sourceHistory: SourceSnapshot[]
  lesson1: Module2Lesson1State
  storyboard: Storyboard
  visualDirection: VisualDirection
  /** 本作品全部已保存资产库存；去重，不只选中图。 */
  assetIds: AssetId[]
  /** 课时一保持空。 */
  imageVersions: ImageVersion[]
  selectedVersions: Partial<Record<SelectableSlot, string>>
  /** 课时一保持空，不提前要求学生填写。 */
  iterations: Iteration[]
}

/** assets store 中的一条持久资产记录（data-contract 第 2 节）。 */
export interface Module2StoredAsset {
  assetId: AssetId
  blob: Blob
  mime: Module2ImageMime
  byteLength: number
  width: number
  height: number
  /** 64 位小写十六进制，与 assetId 去掉前缀后一致。 */
  sha256: string
  createdAt: string
}

/** 生成稳定 ID；randomUUID 只在安全上下文可用，http 课堂访问时退回时间 + 随机数。 */
export function createModule2Id(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${random}`
}

export function createEmptyStudentIdentity(): StudentIdentity {
  return { clazz: "", studentName: "", classSeatCode: "" }
}

export function createEmptyFourParts<T>(factory: () => T): Record<FourPart, T> {
  return {
    opening: factory(),
    development: factory(),
    turn: factory(),
    ending: factory(),
  }
}

/** 首次草稿：身份可全空，没有来源、没有任何确认与完成态。revision 为 0，首次成功保存后变为 1。 */
export function createNewModule2Portfolio(
  student: StudentIdentity = createEmptyStudentIdentity(),
  now: string = new Date().toISOString(),
): Module2PortfolioV1 {
  return {
    schemaVersion: MODULE2_SCHEMA_VERSION,
    id: createModule2Id("m2p"),
    moduleId: MODULE2_MODULE_ID,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    student: { ...student },
    sourceSnapshot: null,
    sourceImportDraft: null,
    sourceHistory: [],
    lesson1: {
      contentVersion: 1,
      step: 1,
      step1Completed: false,
      step2Completed: false,
      step3Completed: false,
      step4Completed: false,
      completed: false,
      completedAt: null,
      sampleObservation: "",
      sampleViewed: false,
      reviewNeeded: { storyboard: false, visualDirection: false },
    },
    storyboard: {
      sourceSnapshotId: null,
      frames: createEmptyFourParts(() => ({ sceneSentence: "" })),
      confirmedAt: null,
    },
    visualDirection: {
      words: [],
      reason: "",
      referenceStyleId: null,
      confirmedAt: null,
    },
    assetIds: [],
    imageVersions: [],
    selectedVersions: {},
    iterations: [],
  }
}
