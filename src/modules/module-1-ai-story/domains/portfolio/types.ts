/**
 * 文件说明：模块 1 学习档案领域模型。
 * 职责：定义六课时聚合、身份、进度与安全归一化，是模块 1 持久化数据的唯一结构真相。
 * 更新触发：模块 1 课时字段、完成状态、数据版本、参照分槽、课时 3/4/5/6 初稿冻结 / 外部 AI 过程、作品确认版本或归一化规则变化时，需要同步更新本文件。
 */

export const MODULE1_ID = "module-1-ai-story" as const
export const MODULE1_APP_VERSION = "0.1.0"
export const MODULE1_CUSTOM_STYLE_ID = "custom"
export const MODULE1_LESSON2_CONTENT_VERSION = 2
export const MODULE1_LESSON3_CONTENT_VERSION = 1
export const MODULE1_LESSON4_CONTENT_VERSION = 1
export const MODULE1_LESSON5_CONTENT_VERSION = 1
export const MODULE1_LESSON6_CONTENT_VERSION = 1
export const MODULE1_STORY_YEAR = "2035"
export type Module1Lesson3PromptId = "p1" | "p2" | "p3" | "p4" | "p5"
export type Module1Lesson4PromptId = "p1" | "p2" | "p3" | "p4" | "p5"
export type Module1Lesson5PromptId = "p1" | "p2" | "p3" | "p4" | "p5"
export type Module1Lesson6PromptId = "p1" | "p2" | "p3" | "p4" | "p5"
export const MODULE1_LESSON6_ENDING_TYPES = ["结果收束", "主题回响", "开放余味", "自定义"] as const
export type Module1Lesson6EndingType = typeof MODULE1_LESSON6_ENDING_TYPES[number]

export type Module1LessonId = 1 | 2 | 3 | 4 | 5 | 6

export interface Module1StudentProfile {
  clazz: string
  studentName: string
  classSeatCode: string
}

export interface Module1ProgressPointer {
  lessonId: Module1LessonId
  stepId: number
}

interface Module1BaseLessonState {
  step: number
  completed: boolean
  completedAt: string | null
}

export interface Module1Lesson1State extends Module1BaseLessonState {
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  sdg: string
  sdgWhy: string
  cityIssue: string
  audience: string
  audienceConcern: string
}

export type Module1Lesson2ReferenceOrigin = "" | "classroom" | "external"

export interface Module1Lesson2Study {
  caseId: string
  response: string
  aiReply: string
  aiAssistUsed: boolean
}

/** 课堂案例或自选作品共用的参照槽字段。 */
export interface Module1Lesson2ReferenceSlot {
  caseId: string
  workTitle: string
  author: string
  location: string
  versionNote: string
  excerpt: string
  sourceNote: string
  sourceConfirmed: boolean
}

/** 自选作品槽：在共用字段上另存第一轮 AI 回复与复制标记。 */
export interface Module1Lesson2FoundDraft extends Module1Lesson2ReferenceSlot {
  recommendationReply: string
  round1PromptCopied: boolean
}

/**
 * 参照存档：`classroomDraft` / `foundDraft` 分槽保存，扁平字段由当前 origin 派生。
 * 切换来源只改 origin，两槽互不拷贝。
 */
export interface Module1Lesson2Reference extends Module1Lesson2ReferenceSlot {
  origin: Module1Lesson2ReferenceOrigin
  classroomDraft: Module1Lesson2ReferenceSlot
  foundDraft: Module1Lesson2FoundDraft
}

export interface Module1Lesson2Character {
  who: string
  want: string
  blocked: string
  firstAction: string
  possibleChange: string
}

export interface Module1Lesson2ReviewNeeded {
  study: boolean
  reference: boolean
  writingPlan: boolean
  reason: boolean
  character: boolean
}

export interface Module1Lesson2State extends Module1BaseLessonState {
  contentVersion: number
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  study: Module1Lesson2Study
  recommendationReply: string
  /** 第 2 关第一轮提示词是否已成功复制；与 study.aiAssistUsed 分开，旧包缺省为 false */
  round1PromptCopied: boolean
  /** 第 2 关第二轮提示词是否已成功复制；旧包缺省为 false */
  round2PromptCopied: boolean
  /** 第 2 关第一步已选定参照且必填满足后记下；旧包缺省为 false */
  step2Round1Passed: boolean
  reference: Module1Lesson2Reference
  analysisReply: string
  writingPlan: string
  reasonAiReply: string
  /** 第 3 关提示词是否已成功复制；与 study.aiAssistUsed / 第 2 关 copied 分开，旧包缺省为 false */
  reasonAiAssistUsed: boolean
  reason: string
  character: Module1Lesson2Character
  characterAiReply: string
  /** 第 4 关提示词是否已成功复制；与 study.aiAssistUsed / 第 2 关 copied / reasonAiAssistUsed 分开，旧包缺省为 false */
  characterAiAssistUsed: boolean
  reviewNeeded: Module1Lesson2ReviewNeeded
  legacyLesson2: Record<string, unknown> | null
  styleId: string
  styleName: string
  styleWhy: string
  styleHint: string
  styleExamples: string[]
  protagonistIdentity: string
  goal: string
  obstacle: string
  changeAction: string
}

/** 单条外部提示词的基础过程，供教师判断学生如何使用 AI。 */
export interface Module1Lesson3AiProcess {
  generatedPromptSnapshot: string
  copiedPrompt: string
  aiReply: string
  promptEdited: boolean
  copySucceeded: boolean
  copiedAt: string | null
  copyCount: number
}

export type Module1Lesson3AiProcessMap = Record<Module1Lesson3PromptId, Module1Lesson3AiProcess>

export type Module1Lesson3CustomPrompts = Record<Module1Lesson3PromptId, string>

export interface Module1Lesson3ReviewNeeded {
  opening: boolean
  draft: boolean
  final: boolean
}

export interface Module1Lesson3State extends Module1BaseLessonState {
  contentVersion: number
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  observation: string
  openingPlan: string
  focusTechnique: string
  storyTitle: string
  draftText: string
  draftFrozenText: string
  finalText: string
  previousFinalText: string
  decisionNote: string
  openingCandidatesRaw: string
  feedbackRaw: string
  revisionInstruction: string
  preserveText: string
  customPrompts: Module1Lesson3CustomPrompts
  aiProcess: Module1Lesson3AiProcessMap
  reviewNeeded: Module1Lesson3ReviewNeeded
  legacyLesson3: Record<string, unknown> | null
}

/** 课时 4 单条外部提示词过程：沿用课时 3 基础字段，并记录复制时的上下文键，供第 3/4 关判断旧轮次是否仍匹配。 */
export interface Module1Lesson4AiProcess extends Module1Lesson3AiProcess {
  contextKey: string
}

export type Module1Lesson4AiProcessMap = Record<Module1Lesson4PromptId, Module1Lesson4AiProcess>

export type Module1Lesson4CustomPrompts = Record<Module1Lesson4PromptId, string>

export interface Module1Lesson4ReviewNeeded {
  plan: boolean
  draft: boolean
  final: boolean
}

export interface Module1Lesson4State extends Module1BaseLessonState {
  contentVersion: number
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  observation: string
  plotPlan: string
  planReason: string
  draftText: string
  draftFrozenText: string
  finalText: string
  previousFinalText: string
  decisionNote: string
  revisionInstruction: string
  preserveText: string
  selfCheck: boolean
  customPrompts: Module1Lesson4CustomPrompts
  aiProcess: Module1Lesson4AiProcessMap
  reviewNeeded: Module1Lesson4ReviewNeeded
  legacyLesson4: Record<string, unknown> | null
}


/** 课时 5 单条外部提示词过程：对齐课时 4，含 contextKey，供第 3/4 关判断旧轮次是否仍匹配。 */
export interface Module1Lesson5AiProcess extends Module1Lesson3AiProcess {
  contextKey: string
}

export type Module1Lesson5AiProcessMap = Record<Module1Lesson5PromptId, Module1Lesson5AiProcess>

export type Module1Lesson5CustomPrompts = Record<Module1Lesson5PromptId, string>

export interface Module1Lesson5ReviewNeeded {
  plan: boolean
  draft: boolean
  final: boolean
}

export interface Module1Lesson5State extends Module1BaseLessonState {
  contentVersion: number
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  observation: string
  plotPlan: string
  planReason: string
  draftText: string
  draftFrozenText: string
  finalText: string
  previousFinalText: string
  decisionNote: string
  revisionInstruction: string
  preserveText: string
  selfCheck: boolean
  customPrompts: Module1Lesson5CustomPrompts
  aiProcess: Module1Lesson5AiProcessMap
  reviewNeeded: Module1Lesson5ReviewNeeded
  legacyLesson5: Record<string, unknown> | null
}

/** 课时 6 单条外部提示词过程：自有 contextKey，不复用课时 5。 */
export interface Module1Lesson6AiProcess extends Module1Lesson3AiProcess {
  contextKey: string
}

export type Module1Lesson6AiProcessMap = Record<Module1Lesson6PromptId, Module1Lesson6AiProcess>

export type Module1Lesson6CustomPrompts = Record<Module1Lesson6PromptId, string>

export interface Module1Lesson6ReviewNeeded {
  plan: boolean
  draft: boolean
  final: boolean
}

