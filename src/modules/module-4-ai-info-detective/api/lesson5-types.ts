/**
 * 文件说明：模块 4 课时 5 学生端 API 类型。
 * 职责：集中定义 v2/v3 submissions、active-session、participant attach、session state、assignment list、answer、rating、my-report 与 completion-summary 的请求/响应字段，供 lesson5 adapter 与学生端 Step1-Step4 共享。
 * 更新触发：后端 `/api/v1/module4/lesson5/*` 学生端字段、题池版本状态、session phase、answer/rating/my-report/V3/completion-summary 契约或前端展示摘要变化时，需要同步更新本文件。
 */

export type Lesson5MaterialKind = "news" | "image"
export type Lesson5SessionRunType = "normal" | "makeup" | "test"
export type Lesson5SessionPhase =
  | "draft"
  | "pool_locked"
  | "trial_open"
  | "trial_locked"
  | "analytics_open"
  | "revision_open"
  | "closed"

export type Lesson5IssueFlag =
  | "source_insufficient"
  | "explanation_unclear"
  | "option_confusing"
  | "material_mismatch"
  | "other"

export type Lesson5StatsStatus = "insufficient" | "preliminary" | "stable"
export type Lesson5RevisionAction = "keep" | "minor_fix" | "major_fix" | "hold"
export type Lesson5ReadyForLesson6 = "none" | "partial" | "full"

export type Lesson5DiagnosisHint =
  | "needs_more_samples"
  | "low_correct_rate"
  | "low_clarity"
  | "low_thinking_value"
  | "low_explanation_helpfulness"
  | "high_issue_flag_rate"

export interface Lesson5V2SubmissionPayload {
  classId: string
  studentName: string
  classSeatCode: string
  lesson5ClientId: string
  readyPackage: Record<string, unknown>
}

export interface Lesson5V2SubmissionItemResult {
  itemId: string
  v2VersionId: string
  status: string
  deduped: boolean
}

export interface Lesson5V2SubmissionResponse {
  ok: boolean
  classId: string
  studentName: string
  classSeatCode: string
  items: Record<Lesson5MaterialKind, Lesson5V2SubmissionItemResult>
  submittedAt: string
}

export interface Lesson5SessionSettings {
  questionCount: number
  newsCount: number
  imageCount: number
}

export interface Lesson5ActiveSessionResponse {
  sessionId: string
  classId: string
  className: string
  title: string
  runType: Lesson5SessionRunType
  phase: Lesson5SessionPhase
  settings: Lesson5SessionSettings
  serverNow: string
}

export interface Lesson5AttachParticipantPayload {
  sessionId: string
  classId: string
  studentName: string
  classSeatCode: string
  lesson5ClientId: string
}

export interface Lesson5AttachParticipantResponse {
  participantId: string
  sessionId: string
  phase: Lesson5SessionPhase
  serverNow: string
}

export interface Lesson5ParticipantState {
  participantId: string
  answeredCount: number
  ratedCount: number
  completed: boolean
}

export interface Lesson5SessionStateResponse {
  sessionId: string
  phase: Lesson5SessionPhase
  settings: Lesson5SessionSettings
  participant: Lesson5ParticipantState
  serverNow: string
}

export interface Lesson5AssignmentMaterial {
  titleOrName?: string
  displayNote?: string
  sourceType?: string
  asset?: {
    dataUrl?: string
    mimeType?: string
    name?: string
    alt?: string
    title?: string
  } | null
}

export interface Lesson5AssignmentTask {
  prompt?: string
  question?: string
}

export interface Lesson5AssignmentOption {
  key?: string
  label?: string
}

export interface Lesson5AssignmentDto {
  assignmentId: string
  itemId: string
  itemVersionId: string
  cardKind: Lesson5MaterialKind
  orderIndex: number
  material: Lesson5AssignmentMaterial
  task: Lesson5AssignmentTask
  options: Lesson5AssignmentOption[]
  itemShortName?: string | null
}

export interface Lesson5AssignmentListResponse {
  sessionId: string
  participantId: string
  assignments: Lesson5AssignmentDto[]
  serverNow: string
}

