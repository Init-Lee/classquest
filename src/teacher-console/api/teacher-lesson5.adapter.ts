/**
 * 文件说明：教师控制台课时 5 会话控制适配器。
 * 职责：提供教师建会话、列会话、改设置、锁池、阶段推进、概览读取、试答进度、analytics 与 revision-plans 读取能力；默认使用模拟数据，HTTP 模式对接后端 API。
 * 更新触发：课时 5 会话接口路径、请求/响应字段、progress/analytics/revision-plans 契约、模拟数据状态机或 C3-C7 阶段边界变化时，需要同步更新本文件。
 */

import {
  buildTeacherAuthHeaders,
  buildTeacherJsonHeaders,
  fetchTeacherJson,
  fixtureClassPermissions,
  resolveTeacherConsoleEndpoint,
  resolveTeacherConsoleMode,
  TeacherConsoleHttpError,
} from "@/teacher-console/api/teacher-auth.adapter"
import type {
  CreateLesson5SessionRequest,
  Lesson5ComputeStatsResponse,
  Lesson5FrozenPoolCounts,
  Lesson5ItemStatsDto,
  Lesson5LockPoolResponse,
  Lesson5PhaseChangeRequest,
  Lesson5PhaseChangeResponse,
  Lesson5RevisionPlanItemDto,
  Lesson5RevisionPlansResponse,
  Lesson5Session,
  Lesson5SessionAnalyticsResponse,
  Lesson5SessionListResponse,
  Lesson5SessionOverview,
  Lesson5SessionPhase,
  Lesson5SessionProgressParticipant,
  Lesson5SessionProgressResponse,
  Lesson5SessionRunType,
  Lesson5StatsStatus,
  TeacherClassPermissionItem,
  TeacherLesson5Adapter,
  TeacherLoginAccount,
  UpdateLesson5SessionSettingsRequest,
} from "@/teacher-console/types"

const TEACHER_LESSON5_BASE_PATH = "/api/v1/teacher/module4/lesson5"
const allowedQuestionCounts = [6, 8, 10] as const
const fixturePrefix = "fixture_teacher_console_"
const fixturePhaseOrder: Lesson5SessionPhase[] = [
  "draft",
  "pool_locked",
  "trial_open",
  "trial_locked",
  "analytics_open",
  "revision_open",
  "closed",
]

let fixtureSessionCounter = 1
const fixtureNow = Date.now()

function resolveFixturePhase(): Lesson5SessionPhase {
  const phase = String(import.meta.env.VITE_MODULE4_LESSON5_FIXTURE_PHASE ?? "").trim()
  return fixturePhaseOrder.includes(phase as Lesson5SessionPhase) ? phase as Lesson5SessionPhase : "pool_locked"
}

function buildFixtureTimestamp(hoursAgo: number) {
  return new Date(fixtureNow - hoursAgo * 60 * 60 * 1000).toISOString()
}

function buildFixtureSession(
  seed: {
    classId: string
    className: string
    title: string
    runType: Lesson5SessionRunType
    phase: Lesson5SessionPhase
    questionCount: number
    hoursAgo: number
  },
): Lesson5Session {
  const createdAt = buildFixtureTimestamp(seed.hoursAgo + 2)
  const updatedAt = buildFixtureTimestamp(seed.hoursAgo)
  const phaseIndex = fixturePhaseOrder.indexOf(seed.phase)
  return {
    sessionId: `fixture_l5s_seed_${seed.classId}_${seed.phase}`,
    classId: seed.classId,
    className: seed.className,
    title: seed.title,
    runType: seed.runType,
    phase: seed.phase,
    settings: buildSettings(seed.questionCount),
    createdAt,
    updatedAt,
    poolLockedAt: phaseIndex >= fixturePhaseOrder.indexOf("pool_locked") ? updatedAt : null,
    trialOpenedAt: phaseIndex >= fixturePhaseOrder.indexOf("trial_open") ? updatedAt : null,
    trialLockedAt: phaseIndex >= fixturePhaseOrder.indexOf("trial_locked") ? updatedAt : null,
    analyticsOpenedAt: phaseIndex >= fixturePhaseOrder.indexOf("analytics_open") ? updatedAt : null,
    revisionOpenedAt: phaseIndex >= fixturePhaseOrder.indexOf("revision_open") ? updatedAt : null,
    closedAt: phaseIndex >= fixturePhaseOrder.indexOf("closed") ? updatedAt : null,
  }
}