/**
 * 上次整体确认时的四段只读快照。
 * 不是可编辑全文，也不是 fullStory；作品页只用来展示这一版，当前工作稿仍在各课确认稿。
 */
export interface Module1Lesson6ConfirmedEdition {
  confirmedAt: string
  storyTitle: string
  openingText: string
  developmentText: string
  turnText: string
  endingText: string
}

export interface Module1Lesson6State extends Module1BaseLessonState {
  contentVersion: number
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
  observation: string
  endingType: Module1Lesson6EndingType | ""
  customEndingRequirement: string
  plotPlan: string
  planReason: string
  draftText: string
  draftFrozenText: string
  finalText: string
  previousFinalText: string
  decisionNote: string
  revisionInstruction: string
  preserveText: string
  selfCheck: boolean
  /** 最近一次打开「预览全文」时的校对版本；正文变了就必须再打开。 */
  previewSeenKey: string
  confirmedEdition: Module1Lesson6ConfirmedEdition | null
  customPrompts: Module1Lesson6CustomPrompts
  aiProcess: Module1Lesson6AiProcessMap
  reviewNeeded: Module1Lesson6ReviewNeeded
  legacyLesson6: Record<string, unknown> | null
}

export interface Module1Portfolio {
  id: string
  moduleId: typeof MODULE1_ID
  appVersion: string
  createdAt: string
  updatedAt: string
  student: Module1StudentProfile
  progress: Module1ProgressPointer
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
  lesson3: Module1Lesson3State
  lesson4: Module1Lesson4State
  lesson5: Module1Lesson5State
  lesson6: Module1Lesson6State
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function stringArrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string").slice(0, 2)
}

export function createEmptyModule1Lesson2Study(): Module1Lesson2Study {
  return { caseId: "", response: "", aiReply: "", aiAssistUsed: false }
}

type Module1Lesson2ReferenceSlotTextKey = Exclude<keyof Module1Lesson2ReferenceSlot, "sourceConfirmed">

const REFERENCE_SLOT_TEXT_KEYS: Module1Lesson2ReferenceSlotTextKey[] = [
  "caseId",
  "workTitle",
  "author",
  "location",
  "versionNote",
  "excerpt",
  "sourceNote",
]

export function createEmptyModule1Lesson2ReferenceSlot(): Module1Lesson2ReferenceSlot {
  return {
    caseId: "",
    workTitle: "",
    author: "",
    location: "",
    versionNote: "",
    excerpt: "",
    sourceNote: "",
    sourceConfirmed: false,
  }
}

export function createEmptyModule1Lesson2FoundDraft(): Module1Lesson2FoundDraft {
  return {
    ...createEmptyModule1Lesson2ReferenceSlot(),
    recommendationReply: "",
    round1PromptCopied: false,
  }
}

export function hasModule1Lesson2ReferenceSlotContent(slot: Module1Lesson2ReferenceSlot): boolean {
  return REFERENCE_SLOT_TEXT_KEYS.some(key => slot[key].trim().length > 0)
}

function copyReferenceSlot(slot: Module1Lesson2ReferenceSlot): Module1Lesson2ReferenceSlot {
  return {
    caseId: slot.caseId,
    workTitle: slot.workTitle,
    author: slot.author,
    location: slot.location,
    versionNote: slot.versionNote,
    excerpt: slot.excerpt,
    sourceNote: slot.sourceNote,
    sourceConfirmed: slot.sourceConfirmed,
  }
}

function copyFoundDraft(slot: Module1Lesson2FoundDraft): Module1Lesson2FoundDraft {
  return {
    ...copyReferenceSlot(slot),
    recommendationReply: slot.recommendationReply,
    round1PromptCopied: slot.round1PromptCopied,
  }
}

/** 按当前 origin 取出对应槽；未选来源时返回空槽，不把另一套内容露出来。 */
export function getModule1Lesson2ActiveReferenceSlot(
  reference: Module1Lesson2Reference,
): Module1Lesson2ReferenceSlot {
  if (reference.origin === "classroom") return copyReferenceSlot(reference.classroomDraft)
  if (reference.origin === "external") return copyReferenceSlot(reference.foundDraft)
  return createEmptyModule1Lesson2ReferenceSlot()
}

/** 用当前 origin 对应槽回写扁平字段，供完成判定、摘要、快照读取。 */
export function projectModule1Lesson2Reference(reference: Module1Lesson2Reference): Module1Lesson2Reference {
  const classroomDraft = copyReferenceSlot({
    ...createEmptyModule1Lesson2ReferenceSlot(),
    ...reference.classroomDraft,
  })
  const foundDraft = copyFoundDraft({
    ...createEmptyModule1Lesson2FoundDraft(),
    ...reference.foundDraft,
  })
  const projected: Module1Lesson2Reference = {
    origin: reference.origin,
    classroomDraft,
    foundDraft,
    ...createEmptyModule1Lesson2ReferenceSlot(),
  }
  return {
    ...projected,
    ...getModule1Lesson2ActiveReferenceSlot(projected),
  }
}

export function withModule1Lesson2ReferenceOrigin(
  reference: Module1Lesson2Reference,
  origin: Module1Lesson2ReferenceOrigin,
): Module1Lesson2Reference {
  return projectModule1Lesson2Reference({ ...reference, origin })
}

export function patchModule1Lesson2ActiveReference(
  reference: Module1Lesson2Reference,
  patch: Partial<Module1Lesson2ReferenceSlot>,
): Module1Lesson2Reference {
  if (reference.origin === "classroom") {
    return projectModule1Lesson2Reference({
      ...reference,
      classroomDraft: { ...reference.classroomDraft, ...patch },
    })
  }
  if (reference.origin === "external") {
    return projectModule1Lesson2Reference({
      ...reference,
      foundDraft: { ...reference.foundDraft, ...patch },
    })
  }
  return projectModule1Lesson2Reference(reference)
}

export function patchModule1Lesson2FoundDraft(
  reference: Module1Lesson2Reference,
  patch: Partial<Pick<Module1Lesson2FoundDraft, "recommendationReply" | "round1PromptCopied">>,
): Module1Lesson2Reference {
  return projectModule1Lesson2Reference({
    ...reference,
    foundDraft: { ...reference.foundDraft, ...patch },
  })
}

/** 扁平字段与第一轮 AI 字段按当前 origin 派生：课堂不露出自选槽的回复。 */
export function syncModule1Lesson2DerivedReference(state: Module1Lesson2State): Module1Lesson2State {
  const reference = projectModule1Lesson2Reference(state.reference)
  const isFound = reference.origin === "external"
  return {
    ...state,
    reference,
    recommendationReply: isFound ? reference.foundDraft.recommendationReply : "",
    round1PromptCopied: isFound ? reference.foundDraft.round1PromptCopied : false,
  }
}

export function createEmptyModule1Lesson2Reference(): Module1Lesson2Reference {
  return projectModule1Lesson2Reference({
    origin: "",
    classroomDraft: createEmptyModule1Lesson2ReferenceSlot(),
    foundDraft: createEmptyModule1Lesson2FoundDraft(),
    ...createEmptyModule1Lesson2ReferenceSlot(),
  })
}

export function createEmptyModule1Lesson2Character(): Module1Lesson2Character {
  return {
    who: "",
    want: "",
    blocked: "",
    firstAction: "",
    possibleChange: "",
  }
}

export function createEmptyModule1Lesson2ReviewNeeded(): Module1Lesson2ReviewNeeded {
  return {
    study: false,
    reference: false,
    writingPlan: false,
    reason: false,
    character: false,
  }
}

export function createEmptyModule1Lesson2State(): Module1Lesson2State {
  return {
    step: 1,
    completed: false,
    completedAt: null,
    contentVersion: MODULE1_LESSON2_CONTENT_VERSION,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    study: createEmptyModule1Lesson2Study(),
    recommendationReply: "",
    round1PromptCopied: false,
    round2PromptCopied: false,
    step2Round1Passed: false,
    reference: createEmptyModule1Lesson2Reference(),
    analysisReply: "",
    writingPlan: "",
    reasonAiReply: "",
    reasonAiAssistUsed: false,
    reason: "",
    character: createEmptyModule1Lesson2Character(),
    characterAiReply: "",
    characterAiAssistUsed: false,
    reviewNeeded: createEmptyModule1Lesson2ReviewNeeded(),
    legacyLesson2: null,
    styleId: "",
    styleName: "",
    styleWhy: "",
    styleHint: "",
    styleExamples: [],
    protagonistIdentity: "",
    goal: "",
    obstacle: "",
    changeAction: "",
  }
}

export const MODULE1_LESSON3_PROMPT_IDS: Module1Lesson3PromptId[] = ["p1", "p2", "p3", "p4", "p5"]

export function createEmptyModule1Lesson3AiProcess(): Module1Lesson3AiProcess {
  return {
    generatedPromptSnapshot: "",
    copiedPrompt: "",
    aiReply: "",
    promptEdited: false,
    copySucceeded: false,
    copiedAt: null,
    copyCount: 0,
  }
}

export function createEmptyModule1Lesson3CustomPrompts(): Module1Lesson3CustomPrompts {
  return { p1: "", p2: "", p3: "", p4: "", p5: "" }
}

