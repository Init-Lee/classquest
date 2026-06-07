/**
 * 文件说明：模块 4 学习档案领域类型。
 * 职责：定义 Module4Portfolio、课时 1/2/3/4/5 本地状态、默认空状态和归一化逻辑，是模块 4 local-first 数据的唯一领域入口。
 * 更新触发：模块 4 新增课时状态、继续学习包字段、学生资料字段、进度指针规则或课时 1/2/3/4/5 过程记录字段变化时，需要同步更新本文件。
 */

import type { JudgmentOption } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

/** 课时 3 判断题选项 key，最多支持 A–F 六项 */
export type Module4Lesson3OptionKey = "A" | "B" | "C" | "D" | "E" | "F"

const LESSON3_OPTION_KEYS: Module4Lesson3OptionKey[] = ["A", "B", "C", "D", "E", "F"]

function isModule4Lesson3OptionKey(value: unknown): value is Module4Lesson3OptionKey {
  return typeof value === "string" && LESSON3_OPTION_KEYS.includes(value as Module4Lesson3OptionKey)
}

function normalizeLesson3TaskOptions(value: unknown, fallback: JudgmentOption[]): JudgmentOption[] {
  if (!Array.isArray(value)) return fallback.slice(0, 3)

  const parsed: Array<{ label: string; rationale: string }> = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    if (!isModule4Lesson3OptionKey(record.key)) continue
    parsed.push({
      label: typeof record.label === "string" ? record.label : "",
      rationale: typeof record.rationale === "string" ? record.rationale : "",
    })
  }

  const count = Math.min(Math.max(parsed.length, 0), LESSON3_OPTION_KEYS.length)
  if (count < 3) return fallback.slice(0, 3)

  const defaultByKey = new Map(fallback.map(option => [option.key, option]))
  return LESSON3_OPTION_KEYS.slice(0, count).map((key, index) => {
    const fallbackOption = defaultByKey.get(key)
    const current = parsed[index]
    return {
      key,
      label: current?.label ?? fallbackOption?.label ?? "",
      rationale: current?.rationale ?? fallbackOption?.rationale ?? "",
    }
  })
}

export const MODULE4_ID = "module-4-ai-info-detective"
export const MODULE4_APP_VERSION = "0.7.2"

/** 学生档案：姓名、班级（下拉文案）、四位班学号（前两位对齐班级序号，后两位班内学号 01～50） */
export interface Module4StudentProfile {
  studentName: string
  clazz: string
  classSeatCode: string
}

export interface Module4ProgressPointer {
  lessonId: number
  stepId: number
}

export interface Module4Lesson1MissionQuizAttempt {
  attemptNo: number
  submittedAt: string
  answers: Record<string, string>
  wrongQuestionIds: string[]
  passed: boolean
}

export type Module4Lesson1Step2SampleKey = "news" | "image"

export interface Module4Lesson1Step2SampleState {
  answered: boolean
  selectedOptionKey?: "A" | "B" | "C"
  isCorrect?: boolean
  selectedAt: string
  answeredAt: string
  explanationViewedAt: string
  materialPreviewOpenedCount: number
  structureInteractionCount: number
  lastInteractionAt: string
  explanationRevealed: boolean
  structureMatched: {
    material: boolean
    task: boolean
    explanation: boolean
    source: boolean
  }
}

export interface Module4Lesson1Step2State {
  introViewed: boolean
  currentPage: "intro" | Module4Lesson1Step2SampleKey
  news: Module4Lesson1Step2SampleState
  image: Module4Lesson1Step2SampleState
  completed: boolean
}

export type Module4Lesson1NewsSourceType = "news_site" | "wechat_article" | "social_screenshot" | "other"
export type Module4Lesson1ImageSourceType = "web" | "ai_generated" | "field_capture" | "mixed"

export type Module4MaterialKind = "news" | "image"
export type Module4MaterialPrepStatus = "ready" | "incomplete" | "none"
export type Module4PostCriteriaStatus = "usable" | "need_fix" | "need_replace"
export type Module4MaterialSourceType = "web" | "ai_generated" | "field_capture" | "mixed"
export type Module4CompressedAssetMimeType = "image/webp" | "image/jpeg" | "image/png"

export interface Module4CompressedMaterialAsset {
  dataUrl: string
  mimeType: Module4CompressedAssetMimeType
  originalName: string
  originalSizeBytes: number
  compressedSizeBytes: number
  width: number
  height: number
  compressedAt: string
  uploadCount: number
}

export interface Module4MaterialSelfChecks {
  typeFits: boolean
  contentCompliant: boolean
  hasJudgmentValue: boolean
}

export interface Module4MaterialScreeningRecord {
  kind: Module4MaterialKind
  initialStatus: Module4MaterialPrepStatus
  postCriteriaStatus?: Module4PostCriteriaStatus
  asset?: Module4CompressedMaterialAsset
  titleOrName: string
  sourceType?: Module4MaterialSourceType
  sourceRecord: string
  sourceAutoPassed: boolean
  sourceCheckCount: number
  sourceCheckLastReason: string
  selfChecks: Module4MaterialSelfChecks
  clueNote: string
  clueEditCount: number
  peerFeedbackNote: string
  peerFeedbackEditCount: number
  completed: boolean
  completedAt: string
}

export interface Module4Lesson2CriteriaExampleAnswer {
  exampleId: string
  selectedCriterion: "typeFits" | "sourceTraceable" | "contentCompliant" | "hasJudgmentValue"
  isCorrect: boolean
}

export interface Module4Lesson2CriteriaAttempt {
  attemptNo: number
  submittedAt: string
  answers: Module4Lesson2CriteriaExampleAnswer[]
  score: number
}

export interface Module4Lesson2ChallengeEvent {
  exampleId: string
  selectedCriterion: "typeFits" | "sourceTraceable" | "contentCompliant" | "hasJudgmentValue"
  isCorrect: boolean
  selectedAt: string
  attemptIndex: number
}

export interface Module4Lesson2QuickCheckTarget<TEvidence extends Record<string, boolean>> {
  achieved: boolean
  evidence: TEvidence
}

export interface Module4Lesson2QuickCheckState {
  T1: Module4Lesson2QuickCheckTarget<{
    newsAssetReady: boolean
    imageAssetReady: boolean
    newsShortNameReady: boolean
    imageShortNameReady: boolean
  }>
  T2: Module4Lesson2QuickCheckTarget<{
    criteriaCalibrationCompleted: boolean
    newsSourceCheckPassed: boolean
    imageSourceCheckPassed: boolean
    newsSelfChecksCompleted: boolean
    imageSelfChecksCompleted: boolean
  }>
  T3: Module4Lesson2QuickCheckTarget<{
    newsClueNoteValid: boolean
    imageClueNoteValid: boolean
  }>
  evaluatedAt: string
  metrics: {
    criteriaAttemptCount: number
    newsUploadCount: number
    imageUploadCount: number
    newsSourceCheckCount: number
    imageSourceCheckCount: number
    newsClueEditCount: number
    imageClueEditCount: number
    newsPeerOrSelfNoteEditCount: number
    imagePeerOrSelfNoteEditCount: number
  }
}

export interface Module4Lesson2State {
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  step5Completed: boolean
  taskBoundaryAcknowledged: boolean
  step1ContextDwellMs: number
  step1ContextViewedAt: string
  step1CaseAnswers: Record<string, string>
  step1MaterialStatusLocked: Record<Module4MaterialKind, boolean>
  step2CriteriaUnlockedKeys: string[]
  step2CriteriaDwellMs: Record<string, number>
  step2ChallengeOrderIds: string[]
  step2ChallengeEvents: Module4Lesson2ChallengeEvent[]
  criteriaAttempts: Module4Lesson2CriteriaAttempt[]
  criteriaExampleScore: number
  criteriaExampleAttemptCount: number
  news: Module4MaterialScreeningRecord
  image: Module4MaterialScreeningRecord
  quickCheck: Module4Lesson2QuickCheckState
  completed: boolean
  completedAt: string
}

export type Module4Lesson3CardVersion = "v1"
export type Module4Lesson3CardStatus = "draft" | "ready_for_lesson4"
export type Module4Lesson3AiReviewRuntimeStatus = "idle" | "pending" | "completed" | "failed"
export type Module4Lesson3AiReviewOverallStatus = "pass" | "needs_revision" | "blocked"
export type Module4Lesson3AiReviewArea = "material" | "task" | "explanation" | "source"
export type Module4Lesson3AiReviewLevel = "ok" | "warning" | "error"

export interface Module4Lesson3MaterialSnapshot {
  kind: Module4MaterialKind
  lesson2Completed: boolean
  lesson2PostCriteriaStatus?: Module4PostCriteriaStatus
  lesson2TitleOrName: string
  lesson2SourceType?: Module4MaterialSourceType
  lesson2SourceRecord: string
  lesson2ClueNote: string
  asset?: Module4CompressedMaterialAsset
  assetFingerprint: string
  snappedAt: string
}

export interface Module4Lesson3CardSelfCheck {
  materialReady: boolean
  taskReady: boolean
  answerSelected: boolean
  explanationReady: boolean
  sourceReady: boolean
  verificationReady: boolean
  allRequiredPassed: boolean
  lastCheckedAt: string
}

export interface Module4Lesson3AiReviewCheck {
  area: Module4Lesson3AiReviewArea
  level: Module4Lesson3AiReviewLevel
  message: string
  suggestion?: string
}

export interface Module4Lesson3AiReviewResult {
  status: Module4Lesson3AiReviewOverallStatus
  summary: string
  checks: Module4Lesson3AiReviewCheck[]
  missingRequiredFields: string[]
  suggestedEdits: string[]
  safetyFlags: string[]
}

/**
 * 单次成功 AI 自检的简化轨迹项。
 * 仅记录可统计字段（请求 ID、时间、状态、tier、四板块等级），不冗余存储 message/summary 文本。
 */
export interface Module4Lesson3AiReviewHistoryEntry {
  requestId: string
  reviewedAt: string
  status: Module4Lesson3AiReviewOverallStatus
  tier: "excellent" | "good" | "blocked"
  areaLevels: Record<Module4Lesson3AiReviewArea, Module4Lesson3AiReviewLevel>
  suggestedEditCount: number
}

/** 课时 3 单张题卡 AI 自检轨迹最多保留的条目数，避免档案无限增长 */
export const LESSON3_AI_REVIEW_HISTORY_LIMIT = 5

export interface Module4Lesson3AiReviewState {
  enabled: boolean
  status: Module4Lesson3AiReviewRuntimeStatus
  lastRequestId: string
  lastReviewedAt: string
  result?: Module4Lesson3AiReviewResult
  /** 题卡内容在上次自检后发生修改，旧结果仅供参考，不能作为放行依据 */
  isStale: boolean
  errorMessage: string
  /** 历史成功调用轨迹（按时间倒序，仅保留简化项） */
  history: Module4Lesson3AiReviewHistoryEntry[]
}

export interface Module4Lesson3QuestionCardDraft {
  id: string
  kind: Module4MaterialKind
  version: Module4Lesson3CardVersion
  status: Module4Lesson3CardStatus
  sourceMaterialSnapshot: Module4Lesson3MaterialSnapshot
  material: {
    titleOrName: string
    displayNote: string
    asset?: Module4CompressedMaterialAsset
    assetFingerprint: string
  }
  task: {
    prompt: string
    options: JudgmentOption[]
    correctOptionKey?: Module4Lesson3OptionKey
  }
  explanation: {
    text: string
    editCount: number
    updatedAt: string
  }
  source: {
    sourceType?: Module4MaterialSourceType
    sourceRecord: string
    verificationNote: string
  }
  selfCheck: Module4Lesson3CardSelfCheck
  aiReview: Module4Lesson3AiReviewState
  metrics: {
    materialEditCount: number
    taskEditCount: number
    explanationEditCount: number
    sourceEditCount: number
    previewModeSwitchCount: number
    aiReviewRequestCount: number
  }
  createdAt: string
  updatedAt: string
}

/** 课时 3 第 4 步单张题卡作者自测记录 */
export interface Lesson3CardSelfTrialRecord {
  submitted: boolean
  selectedOptionKey?: Module4Lesson3OptionKey
  isCorrect?: boolean
  submittedAt?: string
  feedbackViewed: boolean
  confirmed: boolean
  confirmedAt?: string
  /** 确认时写入，用于检测 Step2/Step3 编辑后是否需要重新自测 */
  contentFingerprint?: string
  /** 返回编辑器或内容变更后重置时标记，chip 展示「需要重新作答」 */
  needsRetrial?: boolean
}

export interface Module4Lesson3SelfTrialState {
  news: Lesson3CardSelfTrialRecord
  image: Lesson3CardSelfTrialRecord
}

export interface Module4Lesson3QuickCheckState {
  T1: Module4Lesson2QuickCheckTarget<{
    newsSnapshotReady: boolean
    imageSnapshotReady: boolean
    newsAssetReady: boolean
    imageAssetReady: boolean
  }>
  T2: Module4Lesson2QuickCheckTarget<{
    newsMaterialReady: boolean
    newsTaskReady: boolean
    newsExplanationReady: boolean
    newsSourceReady: boolean
    imageMaterialReady: boolean
    imageTaskReady: boolean
    imageExplanationReady: boolean
    imageSourceReady: boolean
  }>
  T3: Module4Lesson2QuickCheckTarget<{
    finalPreviewConfirmed: boolean
    newsReadyForLesson4: boolean
    imageReadyForLesson4: boolean
    newsSelfTrialConfirmed: boolean
    imageSelfTrialConfirmed: boolean
  }>
  evaluatedAt: string
  metrics: {
    newsExplanationEditCount: number
    imageExplanationEditCount: number
    newsSourceEditCount: number
    imageSourceEditCount: number
    newsPreviewModeSwitchCount: number
    imagePreviewModeSwitchCount: number
    newsAiReviewRequestCount: number
    imageAiReviewRequestCount: number
  }
}

export interface Module4Lesson3State {
  step1Acknowledged: boolean
  step1AcknowledgedAt: string
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  newsCard: Module4Lesson3QuestionCardDraft
  imageCard: Module4Lesson3QuestionCardDraft
  selfTrial: Module4Lesson3SelfTrialState
  finalPreviewConfirmed: boolean
  finalPreviewConfirmedAt: string
  quickCheck: Module4Lesson3QuickCheckState
  completed: boolean
  completedAt: string
}

export type Lesson4OutboundStatus = "not_sent" | "pending" | "claimed" | "submitted" | "pulled" | "cancelled" | "expired"
export type Lesson4InboundStatus = "idle" | "available" | "claimed" | "submitted" | "expired"
export type Lesson4ReviewRubricLevel = "pass" | "minor_fix" | "major_fix"
/** 档位别名，兼容历史 verdict 字段（major_rework 归一化为 major_fix）。 */
export type Lesson4ReviewVerdict = Lesson4ReviewRubricLevel
export type Lesson4ReviewArea = "material" | "task" | "explanation" | "source" | "safety"
/** 单卡量规维度（不含 safety，后者在 reviewJson 整体内容违规统一判定）。 */
export type Lesson4ReviewRubricDimensionKey = Exclude<Lesson4ReviewArea, "safety">

export interface Lesson4ReviewRubricEntry {
  /** 未选中时为 undefined，提交前每个维度须三选一。 */
  level?: Lesson4ReviewRubricLevel
  /** 选定档位后必填，说明该维度评价理由。 */
  reason: string
}