let fixtureSessions: Lesson5Session[] = [
  buildFixtureSession({
    classId: "g7c01",
    className: "七年级 1 班",
    title: "七年级 1 班 课时5 常规试答",
    runType: "normal",
    phase: resolveFixturePhase(),
    questionCount: 8,
    hoursAgo: 3,
  }),
  buildFixtureSession({
    classId: "g7c02",
    className: "七年级 2 班",
    title: "七年级 2 班 课时5 草稿准备",
    runType: "makeup",
    phase: "draft",
    questionCount: 6,
    hoursAgo: 8,
  }),
  buildFixtureSession({
    classId: "g7c03",
    className: "七年级 3 班",
    title: "七年级 3 班 课时5 测试演练",
    runType: "test",
    phase: "trial_open",
    questionCount: 10,
    hoursAgo: 20,
  }),
]

function parseFixtureAccount(token: string): TeacherLoginAccount | null {
  if (!token.startsWith(fixturePrefix)) return null
  const account = token.slice(fixturePrefix.length)
  return account in fixtureClassPermissions ? account as TeacherLoginAccount : null
}

function listFixturePermissions(token: string): TeacherClassPermissionItem[] {
  const account = parseFixtureAccount(token)
  if (!account) {
    throw new TeacherConsoleHttpError("登录状态已失效，请重新登录。", 401)
  }
  if (account === "xnwy-demo") {
    return Array.from({ length: 12 }, (_, index) => {
      const number = index + 1
      return {
        classId: `g7c${String(number).padStart(2, "0")}`,
        className: `七年级 ${number} 班`,
        permission: "view",
      }
    })
  }
  return fixtureClassPermissions[account]
}

function requireFixtureManage(token: string, classId: string): TeacherClassPermissionItem {
  const permission = listFixturePermissions(token).find(item => item.classId === classId)
  if (!permission || permission.permission !== "manage") {
    throw new TeacherConsoleHttpError("当前账号没有管理该班级会话的权限。", 403)
  }
  return permission
}

function requireFixtureView(token: string, classId: string): TeacherClassPermissionItem {
  const permission = listFixturePermissions(token).find(item => item.classId === classId)
  if (!permission) {
    throw new TeacherConsoleHttpError("当前账号没有查看该班级会话的权限。", 403)
  }
  return permission
}

function buildSettings(questionCount: number) {
  const imageCount = Math.floor(questionCount / 2)
  return {
    questionCount,
    newsCount: questionCount - imageCount,
    imageCount,
  }
}

function assertQuestionCount(questionCount: number): void {
  if (!allowedQuestionCounts.some(item => item === questionCount)) {
    throw new TeacherConsoleHttpError("题量只能选择 6、8 或 10。", 400)
  }
}

function assertRunType(runType: Lesson5SessionRunType): void {
  if (!["normal", "makeup", "test"].includes(runType)) {
    throw new TeacherConsoleHttpError("会话类型无效。", 400)
  }
}

function findFixtureSession(sessionId: string): Lesson5Session {
  const session = fixtureSessions.find(item => item.sessionId === sessionId)
  if (!session) {
    throw new TeacherConsoleHttpError("没有找到对应的课时 5 会话。", 404)
  }
  return session
}