export function createEmptyModule1Lesson3AiProcessMap(): Module1Lesson3AiProcessMap {
  return {
    p1: createEmptyModule1Lesson3AiProcess(),
    p2: createEmptyModule1Lesson3AiProcess(),
    p3: createEmptyModule1Lesson3AiProcess(),
    p4: createEmptyModule1Lesson3AiProcess(),
    p5: createEmptyModule1Lesson3AiProcess(),
  }
}

export function createEmptyModule1Lesson3ReviewNeeded(): Module1Lesson3ReviewNeeded {
  return { opening: false, draft: false, final: false }
}

export function createEmptyModule1Lesson3State(): Module1Lesson3State {
  return {
    step: 1,
    completed: false,
    completedAt: null,
    contentVersion: MODULE1_LESSON3_CONTENT_VERSION,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    observation: "",
    openingPlan: "",
    focusTechnique: "",
    storyTitle: "",
    draftText: "",
    draftFrozenText: "",
    finalText: "",
    previousFinalText: "",
    decisionNote: "",
    openingCandidatesRaw: "",
    feedbackRaw: "",
    revisionInstruction: "",
    preserveText: "",
    customPrompts: createEmptyModule1Lesson3CustomPrompts(),
    aiProcess: createEmptyModule1Lesson3AiProcessMap(),
    reviewNeeded: createEmptyModule1Lesson3ReviewNeeded(),
    legacyLesson3: null,
  }
}

export function countModule1MeaningfulChars(text: string): number {
  return Array.from(text.replace(/\s/g, "")).length
}

export function hasModule1Lesson3AiReplyIfUsed(process: Module1Lesson3AiProcess): boolean {
  return !process.copySucceeded || Boolean(process.aiReply.trim())
}

export function hasModule1Lesson3RequiredAi(process: Module1Lesson3AiProcess): boolean {
  return process.copySucceeded && Boolean(process.aiReply.trim())
}

export function hasModule1Lesson3Observation(state: Module1Lesson3State): boolean {
  return Boolean(state.observation.trim()) && hasModule1Lesson3AiReplyIfUsed(state.aiProcess.p1)
}

export function hasModule1Lesson3Opening(state: Module1Lesson3State): boolean {
  return Boolean(state.openingPlan.trim() && state.focusTechnique.trim())
    && hasModule1Lesson3AiReplyIfUsed(state.aiProcess.p2)
}

export function hasModule1Lesson3Draft(state: Module1Lesson3State): boolean {
  return Boolean(state.storyTitle.trim() && state.draftText.trim())
    && hasModule1Lesson3RequiredAi(state.aiProcess.p3)
}

export function hasModule1Lesson3Final(state: Module1Lesson3State): boolean {
  return Boolean(state.finalText.trim() && state.decisionNote.trim())
    && hasModule1Lesson3RequiredAi(state.aiProcess.p4)
    && hasModule1Lesson3AiReplyIfUsed(state.aiProcess.p5)
}

export function hasMeaningfulModule1Lesson3Fields(state: Module1Lesson3State): boolean {
  return hasModule1Lesson3Observation(state)
    && !state.reviewNeeded.opening
    && hasModule1Lesson3Opening(state)
    && !state.reviewNeeded.draft
    && hasModule1Lesson3Draft(state)
    && hasModule1Lesson3Final(state)
    && !state.reviewNeeded.final
}

export const MODULE1_LESSON4_PROMPT_IDS: Module1Lesson4PromptId[] = ["p1", "p2", "p3", "p4", "p5"]

export function createEmptyModule1Lesson4AiProcess(): Module1Lesson4AiProcess {
  return { ...createEmptyModule1Lesson3AiProcess(), contextKey: "" }
}

export function createEmptyModule1Lesson4CustomPrompts(): Module1Lesson4CustomPrompts {
  return { p1: "", p2: "", p3: "", p4: "", p5: "" }
}

export function createEmptyModule1Lesson4AiProcessMap(): Module1Lesson4AiProcessMap {
  return {
    p1: createEmptyModule1Lesson4AiProcess(),
    p2: createEmptyModule1Lesson4AiProcess(),
    p3: createEmptyModule1Lesson4AiProcess(),
    p4: createEmptyModule1Lesson4AiProcess(),
    p5: createEmptyModule1Lesson4AiProcess(),
  }
}

export function createEmptyModule1Lesson4ReviewNeeded(): Module1Lesson4ReviewNeeded {
  return { plan: false, draft: false, final: false }
}

export function createEmptyModule1Lesson4State(): Module1Lesson4State {
  return {
    step: 1,
    completed: false,
    completedAt: null,
    contentVersion: MODULE1_LESSON4_CONTENT_VERSION,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    observation: "",
    plotPlan: "",
    planReason: "",
    draftText: "",
    draftFrozenText: "",
    finalText: "",
    previousFinalText: "",
    decisionNote: "",
    revisionInstruction: "",
    preserveText: "",
    selfCheck: false,
    customPrompts: createEmptyModule1Lesson4CustomPrompts(),
    aiProcess: createEmptyModule1Lesson4AiProcessMap(),
    reviewNeeded: createEmptyModule1Lesson4ReviewNeeded(),
    legacyLesson4: null,
  }
}

export function hasModule1Lesson4AiReplyIfUsed(process: Module1Lesson4AiProcess): boolean {
  return !process.copySucceeded || Boolean(process.aiReply.trim())
}

export function hasModule1Lesson4RequiredAi(process: Module1Lesson4AiProcess): boolean {
  return process.copySucceeded && Boolean(process.aiReply.trim())
}

export function hasModule1Lesson4Observation(state: Module1Lesson4State): boolean {
  return Boolean(state.observation.trim()) && hasModule1Lesson4AiReplyIfUsed(state.aiProcess.p1)
}

export function hasModule1Lesson4Plan(state: Module1Lesson4State): boolean {
  return Boolean(state.plotPlan.trim() && state.planReason.trim())
    && hasModule1Lesson4AiReplyIfUsed(state.aiProcess.p2)
}

export function hasModule1Lesson4Draft(state: Module1Lesson4State): boolean {
  return Boolean(state.draftText.trim())
    && hasModule1Lesson4RequiredAi(state.aiProcess.p3)
}

export function hasModule1Lesson4Final(state: Module1Lesson4State): boolean {
  return Boolean(state.finalText.trim() && state.decisionNote.trim())
    && state.selfCheck
    && hasModule1Lesson4RequiredAi(state.aiProcess.p4)
    && hasModule1Lesson4AiReplyIfUsed(state.aiProcess.p5)
}

export function hasMeaningfulModule1Lesson4Fields(state: Module1Lesson4State): boolean {
  return hasModule1Lesson4Observation(state)
    && !state.reviewNeeded.plan
    && hasModule1Lesson4Plan(state)
    && !state.reviewNeeded.draft
    && hasModule1Lesson4Draft(state)
    && hasModule1Lesson4Final(state)
    && !state.reviewNeeded.final
}


export const MODULE1_LESSON5_PROMPT_IDS: Module1Lesson5PromptId[] = ["p1", "p2", "p3", "p4", "p5"]

export function createEmptyModule1Lesson5AiProcess(): Module1Lesson5AiProcess {
  return { ...createEmptyModule1Lesson3AiProcess(), contextKey: "" }
}

export function createEmptyModule1Lesson5CustomPrompts(): Module1Lesson5CustomPrompts {
  return { p1: "", p2: "", p3: "", p4: "", p5: "" }
}

export function createEmptyModule1Lesson5AiProcessMap(): Module1Lesson5AiProcessMap {
  return {
    p1: createEmptyModule1Lesson5AiProcess(),
    p2: createEmptyModule1Lesson5AiProcess(),
    p3: createEmptyModule1Lesson5AiProcess(),
    p4: createEmptyModule1Lesson5AiProcess(),
    p5: createEmptyModule1Lesson5AiProcess(),
  }
}

export function createEmptyModule1Lesson5ReviewNeeded(): Module1Lesson5ReviewNeeded {
  return { plan: false, draft: false, final: false }
}

export function createEmptyModule1Lesson5State(): Module1Lesson5State {
  return {
    step: 1,
    completed: false,
    completedAt: null,
    contentVersion: MODULE1_LESSON5_CONTENT_VERSION,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    observation: "",
    plotPlan: "",
    planReason: "",
    draftText: "",
    draftFrozenText: "",
    finalText: "",
    previousFinalText: "",
    decisionNote: "",
    revisionInstruction: "",
    preserveText: "",
    selfCheck: false,
    customPrompts: createEmptyModule1Lesson5CustomPrompts(),
    aiProcess: createEmptyModule1Lesson5AiProcessMap(),
    reviewNeeded: createEmptyModule1Lesson5ReviewNeeded(),
    legacyLesson5: null,
  }
}

export function hasModule1Lesson5AiReplyIfUsed(process: Module1Lesson5AiProcess): boolean {
  return !process.copySucceeded || Boolean(process.aiReply.trim())
}

export function hasModule1Lesson5RequiredAi(process: Module1Lesson5AiProcess): boolean {
  return process.copySucceeded && Boolean(process.aiReply.trim())
}

export function hasModule1Lesson5Observation(state: Module1Lesson5State): boolean {
  return Boolean(state.observation.trim()) && hasModule1Lesson5AiReplyIfUsed(state.aiProcess.p1)
}

export function hasModule1Lesson5Plan(state: Module1Lesson5State): boolean {
  return Boolean(state.plotPlan.trim() && state.planReason.trim())
    && hasModule1Lesson5AiReplyIfUsed(state.aiProcess.p2)
}