export interface Module4Lesson4ReviewCardFeedback {
  trialAnswer?: Module4Lesson3OptionKey
  rubric: Record<Lesson4ReviewRubricDimensionKey, Lesson4ReviewRubricEntry>
  /** 该题卡总体建议（分卡独立，不再全局共用）。 */
  overallComment: string
  /** null 表示尚未选择是否违规；提交本卡前须明确 true/false。 */
  contentViolation: boolean | null
  /** 判定存在违规时必填说明。 */
  contentViolationNote: string
  /** 本卡已通过本地校验与 AI 审核，允许整体提交。 */
  approved?: boolean
}

export interface Module4Lesson4ReviewJson {
  cards: Record<Module4MaterialKind, Module4Lesson4ReviewCardFeedback>
}

export type Lesson4FeedbackDecisionAction = "accept" | "partial_accept" | "keep_with_reason" | "must_revise"
export type Lesson4FeedbackDecisionLevel = "minor_fix" | "major_fix" | "content_violation"

export interface Lesson4FeedbackDecision {
  id: string
  cardKind: Module4MaterialKind
  area: Lesson4ReviewArea | "overall"
  level: Lesson4FeedbackDecisionLevel
  reviewerReason: string
  action: Lesson4FeedbackDecisionAction
  authorPlan: string
  resolved: boolean
  resolvedAt: string
}

export interface Module4Lesson4FeedbackInboxState {
  digestedAt: string
  decisions: Lesson4FeedbackDecision[]
  allFeedbackReviewed: boolean
}

export type Module4Lesson4V2CardStatus = "draft" | "confirmed" | "ready_for_lesson5"

