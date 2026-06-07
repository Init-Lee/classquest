/**
 * 文件说明：模块 4 课时 5 学生端 adapter。
 * 职责：为 lesson5 Step1-Step4 提供 fixture/http 双模式入口，覆盖 V2/V3 提交、active session、participant attach、session state、assignment list、answer、rating、my-report 与 completion-summary。
 * 更新触发：课时 5 学生端 endpoint、错误映射、answer/rating/my-report/V3/completion-summary 契约、fixture 口径或环境变量开关变化时，需要同步更新本文件。
 */

import { isModule4TeacherModeActive } from "@/modules/module-4-ai-info-detective/utils/module4-teacher-mode-flag"
import type {
  Lesson5ActiveSessionResponse,
  Lesson5AnswerSubmitRequest,
  Lesson5AnswerSubmitResponse,
  Lesson5AssignmentListResponse,
  Lesson5AttachParticipantPayload,
  Lesson5AttachParticipantResponse,
  Lesson5DiagnosisHint,
  Lesson5IssueFlag,
  Lesson5MaterialKind,
  Lesson5MyCompletionSummaryResponse,
  Lesson5MyReportItemStatsDto,
  Lesson5MyReportResponse,
  Lesson5RatingSubmitRequest,
  Lesson5RatingSubmitResponse,
  Lesson5ReadyForLesson6,
  Lesson5RevisionPlanItemDto,
  Lesson5SessionStateResponse,
  Lesson5StatsStatus,
  Lesson5V2SubmissionPayload,
  Lesson5V2SubmissionResponse,
  Lesson5V3SubmissionPayload,
  Lesson5V3SubmissionResponse,
} from "./lesson5-types"

const LESSON5_STUDENT_BASE_PATH = "/api/v1/module4/lesson5"

export type Lesson5StudentMode = "fixture" | "http"

export class Lesson5SubmissionHttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "Lesson5SubmissionHttpError"
    this.status = status
  }
}

interface Lesson5FixtureParticipantRecord {
  participantId: string
  classId: string
  studentName: string
  classSeatCode: string
}

interface Lesson5FixtureRuntimeState {
  answers: Record<string, Lesson5AnswerSubmitResponse>
  ratings: Record<string, Lesson5RatingSubmitResponse>
}

interface Lesson5FixtureV3Record {
  response: Lesson5V3SubmissionResponse
  payload: Lesson5V3SubmissionPayload
  submittedAt: string
  updatedAt: string
}

const fixtureIssueFlags: Lesson5IssueFlag[] = [
  "source_insufficient",
  "explanation_unclear",
  "option_confusing",
  "material_mismatch",
  "other",
]

const fixtureImageAssetDataUrls = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23e0f2fe'/%3E%3Ccircle cx='140' cy='110' r='46' fill='%23facc15'/%3E%3Cpath d='M0 280 L150 170 L260 250 L390 130 L640 310 L640 360 L0 360 Z' fill='%230f766e' opacity='0.88'/%3E%3Cpath d='M360 96 C430 62 502 90 536 150 C468 136 416 155 360 96 Z' fill='%23ffffff' opacity='0.75'/%3E%3Ctext x='36' y='330' font-family='Arial' font-size='24' fill='%230f172a'%3Efixture 图片素材 1%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23f8fafc'/%3E%3Crect x='70' y='70' width='500' height='220' rx='24' fill='%23fff7ed' stroke='%23fb923c' stroke-width='8'/%3E%3Ccircle cx='178' cy='180' r='58' fill='%23fdba74'/%3E%3Crect x='270' y='130' width='220' height='28' rx='14' fill='%230f172a' opacity='0.75'/%3E%3Crect x='270' y='182' width='170' height='22' rx='11' fill='%23475569' opacity='0.65'/%3E%3Ctext x='88' y='330' font-family='Arial' font-size='24' fill='%239a3412'%3Efixture 图片素材 2%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23ecfeff'/%3E%3Cpath d='M110 260 C180 120 280 110 330 230 C380 110 500 96 550 260 Z' fill='%238b5cf6' opacity='0.75'/%3E%3Cpath d='M125 250 C220 210 295 205 365 245 C435 285 500 292 570 250' stroke='%230f172a' stroke-width='10' fill='none' opacity='0.45'/%3E%3Ccircle cx='500' cy='86' r='36' fill='%23f472b6'/%3E%3Ctext x='36' y='330' font-family='Arial' font-size='24' fill='%230f172a'%3Efixture 图片素材 3%3C/text%3E%3C/svg%3E",
]

export function resolveLesson5StudentMode(): Lesson5StudentMode {
  if (isModule4TeacherModeActive()) return "fixture"
  return import.meta.env.VITE_MODULE4_LESSON5_MODE === "http" ? "http" : "fixture"
}