export function hasModule1Lesson5Draft(state: Module1Lesson5State): boolean {
  return Boolean(state.draftText.trim())
    && hasModule1Lesson5RequiredAi(state.aiProcess.p3)
}

export function hasModule1Lesson5Final(state: Module1Lesson5State): boolean {
  return Boolean(state.finalText.trim() && state.decisionNote.trim())
    && state.selfCheck
    && hasModule1Lesson5RequiredAi(state.aiProcess.p4)
    && hasModule1Lesson5AiReplyIfUsed(state.aiProcess.p5)
}

export function hasMeaningfulModule1Lesson5Fields(state: Module1Lesson5State): boolean {
  return hasModule1Lesson5Observation(state)
    && !state.reviewNeeded.plan
    && hasModule1Lesson5Plan(state)
    && !state.reviewNeeded.draft
    && hasModule1Lesson5Draft(state)
    && hasModule1Lesson5Final(state)
    && !state.reviewNeeded.final
}

export const MODULE1_LESSON6_PROMPT_IDS: Module1Lesson6PromptId[] = ["p1", "p2", "p3", "p4", "p5"]

export function isModule1Lesson6EndingType(value: string): value is Module1Lesson6EndingType {
  return (MODULE1_LESSON6_ENDING_TYPES as readonly string[]).includes(value)
}

export function createEmptyModule1Lesson6AiProcess(): Module1Lesson6AiProcess {
  return { ...createEmptyModule1Lesson3AiProcess(), contextKey: "" }
}

export function createEmptyModule1Lesson6CustomPrompts(): Module1Lesson6CustomPrompts {
  return { p1: "", p2: "", p3: "", p4: "", p5: "" }
}

export function createEmptyModule1Lesson6AiProcessMap(): Module1Lesson6AiProcessMap {
  return {
    p1: createEmptyModule1Lesson6AiProcess(),
    p2: createEmptyModule1Lesson6AiProcess(),
    p3: createEmptyModule1Lesson6AiProcess(),
    p4: createEmptyModule1Lesson6AiProcess(),
    p5: createEmptyModule1Lesson6AiProcess(),
  }
}

export function createEmptyModule1Lesson6ReviewNeeded(): Module1Lesson6ReviewNeeded {
  return { plan: false, draft: false, final: false }
}

export function createEmptyModule1Lesson6ConfirmedEdition(): Module1Lesson6ConfirmedEdition {
  return {
    confirmedAt: "",
    storyTitle: "",
    openingText: "",
    developmentText: "",
    turnText: "",
    endingText: "",
  }
}

export function isModule1Lesson6EditionResolvable(
  edition: Module1Lesson6ConfirmedEdition | null | undefined,
): edition is Module1Lesson6ConfirmedEdition {
  if (!edition) return false
  return Boolean(
    edition.confirmedAt.trim()
    && edition.openingText.trim()
    && edition.developmentText.trim()
    && edition.turnText.trim()
    && edition.endingText.trim(),
  )
}

export function createEmptyModule1Lesson6State(): Module1Lesson6State {
  return {
    step: 1,
    completed: false,
    completedAt: null,
    contentVersion: MODULE1_LESSON6_CONTENT_VERSION,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
    observation: "",
    endingType: "",
    customEndingRequirement: "",
    plotPlan: "",
    planReason: "",
    draftText: "",
    draftFrozenText: "",
    finalText: "",
    previousFinalText: "",
    decisionNote: "",
    revisionInstruction: "",
    preserveText: "",
    selfCheck: false,
    previewSeenKey: "",
    confirmedEdition: null,
    customPrompts: createEmptyModule1Lesson6CustomPrompts(),
    aiProcess: createEmptyModule1Lesson6AiProcessMap(),
    reviewNeeded: createEmptyModule1Lesson6ReviewNeeded(),
    legacyLesson6: null,
  }
}

export function hasModule1Lesson6AiReplyIfUsed(process: Module1Lesson6AiProcess): boolean {
  return !process.copySucceeded || Boolean(process.aiReply.trim())
}

export function hasModule1Lesson6RequiredAi(process: Module1Lesson6AiProcess): boolean {
  return process.copySucceeded && Boolean(process.aiReply.trim())
}

export function hasModule1Lesson6Ending(state: Module1Lesson6State): boolean {
  if (!isModule1Lesson6EndingType(state.endingType)) return false
  if (state.endingType === "自定义") return Boolean(state.customEndingRequirement.trim())
  return true
}

export function hasModule1Lesson6Observation(state: Module1Lesson6State): boolean {
  return Boolean(state.observation.trim()) && hasModule1Lesson6AiReplyIfUsed(state.aiProcess.p1)
}

export function hasModule1Lesson6Plan(state: Module1Lesson6State): boolean {
  return Boolean(state.plotPlan.trim() && state.planReason.trim())
    && hasModule1Lesson6Ending(state)
    && hasModule1Lesson6AiReplyIfUsed(state.aiProcess.p2)
}

export function hasModule1Lesson6Draft(state: Module1Lesson6State): boolean {
  return Boolean(state.draftText.trim())
    && hasModule1Lesson6RequiredAi(state.aiProcess.p3)
}

export function hasModule1Lesson6Final(state: Module1Lesson6State): boolean {
  return Boolean(state.finalText.trim() && state.decisionNote.trim())
    && state.selfCheck
    && Boolean(state.previewSeenKey.trim())
    && hasModule1Lesson6RequiredAi(state.aiProcess.p4)
    && hasModule1Lesson6AiReplyIfUsed(state.aiProcess.p5)
}

export function hasMeaningfulModule1Lesson6Fields(state: Module1Lesson6State): boolean {
  return hasModule1Lesson6Observation(state)
    && !state.reviewNeeded.plan
    && hasModule1Lesson6Plan(state)
    && !state.reviewNeeded.draft
    && hasModule1Lesson6Draft(state)
    && hasModule1Lesson6Final(state)
    && !state.reviewNeeded.final
}

export function hasMeaningfulModule1Lesson1Fields(state: Module1Lesson1State): boolean {
  return [state.sdg, state.sdgWhy, state.cityIssue, state.audience, state.audienceConcern]
    .every(value => value.trim().length > 0)
}

export function hasModule1Lesson1PromptContext(state: Module1Lesson1State): boolean {
  return Boolean(state.sdg.trim() && state.cityIssue.trim() && state.audience.trim())
}

export function parseModule1WritingPlanItems(plan: string): [string, string, string] {
  const numbered = [...plan.matchAll(/^\s*(\d+)\.\s*(.*)$/gm)]
  if (numbered.length >= 2) {
    const map = new Map(numbered.map(match => [Number(match[1]), match[2] ?? ""]))
    return [map.get(1)?.trim() ?? "", map.get(2)?.trim() ?? "", map.get(3)?.trim() ?? ""]
  }
  const lines = plan.split(/\n+/).map(line => line.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean)
  return [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""]
}

export function joinModule1WritingPlanItems(items: [string, string, string]): string {
  return items
    .map(item => item.trim())
    .map((item, index) => (item ? `${index + 1}. ${item}` : ""))
    .filter(Boolean)
    .join("\n")
}

export function hasModule1Lesson2StudyFields(state: Module1Lesson2State): boolean {
  const study = state.study
  if (!study.caseId.trim() || !study.response.trim()) return false
  if (study.aiAssistUsed && !study.aiReply.trim()) return false
  return true
}

export function hasModule1Lesson2ReferenceFields(state: Module1Lesson2State): boolean {
  const reference = projectModule1Lesson2Reference(state.reference)
  const slot = getModule1Lesson2ActiveReferenceSlot(reference)
  return Boolean(
    (reference.origin === "classroom" || reference.origin === "external")
    && slot.workTitle.trim()
    && slot.author.trim()
    && slot.location.trim()
    && slot.excerpt.trim()
    && slot.sourceNote.trim()
    && slot.sourceConfirmed,
  )
}

export function hasModule1Lesson2WritingPlan(state: Module1Lesson2State): boolean {
  const [first, second] = parseModule1WritingPlanItems(state.writingPlan)
  return Boolean(first && second)
}

/** 第 2 关第一步：只看当前 origin 对应槽。点了第一轮复制则仅自选槽的 AI 回复必填。 */
export function canCompleteModule1Lesson2Step2Round1(state: Module1Lesson2State): boolean {
  const reference = projectModule1Lesson2Reference(state.reference)
  if (reference.origin === "classroom") {
    return Boolean(reference.classroomDraft.caseId.trim() && reference.classroomDraft.sourceConfirmed)
  }
  if (reference.origin === "external") {
    const found = reference.foundDraft
    if (found.round1PromptCopied && !found.recommendationReply.trim()) return false
    return Boolean(found.workTitle.trim() && found.excerpt.trim() && found.sourceNote.trim())
  }
  return false
}

/** 第 2 关第二页：完整参照 + 已阅读；若点了第二轮复制则拆解回复必填。写法仍在整关完成时检查。 */
export function canCompleteModule1Lesson2Step2Round2Fields(state: Module1Lesson2State): boolean {
  if (!hasModule1Lesson2ReferenceFields(state)) return false
  if (state.round2PromptCopied && !state.analysisReply.trim()) return false
  return true
}

export function hasModule1Lesson2Reason(state: Module1Lesson2State): boolean {
  if (!state.reason.trim()) return false
  if (state.reasonAiAssistUsed && !state.reasonAiReply.trim()) return false
  return true
}