export interface Module4Lesson4V2CardDraft {
  id: string
  kind: Module4MaterialKind
  version: "v2"
  status: Module4Lesson4V2CardStatus
  baseV1CardId: string
  baseV1UpdatedAt: string
  material: Module4Lesson3QuestionCardDraft["material"]
  task: Module4Lesson3QuestionCardDraft["task"]
  explanation: Module4Lesson3QuestionCardDraft["explanation"]
  source: Module4Lesson3QuestionCardDraft["source"]
  revision: {
    summary: string
    decisionIdsResolved: string[]
    confirmedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface Module4Lesson4V2State {
  newsCard: Module4Lesson4V2CardDraft
  imageCard: Module4Lesson4V2CardDraft
  newsConfirmed: boolean
  imageConfirmed: boolean
  confirmedAt: string
}

export interface Module4Lesson4ReadinessState {
  newsReady: boolean
  imageReady: boolean
  readyForLesson5: boolean
  checkedAt: string
  exportedPackageJson?: unknown
}

export type Module4Lesson4QuickCheckLevel = "excellent" | "achieved" | "basic" | "not_achieved"

export interface Module4Lesson4QuickCheckTarget<TEvidence extends Record<string, unknown>> {
  score: number
  achieved: boolean
  evidence: TEvidence
}

export interface Module4Lesson4QuickCheckState {
  T1: Module4Lesson4QuickCheckTarget<{
    outboundCompleted: boolean
    inboundCompleted: boolean
    gatePassed: boolean
    step1Completed: boolean
    receivedReviewPresent: boolean
  }>
  T2: Module4Lesson4QuickCheckTarget<{
    step2Completed: boolean
    allFeedbackReviewed: boolean
    reviewerPassOnly: boolean
    decisionCount: number
    minorFixDecisionCount: number
    blockingDecisionCount: number
    unresolvedBlockingDecisionIds: string[]
    minorDecisionsMissingReasonIds: string[]
  }>
  T3: Module4Lesson4QuickCheckTarget<{
    step3Completed: boolean
    newsConfirmed: boolean
    imageConfirmed: boolean
    readyForLesson5Status: "green" | "amber" | "red"
    newsSummaryRequired: boolean
    imageSummaryRequired: boolean
    newsRevisionSummaryReady: boolean
    imageRevisionSummaryReady: boolean
    allNewsSectionsPass: boolean
    allImageSectionsPass: boolean
    noRevisionNeeded: boolean
    unresolvedBlockingDecisionIds: string[]
  }>
  totalScore: number
  level: Module4Lesson4QuickCheckLevel
  evaluatedAt: string
  blockers: string[]
}

/** 课时 4 Step4 保存入库包时写入的阶段快照摘要（不含完整题卡正文，便于教师评分与继续学习包携带）。 */
export interface Module4Lesson4StageSnapshot {
  version: "lesson4-stage-v1"
  snappedAt: string
  stepsCompleted: {
    step1: boolean
    step2: boolean
    step3: boolean
    step4: boolean
  }
  gatePassed: boolean
  v2: {
    newsConfirmed: boolean
    imageConfirmed: boolean
    newsStatus: Module4Lesson4V2CardStatus
    imageStatus: Module4Lesson4V2CardStatus
    newsRevisionSummary: string
    imageRevisionSummary: string
    newsDecisionIdsResolved: string[]
    imageDecisionIdsResolved: string[]
  }
  receivedReviewPresent: boolean
  quickCheck: {
    totalScore: number
    level: Module4Lesson4QuickCheckLevel
    evaluatedAt: string
    targets: {
      T1: Pick<Module4Lesson4QuickCheckState["T1"], "score" | "achieved">
      T2: Pick<Module4Lesson4QuickCheckState["T2"], "score" | "achieved">
      T3: Pick<Module4Lesson4QuickCheckState["T3"], "score" | "achieved">
    }
    blockers: string[]
  }
  rubricObservationSummary: {
    passCount: number
    minorFixCount: number
    majorFixCount: number
    contentViolationCount: number
    unresolvedBlockingCount: number
  }
  decisionsSummary: Array<{
    id: string
    cardKind: Module4MaterialKind
    area: Lesson4ReviewArea | "overall"
    level: Lesson4FeedbackDecisionLevel
    action: Lesson4FeedbackDecisionAction
    resolved: boolean
    authorPlan: string
  }>
  readiness: Pick<Module4Lesson4ReadinessState, "newsReady" | "imageReady" | "readyForLesson5" | "checkedAt">
  readyForLesson5EvaluationStatus?: "green" | "amber" | "red"
}

/** 领取后冻结的送审题卡 JSON，与 api Lesson4ReviewRequestJson 结构一致。 */
export interface Module4Lesson4ReviewRequestJson {
  cards: Record<Module4MaterialKind, Module4Lesson3QuestionCardDraft>
  snapshotMeta: {
    version: "v1"
    snapshotCreatedAt: string
  }
}

export interface Module4Lesson4State {
  outbound: {
    status: Lesson4OutboundStatus
    requestId: string
    targetReviewerSeatCode: string
    inviteCode: string
    sentAt: string
    pendingExpiresAt: string
    reviewExpiresAt: string
    receivedReviewJson?: Module4Lesson4ReviewJson
    completed: boolean
  }
  inbound: {
    status: Lesson4InboundStatus
    requestId: string
    authorSeatCode: string
    /** 领取后审查 TTL 截止时间，与 claim/status API 的 reviewExpiresAt 对齐。 */
    reviewExpiresAt: string
    /** B5 claim 返回的完整题卡，持久化以支持刷新/重挂载后恢复工作台。 */
    claimedRequestJson?: Module4Lesson4ReviewRequestJson
    /** 审查进行中的临时草稿（IndexedDB）；提交成功或 inbound 重置后清除，与 submittedReviewJson 区分。 */
    reviewDraftJson?: Module4Lesson4ReviewJson
    submittedReviewJson?: Module4Lesson4ReviewJson
    completed: boolean
  }
  gatePassed: boolean
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  feedbackInbox: Module4Lesson4FeedbackInboxState
  v2: Module4Lesson4V2State
  readiness: Module4Lesson4ReadinessState
  quickCheck: Module4Lesson4QuickCheckState
  /** Step4 保存入库包时写入；供阶段快照 HTML 与继续学习包携带摘要。 */
  stageSnapshot?: Module4Lesson4StageSnapshot
  completed: boolean
  completedAt: string
}

export interface Module4Lesson5SubmissionItemSummary {
  itemId: string
  v2VersionId: string
  status: string
  deduped: boolean
}

export interface Module4Lesson5SubmissionSummary {
  submittedAt: string
  classId: string
  studentName: string
  classSeatCode: string
  mode: "fixture" | "http"
  items: Record<Module4MaterialKind, Module4Lesson5SubmissionItemSummary>
}

export type Module4Lesson5SessionPhase =
  | "pool_locked"
  | "trial_open"
  | "trial_locked"
  | "analytics_open"
  | "revision_open"
  | "closed"

export interface Module4Lesson5ConnectedSessionState {
  sessionId: string
  participantId: string
  classId: string
  className: string
  title: string
  phase: Module4Lesson5SessionPhase
  questionCount: number
  newsCount: number
  imageCount: number
  attachedAt: string
  serverNow: string
  mode: "fixture" | "http"
}

export type Module4Lesson5RevisionAction = "keep" | "minor_fix" | "major_fix" | "hold"
export type Module4Lesson5ReadyForLesson6 = "none" | "partial" | "full"

export interface Module4Lesson5MyReportItemStats {
  itemId: string
  itemVersionId: string
  kind: Module4MaterialKind
  validAnswerCount: number
  correctCount: number
  correctRate: number
  avgClarity: number | null
  avgThinkingValue: number | null
  avgExplanationHelpfulness: number | null
  issueFlagCount: number
  issueFlagRate: number
  issueFlags: string[]
  sampleComments: string[]
  statsStatus: "insufficient" | "preliminary" | "stable"
  computedAt: string
  diagnosisHints: string[]
}

export interface Module4Lesson5MyReportState {
  sessionId: string
  participantId: string
  items: Module4Lesson5MyReportItemStats[]
  generatedAt: string
}

export interface Module4Lesson5RevisionPlanState {
  revisionAction: Module4Lesson5RevisionAction
  selectedProblems: string[]
  evidence: string
  revisionReason: string
  expectedEffect: string
}

export interface Module4Lesson5RevisionCardState {
  card: Module4Lesson4V2CardDraft
  revisionPlan: Module4Lesson5RevisionPlanState
  itemId: string
  baseV2VersionId: string
  v3VersionId?: string
  submittedAt: string
  updatedAt: string
  deduped: boolean
}

export interface Module4Lesson5RevisionState {
  cards: Record<Module4MaterialKind, Module4Lesson5RevisionCardState>
  readyForLesson6: Module4Lesson5ReadyForLesson6
  submittedCount: number
  lastSubmittedAt: string
}

export type Module4Lesson5QuickCheckLevel = "excellent" | "achieved" | "basic" | "not_achieved"

export interface Module4Lesson5QuickCheckTarget<TEvidence extends Record<string, unknown>> {
  score: number
  achieved: boolean
  evidence: TEvidence
}

export interface Module4Lesson5QuickCheckState {
  /** 兼容旧档案与后端 completion-summary 的布尔字段，展示层不要直接作为学生可见文案。 */
  t1HasV2Submission: boolean
  t2HasTrialStats: boolean
  t3HasV3Submission: boolean
  readyForLesson6: Module4Lesson5ReadyForLesson6
  evaluatedAt: string
  T1: Module4Lesson5QuickCheckTarget<{
    v2Submitted: boolean
    hasNewsItem: boolean
    hasImageItem: boolean
  }>
  T2: Module4Lesson5QuickCheckTarget<{
    trialStatsReady: boolean
    reportItemCount: number
    hasNewsStats: boolean
    hasImageStats: boolean
  }>
  T3: Module4Lesson5QuickCheckTarget<{
    v3Submitted: boolean
    submittedCount: number
    readyForLesson6: Module4Lesson5ReadyForLesson6
    newsSubmitted: boolean
    imageSubmitted: boolean
  }>
  totalScore: number
  level: Module4Lesson5QuickCheckLevel
  blockers: string[]
}

export interface Module4Lesson5StageSnapshot {
  version: "lesson5-stage-v1"
  snappedAt: string
  sessionId: string
  participantId: string
  v2Submit: Record<string, unknown>
  trial: Record<string, unknown>
  revision: {
    readyForLesson6: Module4Lesson5ReadyForLesson6
    submittedCount: number
    submittedItemIds: string[]
  }
  quickCheck: {
    totalScore: number
    level: Module4Lesson5QuickCheckLevel
    evaluatedAt: string
    targets: {
      T1: Pick<Module4Lesson5QuickCheckState["T1"], "score" | "achieved">
      T2: Pick<Module4Lesson5QuickCheckState["T2"], "score" | "achieved">
      T3: Pick<Module4Lesson5QuickCheckState["T3"], "score" | "achieved">
    }
    blockers: string[]
  }
}

export interface Module4Lesson5State {
  clientId: string
  submissionSummary?: Module4Lesson5SubmissionSummary
  connectedSession?: Module4Lesson5ConnectedSessionState
  revision?: Module4Lesson5RevisionState
  quickCheck: Module4Lesson5QuickCheckState
  stageSnapshot?: Module4Lesson5StageSnapshot
  myReport?: Module4Lesson5MyReportState
  completed: boolean
  completedAt: string
}

export interface Module4Lesson1Step5State {
  newsPlanText: string
  imagePlanText: string
  newsPossibleSourceType?: Module4Lesson1NewsSourceType
  imagePossibleSourceType?: Module4Lesson1ImageSourceType
  /** 总确认：已阅读「避免使用素材」与「出口确认」说明，单次勾选 */
  exitAndAvoidAcknowledged: boolean
  confirmed: {
    prepareNewsPack: boolean
    prepareImagePack: boolean
    keepSourceRecord: boolean
    avoidUnsuitableMaterial: boolean
  }
  completed: boolean
}

export interface Module4Lesson1State {
  missionAcknowledged: boolean
  outcomeCheckPassed: boolean
  missionQuizAttempts: Module4Lesson1MissionQuizAttempt[]
  missionQuizPassedAt: string
  step2: Module4Lesson1Step2State
  newsSampleViewed: boolean
  imageSampleViewed: boolean
  samplePartsConfirmed: boolean
  cardAnatomyCompleted: boolean
  cardAnatomyScore: number
  fullCardTemplateConfirmed: boolean
  fullCardTemplateConfirmedAt: string
  materialPrepChecklistKeys: string[]
  materialPrepChecklistCompletedAt: string
  step5: Module4Lesson1Step5State
  quizFlowSimulated: boolean
  beforeAfterReason: string
  personalTaskChecklistCompleted: boolean
  newsSourcePlan: string
  imageSourcePlan: string
  completed: boolean
}

export interface Module4Portfolio {
  id: string
  moduleId: typeof MODULE4_ID
  appVersion: string
  student: Module4StudentProfile
  progress: Module4ProgressPointer
  lesson1: Module4Lesson1State
  lesson2: Module4Lesson2State
  lesson3: Module4Lesson3State
  lesson4: Module4Lesson4State
  lesson5: Module4Lesson5State
  createdAt: string
  updatedAt: string
}

function createEmptyStep2SampleState(): Module4Lesson1Step2SampleState {
  return {
    answered: false,
    selectedOptionKey: undefined,
    isCorrect: undefined,
    selectedAt: "",
    answeredAt: "",
    explanationViewedAt: "",
    materialPreviewOpenedCount: 0,
    structureInteractionCount: 0,
    lastInteractionAt: "",
    explanationRevealed: false,
    structureMatched: {
      material: false,
      task: false,
      explanation: false,
      source: false,
    },
  }
}

export function createEmptyModule4Lesson1Step2State(): Module4Lesson1Step2State {
  return {
    introViewed: false,
    currentPage: "intro",
    news: createEmptyStep2SampleState(),
    image: createEmptyStep2SampleState(),
    completed: false,
  }
}

export function createEmptyModule4Lesson1Step5State(): Module4Lesson1Step5State {
  return {
    newsPlanText: "",
    imagePlanText: "",
    newsPossibleSourceType: undefined,
    imagePossibleSourceType: undefined,
    exitAndAvoidAcknowledged: false,
    confirmed: {
      prepareNewsPack: false,
      prepareImagePack: false,
      keepSourceRecord: false,
      avoidUnsuitableMaterial: false,
    },
    completed: false,
  }
}

export function createEmptyModule4Lesson1State(): Module4Lesson1State {
  return {
    missionAcknowledged: false,
    outcomeCheckPassed: false,
    missionQuizAttempts: [],
    missionQuizPassedAt: "",
    step2: createEmptyModule4Lesson1Step2State(),
    newsSampleViewed: false,
    imageSampleViewed: false,
    samplePartsConfirmed: false,
    cardAnatomyCompleted: false,
    cardAnatomyScore: 0,
    fullCardTemplateConfirmed: false,
    fullCardTemplateConfirmedAt: "",
    materialPrepChecklistKeys: [],
    materialPrepChecklistCompletedAt: "",
    step5: createEmptyModule4Lesson1Step5State(),
    quizFlowSimulated: false,
    beforeAfterReason: "",
    personalTaskChecklistCompleted: false,
    newsSourcePlan: "",
    imageSourcePlan: "",
    completed: false,
  }
}

export function createEmptyModule4MaterialScreeningRecord(
  kind: Module4MaterialKind,
): Module4MaterialScreeningRecord {
  return {
    kind,
    initialStatus: "none",
    postCriteriaStatus: undefined,
    asset: undefined,
    titleOrName: "",
    sourceType: undefined,
    sourceRecord: "",
    sourceAutoPassed: false,
    sourceCheckCount: 0,
    sourceCheckLastReason: "",
    selfChecks: {
      typeFits: false,
      contentCompliant: false,
      hasJudgmentValue: false,
    },
    clueNote: "",
    clueEditCount: 0,
    peerFeedbackNote: "",
    peerFeedbackEditCount: 0,
    completed: false,
    completedAt: "",
  }
}

export function createEmptyModule4Lesson2QuickCheckState(): Module4Lesson2QuickCheckState {
  return {
    T1: {
      achieved: false,
      evidence: {
        newsAssetReady: false,
        imageAssetReady: false,
        newsShortNameReady: false,
        imageShortNameReady: false,
      },
    },
    T2: {
      achieved: false,
      evidence: {
        criteriaCalibrationCompleted: false,
        newsSourceCheckPassed: false,
        imageSourceCheckPassed: false,
        newsSelfChecksCompleted: false,
        imageSelfChecksCompleted: false,
      },
    },
    T3: {
      achieved: false,
      evidence: {
        newsClueNoteValid: false,
        imageClueNoteValid: false,
      },
    },
    evaluatedAt: "",
    metrics: {
      criteriaAttemptCount: 0,
      newsUploadCount: 0,
      imageUploadCount: 0,
      newsSourceCheckCount: 0,
      imageSourceCheckCount: 0,
      newsClueEditCount: 0,
      imageClueEditCount: 0,
      newsPeerOrSelfNoteEditCount: 0,
      imagePeerOrSelfNoteEditCount: 0,
    },
  }
}

export function createEmptyModule4Lesson2State(): Module4Lesson2State {
  return {
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    step5Completed: false,
    taskBoundaryAcknowledged: false,
    step1ContextDwellMs: 0,
    step1ContextViewedAt: "",
    step1CaseAnswers: {},
    step1MaterialStatusLocked: { news: false, image: false },
    step2CriteriaUnlockedKeys: [],
    step2CriteriaDwellMs: {},
    step2ChallengeOrderIds: [],
    step2ChallengeEvents: [],
    criteriaAttempts: [],
    criteriaExampleScore: 0,
    criteriaExampleAttemptCount: 0,
    news: createEmptyModule4MaterialScreeningRecord("news"),
    image: createEmptyModule4MaterialScreeningRecord("image"),
    quickCheck: createEmptyModule4Lesson2QuickCheckState(),
    completed: false,
    completedAt: "",
  }
}

function createEmptyModule4Lesson3MaterialSnapshot(kind: Module4MaterialKind): Module4Lesson3MaterialSnapshot {
  return {
    kind,
    lesson2Completed: false,
    lesson2PostCriteriaStatus: undefined,
    lesson2TitleOrName: "",
    lesson2SourceType: undefined,
    lesson2SourceRecord: "",
    lesson2ClueNote: "",
    asset: undefined,
    assetFingerprint: "",
    snappedAt: "",
  }
}

export function createEmptyLesson3CardSelfTrialRecord(): Lesson3CardSelfTrialRecord {
  return {
    submitted: false,
    selectedOptionKey: undefined,
    isCorrect: undefined,
    submittedAt: undefined,
    feedbackViewed: false,
    confirmed: false,
    confirmedAt: undefined,
    contentFingerprint: undefined,
  }
}

export function createEmptyModule4Lesson3SelfTrialState(): Module4Lesson3SelfTrialState {
  return {
    news: createEmptyLesson3CardSelfTrialRecord(),
    image: createEmptyLesson3CardSelfTrialRecord(),
  }
}

export function createEmptyModule4Lesson3CardSelfCheck(): Module4Lesson3CardSelfCheck {
  return {
    materialReady: false,
    taskReady: false,
    answerSelected: false,
    explanationReady: false,
    sourceReady: false,
    verificationReady: false,
    allRequiredPassed: false,
    lastCheckedAt: "",
  }
}

export function createEmptyModule4Lesson3AiReviewState(): Module4Lesson3AiReviewState {
  return {
    enabled: true,
    status: "idle",
    lastRequestId: "",
    lastReviewedAt: "",
    result: undefined,
    isStale: false,
    errorMessage: "",
    history: [],
  }
}

export function createEmptyModule4Lesson3QuestionCardDraft(kind: Module4MaterialKind): Module4Lesson3QuestionCardDraft {
  const now = new Date().toISOString()
  return {
    id: `lesson3-${kind}-v1`,
    kind,
    version: "v1",
    status: "draft",
    sourceMaterialSnapshot: createEmptyModule4Lesson3MaterialSnapshot(kind),
    material: {
      titleOrName: "",
      displayNote: "",
      asset: undefined,
      assetFingerprint: "",
    },
    task: {
      prompt: kind === "news"
        ? "请判断这则新闻是否存在明显的 AI 生成痕迹。"
        : "请判断这张图片是否存在明显的 AI 生成痕迹。",
      options: [
        { key: "A", label: "明显存在 AI 痕迹", rationale: "" },
        { key: "B", label: "暂无明显 AI 痕迹", rationale: "" },
        { key: "C", label: "证据不足，仍需核验", rationale: "" },
      ],
      correctOptionKey: undefined,
    },
    explanation: {
      text: "",
      editCount: 0,
      updatedAt: "",
    },
    source: {
      sourceType: undefined,
      sourceRecord: "",
      verificationNote: "",
    },
    selfCheck: createEmptyModule4Lesson3CardSelfCheck(),
    aiReview: createEmptyModule4Lesson3AiReviewState(),
    metrics: {
      materialEditCount: 0,
      taskEditCount: 0,
      explanationEditCount: 0,
      sourceEditCount: 0,
      previewModeSwitchCount: 0,
      aiReviewRequestCount: 0,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyModule4Lesson3QuickCheckState(): Module4Lesson3QuickCheckState {
  return {
    T1: {
      achieved: false,
      evidence: {
        newsSnapshotReady: false,
        imageSnapshotReady: false,
        newsAssetReady: false,
        imageAssetReady: false,
      },
    },
    T2: {
      achieved: false,
      evidence: {
        newsMaterialReady: false,
        newsTaskReady: false,
        newsExplanationReady: false,
        newsSourceReady: false,
        imageMaterialReady: false,
        imageTaskReady: false,
        imageExplanationReady: false,
        imageSourceReady: false,
      },
    },
    T3: {
      achieved: false,
      evidence: {
        finalPreviewConfirmed: false,
        newsReadyForLesson4: false,
        imageReadyForLesson4: false,
        newsSelfTrialConfirmed: false,
        imageSelfTrialConfirmed: false,
      },
    },
    evaluatedAt: "",
    metrics: {
      newsExplanationEditCount: 0,
      imageExplanationEditCount: 0,
      newsSourceEditCount: 0,
      imageSourceEditCount: 0,
      newsPreviewModeSwitchCount: 0,
      imagePreviewModeSwitchCount: 0,
      newsAiReviewRequestCount: 0,
      imageAiReviewRequestCount: 0,
    },
  }
}

export function createEmptyModule4Lesson3State(): Module4Lesson3State {
  return {
    step1Acknowledged: false,
    step1AcknowledgedAt: "",
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    newsCard: createEmptyModule4Lesson3QuestionCardDraft("news"),
    imageCard: createEmptyModule4Lesson3QuestionCardDraft("image"),
    selfTrial: createEmptyModule4Lesson3SelfTrialState(),
    finalPreviewConfirmed: false,
    finalPreviewConfirmedAt: "",
    quickCheck: createEmptyModule4Lesson3QuickCheckState(),
    completed: false,
    completedAt: "",
  }
}

const LESSON4_REVIEW_RUBRIC_DIMENSION_KEYS: Lesson4ReviewRubricDimensionKey[] = [
  "material",
  "task",
  "explanation",
  "source",
]

function createEmptyLesson4ReviewRubric(): Record<Lesson4ReviewRubricDimensionKey, Lesson4ReviewRubricEntry> {
  return Object.fromEntries(
    LESSON4_REVIEW_RUBRIC_DIMENSION_KEYS.map(key => [key, { level: undefined, reason: "" }]),
  ) as Record<Lesson4ReviewRubricDimensionKey, Lesson4ReviewRubricEntry>
}

function createEmptyLesson4ReviewCardFeedback(): Module4Lesson4ReviewCardFeedback {
  return {
    trialAnswer: undefined,
    rubric: createEmptyLesson4ReviewRubric(),
    overallComment: "",
    contentViolation: null,
    contentViolationNote: "",
    approved: undefined,
  }
}

export function createEmptyModule4Lesson4ReviewJson(): Module4Lesson4ReviewJson {
  return {
    cards: {
      news: createEmptyLesson4ReviewCardFeedback(),
      image: createEmptyLesson4ReviewCardFeedback(),
    },
  }
}

export function createEmptyModule4Lesson4FeedbackInboxState(): Module4Lesson4FeedbackInboxState {
  return {
    digestedAt: "",
    decisions: [],
    allFeedbackReviewed: false,
  }
}

export function createEmptyModule4Lesson4V2CardDraft(kind: Module4MaterialKind): Module4Lesson4V2CardDraft {
  const now = new Date().toISOString()
  const emptyV1 = createEmptyModule4Lesson3QuestionCardDraft(kind)
  return {
    id: `lesson4-${kind}-v2`,
    kind,
    version: "v2",
    status: "draft",
    baseV1CardId: "",
    baseV1UpdatedAt: "",
    material: emptyV1.material,
    task: emptyV1.task,
    explanation: emptyV1.explanation,
    source: emptyV1.source,
    revision: {
      summary: "",
      decisionIdsResolved: [],
      confirmedAt: "",
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyModule4Lesson4V2State(): Module4Lesson4V2State {
  return {
    newsCard: createEmptyModule4Lesson4V2CardDraft("news"),
    imageCard: createEmptyModule4Lesson4V2CardDraft("image"),
    newsConfirmed: false,
    imageConfirmed: false,
    confirmedAt: "",
  }
}

export function createEmptyModule4Lesson4ReadinessState(): Module4Lesson4ReadinessState {
  return {
    newsReady: false,
    imageReady: false,
    readyForLesson5: false,
    checkedAt: "",
    exportedPackageJson: undefined,
  }
}

export function createEmptyModule4Lesson4QuickCheckState(): Module4Lesson4QuickCheckState {
  return {
    T1: {
      score: 0,
      achieved: false,
      evidence: {
        outboundCompleted: false,
        inboundCompleted: false,
        gatePassed: false,
        step1Completed: false,
        receivedReviewPresent: false,
      },
    },
    T2: {
      score: 0,
      achieved: false,
      evidence: {
        step2Completed: false,
        allFeedbackReviewed: false,
        reviewerPassOnly: true,
        decisionCount: 0,
        minorFixDecisionCount: 0,
        blockingDecisionCount: 0,
        unresolvedBlockingDecisionIds: [],
        minorDecisionsMissingReasonIds: [],
      },
    },
    T3: {
      score: 0,
      achieved: false,
      evidence: {
        step3Completed: false,
        newsConfirmed: false,
        imageConfirmed: false,
        readyForLesson5Status: "red",
        newsSummaryRequired: false,
        imageSummaryRequired: false,
        newsRevisionSummaryReady: false,
        imageRevisionSummaryReady: false,
        allNewsSectionsPass: false,
        allImageSectionsPass: false,
        noRevisionNeeded: false,
        unresolvedBlockingDecisionIds: [],
      },
    },
    totalScore: 0,
    level: "not_achieved",
    evaluatedAt: "",
    blockers: [],
  }
}

export function createEmptyModule4Lesson4State(): Module4Lesson4State {
  return {
    outbound: {
      status: "not_sent",
      requestId: "",
      targetReviewerSeatCode: "",
      inviteCode: "",
      sentAt: "",
      pendingExpiresAt: "",
      reviewExpiresAt: "",
      receivedReviewJson: undefined,
      completed: false,
    },
    inbound: {
      status: "idle",
      requestId: "",
      authorSeatCode: "",
      reviewExpiresAt: "",
      claimedRequestJson: undefined,
      reviewDraftJson: undefined,
      submittedReviewJson: undefined,
      completed: false,
    },
    gatePassed: false,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    feedbackInbox: createEmptyModule4Lesson4FeedbackInboxState(),
    v2: createEmptyModule4Lesson4V2State(),
    readiness: createEmptyModule4Lesson4ReadinessState(),
    quickCheck: createEmptyModule4Lesson4QuickCheckState(),
    completed: false,
    completedAt: "",
  }
}

export function createEmptyModule4Lesson5State(): Module4Lesson5State {
  return {
    clientId: "",
    submissionSummary: undefined,
    connectedSession: undefined,
    revision: undefined,
    quickCheck: {
      t1HasV2Submission: false,
      t2HasTrialStats: false,
      t3HasV3Submission: false,
      readyForLesson6: "none",
      evaluatedAt: "",
      T1: {
        score: 0,
        achieved: false,
        evidence: {
          v2Submitted: false,
          hasNewsItem: false,
          hasImageItem: false,
        },
      },
      T2: {
        score: 0,
        achieved: false,
        evidence: {
          trialStatsReady: false,
          reportItemCount: 0,
          hasNewsStats: false,
          hasImageStats: false,
        },
      },
      T3: {
        score: 0,
        achieved: false,
        evidence: {
          v3Submitted: false,
          submittedCount: 0,
          readyForLesson6: "none",
          newsSubmitted: false,
          imageSubmitted: false,
        },
      },
      totalScore: 0,
      level: "not_achieved",
      blockers: [],
    },
    stageSnapshot: undefined,
    myReport: undefined,
    completed: false,
    completedAt: "",
  }
}

function normalizeLesson1MissionQuizAttempts(value: unknown): Module4Lesson1MissionQuizAttempt[] {
  if (!Array.isArray(value)) return []

  return value
    .map((raw, index): Module4Lesson1MissionQuizAttempt | null => {
      if (!raw || typeof raw !== "object") return null
      const attempt = raw as Record<string, unknown>
      const answersRaw = attempt.answers
      const answers: Record<string, string> = {}
      if (answersRaw && typeof answersRaw === "object") {
        Object.entries(answersRaw as Record<string, unknown>).forEach(([key, answer]) => {
          if (typeof answer === "string") answers[key] = answer
        })
      }

      return {
        attemptNo: Number.isFinite(attempt.attemptNo) ? Number(attempt.attemptNo) : index + 1,
        submittedAt: typeof attempt.submittedAt === "string" ? attempt.submittedAt : "",
        answers,
        wrongQuestionIds: Array.isArray(attempt.wrongQuestionIds)
          ? attempt.wrongQuestionIds.filter((id): id is string => typeof id === "string")
          : [],
        passed: attempt.passed === true,
      }
    })
    .filter((attempt): attempt is Module4Lesson1MissionQuizAttempt => attempt !== null)
}

function normalizeStep2SampleState(value: unknown): Module4Lesson1Step2SampleState {
  const fallback = createEmptyStep2SampleState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const selectedOptionKey = raw.selectedOptionKey === "A" || raw.selectedOptionKey === "B" || raw.selectedOptionKey === "C"
    ? raw.selectedOptionKey
    : undefined
  const matchedRaw = raw.structureMatched && typeof raw.structureMatched === "object"
    ? raw.structureMatched as Record<string, unknown>
    : {}

  return {
    answered: raw.answered === true,
    selectedOptionKey,
    isCorrect: typeof raw.isCorrect === "boolean" ? raw.isCorrect : undefined,
    selectedAt: typeof raw.selectedAt === "string" ? raw.selectedAt : "",
    answeredAt: typeof raw.answeredAt === "string" ? raw.answeredAt : "",
    explanationViewedAt: typeof raw.explanationViewedAt === "string" ? raw.explanationViewedAt : "",
    materialPreviewOpenedCount: Number.isFinite(raw.materialPreviewOpenedCount) ? Number(raw.materialPreviewOpenedCount) : 0,
    structureInteractionCount: Number.isFinite(raw.structureInteractionCount) ? Number(raw.structureInteractionCount) : 0,
    lastInteractionAt: typeof raw.lastInteractionAt === "string" ? raw.lastInteractionAt : "",
    explanationRevealed: raw.explanationRevealed === true,
    structureMatched: {
      material: matchedRaw.material === true,
      task: matchedRaw.task === true,
      explanation: matchedRaw.explanation === true,
      source: matchedRaw.source === true,
    },
  }
}

function normalizeLesson1Step2State(value: unknown): Module4Lesson1Step2State {
  const fallback = createEmptyModule4Lesson1Step2State()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const currentPage = raw.currentPage === "news" || raw.currentPage === "image" ? raw.currentPage : "intro"

  return {
    introViewed: raw.introViewed === true,
    currentPage,
    news: normalizeStep2SampleState(raw.news),
    image: normalizeStep2SampleState(raw.image),
    completed: raw.completed === true,
  }
}

function normalizeNewsSourceType(value: unknown): Module4Lesson1NewsSourceType | undefined {
  return value === "news_site" || value === "wechat_article" || value === "social_screenshot" || value === "other"
    ? value
    : undefined
}

function normalizeImageSourceType(value: unknown): Module4Lesson1ImageSourceType | undefined {
  return value === "web" || value === "ai_generated" || value === "field_capture" || value === "mixed"
    ? value
    : undefined
}

function normalizeMaterialKind(value: unknown, fallback: Module4MaterialKind): Module4MaterialKind {
  return value === "news" || value === "image" ? value : fallback
}

function normalizeMaterialPrepStatus(value: unknown): Module4MaterialPrepStatus {
  return value === "ready" || value === "incomplete" || value === "none" ? value : "none"
}

function normalizePostCriteriaStatus(value: unknown): Module4PostCriteriaStatus | undefined {
  return value === "usable" || value === "need_fix" || value === "need_replace" ? value : undefined
}

function normalizeMaterialSourceType(value: unknown): Module4MaterialSourceType | undefined {
  return value === "web" || value === "ai_generated" || value === "field_capture" || value === "mixed"
    ? value
    : undefined
}

function normalizeCompressedAsset(value: unknown): Module4CompressedMaterialAsset | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  if (typeof raw.dataUrl !== "string") return undefined
  const isImageDataUrl = raw.dataUrl.startsWith("data:image/")
  const isLocalImageAsset = raw.dataUrl.startsWith("/") && /\.(png|jpe?g|webp)(?:\?|$)/i.test(raw.dataUrl)
  if (!isImageDataUrl && !isLocalImageAsset) return undefined

  const mimeType = raw.mimeType === "image/webp" || raw.mimeType === "image/jpeg" || raw.mimeType === "image/png"
    ? raw.mimeType
    : raw.dataUrl.startsWith("data:image/png") || /\.png(?:\?|$)/i.test(raw.dataUrl) ? "image/png"
      : raw.dataUrl.startsWith("data:image/jpeg") || /\.jpe?g(?:\?|$)/i.test(raw.dataUrl) ? "image/jpeg"
        : "image/webp"

  return {
    dataUrl: raw.dataUrl,
    mimeType,
    originalName: typeof raw.originalName === "string" ? raw.originalName : "素材图片",
    originalSizeBytes: Number.isFinite(raw.originalSizeBytes) ? Number(raw.originalSizeBytes) : 0,
    compressedSizeBytes: Number.isFinite(raw.compressedSizeBytes) ? Number(raw.compressedSizeBytes) : 0,
    width: Number.isFinite(raw.width) ? Number(raw.width) : 0,
    height: Number.isFinite(raw.height) ? Number(raw.height) : 0,
    compressedAt: typeof raw.compressedAt === "string" ? raw.compressedAt : "",
    uploadCount: Number.isFinite(raw.uploadCount) && Number(raw.uploadCount) > 0 ? Number(raw.uploadCount) : 1,
  }
}

function normalizeMaterialSelfChecks(value: unknown): Module4MaterialSelfChecks {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  return {
    typeFits: raw.typeFits === true,
    contentCompliant: raw.contentCompliant === true,
    hasJudgmentValue: raw.hasJudgmentValue === true,
  }
}

function normalizeMaterialScreeningRecord(
  value: unknown,
  kind: Module4MaterialKind,
): Module4MaterialScreeningRecord {
  const fallback = createEmptyModule4MaterialScreeningRecord(kind)
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>

  return {
    kind: normalizeMaterialKind(raw.kind, kind),
    initialStatus: normalizeMaterialPrepStatus(raw.initialStatus),
    postCriteriaStatus: normalizePostCriteriaStatus(raw.postCriteriaStatus),
    asset: normalizeCompressedAsset(raw.asset),
    titleOrName: typeof raw.titleOrName === "string" ? raw.titleOrName : "",
    sourceType: normalizeMaterialSourceType(raw.sourceType),
    sourceRecord: typeof raw.sourceRecord === "string" ? raw.sourceRecord : "",
    sourceAutoPassed: raw.sourceAutoPassed === true,
    sourceCheckCount: Number.isFinite(raw.sourceCheckCount) ? Number(raw.sourceCheckCount) : 0,
    sourceCheckLastReason: typeof raw.sourceCheckLastReason === "string" ? raw.sourceCheckLastReason : "",
    selfChecks: normalizeMaterialSelfChecks(raw.selfChecks),
    clueNote: typeof raw.clueNote === "string" ? raw.clueNote : "",
    clueEditCount: Number.isFinite(raw.clueEditCount) ? Number(raw.clueEditCount) : 0,
    peerFeedbackNote: typeof raw.peerFeedbackNote === "string" ? raw.peerFeedbackNote : "",
    peerFeedbackEditCount: Number.isFinite(raw.peerFeedbackEditCount) ? Number(raw.peerFeedbackEditCount) : 0,
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : "",
  }
}

function normalizeCriteriaAnswer(value: unknown): Module4Lesson2CriteriaExampleAnswer | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const selectedCriterion = (
    raw.selectedCriterion === "typeFits"
    || raw.selectedCriterion === "sourceTraceable"
    || raw.selectedCriterion === "contentCompliant"
    || raw.selectedCriterion === "hasJudgmentValue"
  )
    ? raw.selectedCriterion
    : undefined
  if (typeof raw.exampleId !== "string" || !selectedCriterion) return null
  return {
    exampleId: raw.exampleId,
    selectedCriterion,
    isCorrect: raw.isCorrect === true,
  }
}

function normalizeCriteriaAttempts(value: unknown): Module4Lesson2CriteriaAttempt[] {
  if (!Array.isArray(value)) return []
  return value
    .map((rawAttempt, index): Module4Lesson2CriteriaAttempt | null => {
      if (!rawAttempt || typeof rawAttempt !== "object") return null
      const raw = rawAttempt as Record<string, unknown>
      const answers = Array.isArray(raw.answers)
        ? raw.answers.map(normalizeCriteriaAnswer).filter((answer): answer is Module4Lesson2CriteriaExampleAnswer => answer !== null)
        : []
      return {
        attemptNo: Number.isFinite(raw.attemptNo) ? Number(raw.attemptNo) : index + 1,
        submittedAt: typeof raw.submittedAt === "string" ? raw.submittedAt : "",
        answers,
        score: Number.isFinite(raw.score) ? Number(raw.score) : answers.filter(answer => answer.isCorrect).length,
      }
    })
    .filter((attempt): attempt is Module4Lesson2CriteriaAttempt => attempt !== null)
}

function normalizeChallengeEvents(value: unknown): Module4Lesson2ChallengeEvent[] {
  if (!Array.isArray(value)) return []
  return value
    .map((rawEvent): Module4Lesson2ChallengeEvent | null => {
      if (!rawEvent || typeof rawEvent !== "object") return null
      const raw = rawEvent as Record<string, unknown>
      const selectedCriterion = (
        raw.selectedCriterion === "typeFits"
        || raw.selectedCriterion === "sourceTraceable"
        || raw.selectedCriterion === "contentCompliant"
        || raw.selectedCriterion === "hasJudgmentValue"
      )
        ? raw.selectedCriterion
        : undefined
      if (typeof raw.exampleId !== "string" || !selectedCriterion) return null
      return {
        exampleId: raw.exampleId,
        selectedCriterion,
        isCorrect: raw.isCorrect === true,
        selectedAt: typeof raw.selectedAt === "string" ? raw.selectedAt : "",
        attemptIndex: Number.isFinite(raw.attemptIndex) && Number(raw.attemptIndex) > 0 ? Number(raw.attemptIndex) : 1,
      }
    })
    .filter((event): event is Module4Lesson2ChallengeEvent => event !== null)
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {}
  const record: Record<string, string> = {}
  Object.entries(value as Record<string, unknown>).forEach(([key, answer]) => {
    if (typeof answer === "string") record[key] = answer
  })
  return record
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string")))
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {}
  const record: Record<string, number> = {}
  Object.entries(value as Record<string, unknown>).forEach(([key, rawValue]) => {
    if (Number.isFinite(rawValue)) record[key] = Number(rawValue)
  })
  return record
}

function normalizeLesson2QuickCheckState(value: unknown): Module4Lesson2QuickCheckState {
  const fallback = createEmptyModule4Lesson2QuickCheckState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const metrics = raw.metrics && typeof raw.metrics === "object" ? raw.metrics as Record<string, unknown> : {}
  const normalizeTarget = <TEvidence extends Record<string, boolean>>(
    targetValue: unknown,
    fallbackTarget: Module4Lesson2QuickCheckTarget<TEvidence>,
  ): Module4Lesson2QuickCheckTarget<TEvidence> => {
    if (!targetValue || typeof targetValue !== "object") return fallbackTarget
    const target = targetValue as Record<string, unknown>
    const evidence = target.evidence && typeof target.evidence === "object" ? target.evidence as Record<string, unknown> : {}
    return {
      achieved: target.achieved === true,
      evidence: Object.fromEntries(
        Object.keys(fallbackTarget.evidence).map(key => [key, evidence[key] === true]),
      ) as TEvidence,
    }
  }

  return {
    T1: normalizeTarget(raw.T1, fallback.T1),
    T2: normalizeTarget(raw.T2, fallback.T2),
    T3: normalizeTarget(raw.T3, fallback.T3),
    evaluatedAt: typeof raw.evaluatedAt === "string" ? raw.evaluatedAt : "",
    metrics: {
      criteriaAttemptCount: Number.isFinite(metrics.criteriaAttemptCount)
        ? Number(metrics.criteriaAttemptCount)
        : Number.isFinite(metrics.criteriaExampleAttemptCount) ? Number(metrics.criteriaExampleAttemptCount) : 0,
      newsUploadCount: Number.isFinite(metrics.newsUploadCount) ? Number(metrics.newsUploadCount) : 0,
      imageUploadCount: Number.isFinite(metrics.imageUploadCount) ? Number(metrics.imageUploadCount) : 0,
      newsSourceCheckCount: Number.isFinite(metrics.newsSourceCheckCount) ? Number(metrics.newsSourceCheckCount) : 0,
      imageSourceCheckCount: Number.isFinite(metrics.imageSourceCheckCount) ? Number(metrics.imageSourceCheckCount) : 0,
      newsClueEditCount: Number.isFinite(metrics.newsClueEditCount) ? Number(metrics.newsClueEditCount) : 0,
      imageClueEditCount: Number.isFinite(metrics.imageClueEditCount) ? Number(metrics.imageClueEditCount) : 0,
      newsPeerOrSelfNoteEditCount: Number.isFinite(metrics.newsPeerOrSelfNoteEditCount) ? Number(metrics.newsPeerOrSelfNoteEditCount) : 0,
      imagePeerOrSelfNoteEditCount: Number.isFinite(metrics.imagePeerOrSelfNoteEditCount) ? Number(metrics.imagePeerOrSelfNoteEditCount) : 0,
    },
  }
}

function normalizeLesson2State(value: unknown): Module4Lesson2State {
  const fallback = createEmptyModule4Lesson2State()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const criteriaAttempts = normalizeCriteriaAttempts(raw.criteriaAttempts)

  return {
    step1Completed: raw.step1Completed === true,
    step2Completed: raw.step2Completed === true,
    step3Completed: raw.step3Completed === true,
    step4Completed: raw.step4Completed === true,
    step5Completed: raw.step5Completed === true,
    taskBoundaryAcknowledged: raw.taskBoundaryAcknowledged === true,
    step1ContextDwellMs: Number.isFinite(raw.step1ContextDwellMs) ? Number(raw.step1ContextDwellMs) : 0,
    step1ContextViewedAt: typeof raw.step1ContextViewedAt === "string" ? raw.step1ContextViewedAt : "",
    step1CaseAnswers: normalizeStringRecord(raw.step1CaseAnswers),
    step1MaterialStatusLocked: {
      news: (raw.step1MaterialStatusLocked as Record<string, unknown> | undefined)?.news === true,
      image: (raw.step1MaterialStatusLocked as Record<string, unknown> | undefined)?.image === true,
    },
    step2CriteriaUnlockedKeys: normalizeStringArray(raw.step2CriteriaUnlockedKeys),
    step2CriteriaDwellMs: normalizeNumberRecord(raw.step2CriteriaDwellMs),
    step2ChallengeOrderIds: normalizeStringArray(raw.step2ChallengeOrderIds),
    step2ChallengeEvents: normalizeChallengeEvents(raw.step2ChallengeEvents),
    criteriaAttempts,
    criteriaExampleScore: Number.isFinite(raw.criteriaExampleScore)
      ? Number(raw.criteriaExampleScore)
      : criteriaAttempts.at(-1)?.score ?? 0,
    criteriaExampleAttemptCount: Number.isFinite(raw.criteriaExampleAttemptCount)
      ? Number(raw.criteriaExampleAttemptCount)
      : criteriaAttempts.length,
    news: normalizeMaterialScreeningRecord(raw.news, "news"),
    image: normalizeMaterialScreeningRecord(raw.image, "image"),
    quickCheck: normalizeLesson2QuickCheckState(raw.quickCheck),
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : "",
  }
}

function normalizeLesson3CardStatus(value: unknown): Module4Lesson3CardStatus {
  return value === "ready_for_lesson4" ? "ready_for_lesson4" : "draft"
}

function normalizeLesson3AiReviewRuntimeStatus(value: unknown): Module4Lesson3AiReviewRuntimeStatus {
  return value === "pending" || value === "completed" || value === "failed" ? value : "idle"
}

function normalizeLesson3AiReviewOverallStatus(value: unknown): Module4Lesson3AiReviewOverallStatus {
  return value === "pass" || value === "blocked" ? value : "needs_revision"
}

function normalizeLesson3AiReviewArea(value: unknown): Module4Lesson3AiReviewArea {
  return value === "task" || value === "explanation" || value === "source" ? value : "material"
}

function normalizeLesson3AiReviewLevel(value: unknown): Module4Lesson3AiReviewLevel {
  return value === "ok" || value === "error" ? value : "warning"
}

function normalizeLesson3CardSelfTrialRecord(value: unknown): Lesson3CardSelfTrialRecord {
  const fallback = createEmptyLesson3CardSelfTrialRecord()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const selectedOptionKey = isModule4Lesson3OptionKey(raw.selectedOptionKey) ? raw.selectedOptionKey : undefined
  return {
    submitted: raw.submitted === true,
    selectedOptionKey,
    isCorrect: typeof raw.isCorrect === "boolean" ? raw.isCorrect : undefined,
    submittedAt: typeof raw.submittedAt === "string" ? raw.submittedAt : undefined,
    feedbackViewed: raw.feedbackViewed === true,
    confirmed: raw.confirmed === true,
    confirmedAt: typeof raw.confirmedAt === "string" ? raw.confirmedAt : undefined,
    contentFingerprint: typeof raw.contentFingerprint === "string" ? raw.contentFingerprint : undefined,
    needsRetrial: raw.needsRetrial === true,
  }
}

function normalizeLesson3SelfTrial(value: unknown): Module4Lesson3SelfTrialState {
  const fallback = createEmptyModule4Lesson3SelfTrialState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    news: normalizeLesson3CardSelfTrialRecord(raw.news),
    image: normalizeLesson3CardSelfTrialRecord(raw.image),
  }
}

function normalizeLesson3SelfCheck(value: unknown): Module4Lesson3CardSelfCheck {
  const fallback = createEmptyModule4Lesson3CardSelfCheck()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    materialReady: raw.materialReady === true,
    taskReady: raw.taskReady === true,
    answerSelected: raw.answerSelected === true,
    explanationReady: raw.explanationReady === true,
    sourceReady: raw.sourceReady === true,
    verificationReady: raw.verificationReady === true,
    allRequiredPassed: raw.allRequiredPassed === true,
    lastCheckedAt: typeof raw.lastCheckedAt === "string" ? raw.lastCheckedAt : "",
  }
}

function normalizeLesson3AiReviewResult(value: unknown): Module4Lesson3AiReviewResult | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  const checks = Array.isArray(raw.checks)
    ? raw.checks
      .map((check): Module4Lesson3AiReviewCheck | null => {
        if (!check || typeof check !== "object") return null
        const item = check as Record<string, unknown>
        return {
          area: normalizeLesson3AiReviewArea(item.area),
          level: normalizeLesson3AiReviewLevel(item.level),
          message: typeof item.message === "string" ? item.message : "",
          suggestion: typeof item.suggestion === "string" ? item.suggestion : undefined,
        }
      })
      .filter((check): check is Module4Lesson3AiReviewCheck => check !== null && check.message.trim().length > 0)
    : []
  return {
    status: normalizeLesson3AiReviewOverallStatus(raw.status),
    summary: typeof raw.summary === "string" ? raw.summary : "",
    checks,
    missingRequiredFields: normalizeStringArray(raw.missingRequiredFields),
    suggestedEdits: normalizeStringArray(raw.suggestedEdits),
    safetyFlags: normalizeStringArray(raw.safetyFlags),
  }
}

function normalizeLesson3AiReviewHistoryEntry(value: unknown): Module4Lesson3AiReviewHistoryEntry | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const requestId = typeof raw.requestId === "string" ? raw.requestId : ""
  const reviewedAt = typeof raw.reviewedAt === "string" ? raw.reviewedAt : ""
  if (!requestId && !reviewedAt) return null
  const rawAreaLevels = raw.areaLevels && typeof raw.areaLevels === "object"
    ? raw.areaLevels as Record<string, unknown>
    : {}
  const rawTier = raw.tier
  const tier: Module4Lesson3AiReviewHistoryEntry["tier"] = rawTier === "excellent" || rawTier === "good" || rawTier === "blocked"
    ? rawTier
    : "good"
  return {
    requestId,
    reviewedAt,
    status: normalizeLesson3AiReviewOverallStatus(raw.status),
    tier,
    areaLevels: {
      material: normalizeLesson3AiReviewLevel(rawAreaLevels.material),
      task: normalizeLesson3AiReviewLevel(rawAreaLevels.task),
      explanation: normalizeLesson3AiReviewLevel(rawAreaLevels.explanation),
      source: normalizeLesson3AiReviewLevel(rawAreaLevels.source),
    },
    suggestedEditCount: Number.isFinite(raw.suggestedEditCount) ? Math.max(0, Number(raw.suggestedEditCount)) : 0,
  }
}

function normalizeLesson3AiReview(value: unknown): Module4Lesson3AiReviewState {
  const fallback = createEmptyModule4Lesson3AiReviewState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const history = Array.isArray(raw.history)
    ? raw.history
      .map(normalizeLesson3AiReviewHistoryEntry)
      .filter((entry): entry is Module4Lesson3AiReviewHistoryEntry => entry !== null)
      .slice(0, LESSON3_AI_REVIEW_HISTORY_LIMIT)
    : []
  return {
    enabled: raw.enabled !== false,
    status: normalizeLesson3AiReviewRuntimeStatus(raw.status),
    lastRequestId: typeof raw.lastRequestId === "string" ? raw.lastRequestId : "",
    lastReviewedAt: typeof raw.lastReviewedAt === "string" ? raw.lastReviewedAt : "",
    result: normalizeLesson3AiReviewResult(raw.result),
    isStale: raw.isStale === true,
    errorMessage: typeof raw.errorMessage === "string" ? raw.errorMessage : "",
    history,
  }
}

function normalizeLesson3MaterialSnapshot(value: unknown, kind: Module4MaterialKind): Module4Lesson3MaterialSnapshot {
  const fallback = createEmptyModule4Lesson3MaterialSnapshot(kind)
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    kind: normalizeMaterialKind(raw.kind, kind),
    lesson2Completed: raw.lesson2Completed === true,
    lesson2PostCriteriaStatus: normalizePostCriteriaStatus(raw.lesson2PostCriteriaStatus),
    lesson2TitleOrName: typeof raw.lesson2TitleOrName === "string" ? raw.lesson2TitleOrName : "",
    lesson2SourceType: normalizeMaterialSourceType(raw.lesson2SourceType),
    lesson2SourceRecord: typeof raw.lesson2SourceRecord === "string" ? raw.lesson2SourceRecord : "",
    lesson2ClueNote: typeof raw.lesson2ClueNote === "string" ? raw.lesson2ClueNote : "",
    asset: normalizeCompressedAsset(raw.asset),
    assetFingerprint: typeof raw.assetFingerprint === "string" ? raw.assetFingerprint : "",
    snappedAt: typeof raw.snappedAt === "string" ? raw.snappedAt : "",
  }
}

function normalizeLesson3QuestionCardDraft(value: unknown, kind: Module4MaterialKind): Module4Lesson3QuestionCardDraft {
  const fallback = createEmptyModule4Lesson3QuestionCardDraft(kind)
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const material = raw.material && typeof raw.material === "object" ? raw.material as Record<string, unknown> : {}
  const task = raw.task && typeof raw.task === "object" ? raw.task as Record<string, unknown> : {}
  const explanation = raw.explanation && typeof raw.explanation === "object" ? raw.explanation as Record<string, unknown> : {}
  const source = raw.source && typeof raw.source === "object" ? raw.source as Record<string, unknown> : {}
  const metrics = raw.metrics && typeof raw.metrics === "object" ? raw.metrics as Record<string, unknown> : {}
  const options = normalizeLesson3TaskOptions(task.options, fallback.task.options)
  const optionKeys = new Set(options.map(option => option.key))
  const correctOptionKey = isModule4Lesson3OptionKey(task.correctOptionKey) && optionKeys.has(task.correctOptionKey)
    ? task.correctOptionKey
    : undefined

  return {
    ...fallback,
    id: typeof raw.id === "string" && raw.id ? raw.id : fallback.id,
    kind: normalizeMaterialKind(raw.kind, kind),
    version: "v1",
    status: normalizeLesson3CardStatus(raw.status),
    sourceMaterialSnapshot: normalizeLesson3MaterialSnapshot(raw.sourceMaterialSnapshot, kind),
    material: {
      titleOrName: typeof material.titleOrName === "string" ? material.titleOrName : "",
      displayNote: typeof material.displayNote === "string" ? material.displayNote : "",
      asset: normalizeCompressedAsset(material.asset),
      assetFingerprint: typeof material.assetFingerprint === "string" ? material.assetFingerprint : "",
    },
    task: {
      prompt: typeof task.prompt === "string" ? task.prompt : fallback.task.prompt,
      options,
      correctOptionKey,
    },
    explanation: {
      text: typeof explanation.text === "string" ? explanation.text : "",
      editCount: Number.isFinite(explanation.editCount) ? Number(explanation.editCount) : 0,
      updatedAt: typeof explanation.updatedAt === "string" ? explanation.updatedAt : "",
    },
    source: {
      sourceType: normalizeMaterialSourceType(source.sourceType),
      sourceRecord: typeof source.sourceRecord === "string" ? source.sourceRecord : "",
      verificationNote: typeof source.verificationNote === "string" ? source.verificationNote : "",
    },
    selfCheck: normalizeLesson3SelfCheck(raw.selfCheck),
    aiReview: normalizeLesson3AiReview(raw.aiReview),
    metrics: {
      materialEditCount: Number.isFinite(metrics.materialEditCount) ? Number(metrics.materialEditCount) : 0,
      taskEditCount: Number.isFinite(metrics.taskEditCount) ? Number(metrics.taskEditCount) : 0,
      explanationEditCount: Number.isFinite(metrics.explanationEditCount) ? Number(metrics.explanationEditCount) : 0,
      sourceEditCount: Number.isFinite(metrics.sourceEditCount) ? Number(metrics.sourceEditCount) : 0,
      previewModeSwitchCount: Number.isFinite(metrics.previewModeSwitchCount) ? Number(metrics.previewModeSwitchCount) : 0,
      aiReviewRequestCount: Number.isFinite(metrics.aiReviewRequestCount) ? Number(metrics.aiReviewRequestCount) : 0,
    },
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : fallback.createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : fallback.updatedAt,
  }
}

function normalizeLesson3QuickCheck(value: unknown): Module4Lesson3QuickCheckState {
  const fallback = createEmptyModule4Lesson3QuickCheckState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const metrics = raw.metrics && typeof raw.metrics === "object" ? raw.metrics as Record<string, unknown> : {}
  const normalizeTarget = <TEvidence extends Record<string, boolean>>(
    targetValue: unknown,
    fallbackTarget: Module4Lesson2QuickCheckTarget<TEvidence>,
  ): Module4Lesson2QuickCheckTarget<TEvidence> => {
    if (!targetValue || typeof targetValue !== "object") return fallbackTarget
    const target = targetValue as Record<string, unknown>
    const evidence = target.evidence && typeof target.evidence === "object" ? target.evidence as Record<string, unknown> : {}
    return {
      achieved: target.achieved === true,
      evidence: Object.fromEntries(
        Object.keys(fallbackTarget.evidence).map(key => [key, evidence[key] === true]),
      ) as TEvidence,
    }
  }

  return {
    T1: normalizeTarget(raw.T1, fallback.T1),
    T2: normalizeTarget(raw.T2, fallback.T2),
    T3: normalizeTarget(raw.T3, fallback.T3),
    evaluatedAt: typeof raw.evaluatedAt === "string" ? raw.evaluatedAt : "",
    metrics: {
      newsExplanationEditCount: Number.isFinite(metrics.newsExplanationEditCount) ? Number(metrics.newsExplanationEditCount) : 0,
      imageExplanationEditCount: Number.isFinite(metrics.imageExplanationEditCount) ? Number(metrics.imageExplanationEditCount) : 0,
      newsSourceEditCount: Number.isFinite(metrics.newsSourceEditCount) ? Number(metrics.newsSourceEditCount) : 0,
      imageSourceEditCount: Number.isFinite(metrics.imageSourceEditCount) ? Number(metrics.imageSourceEditCount) : 0,
      newsPreviewModeSwitchCount: Number.isFinite(metrics.newsPreviewModeSwitchCount) ? Number(metrics.newsPreviewModeSwitchCount) : 0,
      imagePreviewModeSwitchCount: Number.isFinite(metrics.imagePreviewModeSwitchCount) ? Number(metrics.imagePreviewModeSwitchCount) : 0,
      newsAiReviewRequestCount: Number.isFinite(metrics.newsAiReviewRequestCount) ? Number(metrics.newsAiReviewRequestCount) : 0,
      imageAiReviewRequestCount: Number.isFinite(metrics.imageAiReviewRequestCount) ? Number(metrics.imageAiReviewRequestCount) : 0,
    },
  }
}

function normalizeLesson3State(value: unknown): Module4Lesson3State {
  const fallback = createEmptyModule4Lesson3State()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    step1Acknowledged: raw.step1Acknowledged === true,
    step1AcknowledgedAt: typeof raw.step1AcknowledgedAt === "string" ? raw.step1AcknowledgedAt : "",
    step2Completed: raw.step2Completed === true,
    step3Completed: raw.step3Completed === true,
    step4Completed: raw.step4Completed === true,
    newsCard: normalizeLesson3QuestionCardDraft(raw.newsCard, "news"),
    imageCard: normalizeLesson3QuestionCardDraft(raw.imageCard, "image"),
    selfTrial: normalizeLesson3SelfTrial(raw.selfTrial),
    finalPreviewConfirmed: raw.finalPreviewConfirmed === true,
    finalPreviewConfirmedAt: typeof raw.finalPreviewConfirmedAt === "string" ? raw.finalPreviewConfirmedAt : "",
    quickCheck: normalizeLesson3QuickCheck(raw.quickCheck),
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : "",
  }
}

