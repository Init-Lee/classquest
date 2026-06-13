/**
 * 文件说明：模块 4 课时 6 API 类型。
 * 职责：定义学生 V3 发布状态查询与匿名公共挑战 runs/current/answers/summary 的前端 DTO 子集，字段以 camelCase 对齐后端 lesson6 schemas.py。
 * 更新触发：课时 6 学生发布状态、公共挑战后端请求/响应字段、隐私边界、错误响应或前端 adapter 展示所需字段变化时，需要同步更新本文件。
 */

export type PublicChallengeContext = "lesson6_class" | "public_showcase"
export type PublicChallengeCardKind = "news" | "image"
export type Lesson6PublicationStatus = "pending_teacher_check" | "publishable" | "unknown"

export interface Lesson6PublicationStatusQueryItem {
  kind: PublicChallengeCardKind
  itemId: string
  itemVersionId: string
}

export interface Lesson6PublicationStatusRequest {
  items: Lesson6PublicationStatusQueryItem[]
}

export interface Lesson6PublicationStatusItem extends Lesson6PublicationStatusQueryItem {
  status: Lesson6PublicationStatus
  label: string
  checkedAt: string
}

export interface Lesson6PublicationStatusResponse {
  items: Lesson6PublicationStatusItem[]
  syncedAt: string
}

export interface PublicChallengeRunCreateRequest {
  context: PublicChallengeContext
}

export interface PublicChallengeRun {
  runId: string
  context: PublicChallengeContext
  questionCount: number
  startedAt: string
}

export interface PublicChallengeMaterialAsset {
  dataUrl?: string
  mimeType?: string
  name?: string
  alt?: string
  title?: string
}

export interface PublicChallengeMaterial {
  titleOrName?: string
  displayNote?: string
  sourceType?: string
  asset?: PublicChallengeMaterialAsset | null
  [key: string]: unknown
}

export interface PublicChallengeOption {
  key?: string
  label?: string
  rationale?: string
}

export interface PublicChallengeTask {
  prompt?: string
  question?: string
  options?: PublicChallengeOption[]
  [key: string]: unknown
}

export interface PublicChallengeCurrentQuestion {
  runId: string
  runItemId?: string | null
  orderIndex?: number | null
  questionCount: number
  answeredCount: number
  completed: boolean
  kind?: PublicChallengeCardKind | null
  material: PublicChallengeMaterial
  task: PublicChallengeTask
}

export interface PublicChallengeAnswerRequest {
  runItemId: string
  selectedOptionKey: string
  durationMs?: number
}

export interface PublicChallengeProgressDto {
  answeredCount: number
  questionCount: number
}

export interface PublicChallengeNextDto {
  hasNext: boolean
  nextOrderIndex?: number | null
}

export interface PublicChallengeAnswerSourceSummary {
  sourceType?: string
  sourceRecord?: string
  verificationNote?: string
  type?: string
  record?: string
  note?: string
  url?: string
  link?: string
  [key: string]: unknown
}

export interface PublicChallengeAnswerExplanation {
  text?: string
  summary?: string
  detail?: string
  [key: string]: unknown
}

export interface PublicChallengeAnswerResponse {
  isCorrect: boolean
  correctOptionKey: string
  explanation: PublicChallengeAnswerExplanation
  source?: string | PublicChallengeAnswerSourceSummary | null
  progress: PublicChallengeProgressDto
  next: PublicChallengeNextDto
}

export interface PublicChallengeSummary {
  runId: string
  completed: boolean
  questionCount: number
  answeredCount: number
  context: PublicChallengeContext
  completedAt?: string | null
}

export interface PublicChallengeNotReady {
  error: "public_bank_not_ready"
  message: string
  availableCount: number
}