export function hasModule1Lesson2CharacterFields(state: Module1Lesson2State): boolean {
  const character = state.character
  if (![character.who, character.want, character.blocked, character.firstAction, character.possibleChange]
    .every(value => value.trim().length > 0)) {
    return false
  }
  if (state.characterAiAssistUsed && !state.characterAiReply.trim()) return false
  return true
}

export function hasMeaningfulModule1Lesson2Fields(state: Module1Lesson2State): boolean {
  return hasModule1Lesson2StudyFields(state)
    && !state.reviewNeeded.study
    && hasModule1Lesson2ReferenceFields(state)
    && hasModule1Lesson2WritingPlan(state)
    && !state.reviewNeeded.reference
    && !state.reviewNeeded.writingPlan
    && hasModule1Lesson2Reason(state)
    && !state.reviewNeeded.reason
    && hasModule1Lesson2CharacterFields(state)
    && !state.reviewNeeded.character
}

export function syncModule1Lesson2MappedFields(state: Module1Lesson2State): Module1Lesson2State {
  return {
    ...state,
    styleWhy: state.reason,
    protagonistIdentity: state.character.who,
    goal: state.character.want,
    obstacle: state.character.blocked,
  }
}

export function createNewModule1Portfolio(
  student: Partial<Module1StudentProfile> = {},
): Module1Portfolio {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    moduleId: MODULE1_ID,
    appVersion: MODULE1_APP_VERSION,
    createdAt: now,
    updatedAt: now,
    student: {
      clazz: student.clazz?.trim() ?? "",
      studentName: student.studentName?.trim() ?? "",
      classSeatCode: student.classSeatCode?.trim() ?? "",
    },
    progress: { lessonId: 1, stepId: 1 },
    lesson1: {
      step: 1,
      completed: false,
      completedAt: null,
      step1Completed: false,
      step2Completed: false,
      step3Completed: false,
      step4Completed: false,
      sdg: "",
      sdgWhy: "",
      cityIssue: "",
      audience: "",
      audienceConcern: "",
    },
    lesson2: createEmptyModule1Lesson2State(),
    lesson3: createEmptyModule1Lesson3State(),
    lesson4: createEmptyModule1Lesson4State(),
    lesson5: createEmptyModule1Lesson5State(),
    lesson6: createEmptyModule1Lesson6State(),
  }
}

function normalizeStudy(raw: unknown): Module1Lesson2Study {
  const source = isRecord(raw) ? raw : {}
  return {
    caseId: stringValue(source.caseId),
    response: stringValue(source.response),
    aiReply: stringValue(source.aiReply),
    aiAssistUsed: booleanValue(source.aiAssistUsed),
  }
}

function normalizeReferenceOrigin(value: unknown): Module1Lesson2ReferenceOrigin {
  return value === "classroom" || value === "external" ? value : ""
}

function normalizeReferenceSlot(raw: unknown): Module1Lesson2ReferenceSlot {
  const source = isRecord(raw) ? raw : {}
  return {
    caseId: stringValue(source.caseId),
    workTitle: stringValue(source.workTitle),
    author: stringValue(source.author),
    location: stringValue(source.location),
    versionNote: stringValue(source.versionNote),
    excerpt: stringValue(source.excerpt),
    sourceNote: stringValue(source.sourceNote),
    sourceConfirmed: booleanValue(source.sourceConfirmed),
  }
}

function normalizeFoundDraft(
  raw: unknown,
  replyFallback: string,
  copiedFallback: boolean,
): Module1Lesson2FoundDraft {
  const source = isRecord(raw) ? raw : {}
  return {
    ...normalizeReferenceSlot(source),
    recommendationReply: stringValue(source.recommendationReply, replyFallback),
    round1PromptCopied: booleanValue(source.round1PromptCopied, copiedFallback),
  }
}

/**
 * 归一化参照：旧包只有扁平字段时按当时 origin 迁进对应槽，另一槽空。
 * 第一轮 AI 回复属于自选槽，即使当时 origin 是课堂也迁进 foundDraft，避免丢掉。
 */
function normalizeReference(raw: unknown, lesson2Source: Record<string, unknown>): Module1Lesson2Reference {
  const source = isRecord(raw) ? raw : {}
  const origin = normalizeReferenceOrigin(source.origin)
  const reply = stringValue(lesson2Source.recommendationReply)
  const copied = booleanValue(lesson2Source.round1PromptCopied)
  const flat = normalizeReferenceSlot(source)
  const hasClassroom = isRecord(source.classroomDraft)
  const hasFound = isRecord(source.foundDraft)

  let classroomDraft = hasClassroom
    ? normalizeReferenceSlot(source.classroomDraft)
    : createEmptyModule1Lesson2ReferenceSlot()
  let foundDraft = hasFound
    ? normalizeFoundDraft(source.foundDraft, reply, copied)
    : createEmptyModule1Lesson2FoundDraft()

  if (!hasClassroom && !hasFound) {
    if (origin === "classroom" || (!origin && flat.caseId.trim())) {
      classroomDraft = flat
      foundDraft = {
        ...createEmptyModule1Lesson2FoundDraft(),
        recommendationReply: reply,
        round1PromptCopied: copied,
      }
    } else if (origin === "external" || hasModule1Lesson2ReferenceSlotContent(flat)) {
      foundDraft = {
        ...flat,
        recommendationReply: reply,
        round1PromptCopied: copied,
      }
    } else {
      foundDraft = {
        ...createEmptyModule1Lesson2FoundDraft(),
        recommendationReply: reply,
        round1PromptCopied: copied,
      }
    }
  } else {
    if (!hasClassroom && origin === "classroom") {
      classroomDraft = flat
    }
    if (!hasFound && origin === "external") {
      foundDraft = {
        ...flat,
        recommendationReply: reply,
        round1PromptCopied: copied,
      }
    }
  }

  return projectModule1Lesson2Reference({
    origin,
    classroomDraft,
    foundDraft,
    ...createEmptyModule1Lesson2ReferenceSlot(),
  })
}

function normalizeCharacter(raw: unknown, fallback: Module1Lesson2Character): Module1Lesson2Character {
  const source = isRecord(raw) ? raw : {}
  return {
    who: stringValue(source.who, fallback.who),
    want: stringValue(source.want, fallback.want),
    blocked: stringValue(source.blocked, fallback.blocked),
    firstAction: stringValue(source.firstAction, fallback.firstAction),
    possibleChange: stringValue(source.possibleChange, fallback.possibleChange),
  }
}

function normalizeReviewNeeded(raw: unknown, fallback: Module1Lesson2ReviewNeeded): Module1Lesson2ReviewNeeded {
  const source = isRecord(raw) ? raw : {}
  return {
    study: booleanValue(source.study, fallback.study),
    reference: booleanValue(source.reference, fallback.reference),
    writingPlan: booleanValue(source.writingPlan, fallback.writingPlan),
    reason: booleanValue(source.reason, fallback.reason),
    character: booleanValue(source.character, fallback.character),
  }
}

function cloneLegacyLesson2(raw: Record<string, unknown>): Record<string, unknown> {
  const archived = { ...raw }
  delete archived.legacyLesson2
  return archived
}

function hasNewLesson2Shape(source: Record<string, unknown>): boolean {
  return numberValue(source.contentVersion, 0) >= MODULE1_LESSON2_CONTENT_VERSION
    || isRecord(source.study)
    || isRecord(source.reference)
    || isRecord(source.character)
    || typeof source.writingPlan === "string"
    || typeof source.reason === "string"
}

function hasLegacyLesson2Content(source: Record<string, unknown>): boolean {
  return Boolean(
    stringValue(source.styleId)
    || stringValue(source.styleName)
    || stringValue(source.styleWhy)
    || stringValue(source.styleHint)
    || stringValue(source.protagonistIdentity)
    || stringValue(source.goal)
    || stringValue(source.obstacle)
    || stringValue(source.changeAction)
    || stringArrayValue(source.styleExamples).length > 0,
  )
}