function normalizeLesson4OutboundStatus(value: unknown): Lesson4OutboundStatus {
  return value === "pending"
    || value === "claimed"
    || value === "submitted"
    || value === "pulled"
    || value === "cancelled"
    || value === "expired"
    ? value
    : "not_sent"
}

function normalizeLesson4InboundStatus(value: unknown): Lesson4InboundStatus {
  return value === "available" || value === "claimed" || value === "submitted" || value === "expired"
    ? value
    : "idle"
}

function normalizeLesson4ReviewVerdict(value: unknown): Lesson4ReviewVerdict | undefined {
  if (value === "pass" || value === "minor_fix" || value === "major_fix") return value
  if (value === "major_rework") return "major_fix"
  return undefined
}

function normalizeLesson4ReviewRubricEntry(value: unknown): Lesson4ReviewRubricEntry {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nested = value as Record<string, unknown>
    return {
      level: normalizeLesson4ReviewVerdict(nested.level ?? nested.verdict),
      reason: typeof nested.reason === "string" ? nested.reason : "",
    }
  }
  return {
    level: normalizeLesson4ReviewVerdict(value),
    reason: "",
  }
}

function normalizeLesson4ReviewCardContentViolation(value: unknown): boolean | null {
  if (value === true) return true
  if (value === false) return false
  return null
}

