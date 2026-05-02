/**
 * 文件说明：模块 4 学习档案领域类型。
 * 职责：定义 Module4Portfolio、课时 1 本地状态、默认空状态和归一化逻辑，是模块 4 local-first 数据的唯一领域入口。
 * 更新触发：模块 4 新增课时状态、继续学习包字段、学生资料字段、进度指针规则或课时 1 Step5 出口确认字段变化时，需要同步更新本文件。
 */

export const MODULE4_ID = "module-4-ai-info-detective"
export const MODULE4_APP_VERSION = "0.7.0"

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
    createdAt,
    updatedAt,
  }
}
