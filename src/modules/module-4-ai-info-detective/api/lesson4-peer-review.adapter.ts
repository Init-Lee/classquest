/**
 * 文件说明：模块 4 课时 4 同伴互审 adapter。
 * 职责：为前端 Step1 提供唯一互审 API 调用入口，默认返回轻量 fixture 状态，可通过环境变量切换到真实 HTTP 后端。
 * 更新触发：课时 4 互审 endpoint、请求/响应字段、fixture 展示状态或 HTTP 错误映射变化时，需要同步更新本文件。
 * HTTP 已接通：create、status、cancel、inbox（B4）、claim（B5）、submit（B6）、pull（B7，HTTP 模式）。
 */

import type { Module4Lesson3QuestionCardDraft, Module4Lesson4ReviewJson, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { coerceLesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/api/coerce-lesson4-review-request-json"
import { isModule4TeacherModeActive } from "@/modules/module-4-ai-info-detective/utils/module4-teacher-mode-flag"
import type {
  Lesson4CancelReviewRequestPayload,
  Lesson4ClaimReviewRequestPayload,
  Lesson4ClaimReviewRequestResponse,
  Lesson4CreateReviewRequestPayload,
  Lesson4CreateReviewRequestResponse,
  Lesson4FetchReviewRequestStatusPayload,
  Lesson4FetchReviewRequestStatusResponse,
  Lesson4PullReviewFeedbackPayload,
  Lesson4PullReviewFeedbackResponse,
  Lesson4ReviewerInboxPayload,
  Lesson4ReviewerInboxResponse,
  Lesson4ReviewRequestJson,
  Lesson4SubmitReviewFeedbackPayload,
  Lesson4SubmitReviewFeedbackResponse,
} from "./types"

const LESSON4_PEER_REVIEW_BASE_PATH = "/api/v1/module4/lesson4"

/** HTTP 互审错误，携带状态码供 Step1 区分 409 等边界。 */
export class Lesson4PeerReviewHttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "Lesson4PeerReviewHttpError"
    this.status = status
  }
}

function resolveLesson4PeerReviewEndpoint(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return `${base}${LESSON4_PEER_REVIEW_BASE_PATH}${path}`
}

function shouldUseHttp(): boolean {
  if (isModule4TeacherModeActive()) return false
  return import.meta.env.VITE_MODULE4_LESSON4_PEER_REVIEW_MODE === "http"
}

/** 供 Step1 判断是否应发起真实 HTTP 同步（进页 hydrate、轮询、倒计时到期刷新）。 */
export function isLesson4PeerReviewHttpMode(): boolean {
  return shouldUseHttp()
}

function buildJsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json" }
}

async function fetchJson<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
  const response = await fetch(resolveLesson4PeerReviewEndpoint(path), init)
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
    throw new Lesson4PeerReviewHttpError(detail || mapLesson4PeerReviewError(response.status), response.status)
  }
  return await response.json() as TResponse
}

function mapLesson4PeerReviewError(status: number): string {
  if (status === 400) return "互审请求信息不完整，请检查班学号和审查码。"
  if (status === 403) return "当前学号无权操作这条互审请求。"
  if (status === 404) return "没有找到这条互审请求，请刷新后重试。"
  if (status === 409) return "这条任务已被撤回或已被领取，请刷新任务列表。"
  if (status === 410) return "本次互审已过期，请重新发起。"
  if (status === 422) return "互审反馈还不完整，请补齐两张题卡的试答和建议。"
  return "同伴互审服务暂时不可用，请稍后再试。"
}

function addMinutes(base: Date, minutes: number): string {
  return new Date(base.getTime() + minutes * 60 * 1000).toISOString()
}