export interface Lesson5AnswerSourceSummary {
  sourceType?: string
  sourceRecord?: string
  verificationNote?: string
  type?: string
  note?: string
  url?: string
  link?: string
  [key: string]: unknown
}

export interface Lesson5AnswerSubmitRequest {
  participantId: string
  lesson5ClientId: string
  selectedOptionKey: string
  idempotencyKey?: string
}

export interface Lesson5AnswerReveal {
  explanation: string
  summary?: string
  options?: Array<{
    key?: string
    label?: string
    rationale?: string
  }>
  source?: string | Lesson5AnswerSourceSummary | null
}

export interface Lesson5AnswerSubmitResponse {
  answerId: string
  assignmentId: string
  itemId: string
  itemVersionId: string
  selectedOptionKey: string
  correctOptionKey: string
  isCorrect: boolean
  reveal: Lesson5AnswerReveal
  answeredAt: string
}

export interface Lesson5RatingSubmitRequest {
  participantId: string
  lesson5ClientId: string
  clarity: number
  thinkingValue: number
  explanationHelpfulness: number
  issueFlags: Lesson5IssueFlag[]
  comment: string
}

export interface Lesson5RatingSubmitResponse {
  ratingId: string
  answerId: string
  assignmentId: string
  ratedAt: string
}

export interface Lesson5ItemStatsDto {
  itemId: string
  itemVersionId: string
  itemShortName?: string | null
  kind: Lesson5MaterialKind
  validAnswerCount: number
  correctCount: number
  correctRate: number
  avgClarity: number | null
  avgThinkingValue: number | null
  avgExplanationHelpfulness: number | null
  issueFlagCount: number
  issueFlagRate: number
  issueFlags: Lesson5IssueFlag[]
  sampleComments: string[]
  statsStatus: Lesson5StatsStatus
  computedAt: string
}

export interface Lesson5MyReportItemStatsDto extends Lesson5ItemStatsDto {
  diagnosisHints: Lesson5DiagnosisHint[]
}

export interface Lesson5MyReportResponse {
  sessionId: string
  participantId: string
  items: Lesson5MyReportItemStatsDto[]
  generatedAt: string
}

export interface Lesson5V3RevisionDiagnosis {
  selectedProblems: string[]
  evidence: string
}

export interface Lesson5V3RevisionPlan {
  revisionAction: Lesson5RevisionAction
  diagnosis: Lesson5V3RevisionDiagnosis
  revisionReason: string
  expectedEffect: string
}

export interface Lesson5V3SubmissionPayload {
  sessionId: string
  participantId: string
  lesson5ClientId: string
  itemId: string
  baseV2VersionId: string
  revisionPlan: Lesson5V3RevisionPlan
  v3CardJson: Record<string, unknown>
}

export interface Lesson5V3SubmissionResponse {
  ok: boolean
  itemId: string
  v3VersionId: string
  status: string
  readyForLesson6: Lesson5ReadyForLesson6
  deduped: boolean
}

export interface Lesson5RevisionPlanItemDto {
  studentSeatCode: string
  studentName: string
  participantId?: string | null
  itemId: string
  cardKind: Lesson5MaterialKind
  baseV2VersionId: string
  v3VersionId?: string | null
  revisionAction?: Lesson5RevisionAction | null
  diagnosis: Record<string, unknown>
  revisionReason: string
  expectedEffect: string
  status: "none" | "submitted"
  submittedAt?: string | null
  updatedAt?: string | null
}

export interface Lesson5CompletionRevisionDto {
  readyForLesson6: Lesson5ReadyForLesson6
  submittedCount: number
  submittedItems: Lesson5RevisionPlanItemDto[]
}

export interface Lesson5CompletionQuickCheckDto {
  t1HasV2Submission: boolean
  t2HasTrialStats: boolean
  t3HasV3Submission: boolean
}

export interface Lesson5MyCompletionSummaryResponse {
  sessionId: string
  participantId: string
  v2Submit: Record<string, unknown>
  trial: Record<string, unknown>
  myItemStats: Lesson5MyReportItemStatsDto[]
  revision: Lesson5CompletionRevisionDto
  quickCheck: Lesson5CompletionQuickCheckDto
  generatedAt: string
}