function resolveLesson5Endpoint(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return `${base}${LESSON5_STUDENT_BASE_PATH}${path}`
}

function mapLesson5SubmissionError(status: number): string {
  if (status === 400) return "提交包不完整，请回到课时4确认 V2 就绪包后再试。"
  if (status === 404) return "班级不存在，请检查班级和班学号。"
  if (status === 422) return "提交字段格式不符合要求，请刷新后重试。"
  return "课时5题池服务暂时不可用，请稍后再试。"
}

function mapLesson5SessionError(status: number): string {
  if (status === 400) return "课堂连接信息不完整，请检查班级、班学号后重试。"
  if (status === 404) return "当前班级暂时没有可连接的课时5课堂，请稍后再试。"
  if (status === 409) return "课堂身份信息冲突，请确认是否使用了正确的本地学习档案。"
  if (status === 422) return "课堂连接字段格式不符合要求，请刷新后重试。"
  return "课时5课堂连接服务暂时不可用，请稍后再试。"
}

function mapLesson5AnswerError(status: number): string {
  if (status === 400) return "请选择题目中的有效选项后再提交。"
  if (status === 403) return "这道题不属于当前课堂身份，请刷新课堂状态后重试。"
  if (status === 404) return "没有找到这道试答题，请刷新分配列表。"
  if (status === 409) return "当前课堂阶段暂不能提交作答，请确认老师已开放试答。"
  if (status === 422) return "作答字段格式不符合要求，请刷新后重试。"
  return "课时5作答服务暂时不可用，请稍后再试。"
}

function mapLesson5RatingError(status: number): string {
  if (status === 400) return "请确认三项快评均为 1-3 分，问题标记也在列表内。"
  if (status === 403) return "这条作答记录不属于当前课堂身份，请刷新课堂状态后重试。"
  if (status === 404) return "没有找到可评分的作答记录，请先完成作答。"
  if (status === 409) return "当前课堂阶段暂不能提交评分，请确认老师仍在开放试答。"
  if (status === 422) return "评分字段格式不符合要求，请刷新后重试。"
  return "课时5评分服务暂时不可用，请稍后再试。"
}

function mapLesson5ReportError(status: number): string {
  if (status === 403) return "当前课堂身份不能查看这份报告，请刷新课堂连接后重试。"
  if (status === 404) return "没有找到当前课堂报告，请确认已连接课时5课堂。"
  if (status === 409) return "老师尚未开放当前反馈阶段，请等待开放后再刷新。"
  if (status === 422) return "报告查询字段格式不符合要求，请刷新后重试。"
  return "课时5反馈报告暂时不可用，请稍后再试。"
}

function mapLesson5V3Error(status: number): string {
  if (status === 400) return "V3 修订提交内容不完整，请检查修订计划与题卡字段。"
  if (status === 403) return "只能提交本人题卡的 V3 修订，请刷新课堂身份后重试。"
  if (status === 404) return "没有找到对应的 V2 题卡或课堂身份，请刷新后重试。"
  if (status === 409) return "统计反馈尚未开放，或当前 V2 基线已变化，请刷新后再试。"
  if (status === 422) return "V3 修订字段格式不符合要求，请刷新后重试。"
  return "课时5 V3 修订服务暂时不可用，请稍后再试。"
}