function touchSession(session: Lesson5Session, patch: Partial<Lesson5Session>): Lesson5Session {
  const next = {
    ...session,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  fixtureSessions = fixtureSessions.map(item => item.sessionId === session.sessionId ? next : item)
  return next
}

function buildFrozenCounts(session: Lesson5Session): Lesson5FrozenPoolCounts {
  return session.phase === "draft"
    ? { news: 0, image: 0, total: 0 }
    : {
        news: session.settings.newsCount,
        image: session.settings.imageCount,
        total: session.settings.questionCount,
      }
}

function readFixtureJson<TValue>(key: string, fallback: TValue): TValue {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as TValue : fallback
  } catch {
    return fallback
  }
}

function writeFixtureJson<TValue>(key: string, value: TValue): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function fixtureAnalyticsKey(sessionId: string): string {
  return `classquest:module4:lesson5:fixture-analytics:${sessionId}`
}

function collectFixtureAnswersByKind(sessionId: string, kind: "news" | "image") {
  if (typeof window === "undefined") return []
  const answers: Array<{ isCorrect?: boolean; itemId?: string }> = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith(`classquest:module4:lesson5:fixture-runtime:${sessionId}:`)) continue
    const runtime = readFixtureJson<{
      answers?: Record<string, { isCorrect?: boolean; itemId?: string }>
    }>(key, {})
    answers.push(...Object.values(runtime.answers ?? {}).filter(answer => answer.itemId?.includes(`-${kind}-`)))
  }
  return answers
}

function buildStatsStatus(validAnswerCount: number): Lesson5StatsStatus {
  if (validAnswerCount >= 8) return "stable"
  if (validAnswerCount >= 3) return "preliminary"
  return "insufficient"
}

function buildFixtureAnalytics(session: Lesson5Session): Lesson5SessionAnalyticsResponse {
  const computedAt = new Date().toISOString()
  const items: Lesson5ItemStatsDto[] = Array.from({ length: session.settings.questionCount }, (_, index) => {
    const kind = index % 2 === 0 ? "news" : "image"
    const answers = collectFixtureAnswersByKind(session.sessionId, kind)
    const fallbackCount = Math.max(2, Math.min(9, index + (kind === "news" ? 3 : 2)))
    const validAnswerCount = Math.max(answers.length, fallbackCount)
    const fallbackCorrect = kind === "news" ? Math.max(1, validAnswerCount - 1) : Math.max(1, validAnswerCount - 2)
    const correctCount = answers.length > 0
      ? answers.filter(answer => answer.isCorrect === true).length
      : fallbackCorrect
    const issueFlagRate = kind === "news" ? 0.16 : 0.31
    return {
      itemId: `fixture-analytics-${session.sessionId}-${kind}-${index + 1}`,
      itemVersionId: `fixture-analytics-${session.sessionId}-${kind}-${index + 1}-v2`,
      itemShortName: kind === "news" ? `新闻素材 ${Math.floor(index / 2) + 1}` : `图片素材 ${Math.floor(index / 2) + 1}`,
      kind,
      validAnswerCount,
      correctCount,
      correctRate: Number((correctCount / validAnswerCount).toFixed(4)),
      avgClarity: kind === "news" ? 2.4 : 1.9,
      avgThinkingValue: kind === "news" ? 2.2 : 2.1,
      avgExplanationHelpfulness: kind === "news" ? 2.3 : 1.8,
      issueFlagCount: Math.round(validAnswerCount * issueFlagRate),
      issueFlagRate,
      issueFlags: kind === "news" ? ["source_insufficient"] : ["explanation_unclear", "material_mismatch"],
      sampleComments: kind === "news"
        ? ["来源记录能帮助判断，建议题干进一步突出核验线索。"]
        : ["图片细节题有讨论价值，解析需要补足关键证据。"],
      statsStatus: buildStatsStatus(validAnswerCount),
      computedAt,
    }
  })
  const average = (values: number[]) => values.length > 0 ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4)) : null
  return {
    sessionId: session.sessionId,
    phase: session.phase,
    settings: session.settings,
    items,
    summary: {
      itemCount: items.length,
      validAnswerCount: items.reduce((sum, item) => sum + item.validAnswerCount, 0),
      averageCorrectRate: average(items.map(item => item.correctRate)),
      averageIssueFlagRate: average(items.map(item => item.issueFlagRate)),
      statsStatusBreakdown: {
        insufficient: items.filter(item => item.statsStatus === "insufficient").length,
        preliminary: items.filter(item => item.statsStatus === "preliminary").length,
        stable: items.filter(item => item.statsStatus === "stable").length,
      },
    },
    generatedAt: computedAt,
  }
}