function createFixtureCard(kind: Module4MaterialKind): Module4Lesson3QuestionCardDraft {
  const now = "2026-05-28T10:00:00.000Z"
  const isNews = kind === "news"
  return {
    id: `fixture-lesson4-${kind}-v1`,
    kind,
    version: "v1",
    status: "ready_for_lesson4",
    sourceMaterialSnapshot: {
      kind,
      lesson2Completed: true,
      lesson2PostCriteriaStatus: "usable",
      lesson2TitleOrName: isNews ? "校园科技新闻截图" : "AI 生成图片样例",
      lesson2SourceType: isNews ? "web" : "ai_generated",
      lesson2SourceRecord: isNews ? "学校科技栏目网页截图" : "课堂演示 AI 生成记录",
      lesson2ClueNote: isNews ? "标题和正文数据需要核验。" : "背景文字和手部细节需要观察。",
      asset: undefined,
      assetFingerprint: "",
      snappedAt: now,
    },
    material: {
      titleOrName: isNews ? "校园科技新闻截图" : "AI 图片样例",
      displayNote: isNews ? "展示新闻标题、平台与正文片段，供同伴判断是否存在 AI 辅助编写痕迹。" : "展示一张 AI 生成图片，供同伴观察画面细节与来源记录。",
      asset: undefined,
      assetFingerprint: "",
    },
    task: {
      prompt: isNews ? "请判断这则新闻是否存在明显的 AI 生成痕迹。" : "请判断这张图片是否存在明显的 AI 生成痕迹。",
      options: [
        { key: "A", label: "明显存在 AI 痕迹", rationale: "" },
        { key: "B", label: "暂无明显 AI 痕迹", rationale: "" },
        { key: "C", label: "证据不足，仍需核验", rationale: "" },
      ],
      correctOptionKey: isNews ? "C" : "A",
    },
    explanation: {
      text: isNews ? "截图信息不足，需要继续核验发布平台、发布时间和原文内容。" : "画面中存在文字错乱和细节不自然，且来源记录指向 AI 生成工具。",
      editCount: 1,
      updatedAt: now,
    },
    source: {
      sourceType: isNews ? "web" : "ai_generated",
      sourceRecord: isNews ? "学校科技栏目网页截图，保留平台和发布时间线索。" : "课堂演示用 AI 生成图片，保留生成工具和 Prompt 摘要。",
      verificationNote: isNews ? "核对原文链接、发布机构和其他权威报道。" : "核对生成记录、Prompt 摘要或反向搜图结果。",
    },
    selfCheck: {
      materialReady: true,
      taskReady: true,
      answerSelected: true,
      explanationReady: true,
      sourceReady: true,
      verificationReady: true,
      allRequiredPassed: true,
      lastCheckedAt: now,
    },
    aiReview: {
      enabled: true,
      status: "completed",
      lastRequestId: `fixture-${kind}-ai-review`,
      lastReviewedAt: now,
      isStale: false,
      errorMessage: "",
      result: {
        status: "pass",
        summary: "题卡结构完整，可以进入同伴互审。",
        checks: [
          { area: "material", level: "ok", message: "素材展示完整。" },
          { area: "task", level: "ok", message: "判断任务完整。" },
          { area: "explanation", level: "ok", message: "解析有基本依据。" },
          { area: "source", level: "ok", message: "来源记录清楚。" },
        ],
        missingRequiredFields: [],
        suggestedEdits: [],
        safetyFlags: [],
      },
      history: [],
    },
    metrics: {
      materialEditCount: 1,
      taskEditCount: 1,
      explanationEditCount: 1,
      sourceEditCount: 1,
      previewModeSwitchCount: 0,
      aiReviewRequestCount: 1,
    },
    createdAt: now,
    updatedAt: now,
  }
}

function buildFixtureReviewRequestJson(): Lesson4ReviewRequestJson {
  return {
    cards: {
      news: createFixtureCard("news"),
      image: createFixtureCard("image"),
    },
    snapshotMeta: {
      version: "v1",
      snapshotCreatedAt: "2026-05-28T10:00:00.000Z",
    },
  }
}

export const lesson4PeerReviewFixture = {
  serverNow: "2026-05-28T10:02:00.000Z",
  pendingRequestId: "req_fixture_pending",
  claimedRequestId: "req_fixture_claimed",
  inviteCode: "4829",
  reviewJson: {
    cards: {
      news: {
        trialAnswer: "C",
        rubric: {
          material: { level: "pass", reason: "新闻素材清晰，背景完整。" },
          task: { level: "minor_fix", reason: "选项表述略重叠，可再收紧。" },
          explanation: { level: "pass", reason: "解析说明了判断依据。" },
          source: { level: "minor_fix", reason: "来源记录可补充具体栏目。" },
        },
        overallComment: "新闻题卡整体不错，建议把核验入口写得更具体。",
        contentViolation: false,
        contentViolationNote: "",
        approved: true,
      },
      image: {
        trialAnswer: "A",
        rubric: {
          material: { level: "pass", reason: "图片可辨认，与题目相关。" },
          task: { level: "pass", reason: "题干与选项清楚。" },
          explanation: { level: "pass", reason: "解析覆盖了关键线索。" },
          source: { level: "minor_fix", reason: "可补充生成工具名称。" },
        },
        overallComment: "图片题卡清晰，来源说明可再具体一些。",
        contentViolation: false,
        contentViolationNote: "",
        approved: true,
      },
    },
  } satisfies Module4Lesson4ReviewJson,
}

export async function createReviewRequest(payload: Lesson4CreateReviewRequestPayload): Promise<Lesson4CreateReviewRequestResponse> {
  if (shouldUseHttp()) {
    return await fetchJson<Lesson4CreateReviewRequestResponse>("/review-requests", {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
    })
  }
  const serverNow = new Date(lesson4PeerReviewFixture.serverNow)
  return {
    requestId: lesson4PeerReviewFixture.pendingRequestId,
    status: "pending",
    inviteCode: lesson4PeerReviewFixture.inviteCode,
    serverNow: serverNow.toISOString(),
    pendingExpiresAt: addMinutes(serverNow, 6),
  }
}