function resolveFixturePhase() {
  const phase = String(import.meta.env.VITE_MODULE4_LESSON5_FIXTURE_PHASE ?? "").trim()
  return phase === "trial_open"
    || phase === "trial_locked"
    || phase === "analytics_open"
    || phase === "revision_open"
    || phase === "closed"
    ? phase
    : "pool_locked"
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

function fixtureParticipantsKey(sessionId: string): string {
  return `classquest:module4:lesson5:fixture-participants:${sessionId}`
}

function fixtureRuntimeKey(sessionId: string, participantId: string): string {
  return `classquest:module4:lesson5:fixture-runtime:${sessionId}:${participantId}`
}

function fixtureV3Key(sessionId: string, participantId: string): string {
  return `classquest:module4:lesson5:fixture-v3:${sessionId}:${participantId}`
}

function readFixtureRuntime(sessionId: string, participantId: string): Lesson5FixtureRuntimeState {
  return readFixtureJson<Lesson5FixtureRuntimeState>(fixtureRuntimeKey(sessionId, participantId), {
    answers: {},
    ratings: {},
  })
}

function writeFixtureRuntime(sessionId: string, participantId: string, state: Lesson5FixtureRuntimeState): void {
  writeFixtureJson(fixtureRuntimeKey(sessionId, participantId), state)
}

function readFixtureV3Records(sessionId: string, participantId: string): Record<string, Lesson5FixtureV3Record> {
  return readFixtureJson<Record<string, Lesson5FixtureV3Record>>(fixtureV3Key(sessionId, participantId), {})
}

function writeFixtureV3Records(sessionId: string, participantId: string, records: Record<string, Lesson5FixtureV3Record>): void {
  writeFixtureJson(fixtureV3Key(sessionId, participantId), records)
}

function registerFixtureParticipant(payload: Lesson5AttachParticipantPayload, participantId: string): void {
  const key = fixtureParticipantsKey(payload.sessionId)
  const records = readFixtureJson<Record<string, Lesson5FixtureParticipantRecord>>(key, {})
  records[participantId] = {
    participantId,
    classId: payload.classId,
    studentName: payload.studentName,
    classSeatCode: payload.classSeatCode,
  }
  writeFixtureJson(key, records)
}

function readFixtureParticipant(sessionId: string, participantId: string): Lesson5FixtureParticipantRecord | undefined {
  const records = readFixtureJson<Record<string, Lesson5FixtureParticipantRecord>>(fixtureParticipantsKey(sessionId), {})
  const record = records[participantId]
  if (!record) return undefined
  return {
    ...record,
    classId: record.classId || sessionId.replace(/^fixture-session-/, ""),
  }
}

function buildFixtureReportStatsStatus(validAnswerCount: number): Lesson5StatsStatus {
  if (validAnswerCount >= 8) return "stable"
  if (validAnswerCount >= 3) return "preliminary"
  return "insufficient"
}

function readyForLesson6FromCount(count: number): Lesson5ReadyForLesson6 {
  if (count >= 2) return "full"
  if (count >= 1) return "partial"
  return "none"
}

function collectFixtureAnswersByKind(sessionId: string, kind: Lesson5MaterialKind): Lesson5AnswerSubmitResponse[] {
  if (typeof window === "undefined") return []
  const answers: Lesson5AnswerSubmitResponse[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith(`classquest:module4:lesson5:fixture-runtime:${sessionId}:`)) continue
    const runtime = readFixtureJson<Lesson5FixtureRuntimeState>(key, { answers: {}, ratings: {} })
    answers.push(...Object.values(runtime.answers).filter(answer => answer.itemId.includes(`-${kind}-`)))
  }
  return answers
}

function buildFixtureMyReportItem(
  sessionId: string,
  participant: Lesson5FixtureParticipantRecord,
  kind: Lesson5MaterialKind,
): Lesson5MyReportItemStatsDto {
  const computedAt = new Date().toISOString()
  const answers = collectFixtureAnswersByKind(sessionId, kind)
  const fallbackCount = kind === "news" ? 4 : 2
  const validAnswerCount = Math.max(answers.length, fallbackCount)
  const correctCount = answers.length > 0
    ? answers.filter(answer => answer.isCorrect).length
    : Math.max(1, kind === "news" ? 3 : 1)
  const correctRate = Number((correctCount / validAnswerCount).toFixed(4))
  const issueFlagRate = kind === "news" ? 0.18 : 0.34
  const diagnosisHints: Lesson5DiagnosisHint[] = kind === "news"
    ? ["needs_more_samples"]
    : ["low_clarity", "high_issue_flag_rate"]
  return {
    itemId: `fixture-${participant.classId}-${participant.classSeatCode}-${kind}`,
    itemVersionId: `fixture-${participant.classId}-${participant.classSeatCode}-${kind}-v2`,
    itemShortName: kind === "news" ? "校园新闻素材" : "AI 图片素材",
    kind,
    validAnswerCount,
    correctCount,
    correctRate,
    avgClarity: kind === "news" ? 2.4 : 1.8,
    avgThinkingValue: kind === "news" ? 2.2 : 2,
    avgExplanationHelpfulness: kind === "news" ? 2.3 : 1.9,
    issueFlagCount: Math.round(validAnswerCount * issueFlagRate),
    issueFlagRate,
    issueFlags: kind === "news" ? ["source_insufficient"] : ["explanation_unclear", "material_mismatch"],
    sampleComments: kind === "news"
      ? ["来源线索比较清楚，但题干里可以更明确指出核验路径。"]
      : ["图片细节观察有帮助，解析还可以补充为什么这些细节支持判断。"],
    statsStatus: buildFixtureReportStatsStatus(validAnswerCount),
    computedAt,
    diagnosisHints,
  }
}