function normalizeLesson4ReviewCardFeedback(
  value: unknown,
  legacyGlobal?: {
    overallComment: string
    contentViolation: boolean | null
    contentViolationNote: string
  },
): Module4Lesson4ReviewCardFeedback {
  const fallback = createEmptyLesson4ReviewCardFeedback()
  if (!value || typeof value !== "object") {
    if (!legacyGlobal) return fallback
    return {
      ...fallback,
      overallComment: legacyGlobal.overallComment,
      contentViolation: legacyGlobal.contentViolation,
      contentViolationNote: legacyGlobal.contentViolationNote,
    }
  }
  const raw = value as Record<string, unknown>
  const rubricRaw = raw.rubric && typeof raw.rubric === "object" ? raw.rubric as Record<string, unknown> : {}
  const legacyVerdict = normalizeLesson4ReviewVerdict(raw.verdict)
  const legacySuggestions = normalizeStringArray(raw.suggestions)
  const legacyVerdictReason = typeof raw.verdictReason === "string"
    ? raw.verdictReason
    : legacySuggestions.find(item => item.trim().length > 0) ?? ""

  const rubric = createEmptyLesson4ReviewRubric()
  let hasDimensionData = false
  for (const key of LESSON4_REVIEW_RUBRIC_DIMENSION_KEYS) {
    if (rubricRaw[key] === undefined) continue
    hasDimensionData = true
    rubric[key] = normalizeLesson4ReviewRubricEntry(rubricRaw[key])
  }

  if (!hasDimensionData && legacyVerdict) {
    for (const key of LESSON4_REVIEW_RUBRIC_DIMENSION_KEYS) {
      rubric[key] = { level: legacyVerdict, reason: legacyVerdictReason }
    }
  }

  const cardOverall = typeof raw.overallComment === "string" ? raw.overallComment : ""
  const cardViolation = normalizeLesson4ReviewCardContentViolation(raw.contentViolation)
  const cardViolationNote = typeof raw.contentViolationNote === "string" ? raw.contentViolationNote : ""

  return {
    trialAnswer: isModule4Lesson3OptionKey(raw.trialAnswer) ? raw.trialAnswer : undefined,
    rubric,
    overallComment: cardOverall || legacyGlobal?.overallComment || "",
    contentViolation: cardViolation ?? legacyGlobal?.contentViolation ?? null,
    contentViolationNote: cardViolationNote || legacyGlobal?.contentViolationNote || "",
    approved: raw.approved === true ? true : undefined,
  }
}