export async function cancelReviewRequest(payload: Lesson4CancelReviewRequestPayload): Promise<void> {
  if (!shouldUseHttp()) return
  await fetchJson<unknown>(`/review-requests/${encodeURIComponent(payload.requestId)}/cancel`, {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({ authorSeatCode: payload.authorSeatCode }),
  })
}

export async function fetchReviewerInbox(payload: Lesson4ReviewerInboxPayload): Promise<Lesson4ReviewerInboxResponse> {
  if (shouldUseHttp()) {
    const params = new URLSearchParams({
      classId: payload.classId,
      reviewerSeatCode: payload.reviewerSeatCode,
    })
    return await fetchJson<Lesson4ReviewerInboxResponse>(`/review-requests/inbox?${params.toString()}`, {
      method: "GET",
    })
  }
  const serverNow = new Date(lesson4PeerReviewFixture.serverNow)
  if (isModule4TeacherModeActive()) {
    return {
      serverNow: serverNow.toISOString(),
      tasks: [{
        requestId: lesson4PeerReviewFixture.pendingRequestId,
        authorSeatCode: "0102",
        status: "pending",
        pendingExpiresAt: addMinutes(serverNow, 6),
      }],
    }
  }
  return {
    serverNow: serverNow.toISOString(),
    tasks: [],
  }
}

export async function claimReviewRequest(payload: Lesson4ClaimReviewRequestPayload): Promise<Lesson4ClaimReviewRequestResponse> {
  if (shouldUseHttp()) {
    const response = await fetchJson<Lesson4ClaimReviewRequestResponse>(`/review-requests/${encodeURIComponent(payload.requestId)}/claim`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({
        reviewerSeatCode: payload.reviewerSeatCode,
        inviteCode: payload.inviteCode,
      }),
    })
    const requestJson = coerceLesson4ReviewRequestJson(response.requestJson)
    return {
      ...response,
      requestJson,
    }
  }
  const serverNow = new Date(lesson4PeerReviewFixture.serverNow)
  return {
    requestId: payload.requestId,
    status: payload.inviteCode === lesson4PeerReviewFixture.inviteCode ? "claimed" : "expired",
    serverNow: serverNow.toISOString(),
    reviewExpiresAt: addMinutes(serverNow, 20),
    requestJson: buildFixtureReviewRequestJson(),
  }
}

export async function submitReviewFeedback(payload: Lesson4SubmitReviewFeedbackPayload): Promise<Lesson4SubmitReviewFeedbackResponse> {
  if (shouldUseHttp()) {
    return await fetchJson<Lesson4SubmitReviewFeedbackResponse>(`/review-requests/${encodeURIComponent(payload.requestId)}/submit`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({
        reviewerSeatCode: payload.reviewerSeatCode,
        reviewJson: payload.reviewJson,
      }),
    })
  }
  return {
    requestId: payload.requestId,
    status: "submitted",
    serverNow: lesson4PeerReviewFixture.serverNow,
    submittedAt: lesson4PeerReviewFixture.serverNow,
  }
}

export async function fetchReviewRequestStatus(payload: Lesson4FetchReviewRequestStatusPayload): Promise<Lesson4FetchReviewRequestStatusResponse> {
  if (shouldUseHttp()) {
    const params = new URLSearchParams({ authorSeatCode: payload.authorSeatCode })
    return await fetchJson<Lesson4FetchReviewRequestStatusResponse>(
      `/review-requests/${encodeURIComponent(payload.requestId)}/status?${params.toString()}`,
      { method: "GET" },
    )
  }
  const serverNow = new Date(lesson4PeerReviewFixture.serverNow)
  return {
    requestId: payload.requestId,
    status: "pending",
    serverNow: serverNow.toISOString(),
    pendingExpiresAt: addMinutes(serverNow, 6),
  }
}

export async function pullReviewFeedback(payload: Lesson4PullReviewFeedbackPayload): Promise<Lesson4PullReviewFeedbackResponse> {
  if (shouldUseHttp()) {
    return await fetchJson<Lesson4PullReviewFeedbackResponse>(`/review-requests/${encodeURIComponent(payload.requestId)}/pull`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ authorSeatCode: payload.authorSeatCode }),
    })
  }
  if (isModule4TeacherModeActive()) {
    return {
      requestId: payload.requestId,
      status: "pulled",
      serverNow: lesson4PeerReviewFixture.serverNow,
      pulledAt: lesson4PeerReviewFixture.serverNow,
      reviewJson: lesson4PeerReviewFixture.reviewJson,
    }
  }
  throw new Error("当前为前端 fixture，不模拟真实反馈回传；请等待后端 HTTP 接入后再拉取。")
}