function fixtureRevisionPlanItem(
  participant: Lesson5FixtureParticipantRecord,
  kind: Lesson5MaterialKind,
  record?: Lesson5FixtureV3Record,
): Lesson5RevisionPlanItemDto {
  const baseV2VersionId = record?.payload.baseV2VersionId ?? `fixture-${participant.classId}-${participant.classSeatCode}-${kind}-v2`
  const itemId = record?.payload.itemId ?? `fixture-${participant.classId}-${participant.classSeatCode}-${kind}`
  const plan = record?.payload.revisionPlan
  return {
    studentSeatCode: participant.classSeatCode,
    studentName: participant.studentName,
    participantId: participant.participantId,
    itemId,
    cardKind: kind,
    baseV2VersionId,
    v3VersionId: record?.response.v3VersionId ?? null,
    revisionAction: plan?.revisionAction ?? null,
    diagnosis: plan?.diagnosis ? { ...plan.diagnosis } : {},
    revisionReason: plan?.revisionReason ?? "",
    expectedEffect: plan?.expectedEffect ?? "",
    status: record ? "submitted" : "none",
    submittedAt: record?.submittedAt ?? null,
    updatedAt: record?.updatedAt ?? null,
  }
}

function findFixtureSessionIdForParticipant(participantId: string): string {
  if (typeof window === "undefined") return "fixture-session-unknown"
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith("classquest:module4:lesson5:fixture-participants:")) continue
    const records = readFixtureJson<Record<string, Lesson5FixtureParticipantRecord>>(key, {})
    if (records[participantId]) {
      return key.replace("classquest:module4:lesson5:fixture-participants:", "")
    }
  }
  return "fixture-session-unknown"
}

function fixtureAnswerId(assignmentId: string): string {
  return `fixture-answer:${assignmentId}`
}

function fixtureAssignmentIdFromAnswerId(answerId: string): string {
  return answerId.replace(/^fixture-answer:/, "")
}

function buildFixtureReveal(assignmentId: string, selectedOptionKey: string): Lesson5AnswerSubmitResponse {
  const orderMatch = assignmentId.match(/-(\d+)$/)
  const order = orderMatch ? Number(orderMatch[1]) : 1
  const correctOptionKey = order % 3 === 0 ? "C" : order % 2 === 0 ? "B" : "A"
  const cardKind = order % 2 === 0 ? "image" : "news"
  const answeredAt = new Date().toISOString()
  return {
    answerId: fixtureAnswerId(assignmentId),
    assignmentId,
    itemId: `fixture-item-${cardKind}-${order}`,
    itemVersionId: `fixture-item-${cardKind}-${order}-v2`,
    selectedOptionKey,
    correctOptionKey,
    isCorrect: selectedOptionKey === correctOptionKey,
    reveal: {
      explanation: selectedOptionKey === correctOptionKey
        ? "你的判断与示例正解一致。请继续观察解析中提到的证据链。"
        : "本题示例正解不同于你的选择。请重点比较素材细节、题干证据和来源记录。",
      summary: cardKind === "image"
        ? "fixture 摘要：图片细节、来源记录与选项理由已合并到提交后揭示区。"
        : "fixture 摘要：新闻来源、题干证据与选项理由已合并到提交后揭示区。",
      options: [
        { key: "A", label: "明显存在 AI 痕迹", rationale: "选项 A 解答：重点核查是否存在纹理重复、文字错乱、人物肢体异常或来源无法追溯。" },
        { key: "B", label: "暂无明显 AI 痕迹", rationale: "选项 B 解答：需要能说明素材细节自然、来源清楚，并且没有发现典型 AI 生成痕迹。" },
        { key: "C", label: "证据不足，仍需核验", rationale: "选项 C 解答：当画面或新闻本身不能直接判断时，应继续查找原始来源、发布时间和交叉证据。" },
      ],
      source: {
        sourceType: cardKind === "news" ? "web" : "ai_generated",
        sourceRecord: cardKind === "news"
          ? "fixture 校园新闻平台记录，含栏目、发布时间与原文链接占位。"
          : "fixture 图片生成记录，含工具、Prompt 摘要与导出时间占位。",
        verificationNote: "fixture 仅用于本地演示；HTTP 模式会显示后端题卡版本中的来源摘要。",
      },
    },
    answeredAt,
  }
}

async function fetchJson<TResponse>(path: string, init: RequestInit, mapError: (status: number) => string): Promise<TResponse> {
  const response = await fetch(resolveLesson5Endpoint(path), init)
  if (!response.ok) {
    let detail = ""
    try {
      const body = await response.json() as { detail?: string | Array<{ msg?: string }> }
      if (typeof body.detail === "string" && body.detail.trim()) {
        detail = body.detail.trim()
      }
    } catch {
      // 忽略非 JSON 错误体，回退到状态码映射文案。
    }
    throw new Lesson5SubmissionHttpError(detail || mapError(response.status), response.status)
  }
  return await response.json() as TResponse
}