function buildFixtureProgressFromStudentRuntime(session: Lesson5Session): Lesson5SessionProgressParticipant[] {
  const participants = readFixtureJson<Record<string, { studentName: string; classSeatCode: string }>>(
    `classquest:module4:lesson5:fixture-participants:${session.sessionId}`,
    {},
  )
  return Object.entries(participants)
    .map(([participantId, participant]) => {
      const runtime = readFixtureJson<{
        answers?: Record<string, unknown>
        ratings?: Record<string, unknown>
      }>(`classquest:module4:lesson5:fixture-runtime:${session.sessionId}:${participantId}`, {})
      const answeredCount = Object.keys(runtime.answers ?? {}).length
      const ratedCount = Object.keys(runtime.ratings ?? {}).length
      return {
        participantId,
        studentName: participant.studentName,
        classSeatCode: participant.classSeatCode,
        answeredCount,
        ratedCount,
        completed: ratedCount >= session.settings.questionCount,
      }
    })
    .sort((a, b) => a.classSeatCode.localeCompare(b.classSeatCode))
}

function buildFixtureFallbackProgress(session: Lesson5Session): Lesson5SessionProgressParticipant[] {
  const active = session.phase !== "draft" && session.phase !== "pool_locked"
  const questionCount = session.settings.questionCount
  return [
    {
      participantId: `${session.sessionId}-fixture-p01`,
      studentName: "fixture 学生甲",
      classSeatCode: "0101",
      answeredCount: active ? Math.min(2, questionCount) : 0,
      ratedCount: active ? Math.min(1, questionCount) : 0,
      completed: false,
    },
    {
      participantId: `${session.sessionId}-fixture-p02`,
      studentName: "fixture 学生乙",
      classSeatCode: "0102",
      answeredCount: active ? questionCount : 0,
      ratedCount: active ? questionCount : 0,
      completed: active,
    },
  ]
}

async function createSessionFixture(token: string, payload: CreateLesson5SessionRequest): Promise<Lesson5Session> {
  const permission = requireFixtureManage(token, payload.classId)
  assertRunType(payload.runType)
  assertQuestionCount(payload.settings.questionCount)
  if (!payload.title.trim()) {
    throw new TeacherConsoleHttpError("请输入会话标题。", 400)
  }

  const now = new Date().toISOString()
  const session: Lesson5Session = {
    sessionId: `fixture_l5s_${String(fixtureSessionCounter++).padStart(3, "0")}`,
    classId: payload.classId,
    className: permission.className,
    title: payload.title.trim(),
    runType: payload.runType,
    phase: "draft",
    settings: buildSettings(payload.settings.questionCount),
    createdAt: now,
    updatedAt: now,
    poolLockedAt: null,
    trialOpenedAt: null,
    trialLockedAt: null,
    analyticsOpenedAt: null,
    revisionOpenedAt: null,
    closedAt: null,
  }
  fixtureSessions = [session, ...fixtureSessions]
  return session
}