function normalizeLesson2State(raw: unknown): Module1Lesson2State {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson2State()
  const alreadyArchived = isRecord(source.legacyLesson2) ? source.legacyLesson2 : null
  const isLegacyRecord = Boolean(alreadyArchived)
    || (!hasNewLesson2Shape(source) && hasLegacyLesson2Content(source))
  const legacyLesson2 = alreadyArchived
    ?? (isLegacyRecord && hasLegacyLesson2Content(source) ? cloneLegacyLesson2(source) : null)

  const styleId = stringValue(source.styleId)
  const styleName = stringValue(source.styleName)
  const styleWhy = stringValue(source.styleWhy)
  const styleHint = stringValue(source.styleHint)
  const styleExamples = stringArrayValue(source.styleExamples)
  const protagonistIdentity = stringValue(source.protagonistIdentity)
  const goal = stringValue(source.goal)
  const obstacle = stringValue(source.obstacle)
  const changeAction = stringValue(source.changeAction)

  const mappedCharacter = {
    who: protagonistIdentity,
    want: goal,
    blocked: obstacle,
    firstAction: "",
    possibleChange: "",
  }
  const character = normalizeCharacter(source.character, isLegacyRecord ? mappedCharacter : empty.character)
  const reason = stringValue(source.reason) || (isLegacyRecord ? styleWhy : "")
  const writingPlan = stringValue(source.writingPlan)
  const study = normalizeStudy(source.study)
  const reference = normalizeReference(source.reference, source)

  const reviewFallback: Module1Lesson2ReviewNeeded = isLegacyRecord
    ? {
      study: false,
      reference: !hasModule1Lesson2ReferenceFields({ ...empty, reference }),
      writingPlan: !hasModule1Lesson2WritingPlan({ ...empty, writingPlan }),
      reason: Boolean(reason.trim()),
      character: Boolean(character.who.trim() || character.want.trim() || character.blocked.trim()),
    }
    : empty.reviewNeeded
  const reviewNeeded = normalizeReviewNeeded(source.reviewNeeded, reviewFallback)

  const draft = syncModule1Lesson2MappedFields(syncModule1Lesson2DerivedReference({
    ...empty,
    study,
    recommendationReply: stringValue(source.recommendationReply),
    round1PromptCopied: booleanValue(source.round1PromptCopied),
    round2PromptCopied: booleanValue(source.round2PromptCopied),
    step2Round1Passed: booleanValue(source.step2Round1Passed),
    reference,
    analysisReply: stringValue(source.analysisReply),
    writingPlan,
    reasonAiReply: stringValue(source.reasonAiReply),
    reasonAiAssistUsed: booleanValue(source.reasonAiAssistUsed),
    reason,
    character,
    characterAiReply: stringValue(source.characterAiReply),
    characterAiAssistUsed: booleanValue(source.characterAiAssistUsed),
    reviewNeeded,
    legacyLesson2,
    styleId,
    styleName,
    styleWhy,
    styleHint,
    styleExamples,
    protagonistIdentity,
    goal,
    obstacle,
    changeAction,
  }))

  const studyReady = hasModule1Lesson2StudyFields(draft) && !draft.reviewNeeded.study
  const referenceReady = canCompleteModule1Lesson2Step2Round2Fields(draft)
    && hasModule1Lesson2WritingPlan(draft)
    && !draft.reviewNeeded.reference
    && !draft.reviewNeeded.writingPlan
  const reasonReady = hasModule1Lesson2Reason(draft) && !draft.reviewNeeded.reason
  const characterReady = hasModule1Lesson2CharacterFields(draft) && !draft.reviewNeeded.character
  const step1Completed = booleanValue(source.step1Completed) && studyReady
  const step2Completed = step1Completed && booleanValue(source.step2Completed) && referenceReady
  const step3Completed = step2Completed && booleanValue(source.step3Completed) && reasonReady
  const step4Completed = step3Completed && booleanValue(source.step4Completed) && characterReady
  const completed = step4Completed && booleanValue(source.completed)
  const safeStep = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    ...draft,
    step: safeStep,
    completed,
    completedAt: completed ? stringValue(source.completedAt) || null : null,
    contentVersion: MODULE1_LESSON2_CONTENT_VERSION,
    step1Completed,
    step2Completed,
    step3Completed,
    step4Completed,
  }
}

function normalizeLesson3AiProcess(raw: unknown): Module1Lesson3AiProcess {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson3AiProcess()
  return {
    generatedPromptSnapshot: stringValue(source.generatedPromptSnapshot),
    copiedPrompt: stringValue(source.copiedPrompt),
    aiReply: stringValue(source.aiReply),
    promptEdited: booleanValue(source.promptEdited),
    copySucceeded: booleanValue(source.copySucceeded),
    copiedAt: source.copiedAt === null ? null : stringValue(source.copiedAt) || null,
    copyCount: Math.max(0, numberValue(source.copyCount, empty.copyCount)),
  }
}

function normalizeLesson3CustomPrompts(raw: unknown): Module1Lesson3CustomPrompts {
  const source = isRecord(raw) ? raw : {}
  return {
    p1: stringValue(source.p1),
    p2: stringValue(source.p2),
    p3: stringValue(source.p3),
    p4: stringValue(source.p4),
    p5: stringValue(source.p5),
  }
}

function normalizeLesson3AiProcessMap(raw: unknown): Module1Lesson3AiProcessMap {
  const source = isRecord(raw) ? raw : {}
  return {
    p1: normalizeLesson3AiProcess(source.p1),
    p2: normalizeLesson3AiProcess(source.p2),
    p3: normalizeLesson3AiProcess(source.p3),
    p4: normalizeLesson3AiProcess(source.p4),
    p5: normalizeLesson3AiProcess(source.p5),
  }
}

function normalizeLesson3ReviewNeeded(
  raw: unknown,
  fallback: Module1Lesson3ReviewNeeded,
): Module1Lesson3ReviewNeeded {
  const source = isRecord(raw) ? raw : {}
  return {
    opening: booleanValue(source.opening, fallback.opening),
    draft: booleanValue(source.draft, fallback.draft),
    final: booleanValue(source.final, fallback.final),
  }
}

function cloneLegacyLesson3(raw: Record<string, unknown>): Record<string, unknown> {
  const archived = { ...raw }
  delete archived.legacyLesson3
  return archived
}

function hasNewLesson3Shape(source: Record<string, unknown>): boolean {
  return numberValue(source.contentVersion, 0) >= MODULE1_LESSON3_CONTENT_VERSION
    || typeof source.observation === "string"
    || typeof source.openingPlan === "string"
    || typeof source.draftText === "string"
    || typeof source.finalText === "string"
    || isRecord(source.aiProcess)
}

function hasLegacyLesson3Content(source: Record<string, unknown>): boolean {
  return Boolean(
    stringValue(source.storyTitle)
    || stringValue(source.sectionText)
    || stringValue(source.openingOut)
    || stringValue(source.openingPrompt),
  )
}

function normalizeLesson3State(raw: unknown): Module1Lesson3State {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson3State()
  const alreadyArchived = isRecord(source.legacyLesson3) ? source.legacyLesson3 : null
  const isLegacyRecord = Boolean(alreadyArchived)
    || (!hasNewLesson3Shape(source) && hasLegacyLesson3Content(source))
  const legacyLesson3 = alreadyArchived
    ?? (isLegacyRecord && hasLegacyLesson3Content(source) ? cloneLegacyLesson3(source) : null)

  const draft: Module1Lesson3State = {
    ...empty,
    observation: stringValue(source.observation),
    openingPlan: stringValue(source.openingPlan),
    focusTechnique: stringValue(source.focusTechnique),
    storyTitle: stringValue(source.storyTitle),
    draftText: stringValue(source.draftText),
    draftFrozenText: stringValue(source.draftFrozenText),
    finalText: stringValue(source.finalText),
    previousFinalText: stringValue(source.previousFinalText),
    decisionNote: stringValue(source.decisionNote),
    openingCandidatesRaw: stringValue(source.openingCandidatesRaw),
    feedbackRaw: stringValue(source.feedbackRaw),
    revisionInstruction: stringValue(source.revisionInstruction),
    preserveText: stringValue(source.preserveText),
    customPrompts: normalizeLesson3CustomPrompts(source.customPrompts),
    aiProcess: normalizeLesson3AiProcessMap(source.aiProcess),
    reviewNeeded: normalizeLesson3ReviewNeeded(source.reviewNeeded, empty.reviewNeeded),
    legacyLesson3,
  }

  const observationReady = hasModule1Lesson3Observation(draft)
  const openingReady = hasModule1Lesson3Opening(draft) && !draft.reviewNeeded.opening
  const draftReady = hasModule1Lesson3Draft(draft) && !draft.reviewNeeded.draft
  const finalReady = hasModule1Lesson3Final(draft) && !draft.reviewNeeded.final
  const step1Completed = booleanValue(source.step1Completed) && observationReady
  const step2Completed = step1Completed && booleanValue(source.step2Completed) && openingReady
  const step3Completed = step2Completed && booleanValue(source.step3Completed) && draftReady
  const step4Completed = step3Completed && booleanValue(source.step4Completed) && finalReady
  const completed = step4Completed && booleanValue(source.completed)
  const safeStep = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    ...draft,
    step: safeStep,
    completed,
    completedAt: completed ? stringValue(source.completedAt) || null : null,
    contentVersion: MODULE1_LESSON3_CONTENT_VERSION,
    step1Completed,
    step2Completed,
    step3Completed,
    step4Completed,
  }
}

function normalizeLesson4AiProcess(raw: unknown): Module1Lesson4AiProcess {
  const source = isRecord(raw) ? raw : {}
  return {
    ...normalizeLesson3AiProcess(raw),
    contextKey: stringValue(source.contextKey),
  }
}

function normalizeLesson4CustomPrompts(raw: unknown): Module1Lesson4CustomPrompts {
  return normalizeLesson3CustomPrompts(raw)
}

function normalizeLesson4AiProcessMap(raw: unknown): Module1Lesson4AiProcessMap {
  const source = isRecord(raw) ? raw : {}
  return {
    p1: normalizeLesson4AiProcess(source.p1),
    p2: normalizeLesson4AiProcess(source.p2),
    p3: normalizeLesson4AiProcess(source.p3),
    p4: normalizeLesson4AiProcess(source.p4),
    p5: normalizeLesson4AiProcess(source.p5),
  }
}

function normalizeLesson4ReviewNeeded(
  raw: unknown,
  fallback: Module1Lesson4ReviewNeeded,
): Module1Lesson4ReviewNeeded {
  const source = isRecord(raw) ? raw : {}
  return {
    plan: booleanValue(source.plan, fallback.plan),
    draft: booleanValue(source.draft, fallback.draft),
    final: booleanValue(source.final, fallback.final),
  }
}