function normalizeLesson4ReviewJson(value: unknown): Module4Lesson4ReviewJson | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  const cards = raw.cards && typeof raw.cards === "object" ? raw.cards as Record<string, unknown> : {}
  /** 旧版全局 overall/violation 迁移到 news 卡，image 需重新填写。 */
  const legacyGlobal = {
    overallComment: typeof raw.overallComment === "string" ? raw.overallComment : "",
    contentViolation: normalizeLesson4ReviewCardContentViolation(raw.contentViolation),
    contentViolationNote: typeof raw.contentViolationNote === "string" ? raw.contentViolationNote : "",
  }
  const hasLegacyGlobal = legacyGlobal.overallComment.length > 0
    || legacyGlobal.contentViolation !== null
    || legacyGlobal.contentViolationNote.length > 0
  return {
    cards: {
      news: normalizeLesson4ReviewCardFeedback(cards.news, hasLegacyGlobal ? legacyGlobal : undefined),
      image: normalizeLesson4ReviewCardFeedback(cards.image),
    },
  }
}

function parseJsonObjectIfString(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return undefined
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

function normalizeLesson5SubmissionItemSummary(value: unknown): Module4Lesson5SubmissionItemSummary | undefined {
  if (!isPlainObject(value)) return undefined
  const itemId = typeof value.itemId === "string" ? value.itemId : ""
  const v2VersionId = typeof value.v2VersionId === "string" ? value.v2VersionId : ""
  if (!itemId || !v2VersionId) return undefined
  return {
    itemId,
    v2VersionId,
    status: typeof value.status === "string" ? value.status : "",
    deduped: value.deduped === true,
  }
}

function normalizeLesson5SubmissionSummary(value: unknown): Module4Lesson5SubmissionSummary | undefined {
  if (!isPlainObject(value)) return undefined
  const items = isPlainObject(value.items) ? value.items : {}
  const news = normalizeLesson5SubmissionItemSummary(items.news)
  const image = normalizeLesson5SubmissionItemSummary(items.image)
  if (!news || !image) return undefined
  return {
    submittedAt: typeof value.submittedAt === "string" ? value.submittedAt : "",
    classId: typeof value.classId === "string" ? value.classId : "",
    studentName: typeof value.studentName === "string" ? value.studentName : "",
    classSeatCode: typeof value.classSeatCode === "string" ? value.classSeatCode : "",
    mode: value.mode === "http" ? "http" : "fixture",
    items: { news, image },
  }
}

function normalizeLesson5SessionPhase(value: unknown): Module4Lesson5SessionPhase {
  if (
    value === "trial_open"
    || value === "trial_locked"
    || value === "analytics_open"
    || value === "revision_open"
    || value === "closed"
  ) {
    return value
  }
  return "pool_locked"
}

function normalizeLesson5ConnectedSession(value: unknown): Module4Lesson5ConnectedSessionState | undefined {
  if (!isPlainObject(value)) return undefined
  const sessionId = typeof value.sessionId === "string" ? value.sessionId : ""
  const participantId = typeof value.participantId === "string" ? value.participantId : ""
  const classId = typeof value.classId === "string" ? value.classId : ""
  if (!sessionId || !participantId || !classId) return undefined
  return {
    sessionId,
    participantId,
    classId,
    className: typeof value.className === "string" ? value.className : "",
    title: typeof value.title === "string" ? value.title : "",
    phase: normalizeLesson5SessionPhase(value.phase),
    questionCount: Number.isFinite(value.questionCount) ? Number(value.questionCount) : 0,
    newsCount: Number.isFinite(value.newsCount) ? Number(value.newsCount) : 0,
    imageCount: Number.isFinite(value.imageCount) ? Number(value.imageCount) : 0,
    attachedAt: typeof value.attachedAt === "string" ? value.attachedAt : "",
    serverNow: typeof value.serverNow === "string" ? value.serverNow : "",
    mode: value.mode === "http" ? "http" : "fixture",
  }
}

function normalizeLesson5ReadyForLesson6(value: unknown): Module4Lesson5ReadyForLesson6 {
  return value === "full" || value === "partial" ? value : "none"
}

function normalizeLesson5QuickCheckLevel(value: unknown): Module4Lesson5QuickCheckLevel {
  return value === "excellent" || value === "achieved" || value === "basic" ? value : "not_achieved"
}

function deriveLesson5QuickCheckLevel(totalScore: number, allTargetsAchieved: boolean): Module4Lesson5QuickCheckLevel {
  if (totalScore === 100 && allTargetsAchieved) return "excellent"
  if (totalScore >= 75 && allTargetsAchieved) return "achieved"
  if (totalScore >= 60) return "basic"
  return "not_achieved"
}

function normalizeLesson5RevisionAction(value: unknown): Module4Lesson5RevisionAction {
  return value === "keep" || value === "major_fix" ? value : "minor_fix"
}

function normalizeLesson5QuickCheck(value: unknown): Module4Lesson5QuickCheckState {
  const fallback = createEmptyModule4Lesson5State().quickCheck
  if (!isPlainObject(value)) return fallback
  const T1Raw = isPlainObject(value.T1) ? value.T1 : {}
  const T2Raw = isPlainObject(value.T2) ? value.T2 : {}
  const T3Raw = isPlainObject(value.T3) ? value.T3 : {}
  const T1EvidenceRaw = isPlainObject(T1Raw.evidence) ? T1Raw.evidence : {}
  const T2EvidenceRaw = isPlainObject(T2Raw.evidence) ? T2Raw.evidence : {}
  const T3EvidenceRaw = isPlainObject(T3Raw.evidence) ? T3Raw.evidence : {}
  const legacyT1 = value.t1HasV2Submission === true
  const legacyT2 = value.t2HasTrialStats === true
  const legacyT3 = value.t3HasV3Submission === true
  const readyForLesson6 = normalizeLesson5ReadyForLesson6(value.readyForLesson6)
  const T1 = {
    score: Number.isFinite(T1Raw.score) ? Number(T1Raw.score) : legacyT1 ? 35 : 0,
    achieved: typeof T1Raw.achieved === "boolean" ? T1Raw.achieved : legacyT1,
    evidence: {
      v2Submitted: T1EvidenceRaw.v2Submitted === true || legacyT1,
      hasNewsItem: T1EvidenceRaw.hasNewsItem === true || legacyT1,
      hasImageItem: T1EvidenceRaw.hasImageItem === true || legacyT1,
    },
  }
  const T2 = {
    score: Number.isFinite(T2Raw.score) ? Number(T2Raw.score) : legacyT2 ? 30 : 0,
    achieved: typeof T2Raw.achieved === "boolean" ? T2Raw.achieved : legacyT2,
    evidence: {
      trialStatsReady: T2EvidenceRaw.trialStatsReady === true || legacyT2,
      reportItemCount: Number.isFinite(T2EvidenceRaw.reportItemCount) ? Number(T2EvidenceRaw.reportItemCount) : 0,
      hasNewsStats: T2EvidenceRaw.hasNewsStats === true || legacyT2,
      hasImageStats: T2EvidenceRaw.hasImageStats === true || legacyT2,
    },
  }
  const T3 = {
    score: Number.isFinite(T3Raw.score) ? Number(T3Raw.score) : readyForLesson6 === "full" ? 35 : legacyT3 ? 30 : 0,
    achieved: typeof T3Raw.achieved === "boolean" ? T3Raw.achieved : legacyT3,
    evidence: {
      v3Submitted: T3EvidenceRaw.v3Submitted === true || legacyT3,
      submittedCount: Number.isFinite(T3EvidenceRaw.submittedCount) ? Number(T3EvidenceRaw.submittedCount) : legacyT3 ? 1 : 0,
      readyForLesson6,
      newsSubmitted: T3EvidenceRaw.newsSubmitted === true,
      imageSubmitted: T3EvidenceRaw.imageSubmitted === true,
    },
  }
  const totalScore = Number.isFinite(value.totalScore) ? Number(value.totalScore) : T1.score + T2.score + T3.score
  return {
    t1HasV2Submission: legacyT1 || T1.achieved,
    t2HasTrialStats: legacyT2 || T2.achieved,
    t3HasV3Submission: legacyT3 || T3.achieved,
    readyForLesson6,
    evaluatedAt: typeof value.evaluatedAt === "string" ? value.evaluatedAt : "",
    T1,
    T2,
    T3,
    totalScore,
    level: typeof value.level === "string"
      ? normalizeLesson5QuickCheckLevel(value.level)
      : deriveLesson5QuickCheckLevel(totalScore, T1.achieved && T2.achieved && T3.achieved),
    blockers: normalizeStringArray(value.blockers),
  }
}

function normalizeLesson5RevisionPlan(value: unknown): Module4Lesson5RevisionPlanState {
  const raw = isPlainObject(value) ? value : {}
  return {
    revisionAction: normalizeLesson5RevisionAction(raw.revisionAction),
    selectedProblems: normalizeStringArray(raw.selectedProblems),
    evidence: typeof raw.evidence === "string" ? raw.evidence : "",
    revisionReason: typeof raw.revisionReason === "string" ? raw.revisionReason : "",
    expectedEffect: typeof raw.expectedEffect === "string" ? raw.expectedEffect : "",
  }
}

function normalizeLesson5RevisionCard(value: unknown, kind: Module4MaterialKind): Module4Lesson5RevisionCardState | undefined {
  if (!isPlainObject(value)) return undefined
  return {
    card: normalizeLesson4V2CardDraft(value.card, kind),
    revisionPlan: normalizeLesson5RevisionPlan(value.revisionPlan),
    itemId: typeof value.itemId === "string" ? value.itemId : "",
    baseV2VersionId: typeof value.baseV2VersionId === "string" ? value.baseV2VersionId : "",
    v3VersionId: typeof value.v3VersionId === "string" ? value.v3VersionId : undefined,
    submittedAt: typeof value.submittedAt === "string" ? value.submittedAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    deduped: value.deduped === true,
  }
}

function normalizeLesson5Revision(value: unknown): Module4Lesson5RevisionState | undefined {
  if (!isPlainObject(value) || !isPlainObject(value.cards)) return undefined
  const news = normalizeLesson5RevisionCard(value.cards.news, "news")
  const image = normalizeLesson5RevisionCard(value.cards.image, "image")
  if (!news || !image) return undefined
  return {
    cards: { news, image },
    readyForLesson6: normalizeLesson5ReadyForLesson6(value.readyForLesson6),
    submittedCount: Number.isFinite(value.submittedCount) ? Number(value.submittedCount) : 0,
    lastSubmittedAt: typeof value.lastSubmittedAt === "string" ? value.lastSubmittedAt : "",
  }
}

function normalizeLesson5StatsStatus(value: unknown): Module4Lesson5MyReportItemStats["statsStatus"] {
  return value === "stable" || value === "preliminary" ? value : "insufficient"
}

function normalizeLesson5MyReportItem(value: unknown): Module4Lesson5MyReportItemStats | null {
  if (!isPlainObject(value)) return null
  const itemId = typeof value.itemId === "string" ? value.itemId : ""
  const itemVersionId = typeof value.itemVersionId === "string" ? value.itemVersionId : ""
  if (!itemId || !itemVersionId) return null
  return {
    itemId,
    itemVersionId,
    kind: value.kind === "image" ? "image" : "news",
    validAnswerCount: Number.isFinite(value.validAnswerCount) ? Number(value.validAnswerCount) : 0,
    correctCount: Number.isFinite(value.correctCount) ? Number(value.correctCount) : 0,
    correctRate: Number.isFinite(value.correctRate) ? Number(value.correctRate) : 0,
    avgClarity: Number.isFinite(value.avgClarity) ? Number(value.avgClarity) : null,
    avgThinkingValue: Number.isFinite(value.avgThinkingValue) ? Number(value.avgThinkingValue) : null,
    avgExplanationHelpfulness: Number.isFinite(value.avgExplanationHelpfulness) ? Number(value.avgExplanationHelpfulness) : null,
    issueFlagCount: Number.isFinite(value.issueFlagCount) ? Number(value.issueFlagCount) : 0,
    issueFlagRate: Number.isFinite(value.issueFlagRate) ? Number(value.issueFlagRate) : 0,
    issueFlags: normalizeStringArray(value.issueFlags),
    sampleComments: normalizeStringArray(value.sampleComments),
    statsStatus: normalizeLesson5StatsStatus(value.statsStatus),
    computedAt: typeof value.computedAt === "string" ? value.computedAt : "",
    diagnosisHints: normalizeStringArray(value.diagnosisHints),
  }
}

function normalizeLesson5MyReport(value: unknown): Module4Lesson5MyReportState | undefined {
  if (!isPlainObject(value)) return undefined
  const sessionId = typeof value.sessionId === "string" ? value.sessionId : ""
  const participantId = typeof value.participantId === "string" ? value.participantId : ""
  if (!sessionId || !participantId) return undefined
  return {
    sessionId,
    participantId,
    items: Array.isArray(value.items)
      ? value.items.map(normalizeLesson5MyReportItem).filter((item): item is Module4Lesson5MyReportItemStats => item !== null)
      : [],
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt : "",
  }
}

function normalizeLesson5StageSnapshot(value: unknown): Module4Lesson5StageSnapshot | undefined {
  if (!isPlainObject(value) || value.version !== "lesson5-stage-v1") return undefined
  const revision = isPlainObject(value.revision) ? value.revision : {}
  const quickCheckRaw = isPlainObject(value.quickCheck) ? value.quickCheck : {}
  const normalizedQuickCheck = normalizeLesson5QuickCheck(quickCheckRaw)
  const targetsRaw = isPlainObject(quickCheckRaw.targets) ? quickCheckRaw.targets : {}
  const normalizeSnapshotTarget = (
    targetValue: unknown,
    fallbackTarget: Pick<Module4Lesson5QuickCheckState["T1"], "score" | "achieved">,
  ) => {
    const target = isPlainObject(targetValue) ? targetValue : {}
    return {
      score: Number.isFinite(target.score) ? Number(target.score) : fallbackTarget.score,
      achieved: typeof target.achieved === "boolean" ? target.achieved : fallbackTarget.achieved,
    }
  }
  return {
    version: "lesson5-stage-v1",
    snappedAt: typeof value.snappedAt === "string" ? value.snappedAt : "",
    sessionId: typeof value.sessionId === "string" ? value.sessionId : "",
    participantId: typeof value.participantId === "string" ? value.participantId : "",
    v2Submit: isPlainObject(value.v2Submit) ? { ...value.v2Submit } : {},
    trial: isPlainObject(value.trial) ? { ...value.trial } : {},
    revision: {
      readyForLesson6: normalizeLesson5ReadyForLesson6(revision.readyForLesson6),
      submittedCount: Number.isFinite(revision.submittedCount) ? Number(revision.submittedCount) : 0,
      submittedItemIds: normalizeStringArray(revision.submittedItemIds),
    },
    quickCheck: {
      totalScore: Number.isFinite(quickCheckRaw.totalScore) ? Number(quickCheckRaw.totalScore) : normalizedQuickCheck.totalScore,
      level: typeof quickCheckRaw.level === "string" ? normalizeLesson5QuickCheckLevel(quickCheckRaw.level) : normalizedQuickCheck.level,
      evaluatedAt: typeof quickCheckRaw.evaluatedAt === "string" ? quickCheckRaw.evaluatedAt : normalizedQuickCheck.evaluatedAt,
      targets: {
        T1: normalizeSnapshotTarget(targetsRaw.T1, normalizedQuickCheck.T1),
        T2: normalizeSnapshotTarget(targetsRaw.T2, normalizedQuickCheck.T2),
        T3: normalizeSnapshotTarget(targetsRaw.T3, normalizedQuickCheck.T3),
      },
      blockers: normalizeStringArray(quickCheckRaw.blockers).length > 0
        ? normalizeStringArray(quickCheckRaw.blockers)
        : normalizedQuickCheck.blockers,
    },
  }
}

function normalizeLesson5State(value: unknown): Module4Lesson5State {
  const fallback = createEmptyModule4Lesson5State()
  if (!isPlainObject(value)) return fallback
  const submissionSummary = normalizeLesson5SubmissionSummary(value.submissionSummary)
  const connectedSession = normalizeLesson5ConnectedSession(value.connectedSession)
  return {
    clientId: typeof value.clientId === "string" ? value.clientId : "",
    submissionSummary,
    connectedSession,
    revision: normalizeLesson5Revision(value.revision),
    quickCheck: normalizeLesson5QuickCheck(value.quickCheck),
    stageSnapshot: normalizeLesson5StageSnapshot(value.stageSnapshot),
    myReport: normalizeLesson5MyReport(value.myReport),
    completed: value.completed === true && Boolean(submissionSummary),
    completedAt: typeof value.completedAt === "string" && submissionSummary ? value.completedAt : "",
  }
}

function normalizeLesson4ReviewRequestJson(value: unknown): Module4Lesson4ReviewRequestJson | undefined {
  const parsed = parseJsonObjectIfString(value)
  if (!isPlainObject(parsed)) return undefined
  const cardsRaw = parsed.cards
  if (!isPlainObject(cardsRaw)) return undefined
  const newsRaw = cardsRaw.news
  const imageRaw = cardsRaw.image
  if (!isPlainObject(newsRaw) || !isPlainObject(imageRaw)) return undefined
  const snapshotMeta = isPlainObject(parsed.snapshotMeta) ? parsed.snapshotMeta : {}
  return {
    cards: {
      news: normalizeLesson3QuestionCardDraft(newsRaw, "news"),
      image: normalizeLesson3QuestionCardDraft(imageRaw, "image"),
    },
    snapshotMeta: {
      version: "v1",
      snapshotCreatedAt: typeof snapshotMeta.snapshotCreatedAt === "string" ? snapshotMeta.snapshotCreatedAt : "",
    },
  }
}

function normalizeLesson4FeedbackDecisionAction(value: unknown): Lesson4FeedbackDecisionAction {
  return value === "accept" || value === "partial_accept" || value === "keep_with_reason" || value === "must_revise"
    ? value
    : "must_revise"
}

function normalizeLesson4FeedbackDecisionLevel(value: unknown): Lesson4FeedbackDecisionLevel {
  return value === "minor_fix" || value === "content_violation" ? value : "major_fix"
}

function normalizeLesson4FeedbackDecisionArea(value: unknown): Lesson4ReviewArea | "overall" {
  if (
    value === "material"
    || value === "task"
    || value === "explanation"
    || value === "source"
    || value === "safety"
    || value === "overall"
  ) {
    return value
  }
  return "overall"
}

function normalizeLesson4FeedbackDecision(value: unknown): Lesson4FeedbackDecision | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const cardKind = raw.cardKind === "image" ? "image" : raw.cardKind === "news" ? "news" : undefined
  const id = typeof raw.id === "string" ? raw.id : ""
  if (!cardKind || !id) return null
  const level = normalizeLesson4FeedbackDecisionLevel(raw.level)
  const action = level === "minor_fix" ? normalizeLesson4FeedbackDecisionAction(raw.action) : "must_revise"
  return {
    id,
    cardKind,
    area: normalizeLesson4FeedbackDecisionArea(raw.area),
    level,
    reviewerReason: typeof raw.reviewerReason === "string" ? raw.reviewerReason : "",
    action,
    authorPlan: typeof raw.authorPlan === "string" ? raw.authorPlan : "",
    resolved: raw.resolved === true,
    resolvedAt: typeof raw.resolvedAt === "string" ? raw.resolvedAt : "",
  }
}