async function listSessionsFixture(token: string, classId: string): Promise<Lesson5SessionListResponse> {
  requireFixtureView(token, classId)
  return {
    sessions: fixtureSessions
      .filter(item => item.classId === classId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  }
}

async function updateSettingsFixture(
  token: string,
  sessionId: string,
  payload: UpdateLesson5SessionSettingsRequest,
): Promise<Lesson5Session> {
  const session = findFixtureSession(sessionId)
  requireFixtureManage(token, session.classId)
  if (session.phase !== "draft") {
    throw new TeacherConsoleHttpError("锁池后不能再修改会话设置。", 409)
  }
  assertQuestionCount(payload.settings.questionCount)
  return touchSession(session, { settings: buildSettings(payload.settings.questionCount) })
}

async function lockPoolFixture(token: string, sessionId: string): Promise<Lesson5LockPoolResponse> {
  const session = findFixtureSession(sessionId)
  requireFixtureManage(token, session.classId)
  if (session.phase !== "draft") {
    throw new TeacherConsoleHttpError("只有草稿会话可以锁池。", 409)
  }
  const locked = touchSession(session, {
    phase: "pool_locked",
    poolLockedAt: new Date().toISOString(),
  })
  return {
    sessionId: locked.sessionId,
    phase: locked.phase,
    frozen: buildFrozenCounts(locked),
  }
}

async function changePhaseFixture(
  token: string,
  sessionId: string,
  payload: Lesson5PhaseChangeRequest,
): Promise<Lesson5PhaseChangeResponse> {
  const session = findFixtureSession(sessionId)
  requireFixtureManage(token, session.classId)
  if (payload.targetPhase === "pool_locked") {
    throw new TeacherConsoleHttpError("进入题池已锁定阶段必须使用锁池按钮。", 409)
  }
  const currentIndex = fixturePhaseOrder.indexOf(session.phase)
  const targetIndex = fixturePhaseOrder.indexOf(payload.targetPhase)
  if (targetIndex !== currentIndex + 1) {
    throw new TeacherConsoleHttpError("阶段只能按顺序推进，不能越级或回退。", 409)
  }
  if (payload.targetPhase === "analytics_open") {
    const analytics = readFixtureJson<Lesson5SessionAnalyticsResponse | null>(fixtureAnalyticsKey(sessionId), null)
    if (!analytics) {
      throw new TeacherConsoleHttpError("请先计算统计，再开放统计反馈。", 409)
    }
  }
  const changedAt = new Date().toISOString()
  touchSession(session, {
    phase: payload.targetPhase,
    trialOpenedAt: payload.targetPhase === "trial_open" ? changedAt : session.trialOpenedAt,
    trialLockedAt: payload.targetPhase === "trial_locked" ? changedAt : session.trialLockedAt,
    analyticsOpenedAt: payload.targetPhase === "analytics_open" ? changedAt : session.analyticsOpenedAt,
    revisionOpenedAt: payload.targetPhase === "revision_open" ? changedAt : session.revisionOpenedAt,
    closedAt: payload.targetPhase === "closed" ? changedAt : session.closedAt,
  })
  return { sessionId, phase: payload.targetPhase, changedAt }
}

async function getOverviewFixture(token: string, sessionId: string): Promise<Lesson5SessionOverview> {
  const session = findFixtureSession(sessionId)
  requireFixtureView(token, session.classId)
  const frozen = buildFrozenCounts(session)
  const missing = Math.max(0, session.settings.questionCount - frozen.total)
  return {
    session,
    frozen,
    classPoolAuthorsSubmitted: frozen.total,
    classPoolAuthorsMissing: missing,
    classPoolItemsCurrentV2: session.settings.questionCount,
    readiness: missing > 0 ? [`还缺 ${missing} 张当前 V2 题卡，C3 不阻塞锁池但建议课前补齐。`] : ["当前会话题量已满足 C3 锁池检查。"],
    generatedAt: new Date().toISOString(),
  }
}

async function fetchSessionProgressFixture(token: string, sessionId: string): Promise<Lesson5SessionProgressResponse> {
  const session = findFixtureSession(sessionId)
  requireFixtureView(token, session.classId)
  const runtimeParticipants = buildFixtureProgressFromStudentRuntime(session)
  const participants = runtimeParticipants.length > 0 ? runtimeParticipants : buildFixtureFallbackProgress(session)
  return {
    sessionId,
    phase: session.phase,
    settings: session.settings,
    participants,
    summary: {
      attachedCount: participants.length,
      answeredCount: participants.reduce((sum, participant) => sum + participant.answeredCount, 0),
      ratedCount: participants.reduce((sum, participant) => sum + participant.ratedCount, 0),
      completedCount: participants.filter(participant => participant.completed).length,
      questionCount: session.settings.questionCount,
    },
    generatedAt: new Date().toISOString(),
  }
}

async function computeStatsFixture(token: string, sessionId: string): Promise<Lesson5ComputeStatsResponse> {
  const session = findFixtureSession(sessionId)
  requireFixtureManage(token, session.classId)
  if (fixturePhaseOrder.indexOf(session.phase) < fixturePhaseOrder.indexOf("trial_locked")) {
    throw new TeacherConsoleHttpError("请先锁定试答，再计算统计。", 409)
  }
  const analytics = buildFixtureAnalytics(session)
  writeFixtureJson(fixtureAnalyticsKey(sessionId), analytics)
  return {
    sessionId,
    computedItemCount: analytics.items.length,
    statsStatusBreakdown: analytics.summary.statsStatusBreakdown,
    computedAt: analytics.generatedAt,
  }
}

async function fetchSessionAnalyticsFixture(token: string, sessionId: string): Promise<Lesson5SessionAnalyticsResponse> {
  const session = findFixtureSession(sessionId)
  requireFixtureView(token, session.classId)
  const existing = readFixtureJson<Lesson5SessionAnalyticsResponse | null>(fixtureAnalyticsKey(sessionId), null)
  if (existing) {
    return {
      ...existing,
      phase: session.phase,
      generatedAt: new Date().toISOString(),
    }
  }
  if (session.phase === "analytics_open") {
    const analytics = buildFixtureAnalytics(session)
    writeFixtureJson(fixtureAnalyticsKey(sessionId), analytics)
    return analytics
  }
  throw new TeacherConsoleHttpError("统计尚未计算，请先点击“计算统计”。", 409)
}

function buildFixtureRevisionPlans(session: Lesson5Session): Lesson5RevisionPlansResponse {
  const participants = readFixtureJson<Record<string, { studentName: string; classSeatCode: string; classId?: string }>>(
    `classquest:module4:lesson5:fixture-participants:${session.sessionId}`,
    {},
  )
  const fallbackParticipants = Object.keys(participants).length > 0
    ? participants
    : {
        [`${session.sessionId}-fixture-p01`]: { studentName: "fixture 学生甲", classSeatCode: "0101", classId: session.classId },
        [`${session.sessionId}-fixture-p02`]: { studentName: "fixture 学生乙", classSeatCode: "0102", classId: session.classId },
      }
  const items: Lesson5RevisionPlanItemDto[] = Object.entries(fallbackParticipants).flatMap(([participantId, participant]) => {
    const classId = participant.classId || session.classId
    const records = readFixtureJson<Record<string, {
      response?: { v3VersionId?: string }
      payload?: {
        itemId?: string
        baseV2VersionId?: string
        revisionPlan?: {
          revisionAction?: Lesson5RevisionPlanItemDto["revisionAction"]
          diagnosis?: Record<string, unknown>
          revisionReason?: string
          expectedEffect?: string
        }
      }
      submittedAt?: string
      updatedAt?: string
    }>>(`classquest:module4:lesson5:fixture-v3:${session.sessionId}:${participantId}`, {})
    return (["news", "image"] as const).map(kind => {
      const record = Object.values(records).find(item =>
        item.payload?.itemId?.includes(`-${kind}`) || item.payload?.baseV2VersionId?.includes(`-${kind}`),
      )
      const plan = record?.payload?.revisionPlan
      return {
        studentSeatCode: participant.classSeatCode,
        studentName: participant.studentName,
        participantId,
        itemId: record?.payload?.itemId ?? `fixture-${classId}-${participant.classSeatCode}-${kind}`,
        cardKind: kind,
        baseV2VersionId: record?.payload?.baseV2VersionId ?? `fixture-${classId}-${participant.classSeatCode}-${kind}-v2`,
        v3VersionId: record?.response?.v3VersionId ?? null,
        revisionAction: plan?.revisionAction ?? null,
        diagnosis: plan?.diagnosis ?? {},
        revisionReason: plan?.revisionReason ?? "",
        expectedEffect: plan?.expectedEffect ?? "",
        status: record ? "submitted" as const : "none" as const,
        submittedAt: record?.submittedAt ?? null,
        updatedAt: record?.updatedAt ?? null,
      }
    })
  }).sort((a, b) => a.studentSeatCode.localeCompare(b.studentSeatCode) || a.cardKind.localeCompare(b.cardKind))
  const readyBySeat = new Map<string, number>()
  items.forEach(item => {
    readyBySeat.set(item.studentSeatCode, (readyBySeat.get(item.studentSeatCode) ?? 0) + (item.status === "submitted" ? 1 : 0))
  })
  return {
    sessionId: session.sessionId,
    phase: session.phase,
    items,
    summary: {
      totalItems: items.length,
      submittedItems: items.filter(item => item.status === "submitted").length,
      readyFullStudents: Array.from(readyBySeat.values()).filter(count => count >= 2).length,
      readyPartialStudents: Array.from(readyBySeat.values()).filter(count => count === 1).length,
      readyNoneStudents: Array.from(readyBySeat.values()).filter(count => count === 0).length,
    },
    generatedAt: new Date().toISOString(),
  }
}

async function fetchRevisionPlansFixture(token: string, sessionId: string): Promise<Lesson5RevisionPlansResponse> {
  const session = findFixtureSession(sessionId)
  requireFixtureView(token, session.classId)
  if (fixturePhaseOrder.indexOf(session.phase) < fixturePhaseOrder.indexOf("analytics_open")) {
    throw new TeacherConsoleHttpError("修订观察尚未开放，请先开放统计反馈。", 409)
  }
  return buildFixtureRevisionPlans(session)
}

async function createSessionHttp(token: string, payload: CreateLesson5SessionRequest): Promise<Lesson5Session> {
  return await fetchTeacherJson<Lesson5Session>(
    resolveTeacherConsoleEndpoint("/sessions", TEACHER_LESSON5_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )
}

async function listSessionsHttp(token: string, classId: string): Promise<Lesson5SessionListResponse> {
  return await fetchTeacherJson<Lesson5SessionListResponse>(
    resolveTeacherConsoleEndpoint(`/sessions?classId=${encodeURIComponent(classId)}`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function updateSettingsHttp(
  token: string,
  sessionId: string,
  payload: UpdateLesson5SessionSettingsRequest,
): Promise<Lesson5Session> {
  return await fetchTeacherJson<Lesson5Session>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/settings`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "PATCH",
      headers: buildTeacherJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )
}

async function lockPoolHttp(token: string, sessionId: string): Promise<Lesson5LockPoolResponse> {
  return await fetchTeacherJson<Lesson5LockPoolResponse>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/lock-pool`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function changePhaseHttp(
  token: string,
  sessionId: string,
  payload: Lesson5PhaseChangeRequest,
): Promise<Lesson5PhaseChangeResponse> {
  return await fetchTeacherJson<Lesson5PhaseChangeResponse>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/phase`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherJsonHeaders(token),
      body: JSON.stringify(payload),
    },
  )
}

async function getOverviewHttp(token: string, sessionId: string): Promise<Lesson5SessionOverview> {
  return await fetchTeacherJson<Lesson5SessionOverview>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/overview`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function fetchSessionProgressHttp(token: string, sessionId: string): Promise<Lesson5SessionProgressResponse> {
  return await fetchTeacherJson<Lesson5SessionProgressResponse>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/progress`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function computeStatsHttp(token: string, sessionId: string): Promise<Lesson5ComputeStatsResponse> {
  return await fetchTeacherJson<Lesson5ComputeStatsResponse>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/compute-stats`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function fetchSessionAnalyticsHttp(token: string, sessionId: string): Promise<Lesson5SessionAnalyticsResponse> {
  return await fetchTeacherJson<Lesson5SessionAnalyticsResponse>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/analytics`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function fetchRevisionPlansHttp(token: string, sessionId: string): Promise<Lesson5RevisionPlansResponse> {
  return await fetchTeacherJson<Lesson5RevisionPlansResponse>(
    resolveTeacherConsoleEndpoint(`/sessions/${encodeURIComponent(sessionId)}/revision-plans`, TEACHER_LESSON5_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

export async function fetchLesson5SessionProgress(token: string, sessionId: string): Promise<Lesson5SessionProgressResponse> {
  return resolveTeacherConsoleMode() === "http" ? fetchSessionProgressHttp(token, sessionId) : fetchSessionProgressFixture(token, sessionId)
}

export async function computeLesson5Stats(token: string, sessionId: string): Promise<Lesson5ComputeStatsResponse> {
  return resolveTeacherConsoleMode() === "http" ? computeStatsHttp(token, sessionId) : computeStatsFixture(token, sessionId)
}

export async function fetchLesson5SessionAnalytics(token: string, sessionId: string): Promise<Lesson5SessionAnalyticsResponse> {
  return resolveTeacherConsoleMode() === "http" ? fetchSessionAnalyticsHttp(token, sessionId) : fetchSessionAnalyticsFixture(token, sessionId)
}

export async function fetchLesson5RevisionPlans(token: string, sessionId: string): Promise<Lesson5RevisionPlansResponse> {
  return resolveTeacherConsoleMode() === "http" ? fetchRevisionPlansHttp(token, sessionId) : fetchRevisionPlansFixture(token, sessionId)
}

export async function checkLesson5SessionStatsComputed(token: string, sessionId: string): Promise<boolean> {
  if (resolveTeacherConsoleMode() === "http") {
    try {
      await fetchSessionAnalyticsHttp(token, sessionId)
      return true
    } catch {
      return false
    }
  }
  return readFixtureJson<Lesson5SessionAnalyticsResponse | null>(fixtureAnalyticsKey(sessionId), null) !== null
}

export const teacherLesson5Adapter: TeacherLesson5Adapter = {
  createSession: (token, payload) => resolveTeacherConsoleMode() === "http" ? createSessionHttp(token, payload) : createSessionFixture(token, payload),
  listSessions: (token, classId) => resolveTeacherConsoleMode() === "http" ? listSessionsHttp(token, classId) : listSessionsFixture(token, classId),
  updateSettings: (token, sessionId, payload) => resolveTeacherConsoleMode() === "http" ? updateSettingsHttp(token, sessionId, payload) : updateSettingsFixture(token, sessionId, payload),
  lockPool: (token, sessionId) => resolveTeacherConsoleMode() === "http" ? lockPoolHttp(token, sessionId) : lockPoolFixture(token, sessionId),
  changePhase: (token, sessionId, payload) => resolveTeacherConsoleMode() === "http" ? changePhaseHttp(token, sessionId, payload) : changePhaseFixture(token, sessionId, payload),
  getOverview: (token, sessionId) => resolveTeacherConsoleMode() === "http" ? getOverviewHttp(token, sessionId) : getOverviewFixture(token, sessionId),
  fetchSessionProgress: fetchLesson5SessionProgress,
  computeStats: computeLesson5Stats,
  fetchSessionAnalytics: fetchLesson5SessionAnalytics,
  fetchRevisionPlans: fetchLesson5RevisionPlans,
  checkSessionStatsComputed: checkLesson5SessionStatsComputed,
}
