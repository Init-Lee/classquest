/**
 * 文件说明：模块 1 学习档案领域模型。
 * 职责：定义六课时聚合、身份、进度与安全归一化，是模块 1 持久化数据的唯一结构真相。
 * 更新触发：模块 1 课时字段、完成状态、数据版本或归一化规则变化时，需要同步更新本文件。
 */

export const MODULE1_ID = "module-1-ai-story" as const
export const MODULE1_APP_VERSION = "0.1.0"
export const MODULE1_CUSTOM_STYLE_ID = "custom"

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

export interface Module1Lesson2State extends Module1BaseLessonState {
  step1Completed: boolean
  step2Completed: boolean
  step3Completed: boolean
  step4Completed: boolean
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

export function createEmptyModule1Lesson2State(): Module1Lesson2State {
  return {
    step: 1,
    completed: false,
    completedAt: null,
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
    step4Completed: false,
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

export function hasSelectedModule1Lesson2Style(state: Module1Lesson2State): boolean {
  if (!state.styleId.trim() || !state.styleName.trim()) return false
  if (state.styleId === MODULE1_CUSTOM_STYLE_ID) {
    return Boolean(state.styleHint.trim() && state.styleExamples.filter(item => item.trim()).length >= 2)
  }
  return true
}

export function hasMeaningfulModule1Lesson2CharacterFields(state: Module1Lesson2State): boolean {
  return [state.protagonistIdentity, state.goal, state.obstacle, state.changeAction]
    .every(value => value.trim().length > 0)
}

export function hasMeaningfulModule1Lesson2Fields(state: Module1Lesson2State): boolean {
  return hasSelectedModule1Lesson2Style(state)
    && Boolean(state.styleWhy.trim())
    && hasMeaningfulModule1Lesson2CharacterFields(state)
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

function normalizeLesson2State(raw: unknown): Module1Lesson2State {
  const source = isRecord(raw) ? raw : {}
  const styleId = stringValue(source.styleId)
  const styleName = stringValue(source.styleName)
  const styleWhy = stringValue(source.styleWhy)
  const styleHint = stringValue(source.styleHint)
  const styleExamples = stringArrayValue(source.styleExamples)
  const protagonistIdentity = stringValue(source.protagonistIdentity)
  const goal = stringValue(source.goal)
  const obstacle = stringValue(source.obstacle)
  const changeAction = stringValue(source.changeAction)
  const selectedStyle = hasSelectedModule1Lesson2Style({
    ...createEmptyModule1Lesson2State(),
    styleId,
    styleName,
    styleHint,
    styleExamples,
  })
  const step1Completed = booleanValue(source.step1Completed)
  const step2Completed = step1Completed && booleanValue(source.step2Completed) && selectedStyle
  const step3Completed = step2Completed && booleanValue(source.step3Completed) && Boolean(styleWhy.trim())
  const allFieldsComplete = selectedStyle
    && Boolean(styleWhy.trim())
    && [protagonistIdentity, goal, obstacle, changeAction].every(value => value.trim().length > 0)
  const step4Completed = step3Completed
    && booleanValue(source.step4Completed)
    && allFieldsComplete
  const completed = step4Completed && booleanValue(source.completed)
  const safeStep = !step1Completed ? 1 : !step2Completed ? 2 : !step3Completed ? 3 : 4

  return {
    step: safeStep,
    completed,
    completedAt: completed ? stringValue(source.completedAt) || null : null,
    step1Completed,
    step2Completed,
    step3Completed,
    step4Completed,
    styleId,
    styleName,
    styleWhy,
    styleHint,
    styleExamples,
    protagonistIdentity,
    goal,
    obstacle,
    changeAction,
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
    appVersion: stringValue(source.appVersion, MODULE1_APP_VERSION),
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