function normalizeLesson4FeedbackInboxState(value: unknown): Module4Lesson4FeedbackInboxState {
  const fallback = createEmptyModule4Lesson4FeedbackInboxState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    digestedAt: typeof raw.digestedAt === "string" ? raw.digestedAt : "",
    decisions: Array.isArray(raw.decisions)
      ? raw.decisions.map(normalizeLesson4FeedbackDecision).filter((decision): decision is Lesson4FeedbackDecision => decision !== null)
      : [],
    allFeedbackReviewed: raw.allFeedbackReviewed === true,
  }
}

function normalizeLesson4V2CardStatus(value: unknown): Module4Lesson4V2CardStatus {
  return value === "confirmed" || value === "ready_for_lesson5" ? value : "draft"
}

function normalizeLesson4V2CardDraft(value: unknown, kind: Module4MaterialKind): Module4Lesson4V2CardDraft {
  const fallback = createEmptyModule4Lesson4V2CardDraft(kind)
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const revision = raw.revision && typeof raw.revision === "object" ? raw.revision as Record<string, unknown> : {}
  const v1Like = normalizeLesson3QuestionCardDraft({ ...raw, version: "v1" }, kind)
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : fallback.id,
    kind: normalizeMaterialKind(raw.kind, kind),
    version: "v2",
    status: normalizeLesson4V2CardStatus(raw.status),
    baseV1CardId: typeof raw.baseV1CardId === "string" ? raw.baseV1CardId : "",
    baseV1UpdatedAt: typeof raw.baseV1UpdatedAt === "string" ? raw.baseV1UpdatedAt : "",
    material: v1Like.material,
    task: v1Like.task,
    explanation: v1Like.explanation,
    source: v1Like.source,
    revision: {
      summary: typeof revision.summary === "string" ? revision.summary : "",
      decisionIdsResolved: normalizeStringArray(revision.decisionIdsResolved),
      confirmedAt: typeof revision.confirmedAt === "string" ? revision.confirmedAt : "",
    },
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : fallback.createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : fallback.updatedAt,
  }
}

function normalizeLesson4V2State(value: unknown): Module4Lesson4V2State {
  const fallback = createEmptyModule4Lesson4V2State()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    newsCard: normalizeLesson4V2CardDraft(raw.newsCard, "news"),
    imageCard: normalizeLesson4V2CardDraft(raw.imageCard, "image"),
    newsConfirmed: raw.newsConfirmed === true,
    imageConfirmed: raw.imageConfirmed === true,
    confirmedAt: typeof raw.confirmedAt === "string" ? raw.confirmedAt : "",
  }
}

function normalizeLesson4ReadinessState(value: unknown): Module4Lesson4ReadinessState {
  const fallback = createEmptyModule4Lesson4ReadinessState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    newsReady: raw.newsReady === true,
    imageReady: raw.imageReady === true,
    readyForLesson5: raw.readyForLesson5 === true,
    checkedAt: typeof raw.checkedAt === "string" ? raw.checkedAt : "",
    exportedPackageJson: raw.exportedPackageJson,
  }
}

function normalizeLesson4QuickCheckLevel(value: unknown): Module4Lesson4QuickCheckLevel {
  return value === "excellent" || value === "achieved" || value === "basic" ? value : "not_achieved"
}

function normalizeLesson4ReadyStatus(value: unknown): "green" | "amber" | "red" {
  return value === "green" || value === "amber" ? value : "red"
}

function normalizeLesson4QuickCheckState(value: unknown): Module4Lesson4QuickCheckState {
  const fallback = createEmptyModule4Lesson4QuickCheckState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const t1Raw = raw.T1 && typeof raw.T1 === "object" ? raw.T1 as Record<string, unknown> : {}
  const t2Raw = raw.T2 && typeof raw.T2 === "object" ? raw.T2 as Record<string, unknown> : {}
  const t3Raw = raw.T3 && typeof raw.T3 === "object" ? raw.T3 as Record<string, unknown> : {}
  const t1Evidence = t1Raw.evidence && typeof t1Raw.evidence === "object" ? t1Raw.evidence as Record<string, unknown> : {}
  const t2Evidence = t2Raw.evidence && typeof t2Raw.evidence === "object" ? t2Raw.evidence as Record<string, unknown> : {}
  const t3Evidence = t3Raw.evidence && typeof t3Raw.evidence === "object" ? t3Raw.evidence as Record<string, unknown> : {}
  return {
    T1: {
      score: Number.isFinite(t1Raw.score) ? Number(t1Raw.score) : 0,
      achieved: t1Raw.achieved === true,
      evidence: {
        outboundCompleted: t1Evidence.outboundCompleted === true,
        inboundCompleted: t1Evidence.inboundCompleted === true,
        gatePassed: t1Evidence.gatePassed === true,
        step1Completed: t1Evidence.step1Completed === true,
        receivedReviewPresent: t1Evidence.receivedReviewPresent === true,
      },
    },
    T2: {
      score: Number.isFinite(t2Raw.score) ? Number(t2Raw.score) : 0,
      achieved: t2Raw.achieved === true,
      evidence: {
        step2Completed: t2Evidence.step2Completed === true,
        allFeedbackReviewed: t2Evidence.allFeedbackReviewed === true,
        reviewerPassOnly: t2Evidence.reviewerPassOnly !== false,
        decisionCount: Number.isFinite(t2Evidence.decisionCount) ? Number(t2Evidence.decisionCount) : 0,
        minorFixDecisionCount: Number.isFinite(t2Evidence.minorFixDecisionCount) ? Number(t2Evidence.minorFixDecisionCount) : 0,
        blockingDecisionCount: Number.isFinite(t2Evidence.blockingDecisionCount) ? Number(t2Evidence.blockingDecisionCount) : 0,
        unresolvedBlockingDecisionIds: normalizeStringArray(t2Evidence.unresolvedBlockingDecisionIds),
        minorDecisionsMissingReasonIds: normalizeStringArray(t2Evidence.minorDecisionsMissingReasonIds),
      },
    },
    T3: {
      score: Number.isFinite(t3Raw.score) ? Number(t3Raw.score) : 0,
      achieved: t3Raw.achieved === true,
      evidence: {
        step3Completed: t3Evidence.step3Completed === true,
        newsConfirmed: t3Evidence.newsConfirmed === true,
        imageConfirmed: t3Evidence.imageConfirmed === true,
        readyForLesson5Status: normalizeLesson4ReadyStatus(t3Evidence.readyForLesson5Status),
        newsSummaryRequired: t3Evidence.newsSummaryRequired === true,
        imageSummaryRequired: t3Evidence.imageSummaryRequired === true,
        newsRevisionSummaryReady: t3Evidence.newsRevisionSummaryReady === true,
        imageRevisionSummaryReady: t3Evidence.imageRevisionSummaryReady === true,
        allNewsSectionsPass: t3Evidence.allNewsSectionsPass === true,
        allImageSectionsPass: t3Evidence.allImageSectionsPass === true,
        noRevisionNeeded: t3Evidence.noRevisionNeeded === true,
        unresolvedBlockingDecisionIds: normalizeStringArray(t3Evidence.unresolvedBlockingDecisionIds),
      },
    },
    totalScore: Number.isFinite(raw.totalScore) ? Number(raw.totalScore) : 0,
    level: normalizeLesson4QuickCheckLevel(raw.level),
    evaluatedAt: typeof raw.evaluatedAt === "string" ? raw.evaluatedAt : "",
    blockers: normalizeStringArray(raw.blockers),
  }
}