async function submitHttp(payload: Lesson5V2SubmissionPayload): Promise<Lesson5V2SubmissionResponse> {
  return fetchJson<Lesson5V2SubmissionResponse>("/v2-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, mapLesson5SubmissionError)
}

function submitFixture(payload: Lesson5V2SubmissionPayload): Lesson5V2SubmissionResponse {
  const submittedAt = new Date().toISOString()
  const baseId = `${payload.classId}-${payload.classSeatCode}`
  return {
    ok: true,
    classId: payload.classId,
    studentName: payload.studentName,
    classSeatCode: payload.classSeatCode,
    items: {
      news: {
        itemId: `fixture-${baseId}-news`,
        v2VersionId: `fixture-${baseId}-news-v2`,
        status: "submitted_to_trial_pool",
        deduped: false,
      },
      image: {
        itemId: `fixture-${baseId}-image`,
        v2VersionId: `fixture-${baseId}-image-v2`,
        status: "submitted_to_trial_pool",
        deduped: false,
      },
    },
    submittedAt,
  }
}

export async function submitLesson5V2Package(payload: Lesson5V2SubmissionPayload): Promise<Lesson5V2SubmissionResponse> {
  return resolveLesson5StudentMode() === "http" ? submitHttp(payload) : submitFixture(payload)
}

async function submitV3Http(payload: Lesson5V3SubmissionPayload): Promise<Lesson5V3SubmissionResponse> {
  return fetchJson<Lesson5V3SubmissionResponse>("/v3-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, mapLesson5V3Error)
}

function submitV3Fixture(payload: Lesson5V3SubmissionPayload): Lesson5V3SubmissionResponse {
  const phase = resolveFixturePhase()
  if (phase !== "analytics_open" && phase !== "revision_open" && phase !== "closed") {
    throw new Lesson5SubmissionHttpError("fixture 当前未开放统计反馈，请将 VITE_MODULE4_LESSON5_FIXTURE_PHASE 设置为 analytics_open 后重启前端。", 409)
  }
  const participant = readFixtureParticipant(payload.sessionId, payload.participantId)
  if (!participant) {
    throw new Lesson5SubmissionHttpError("fixture 未找到当前课堂身份，请先完成第 2 关连接课堂。", 404)
  }
  const itemOwnerPrefix = `fixture-${participant.classId}-${participant.classSeatCode}-`
  const ownFixtureItem = payload.itemId.startsWith(itemOwnerPrefix) || payload.itemId.startsWith("fixture-item-")
  if (!ownFixtureItem) {
    throw new Lesson5SubmissionHttpError("fixture 只能提交本人题卡的 V3 修订。", 403)
  }
  if (!payload.revisionPlan.revisionReason.trim() || !payload.revisionPlan.expectedEffect.trim()) {
    throw new Lesson5SubmissionHttpError("请填写修订原因和预期效果后再提交。", 400)
  }
  const now = new Date().toISOString()
  const records = readFixtureV3Records(payload.sessionId, payload.participantId)
  const existing = records[payload.itemId]
  const submittedCount = Object.keys(existing ? records : { ...records, [payload.itemId]: true }).length
  const response: Lesson5V3SubmissionResponse = existing?.response ?? {
    ok: true,
    itemId: payload.itemId,
    v3VersionId: `${payload.baseV2VersionId.replace(/-v2$/, "")}-v3`,
    status: "ready_for_lesson6",
    readyForLesson6: readyForLesson6FromCount(submittedCount),
    deduped: false,
  }
  records[payload.itemId] = {
    response: existing ? { ...response, readyForLesson6: readyForLesson6FromCount(submittedCount), deduped: true } : response,
    payload,
    submittedAt: existing?.submittedAt ?? now,
    updatedAt: now,
  }
  writeFixtureV3Records(payload.sessionId, payload.participantId, records)
  return records[payload.itemId].response
}

export async function submitLesson5V3(payload: Lesson5V3SubmissionPayload): Promise<Lesson5V3SubmissionResponse> {
  return resolveLesson5StudentMode() === "http" ? submitV3Http(payload) : submitV3Fixture(payload)
}

async function fetchActiveSessionHttp(classId: string): Promise<Lesson5ActiveSessionResponse | null> {
  try {
    return await fetchJson<Lesson5ActiveSessionResponse>(
      `/active-session?classId=${encodeURIComponent(classId)}`,
      { method: "GET" },
      mapLesson5SessionError,
    )
  } catch (error) {
    if (error instanceof Lesson5SubmissionHttpError && error.status === 404) return null
    throw error
  }
}

function fetchActiveSessionFixture(classId: string): Lesson5ActiveSessionResponse {
  const serverNow = new Date().toISOString()
  const phase = resolveFixturePhase()
  return {
    sessionId: `fixture-session-${classId}`,
    classId,
    className: `fixture ${classId}`,
    title: "课时5 fixture 试答分配",
    runType: "normal",
    phase,
    settings: {
      questionCount: 6,
      newsCount: 3,
      imageCount: 3,
    },
    serverNow,
  }
}

export async function fetchLesson5ActiveSession(classId: string): Promise<Lesson5ActiveSessionResponse | null> {
  return resolveLesson5StudentMode() === "http" ? fetchActiveSessionHttp(classId) : fetchActiveSessionFixture(classId)
}

async function attachParticipantHttp(payload: Lesson5AttachParticipantPayload): Promise<Lesson5AttachParticipantResponse> {
  return fetchJson<Lesson5AttachParticipantResponse>("/participants/attach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, mapLesson5SessionError)
}

function attachParticipantFixture(payload: Lesson5AttachParticipantPayload): Lesson5AttachParticipantResponse {
  const participantId = `fixture-participant-${payload.sessionId}-${payload.classSeatCode}-${payload.lesson5ClientId.slice(-8)}`
  registerFixtureParticipant(payload, participantId)
  return {
    participantId,
    sessionId: payload.sessionId,
    phase: resolveFixturePhase(),
    serverNow: new Date().toISOString(),
  }
}

export async function attachLesson5Participant(payload: Lesson5AttachParticipantPayload): Promise<Lesson5AttachParticipantResponse> {
  return resolveLesson5StudentMode() === "http" ? attachParticipantHttp(payload) : attachParticipantFixture(payload)
}

async function fetchSessionStateHttp(sessionId: string, participantId: string): Promise<Lesson5SessionStateResponse> {
  return fetchJson<Lesson5SessionStateResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/state?participantId=${encodeURIComponent(participantId)}`,
    { method: "GET" },
    mapLesson5SessionError,
  )
}

function fetchSessionStateFixture(sessionId: string, participantId: string): Lesson5SessionStateResponse {
  const runtime = readFixtureRuntime(sessionId, participantId)
  const answeredCount = Object.keys(runtime.answers).length
  const ratedCount = Object.keys(runtime.ratings).length
  return {
    sessionId,
    phase: resolveFixturePhase(),
    settings: {
      questionCount: 6,
      newsCount: 3,
      imageCount: 3,
    },
    participant: {
      participantId,
      answeredCount,
      ratedCount,
      completed: ratedCount >= 6,
    },
    serverNow: new Date().toISOString(),
  }
}

export async function fetchLesson5SessionState(sessionId: string, participantId: string): Promise<Lesson5SessionStateResponse> {
  return resolveLesson5StudentMode() === "http"
    ? fetchSessionStateHttp(sessionId, participantId)
    : fetchSessionStateFixture(sessionId, participantId)
}

async function fetchAssignmentsHttp(sessionId: string, participantId: string): Promise<Lesson5AssignmentListResponse> {
  return fetchJson<Lesson5AssignmentListResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/assignments?participantId=${encodeURIComponent(participantId)}`,
    { method: "GET" },
    mapLesson5SessionError,
  )
}

function fetchAssignmentsFixture(sessionId: string, participantId: string): Lesson5AssignmentListResponse {
  const kinds = ["news", "image", "news", "image", "news", "image"] as const
  return {
    sessionId,
    participantId,
    assignments: kinds.map((cardKind, index) => ({
      assignmentId: `fixture-assignment-${participantId}-${index + 1}`,
      itemId: `fixture-item-${cardKind}-${index + 1}`,
      itemVersionId: `fixture-item-${cardKind}-${index + 1}-v2`,
      cardKind,
      orderIndex: index + 1,
      material: {
        titleOrName: cardKind === "news" ? `校园新闻素材 ${Math.floor(index / 2) + 1}` : `图片素材 ${Math.floor(index / 2) + 1}`,
        displayNote: cardKind === "news" ? "阅读新闻截图摘要，判断是否存在 AI 生成或改写痕迹。" : "观察图片细节和来源记录，判断是否存在 AI 生成痕迹。",
        asset: cardKind === "image"
          ? {
              dataUrl: fixtureImageAssetDataUrls[Math.floor(index / 2) % fixtureImageAssetDataUrls.length],
              mimeType: "image/svg+xml",
              name: `fixture-image-${Math.floor(index / 2) + 1}.svg`,
              alt: `课时5 fixture 图片素材 ${Math.floor(index / 2) + 1}`,
              title: `fixture 图片素材 ${Math.floor(index / 2) + 1}`,
            }
          : null,
      },
      task: {
        prompt: cardKind === "news" ? "请判断这则新闻是否存在明显的 AI 痕迹。" : "请判断这张图片是否存在明显的 AI 痕迹。",
      },
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
      itemShortName: cardKind === "news" ? "新闻题卡" : "图片题卡",
    })),
    serverNow: new Date().toISOString(),
  }
}

export async function fetchLesson5Assignments(sessionId: string, participantId: string): Promise<Lesson5AssignmentListResponse> {
  return resolveLesson5StudentMode() === "http" ? fetchAssignmentsHttp(sessionId, participantId) : fetchAssignmentsFixture(sessionId, participantId)
}

async function submitAnswerHttp(assignmentId: string, payload: Lesson5AnswerSubmitRequest): Promise<Lesson5AnswerSubmitResponse> {
  return fetchJson<Lesson5AnswerSubmitResponse>(
    `/assignments/${encodeURIComponent(assignmentId)}/answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    mapLesson5AnswerError,
  )
}

function submitAnswerFixture(assignmentId: string, payload: Lesson5AnswerSubmitRequest): Lesson5AnswerSubmitResponse {
  if (resolveFixturePhase() !== "trial_open") {
    throw new Lesson5SubmissionHttpError("fixture 当前未开放试答，请将 VITE_MODULE4_LESSON5_FIXTURE_PHASE 设置为 trial_open 后重启前端。", 409)
  }
  const sessionId = findFixtureSessionIdForParticipant(payload.participantId)
  const runtime = readFixtureRuntime(sessionId, payload.participantId)
  const existing = runtime.answers[assignmentId]
  if (existing) return existing
  const selectedOptionKey = payload.selectedOptionKey.trim()
  if (!selectedOptionKey) {
    throw new Lesson5SubmissionHttpError("请选择一个选项后再提交。", 400)
  }
  const response = buildFixtureReveal(assignmentId, selectedOptionKey)
  runtime.answers[assignmentId] = response
  writeFixtureRuntime(sessionId, payload.participantId, runtime)
  return response
}

export async function submitLesson5Answer(assignmentId: string, payload: Lesson5AnswerSubmitRequest): Promise<Lesson5AnswerSubmitResponse> {
  return resolveLesson5StudentMode() === "http" ? submitAnswerHttp(assignmentId, payload) : submitAnswerFixture(assignmentId, payload)
}

async function submitRatingHttp(answerId: string, payload: Lesson5RatingSubmitRequest): Promise<Lesson5RatingSubmitResponse> {
  return fetchJson<Lesson5RatingSubmitResponse>(
    `/answers/${encodeURIComponent(answerId)}/rating`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    mapLesson5RatingError,
  )
}

function submitRatingFixture(answerId: string, payload: Lesson5RatingSubmitRequest): Lesson5RatingSubmitResponse {
  if (resolveFixturePhase() !== "trial_open") {
    throw new Lesson5SubmissionHttpError("fixture 当前未开放试答，请将 VITE_MODULE4_LESSON5_FIXTURE_PHASE 设置为 trial_open 后重启前端。", 409)
  }
  const sessionId = findFixtureSessionIdForParticipant(payload.participantId)
  const runtime = readFixtureRuntime(sessionId, payload.participantId)
  const assignmentId = fixtureAssignmentIdFromAnswerId(answerId)
  if (!runtime.answers[assignmentId]) {
    throw new Lesson5SubmissionHttpError("请先提交本题答案，看到揭示后再评分。", 404)
  }
  const existing = runtime.ratings[answerId]
  if (existing) return existing
  if ([payload.clarity, payload.thinkingValue, payload.explanationHelpfulness].some(score => score < 1 || score > 3)) {
    throw new Lesson5SubmissionHttpError("三项快评只能选择 1、2、3 分。", 400)
  }
  const invalidFlag = payload.issueFlags.find(flag => !fixtureIssueFlags.includes(flag))
  if (invalidFlag) {
    throw new Lesson5SubmissionHttpError(`问题标记无效：${invalidFlag}`, 400)
  }
  const response = {
    ratingId: `fixture-rating:${answerId}`,
    answerId,
    assignmentId,
    ratedAt: new Date().toISOString(),
  }
  runtime.ratings[answerId] = response
  writeFixtureRuntime(sessionId, payload.participantId, runtime)
  return response
}

export async function submitLesson5Rating(answerId: string, payload: Lesson5RatingSubmitRequest): Promise<Lesson5RatingSubmitResponse> {
  return resolveLesson5StudentMode() === "http" ? submitRatingHttp(answerId, payload) : submitRatingFixture(answerId, payload)
}

async function fetchMyReportHttp(
  sessionId: string,
  participantId: string,
  lesson5ClientId: string,
): Promise<Lesson5MyReportResponse> {
  return fetchJson<Lesson5MyReportResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/my-report?participantId=${encodeURIComponent(participantId)}&lesson5ClientId=${encodeURIComponent(lesson5ClientId)}`,
    { method: "GET" },
    mapLesson5ReportError,
  )
}

function fetchMyReportFixture(sessionId: string, participantId: string): Lesson5MyReportResponse {
  const phase = resolveFixturePhase()
  if (phase !== "analytics_open" && phase !== "revision_open" && phase !== "closed") {
    throw new Lesson5SubmissionHttpError("fixture 当前未开放统计反馈，请将 VITE_MODULE4_LESSON5_FIXTURE_PHASE 设置为 analytics_open 后重启前端。", 409)
  }
  const participant = readFixtureParticipant(sessionId, participantId)
  if (!participant) {
    throw new Lesson5SubmissionHttpError("fixture 未找到当前课堂身份，请先完成第 2 关连接课堂。", 404)
  }
  return {
    sessionId,
    participantId,
    items: [
      buildFixtureMyReportItem(sessionId, participant, "news"),
      buildFixtureMyReportItem(sessionId, participant, "image"),
    ],
    generatedAt: new Date().toISOString(),
  }
}

export async function fetchLesson5MyReport(
  sessionId: string,
  participantId: string,
  lesson5ClientId: string,
): Promise<Lesson5MyReportResponse> {
  return resolveLesson5StudentMode() === "http"
    ? fetchMyReportHttp(sessionId, participantId, lesson5ClientId)
    : fetchMyReportFixture(sessionId, participantId)
}

async function fetchMyCompletionSummaryHttp(
  sessionId: string,
  participantId: string,
  lesson5ClientId: string,
): Promise<Lesson5MyCompletionSummaryResponse> {
  return fetchJson<Lesson5MyCompletionSummaryResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/my-completion-summary?participantId=${encodeURIComponent(participantId)}&lesson5ClientId=${encodeURIComponent(lesson5ClientId)}`,
    { method: "GET" },
    mapLesson5ReportError,
  )
}

function fetchMyCompletionSummaryFixture(sessionId: string, participantId: string): Lesson5MyCompletionSummaryResponse {
  const phase = resolveFixturePhase()
  if (phase !== "analytics_open" && phase !== "revision_open" && phase !== "closed") {
    throw new Lesson5SubmissionHttpError("fixture 当前未开放统计反馈，请将 VITE_MODULE4_LESSON5_FIXTURE_PHASE 设置为 analytics_open 后重启前端。", 409)
  }
  const participant = readFixtureParticipant(sessionId, participantId)
  if (!participant) {
    throw new Lesson5SubmissionHttpError("fixture 未找到当前课堂身份，请先完成第 2 关连接课堂。", 404)
  }
  const runtime = readFixtureRuntime(sessionId, participantId)
  const v3Records = readFixtureV3Records(sessionId, participantId)
  const submittedItems = (["news", "image"] as const)
    .map(kind => fixtureRevisionPlanItem(
      participant,
      kind,
      Object.values(v3Records).find(record => record.payload.itemId.includes(`-${kind}`) || record.payload.baseV2VersionId.includes(`-${kind}`)),
    ))
    .filter(item => item.status === "submitted")
  const myItemStats = [
    buildFixtureMyReportItem(sessionId, participant, "news"),
    buildFixtureMyReportItem(sessionId, participant, "image"),
  ]
  return {
    sessionId,
    participantId,
    v2Submit: {
      authorSeatCode: participant.classSeatCode,
      itemCount: myItemStats.length,
      hasNews: true,
      hasImage: true,
    },
    trial: {
      answeredCount: Object.keys(runtime.answers).length,
      ratedCount: Object.keys(runtime.ratings).length,
      completed: Object.keys(runtime.ratings).length >= 6,
    },
    myItemStats,
    revision: {
      readyForLesson6: readyForLesson6FromCount(submittedItems.length),
      submittedCount: submittedItems.length,
      submittedItems,
    },
    quickCheck: {
      t1HasV2Submission: true,
      t2HasTrialStats: true,
      t3HasV3Submission: submittedItems.length > 0,
    },
    generatedAt: new Date().toISOString(),
  }
}

export async function fetchLesson5MyCompletionSummary(
  sessionId: string,
  participantId: string,
  lesson5ClientId: string,
): Promise<Lesson5MyCompletionSummaryResponse> {
  return resolveLesson5StudentMode() === "http"
    ? fetchMyCompletionSummaryHttp(sessionId, participantId, lesson5ClientId)
    : fetchMyCompletionSummaryFixture(sessionId, participantId)
}