function cloneLegacyLesson4(raw: Record<string, unknown>): Record<string, unknown> {
  const archived = { ...raw }
  delete archived.legacyLesson4
  return archived
}

function hasNewLesson4Shape(source: Record<string, unknown>): boolean {
  return numberValue(source.contentVersion, 0) >= MODULE1_LESSON4_CONTENT_VERSION
    || typeof source.observation === "string"
    || typeof source.plotPlan === "string"
    || typeof source.draftText === "string"
    || typeof source.finalText === "string"
    || isRecord(source.aiProcess)
}

function hasLegacyLesson4Content(source: Record<string, unknown>): boolean {
  return Boolean(
    stringValue(source.chengOut)
    || stringValue(source.chengPrompt)
    || stringValue(source.sectionText),
  )
}

function normalizeLesson4State(raw: unknown): Module1Lesson4State {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson4State()
  const alreadyArchived = isRecord(source.legacyLesson4) ? source.legacyLesson4 : null
  const isLegacyRecord = Boolean(alreadyArchived)
    || (!hasNewLesson4Shape(source) && hasLegacyLesson4Content(source))
  const legacyLesson4 = alreadyArchived
    ?? (isLegacyRecord && hasLegacyLesson4Content(source) ? cloneLegacyLesson4(source) : null)

  const draft: Module1Lesson4State = {
    ...empty,
    observation: stringValue(source.observation),
    plotPlan: stringValue(source.plotPlan),
    planReason: stringValue(source.planReason),
    draftText: stringValue(source.draftText),
    draftFrozenText: stringValue(source.draftFrozenText),
    finalText: stringValue(source.finalText),
    previousFinalText: stringValue(source.previousFinalText),
    decisionNote: stringValue(source.decisionNote),
    revisionInstruction: stringValue(source.revisionInstruction),
    preserveText: stringValue(source.preserveText),
    selfCheck: booleanValue(source.selfCheck),
    customPrompts: normalizeLesson4CustomPrompts(source.customPrompts),
    aiProcess: normalizeLesson4AiProcessMap(source.aiProcess),
    reviewNeeded: normalizeLesson4ReviewNeeded(source.reviewNeeded, empty.reviewNeeded),
    legacyLesson4,
  }

  const observationReady = hasModule1Lesson4Observation(draft)
  const planReady = hasModule1Lesson4Plan(draft) && !draft.reviewNeeded.plan
  const draftReady = hasModule1Lesson4Draft(draft) && !draft.reviewNeeded.draft
  const finalReady = hasModule1Lesson4Final(draft) && !draft.reviewNeeded.final
  const step1Completed = booleanValue(source.step1Completed) && observationReady
  const step2Completed = step1Completed && booleanValue(source.step2Completed) && planReady
  const step3Completed = step2Completed && booleanValue(source.step3Completed) && draftReady
  const step4Completed = step3Completed && booleanValue(source.step4Completed) && finalReady
  const completed = step4Completed && booleanValue(source.completed)
  const safeStep = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    ...draft,
    step: safeStep,
    completed,
    completedAt: completed ? stringValue(source.completedAt) || null : null,
    contentVersion: MODULE1_LESSON4_CONTENT_VERSION,
    step1Completed,
    step2Completed,
    step3Completed,
    step4Completed,
  }
}


function normalizeLesson5AiProcess(raw: unknown): Module1Lesson5AiProcess {
  const source = isRecord(raw) ? raw : {}
  const base = createEmptyModule1Lesson5AiProcess()
  return {
    generatedPromptSnapshot: stringValue(source.generatedPromptSnapshot, base.generatedPromptSnapshot),
    copiedPrompt: stringValue(source.copiedPrompt, base.copiedPrompt),
    aiReply: stringValue(source.aiReply, base.aiReply),
    promptEdited: booleanValue(source.promptEdited, base.promptEdited),
    copySucceeded: booleanValue(source.copySucceeded, base.copySucceeded),
    copiedAt: typeof source.copiedAt === "string" ? source.copiedAt : null,
    copyCount: numberValue(source.copyCount, base.copyCount),
    contextKey: stringValue(source.contextKey, base.contextKey),
  }
}

function normalizeLesson5AiProcessMap(raw: unknown): Module1Lesson5AiProcessMap {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson5AiProcessMap()
  return {
    p1: normalizeLesson5AiProcess(source.p1 ?? empty.p1),
    p2: normalizeLesson5AiProcess(source.p2 ?? empty.p2),
    p3: normalizeLesson5AiProcess(source.p3 ?? empty.p3),
    p4: normalizeLesson5AiProcess(source.p4 ?? empty.p4),
    p5: normalizeLesson5AiProcess(source.p5 ?? empty.p5),
  }
}

function normalizeLesson5CustomPrompts(raw: unknown): Module1Lesson5CustomPrompts {
  const source = isRecord(raw) ? raw : {}
  return {
    p1: stringValue(source.p1),
    p2: stringValue(source.p2),
    p3: stringValue(source.p3),
    p4: stringValue(source.p4),
    p5: stringValue(source.p5),
  }
}

function normalizeLesson5ReviewNeeded(
  raw: unknown,
  fallback: Module1Lesson5ReviewNeeded,
): Module1Lesson5ReviewNeeded {
  const source = isRecord(raw) ? raw : {}
  return {
    plan: booleanValue(source.plan, fallback.plan),
    draft: booleanValue(source.draft, fallback.draft),
    final: booleanValue(source.final, fallback.final),
  }
}

function cloneLegacyLesson5(raw: Record<string, unknown>): Record<string, unknown> {
  const archived = { ...raw }
  delete archived.legacyLesson5
  return archived
}

function hasNewLesson5Shape(source: Record<string, unknown>): boolean {
  return numberValue(source.contentVersion, 0) >= MODULE1_LESSON5_CONTENT_VERSION
    || typeof source.observation === "string"
    || typeof source.plotPlan === "string"
    || typeof source.draftText === "string"
    || typeof source.finalText === "string"
    || isRecord(source.aiProcess)
}

function hasLegacyLesson5Content(source: Record<string, unknown>): boolean {
  return Boolean(
    stringValue(source.zhuan)
    || stringValue(source.zhuanOut)
    || stringValue(source.sectionText)
    || stringValue(source.conflictType)
    || stringValue(source.twistType),
  )
}

function normalizeLesson5State(raw: unknown): Module1Lesson5State {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson5State()
  const alreadyArchived = isRecord(source.legacyLesson5) ? source.legacyLesson5 : null
  const isLegacyRecord = Boolean(alreadyArchived)
    || (!hasNewLesson5Shape(source) && hasLegacyLesson5Content(source))
  const legacyLesson5 = alreadyArchived
    ?? (isLegacyRecord && hasLegacyLesson5Content(source) ? cloneLegacyLesson5(source) : null)

  const draft: Module1Lesson5State = {
    ...empty,
    observation: stringValue(source.observation),
    plotPlan: stringValue(source.plotPlan),
    planReason: stringValue(source.planReason),
    draftText: stringValue(source.draftText),
    draftFrozenText: stringValue(source.draftFrozenText),
    finalText: stringValue(source.finalText),
    previousFinalText: stringValue(source.previousFinalText),
    decisionNote: stringValue(source.decisionNote),
    revisionInstruction: stringValue(source.revisionInstruction),
    preserveText: stringValue(source.preserveText),
    selfCheck: booleanValue(source.selfCheck),
    customPrompts: normalizeLesson5CustomPrompts(source.customPrompts),
    aiProcess: normalizeLesson5AiProcessMap(source.aiProcess),
    reviewNeeded: normalizeLesson5ReviewNeeded(source.reviewNeeded, empty.reviewNeeded),
    legacyLesson5,
  }

  const observationReady = hasModule1Lesson5Observation(draft)
  const planReady = hasModule1Lesson5Plan(draft) && !draft.reviewNeeded.plan
  const draftReady = hasModule1Lesson5Draft(draft) && !draft.reviewNeeded.draft
  const finalReady = hasModule1Lesson5Final(draft) && !draft.reviewNeeded.final
  const step1Completed = booleanValue(source.step1Completed) && observationReady
  const step2Completed = step1Completed && booleanValue(source.step2Completed) && planReady
  const step3Completed = step2Completed && booleanValue(source.step3Completed) && draftReady
  const step4Completed = step3Completed && booleanValue(source.step4Completed) && finalReady
  const completed = step4Completed && booleanValue(source.completed)
  const safeStep = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    ...draft,
    step: safeStep,
    completed,
    completedAt: completed ? stringValue(source.completedAt) || null : null,
    contentVersion: MODULE1_LESSON5_CONTENT_VERSION,
    step1Completed,
    step2Completed,
    step3Completed,
    step4Completed,
  }
}

function normalizeLesson6AiProcess(raw: unknown): Module1Lesson6AiProcess {
  const source = isRecord(raw) ? raw : {}
  const base = createEmptyModule1Lesson6AiProcess()
  return {
    generatedPromptSnapshot: stringValue(source.generatedPromptSnapshot, base.generatedPromptSnapshot),
    copiedPrompt: stringValue(source.copiedPrompt, base.copiedPrompt),
    aiReply: stringValue(source.aiReply, base.aiReply),
    promptEdited: booleanValue(source.promptEdited, base.promptEdited),
    copySucceeded: booleanValue(source.copySucceeded, base.copySucceeded),
    copiedAt: typeof source.copiedAt === "string" ? source.copiedAt : null,
    copyCount: numberValue(source.copyCount, base.copyCount),
    contextKey: stringValue(source.contextKey, base.contextKey),
  }
}