function normalizeLesson4StageSnapshot(value: unknown): Module4Lesson4StageSnapshot | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  if (raw.version !== "lesson4-stage-v1") return undefined
  const steps = raw.stepsCompleted && typeof raw.stepsCompleted === "object"
    ? raw.stepsCompleted as Record<string, unknown>
    : {}
  const v2Raw = raw.v2 && typeof raw.v2 === "object" ? raw.v2 as Record<string, unknown> : {}
  const readinessRaw = raw.readiness && typeof raw.readiness === "object"
    ? raw.readiness as Record<string, unknown>
    : {}
  const quickCheckRaw = raw.quickCheck && typeof raw.quickCheck === "object"
    ? raw.quickCheck as Record<string, unknown>
    : {}
  const quickCheckTargetsRaw = quickCheckRaw.targets && typeof quickCheckRaw.targets === "object"
    ? quickCheckRaw.targets as Record<string, unknown>
    : {}
  const rubricObservationRaw = raw.rubricObservationSummary && typeof raw.rubricObservationSummary === "object"
    ? raw.rubricObservationSummary as Record<string, unknown>
    : {}
  const evaluationStatus = raw.readyForLesson5EvaluationStatus
  const normalizeSnapshotTarget = (targetValue: unknown) => {
    const target = targetValue && typeof targetValue === "object" ? targetValue as Record<string, unknown> : {}
    return {
      score: Number.isFinite(target.score) ? Number(target.score) : 0,
      achieved: target.achieved === true,
    }
  }
  return {
    version: "lesson4-stage-v1",
    snappedAt: typeof raw.snappedAt === "string" ? raw.snappedAt : "",
    stepsCompleted: {
      step1: steps.step1 === true,
      step2: steps.step2 === true,
      step3: steps.step3 === true,
      step4: steps.step4 === true,
    },
    gatePassed: raw.gatePassed === true,
    v2: {
      newsConfirmed: v2Raw.newsConfirmed === true,
      imageConfirmed: v2Raw.imageConfirmed === true,
      newsStatus: normalizeLesson4V2CardStatus(v2Raw.newsStatus),
      imageStatus: normalizeLesson4V2CardStatus(v2Raw.imageStatus),
      newsRevisionSummary: typeof v2Raw.newsRevisionSummary === "string" ? v2Raw.newsRevisionSummary : "",
      imageRevisionSummary: typeof v2Raw.imageRevisionSummary === "string" ? v2Raw.imageRevisionSummary : "",
      newsDecisionIdsResolved: normalizeStringArray(v2Raw.newsDecisionIdsResolved),
      imageDecisionIdsResolved: normalizeStringArray(v2Raw.imageDecisionIdsResolved),
    },
    receivedReviewPresent: raw.receivedReviewPresent === true,
    quickCheck: {
      totalScore: Number.isFinite(quickCheckRaw.totalScore) ? Number(quickCheckRaw.totalScore) : 0,
      level: normalizeLesson4QuickCheckLevel(quickCheckRaw.level),
      evaluatedAt: typeof quickCheckRaw.evaluatedAt === "string" ? quickCheckRaw.evaluatedAt : "",
      targets: {
        T1: normalizeSnapshotTarget(quickCheckTargetsRaw.T1),
        T2: normalizeSnapshotTarget(quickCheckTargetsRaw.T2),
        T3: normalizeSnapshotTarget(quickCheckTargetsRaw.T3),
      },
      blockers: normalizeStringArray(quickCheckRaw.blockers),
    },
    rubricObservationSummary: {
      passCount: Number.isFinite(rubricObservationRaw.passCount) ? Number(rubricObservationRaw.passCount) : 0,
      minorFixCount: Number.isFinite(rubricObservationRaw.minorFixCount) ? Number(rubricObservationRaw.minorFixCount) : 0,
      majorFixCount: Number.isFinite(rubricObservationRaw.majorFixCount) ? Number(rubricObservationRaw.majorFixCount) : 0,
      contentViolationCount: Number.isFinite(rubricObservationRaw.contentViolationCount) ? Number(rubricObservationRaw.contentViolationCount) : 0,
      unresolvedBlockingCount: Number.isFinite(rubricObservationRaw.unresolvedBlockingCount) ? Number(rubricObservationRaw.unresolvedBlockingCount) : 0,
    },
    decisionsSummary: Array.isArray(raw.decisionsSummary)
      ? raw.decisionsSummary
        .map((item): Module4Lesson4StageSnapshot["decisionsSummary"][number] | null => {
          if (!item || typeof item !== "object") return null
          const decision = item as Record<string, unknown>
          const cardKind = decision.cardKind === "image" ? "image" : decision.cardKind === "news" ? "news" : undefined
          const id = typeof decision.id === "string" ? decision.id : ""
          if (!cardKind || !id) return null
          return {
            id,
            cardKind,
            area: normalizeLesson4FeedbackDecisionArea(decision.area),
            level: normalizeLesson4FeedbackDecisionLevel(decision.level),
            action: normalizeLesson4FeedbackDecisionAction(decision.action),
            resolved: decision.resolved === true,
            authorPlan: typeof decision.authorPlan === "string" ? decision.authorPlan : "",
          }
        })
        .filter((item): item is Module4Lesson4StageSnapshot["decisionsSummary"][number] => item !== null)
      : [],
    readiness: {
      newsReady: readinessRaw.newsReady === true,
      imageReady: readinessRaw.imageReady === true,
      readyForLesson5: readinessRaw.readyForLesson5 === true,
      checkedAt: typeof readinessRaw.checkedAt === "string" ? readinessRaw.checkedAt : "",
    },
    readyForLesson5EvaluationStatus: evaluationStatus === "green" || evaluationStatus === "amber" || evaluationStatus === "red"
      ? evaluationStatus
      : undefined,
  }
}

function normalizeLesson4State(value: unknown): Module4Lesson4State {
  const fallback = createEmptyModule4Lesson4State()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  const outbound = raw.outbound && typeof raw.outbound === "object" ? raw.outbound as Record<string, unknown> : {}
  const inbound = raw.inbound && typeof raw.inbound === "object" ? raw.inbound as Record<string, unknown> : {}
  const normalizedOutbound = {
    status: normalizeLesson4OutboundStatus(outbound.status),
    requestId: typeof outbound.requestId === "string" ? outbound.requestId : "",
    targetReviewerSeatCode: typeof outbound.targetReviewerSeatCode === "string" ? outbound.targetReviewerSeatCode.replace(/\D/g, "").slice(0, 4) : "",
    inviteCode: typeof outbound.inviteCode === "string" ? outbound.inviteCode.replace(/\D/g, "").slice(0, 4) : "",
    sentAt: typeof outbound.sentAt === "string" ? outbound.sentAt : "",
    pendingExpiresAt: typeof outbound.pendingExpiresAt === "string" ? outbound.pendingExpiresAt : "",
    reviewExpiresAt: typeof outbound.reviewExpiresAt === "string" ? outbound.reviewExpiresAt : "",
    receivedReviewJson: normalizeLesson4ReviewJson(outbound.receivedReviewJson),
    completed: outbound.completed === true,
  }
  const normalizedInbound = {
    status: normalizeLesson4InboundStatus(inbound.status),
    requestId: typeof inbound.requestId === "string" ? inbound.requestId : "",
    authorSeatCode: typeof inbound.authorSeatCode === "string" ? inbound.authorSeatCode.replace(/\D/g, "").slice(0, 4) : "",
    reviewExpiresAt: typeof inbound.reviewExpiresAt === "string" ? inbound.reviewExpiresAt : "",
    claimedRequestJson: normalizeLesson4ReviewRequestJson(inbound.claimedRequestJson),
    reviewDraftJson: normalizeLesson4ReviewJson(inbound.reviewDraftJson),
    submittedReviewJson: normalizeLesson4ReviewJson(inbound.submittedReviewJson),
    completed: inbound.completed === true,
  }
  const legacyGatePassed = normalizedOutbound.completed && normalizedInbound.completed
  const step4Completed = raw.step4Completed === true
  const wasLegacyStep1Completed = raw.completed === true && !step4Completed
  const gatePassed = raw.gatePassed === true || raw.step1Completed === true || legacyGatePassed || wasLegacyStep1Completed
  return {
    outbound: normalizedOutbound,
    inbound: normalizedInbound,
    gatePassed,
    step1Completed: raw.step1Completed === true || gatePassed,
    step2Completed: raw.step2Completed === true,
    step3Completed: raw.step3Completed === true,
    step4Completed,
    feedbackInbox: normalizeLesson4FeedbackInboxState(raw.feedbackInbox),
    v2: normalizeLesson4V2State(raw.v2),
    readiness: normalizeLesson4ReadinessState(raw.readiness),
    quickCheck: normalizeLesson4QuickCheckState(raw.quickCheck),
    stageSnapshot: normalizeLesson4StageSnapshot(raw.stageSnapshot),
    completed: step4Completed && raw.completed === true,
    completedAt: typeof raw.completedAt === "string" && step4Completed ? raw.completedAt : "",
  }
}

function normalizeLesson1Step5State(value: unknown, lesson1: Partial<Module4Lesson1State>): Module4Lesson1Step5State {
  const fallback = createEmptyModule4Lesson1Step5State()
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const confirmedRaw = raw.confirmed && typeof raw.confirmed === "object"
    ? raw.confirmed as Record<string, unknown>
    : {}
  const legacyCompleted = lesson1.personalTaskChecklistCompleted === true && lesson1.completed === true
  const newsPlanText = typeof raw.newsPlanText === "string"
    ? raw.newsPlanText
    : typeof lesson1.newsSourcePlan === "string" ? lesson1.newsSourcePlan : fallback.newsPlanText
  const imagePlanText = typeof raw.imagePlanText === "string"
    ? raw.imagePlanText
    : typeof lesson1.imageSourcePlan === "string" ? lesson1.imageSourcePlan : fallback.imagePlanText

  const allFourConfirmed = (
    confirmedRaw.prepareNewsPack === true
    && confirmedRaw.prepareImagePack === true
    && confirmedRaw.keepSourceRecord === true
    && confirmedRaw.avoidUnsuitableMaterial === true
  )

  return {
    newsPlanText,
    imagePlanText,
    newsPossibleSourceType: normalizeNewsSourceType(raw.newsPossibleSourceType),
    imagePossibleSourceType: normalizeImageSourceType(raw.imagePossibleSourceType),
    exitAndAvoidAcknowledged: raw.exitAndAvoidAcknowledged === true || allFourConfirmed || legacyCompleted,
    confirmed: {
      prepareNewsPack: confirmedRaw.prepareNewsPack === true || legacyCompleted,
      prepareImagePack: confirmedRaw.prepareImagePack === true || legacyCompleted,
      keepSourceRecord: confirmedRaw.keepSourceRecord === true || legacyCompleted,
      avoidUnsuitableMaterial: confirmedRaw.avoidUnsuitableMaterial === true || legacyCompleted,
    },
    completed: raw.completed === true || legacyCompleted,
  }
}

function createPortfolioId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `module4-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function emptyStudent(): Module4StudentProfile {
  return { studentName: "", clazz: "", classSeatCode: "" }
}

export function createNewModule4Portfolio(
  student: Partial<Module4StudentProfile> = {},
): Module4Portfolio {
  const now = new Date().toISOString()
  const merged = { ...emptyStudent(), ...student }
  return {
    id: createPortfolioId(),
    moduleId: MODULE4_ID,
    appVersion: MODULE4_APP_VERSION,
    student: {
      studentName: merged.studentName?.trim() ?? "",
      clazz: merged.clazz ?? "",
      classSeatCode: merged.classSeatCode?.replace(/\D/g, "").slice(0, 4) ?? "",
    },
    progress: { lessonId: 1, stepId: 1 },
    lesson1: createEmptyModule4Lesson1State(),
    lesson2: createEmptyModule4Lesson2State(),
    lesson3: createEmptyModule4Lesson3State(),
    lesson4: createEmptyModule4Lesson4State(),
    lesson5: createEmptyModule4Lesson5State(),
    createdAt: now,
    updatedAt: now,
  }
}

/** 兼容旧字段 studentAlias / classCode（开发期迁移用） */
function normalizeStudentShape(student: unknown): Module4StudentProfile {
  const base = emptyStudent()
  if (!student || typeof student !== "object") return base
  const s = student as Record<string, unknown>

  const legacyAlias = typeof s.studentAlias === "string" ? s.studentAlias.trim() : ""
  const legacyCode = typeof s.classCode === "string" ? s.classCode.trim() : ""

  const studentName = typeof s.studentName === "string" ? s.studentName.trim() : ""
  const clazz = typeof s.clazz === "string" ? s.clazz : ""
  const classSeatCodeRaw = typeof s.classSeatCode === "string" ? s.classSeatCode : ""

  return {
    studentName: studentName || legacyAlias || base.studentName,
    clazz: clazz || (legacyCode && /^初一（\d{1,2}）班$/.test(legacyCode) ? legacyCode : "") || base.clazz,
    classSeatCode: classSeatCodeRaw.replace(/\D/g, "").slice(0, 4) || base.classSeatCode,
  }
}

export function normalizeModule4Portfolio(input: Partial<Module4Portfolio> | null | undefined): Module4Portfolio {
  const fallback = createNewModule4Portfolio()
  if (!input || typeof input !== "object") return fallback

  const createdAt = typeof input.createdAt === "string" ? input.createdAt : fallback.createdAt
  const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : fallback.updatedAt
  const progress = input.progress ?? fallback.progress
  const lesson1 = input.lesson1 ?? createEmptyModule4Lesson1State()
  const lesson2 = normalizeLesson2State((input as Partial<Module4Portfolio>).lesson2)
  const lesson3 = normalizeLesson3State((input as Partial<Module4Portfolio>).lesson3)
  const lesson4 = normalizeLesson4State((input as Partial<Module4Portfolio>).lesson4)
  const lesson5 = normalizeLesson5State((input as Partial<Module4Portfolio>).lesson5)

  const studentMerged = normalizeStudentShape(input.student)

  return {
    id: typeof input.id === "string" && input.id ? input.id : fallback.id,
    moduleId: MODULE4_ID,
    appVersion: typeof input.appVersion === "string" ? input.appVersion : MODULE4_APP_VERSION,
    student: studentMerged,
    progress: {
      lessonId: Number.isFinite(progress.lessonId) ? progress.lessonId : 1,
      stepId: Number.isFinite(progress.stepId) ? progress.stepId : 1,
    },
    lesson1: {
      ...createEmptyModule4Lesson1State(),
      ...lesson1,
      beforeAfterReason: typeof lesson1.beforeAfterReason === "string" ? lesson1.beforeAfterReason : "",
      newsSourcePlan: typeof lesson1.newsSourcePlan === "string" ? lesson1.newsSourcePlan : "",
      imageSourcePlan: typeof lesson1.imageSourcePlan === "string" ? lesson1.imageSourcePlan : "",
      cardAnatomyScore: Number.isFinite(lesson1.cardAnatomyScore) ? lesson1.cardAnatomyScore : 0,
      fullCardTemplateConfirmed: lesson1.fullCardTemplateConfirmed === true || lesson1.quizFlowSimulated === true,
      fullCardTemplateConfirmedAt: typeof lesson1.fullCardTemplateConfirmedAt === "string" ? lesson1.fullCardTemplateConfirmedAt : "",
      materialPrepChecklistKeys: Array.isArray(lesson1.materialPrepChecklistKeys)
        ? lesson1.materialPrepChecklistKeys.filter((key): key is string => typeof key === "string")
        : [],
      materialPrepChecklistCompletedAt: typeof lesson1.materialPrepChecklistCompletedAt === "string" ? lesson1.materialPrepChecklistCompletedAt : "",
      step5: normalizeLesson1Step5State(lesson1.step5, lesson1),
      missionQuizAttempts: normalizeLesson1MissionQuizAttempts(lesson1.missionQuizAttempts),
      missionQuizPassedAt: typeof lesson1.missionQuizPassedAt === "string" ? lesson1.missionQuizPassedAt : "",
      step2: normalizeLesson1Step2State(lesson1.step2),
    },
    lesson2,
    lesson3,
    lesson4,
    lesson5,
    createdAt,
    updatedAt,
  }
}
