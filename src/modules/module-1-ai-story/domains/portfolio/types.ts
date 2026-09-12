/**
 * 文件说明：模块 1 学习档案领域模型。
 * 职责：定义六课时聚合、身份、进度与安全归一化，是模块 1 持久化数据的唯一结构真相。
 * 更新触发：模块 1 课时字段、完成状态、数据版本或归一化规则变化时，需要同步更新本文件。
 */

export const MODULE1_ID = "module-1-ai-story" as const
export const MODULE1_APP_VERSION = "0.1.0"
export const MODULE1_CUSTOM_STYLE_ID = "custom"
export const MODULE1_LESSON2_CONTENT_VERSION = 2
export const MODULE1_STORY_YEAR = "2035"

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

export interface Module1Lesson2Reference {
  origin: Module1Lesson2ReferenceOrigin
  caseId: string
  workTitle: string
  author: string
  location: string
  versionNote: string
  excerpt: string
  sourceNote: string
  sourceConfirmed: boolean
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
  reference: Module1Lesson2Reference
  analysisReply: string
  writingPlan: string
  reasonAiReply: string
  reason: string
  character: Module1Lesson2Character
  characterAiReply: string
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

export type Module1EmptyLessonState = Module1BaseLessonState

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
  lesson3: Module1EmptyLessonState
  lesson4: Module1EmptyLessonState
  lesson5: Module1EmptyLessonState
  lesson6: Module1EmptyLessonState
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

function createEmptyLesson(): Module1EmptyLessonState {
  return { step: 1, completed: false, completedAt: null }
}

export function createEmptyModule1Lesson2Study(): Module1Lesson2Study {
  return { caseId: "", response: "", aiReply: "", aiAssistUsed: false }
}

export function createEmptyModule1Lesson2Reference(): Module1Lesson2Reference {
  return {
    origin: "",
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
    reference: createEmptyModule1Lesson2Reference(),
    analysisReply: "",
    writingPlan: "",
    reasonAiReply: "",
    reason: "",
    character: createEmptyModule1Lesson2Character(),
    characterAiReply: "",
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
  const reference = state.reference
  return Boolean(
    (reference.origin === "classroom" || reference.origin === "external")
    && reference.workTitle.trim()
    && reference.author.trim()
    && reference.location.trim()
    && reference.excerpt.trim()
    && reference.sourceNote.trim()
    && reference.sourceConfirmed,
  )
}

export function hasModule1Lesson2WritingPlan(state: Module1Lesson2State): boolean {
  const [first, second] = parseModule1WritingPlanItems(state.writingPlan)
  return Boolean(first && second)
}

export function hasModule1Lesson2Reason(state: Module1Lesson2State): boolean {
  return Boolean(state.reason.trim())
}

export function hasModule1Lesson2CharacterFields(state: Module1Lesson2State): boolean {
  const character = state.character
  return [character.who, character.want, character.blocked, character.firstAction, character.possibleChange]
    .every(value => value.trim().length > 0)
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
    lesson3: createEmptyLesson(),
    lesson4: createEmptyLesson(),
    lesson5: createEmptyLesson(),
    lesson6: createEmptyLesson(),
  }
}

function normalizeEmptyLesson(raw: unknown): Module1EmptyLessonState {
  const source = isRecord(raw) ? raw : {}
  return {
    step: Math.max(1, numberValue(source.step, 1)),
    completed: booleanValue(source.completed),
    completedAt: source.completedAt === null ? null : stringValue(source.completedAt) || null,
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

function normalizeReference(raw: unknown): Module1Lesson2Reference {
  const source = isRecord(raw) ? raw : {}
  return {
    origin: normalizeReferenceOrigin(source.origin),
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
  const reference = normalizeReference(source.reference)

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

  const draft = syncModule1Lesson2MappedFields({
    ...empty,
    study,
    recommendationReply: stringValue(source.recommendationReply),
    reference,
    analysisReply: stringValue(source.analysisReply),
    writingPlan,
    reasonAiReply: stringValue(source.reasonAiReply),
    reason,
    character,
    characterAiReply: stringValue(source.characterAiReply),
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
  })

  const studyReady = hasModule1Lesson2StudyFields(draft) && !draft.reviewNeeded.study
  const referenceReady = hasModule1Lesson2ReferenceFields(draft)
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
    lesson3: normalizeEmptyLesson(source.lesson3),
    lesson4: normalizeEmptyLesson(source.lesson4),
    lesson5: normalizeEmptyLesson(source.lesson5),
    lesson6: normalizeEmptyLesson(source.lesson6),
  }
}
