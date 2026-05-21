/**
 * 文件说明：模块 4 学习档案领域类型。
 * 职责：定义 Module4Portfolio、课时 1/2/3 本地状态、默认空状态和归一化逻辑，是模块 4 local-first 数据的唯一领域入口。
 * 更新触发：模块 4 新增课时状态、继续学习包字段、学生资料字段、进度指针规则或课时 1/2/3 过程记录字段变化时，需要同步更新本文件。
 */

import type { JudgmentOption } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

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

export interface Module4Lesson3AiReviewState {
  enabled: boolean
  status: Module4Lesson3AiReviewRuntimeStatus
  lastRequestId: string
  lastReviewedAt: string
  result?: Module4Lesson3AiReviewResult
  errorMessage: string
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
    correctOptionKey?: "A" | "B" | "C"
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
  finalPreviewConfirmed: boolean
  finalPreviewConfirmedAt: string
  quickCheck: Module4Lesson3QuickCheckState
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
    errorMessage: "",
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
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
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
    finalPreviewConfirmed: false,
    finalPreviewConfirmedAt: "",
    quickCheck: createEmptyModule4Lesson3QuickCheckState(),
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

function normalizeLesson3AiReview(value: unknown): Module4Lesson3AiReviewState {
  const fallback = createEmptyModule4Lesson3AiReviewState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Record<string, unknown>
  return {
    enabled: raw.enabled !== false,
    status: normalizeLesson3AiReviewRuntimeStatus(raw.status),
    lastRequestId: typeof raw.lastRequestId === "string" ? raw.lastRequestId : "",
    lastReviewedAt: typeof raw.lastReviewedAt === "string" ? raw.lastReviewedAt : "",
    result: normalizeLesson3AiReviewResult(raw.result),
    errorMessage: typeof raw.errorMessage === "string" ? raw.errorMessage : "",
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
  const correctOptionKey = task.correctOptionKey === "A" || task.correctOptionKey === "B" || task.correctOptionKey === "C"
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
      options: fallback.task.options,
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
    finalPreviewConfirmed: raw.finalPreviewConfirmed === true,
    finalPreviewConfirmedAt: typeof raw.finalPreviewConfirmedAt === "string" ? raw.finalPreviewConfirmedAt : "",
    quickCheck: normalizeLesson3QuickCheck(raw.quickCheck),
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : "",
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
    createdAt,
    updatedAt,
  }
}