function normalizeLesson6AiProcessMap(raw: unknown): Module1Lesson6AiProcessMap {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson6AiProcessMap()
  return {
    p1: normalizeLesson6AiProcess(source.p1 ?? empty.p1),
    p2: normalizeLesson6AiProcess(source.p2 ?? empty.p2),
    p3: normalizeLesson6AiProcess(source.p3 ?? empty.p3),
    p4: normalizeLesson6AiProcess(source.p4 ?? empty.p4),
    p5: normalizeLesson6AiProcess(source.p5 ?? empty.p5),
  }
}

function normalizeLesson6CustomPrompts(raw: unknown): Module1Lesson6CustomPrompts {
  const source = isRecord(raw) ? raw : {}
  return {
    p1: stringValue(source.p1),
    p2: stringValue(source.p2),
    p3: stringValue(source.p3),
    p4: stringValue(source.p4),
    p5: stringValue(source.p5),
  }
}

function normalizeLesson6ReviewNeeded(
  raw: unknown,
  fallback: Module1Lesson6ReviewNeeded,
): Module1Lesson6ReviewNeeded {
  const source = isRecord(raw) ? raw : {}
  return {
    plan: booleanValue(source.plan, fallback.plan),
    draft: booleanValue(source.draft, fallback.draft),
    final: booleanValue(source.final, fallback.final),
  }
}

function normalizeLesson6ConfirmedEdition(raw: unknown): Module1Lesson6ConfirmedEdition | null {
  if (!isRecord(raw)) return null
  const edition: Module1Lesson6ConfirmedEdition = {
    confirmedAt: stringValue(raw.confirmedAt),
    storyTitle: stringValue(raw.storyTitle),
    openingText: stringValue(raw.openingText),
    developmentText: stringValue(raw.developmentText),
    turnText: stringValue(raw.turnText),
    endingText: stringValue(raw.endingText),
  }
  return isModule1Lesson6EditionResolvable(edition) ? edition : null
}

function cloneLegacyLesson6(raw: Record<string, unknown>): Record<string, unknown> {
  const archived = { ...raw }
  delete archived.legacyLesson6
  return archived
}

function hasNewLesson6Shape(source: Record<string, unknown>): boolean {
  return numberValue(source.contentVersion, 0) >= MODULE1_LESSON6_CONTENT_VERSION
    || typeof source.observation === "string"
    || typeof source.plotPlan === "string"
    || typeof source.draftText === "string"
    || typeof source.finalText === "string"
    || isRecord(source.aiProcess)
}

function hasLegacyLesson6Content(source: Record<string, unknown>): boolean {
  return Boolean(
    stringValue(source.he)
    || stringValue(source.heOut)
    || stringValue(source.customEnding)
    || stringValue(source.sectionText),
  )
}

function normalizeLesson6State(raw: unknown): Module1Lesson6State {
  const source = isRecord(raw) ? raw : {}
  const empty = createEmptyModule1Lesson6State()
  const alreadyArchived = isRecord(source.legacyLesson6) ? source.legacyLesson6 : null
  const isLegacyRecord = Boolean(alreadyArchived)
    || (!hasNewLesson6Shape(source) && hasLegacyLesson6Content(source))
  const legacyLesson6 = alreadyArchived
    ?? (isLegacyRecord && hasLegacyLesson6Content(source) ? cloneLegacyLesson6(source) : null)
  const endingRaw = stringValue(source.endingType)
  const confirmedEdition = normalizeLesson6ConfirmedEdition(source.confirmedEdition)

  const draft: Module1Lesson6State = {
    ...empty,
    observation: stringValue(source.observation),
    endingType: isModule1Lesson6EndingType(endingRaw) ? endingRaw : "",
    customEndingRequirement: stringValue(source.customEndingRequirement),
    plotPlan: stringValue(source.plotPlan),
    planReason: stringValue(source.planReason),
    draftText: stringValue(source.draftText),
    draftFrozenText: stringValue(source.draftFrozenText),
    finalText: stringValue(source.finalText),
    previousFinalText: stringValue(source.previousFinalText),
    decisionNote: stringValue(source.decisionNote),
    revisionInstruction: stringValue(source.revisionInstruction),
    preserveText: stringValue(source.preserveText),
    selfCheck: booleanValue(source.selfCheck),
    previewSeenKey: stringValue(source.previewSeenKey),
    confirmedEdition,
    customPrompts: normalizeLesson6CustomPrompts(source.customPrompts),
    aiProcess: normalizeLesson6AiProcessMap(source.aiProcess),
    reviewNeeded: normalizeLesson6ReviewNeeded(source.reviewNeeded, empty.reviewNeeded),
    legacyLesson6,
  }

  const observationReady = hasModule1Lesson6Observation(draft)
  const planReady = hasModule1Lesson6Plan(draft) && !draft.reviewNeeded.plan
  const draftReady = hasModule1Lesson6Draft(draft) && !draft.reviewNeeded.draft
  const finalReady = hasModule1Lesson6Final(draft) && !draft.reviewNeeded.final
  let step1Completed = booleanValue(source.step1Completed) && observationReady
  let step2Completed = step1Completed && booleanValue(source.step2Completed) && planReady
  let step3Completed = step2Completed && booleanValue(source.step3Completed) && draftReady
  let step4Completed = step3Completed && booleanValue(source.step4Completed) && finalReady
  // 已有可解析的作品确认版本时，保留历史完成，避免改工作稿后把「我的小说」重新锁死。
  const historical = booleanValue(source.completed) && isModule1Lesson6EditionResolvable(confirmedEdition)
  if (historical) {
    step1Completed = true
    step2Completed = true
    step3Completed = true
    step4Completed = true
  }
  const completed = historical || (step4Completed && booleanValue(source.completed))
  const safeStep = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    ...draft,
    step: safeStep,
    completed,
    completedAt: completed ? stringValue(source.completedAt) || confirmedEdition?.confirmedAt || null : null,
    contentVersion: MODULE1_LESSON6_CONTENT_VERSION,
    step1Completed,
    step2Completed,
    step3Completed,
    step4Completed,
  }
}

export function normalizeModule1Portfolio(raw: unknown): Module1Portfolio {
  const source = isRecord(raw) ? raw : {}
  const student = isRecord(source.student) ? source.student : {}
  const progress = isRecord(source.progress) ? source.progress : {}
  const lesson1 = isRecord(source.lesson1) ? source.lesson1 : {}
  const fallback = createNewModule1Portfolio()
  const lessonId = numberValue(progress.lessonId, 1)
  const sdg = stringValue(lesson1.sdg)
  const sdgWhy = stringValue(lesson1.sdgWhy)
  const cityIssue = stringValue(lesson1.cityIssue)
  const audience = stringValue(lesson1.audience)
  const audienceConcern = stringValue(lesson1.audienceConcern)
  const step1Completed = booleanValue(lesson1.step1Completed)
  const step2Completed = step1Completed
    && booleanValue(lesson1.step2Completed)
    && Boolean(sdg.trim() && sdgWhy.trim())
  const step3Completed = step2Completed
    && booleanValue(lesson1.step3Completed)
    && Boolean(cityIssue.trim())
  const allLesson1FieldsComplete = [sdg, sdgWhy, cityIssue, audience, audienceConcern]
    .every(value => value.trim().length > 0)
  const step4Completed = step3Completed
    && booleanValue(lesson1.step4Completed)
    && Boolean(audience.trim() && audienceConcern.trim())
    && allLesson1FieldsComplete
  const lesson1Completed = step4Completed && booleanValue(lesson1.completed)
  const safeLesson1Step = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    ...fallback,
    id: stringValue(source.id, fallback.id),
    moduleId: MODULE1_ID,
    appVersion: stringValue(source.appVersion, fallback.appVersion),
    createdAt: stringValue(source.createdAt, fallback.createdAt),
    updatedAt: stringValue(source.updatedAt, fallback.updatedAt),
    student: {
      clazz: stringValue(student.clazz).trim(),
      studentName: stringValue(student.studentName).trim(),
      classSeatCode: stringValue(student.classSeatCode).trim(),
    },
    progress: {
      lessonId: lessonId >= 1 && lessonId <= 6 ? lessonId as Module1LessonId : 1,
      stepId: Math.max(1, numberValue(progress.stepId, 1)),
    },
    lesson1: {
      step: safeLesson1Step,
      completed: lesson1Completed,
      completedAt: lesson1Completed ? stringValue(lesson1.completedAt) || null : null,
      step1Completed,
      step2Completed,
      step3Completed,
      step4Completed,
      sdg,
      sdgWhy,
      cityIssue,
      audience,
      audienceConcern,
    },
    lesson2: normalizeLesson2State(source.lesson2),
    lesson3: normalizeLesson3State(source.lesson3),
    lesson4: normalizeLesson4State(source.lesson4),
    lesson5: normalizeLesson5State(source.lesson5),
    lesson6: normalizeLesson6State(source.lesson6),
  }
}
