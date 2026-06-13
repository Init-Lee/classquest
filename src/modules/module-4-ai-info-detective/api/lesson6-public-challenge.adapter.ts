/**
 * 文件说明：模块 4 课时 6 公共挑战 adapter。
 * 职责：为匿名公共挑战提供 fixture/http 双模式访问，封装 run 创建、当前题读取、答案提交、摘要读取与可识别错误映射。
 * 更新触发：公共挑战 endpoint、VITE_MODULE4_LESSON6_MODE、匿名请求头、fixture 演示数据或错误映射策略变化时，需要同步更新本文件。
 */

import {
  clearActivePublicChallengeRunId,
  ensureAnonSessionId,
  writeActivePublicChallengeRunId,
} from "@/modules/module-4-ai-info-detective/features/public-challenge/public-challenge-storage"
import type {
  PublicChallengeAnswerRequest,
  PublicChallengeAnswerResponse,
  PublicChallengeContext,
  PublicChallengeCurrentQuestion,
  PublicChallengeMaterial,
  PublicChallengeRun,
  PublicChallengeSummary,
  PublicChallengeTask,
} from "./lesson6-types"

const PUBLIC_CHALLENGE_BASE_PATH = "/api/v1/module4/public-challenge"
const PUBLIC_CHALLENGE_FIXTURE_QUESTION_COUNT = 6

export type PublicChallengeMode = "fixture" | "http"
export type PublicChallengeErrorType = "not_ready" | "rate_limited" | "http_error"

export class PublicChallengeHttpError extends Error {
  readonly status: number
  readonly type: PublicChallengeErrorType
  readonly availableCount?: number

  constructor(message: string, status: number, type: PublicChallengeErrorType = "http_error", availableCount?: number) {
    super(message)
    this.name = "PublicChallengeHttpError"
    this.status = status
    this.type = type
    this.availableCount = availableCount
  }
}

interface FixtureQuestion {
  runItemId: string
  orderIndex: number
  kind: "news" | "image"
  material: PublicChallengeMaterial
  task: PublicChallengeTask
  correctOptionKey: string
  explanation: { text: string; summary?: string }
  source: {
    sourceType: string
    sourceRecord: string
    verificationNote: string
  }
}

interface FixtureRunState {
  run: PublicChallengeRun
  answers: Record<string, PublicChallengeAnswerResponse>
}

const fixtureRuns: Record<string, FixtureRunState> = {}

function svgDataUrl(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" rx="28" fill="${color}"/><circle cx="156" cy="132" r="64" fill="#ffffff" opacity="0.65"/><path d="M80 280 C180 172 242 240 326 164 C410 88 494 190 574 116 L574 312 L80 312 Z" fill="#0f172a" opacity="0.18"/><text x="48" y="330" font-family="Arial" font-size="24" fill="#0f172a">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const fixtureQuestionBank: FixtureQuestion[] = [
  {
    runItemId: "fixture-l6-run-item-1",
    orderIndex: 1,
    kind: "news",
    material: {
      titleOrName: "校园科技节新闻摘录",
      displayNote: "阅读新闻摘要，判断内容是否存在 AI 改写痕迹。",
      asset: null,
    },
    task: {
      prompt: "这则新闻语气统一、缺少采访细节，但来源栏目完整。你会如何判断？",
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
    },
    correctOptionKey: "C",
    explanation: { text: "仅凭语气统一不能直接断定 AI 生成，需要继续核对原文、发布时间和采访来源。" },
    source: {
      sourceType: "web",
      sourceRecord: "fixture 校园新闻栏目记录，含发布时间与原文链接占位。",
      verificationNote: "先查原始页面，再比对其他渠道是否转载同一内容。",
    },
  },
  {
    runItemId: "fixture-l6-run-item-2",
    orderIndex: 2,
    kind: "image",
    material: {
      titleOrName: "社团海报图片",
      displayNote: "观察画面文字、手部和背景细节。",
      asset: {
        dataUrl: svgDataUrl("公共挑战图片素材 1", "#dbeafe"),
        mimeType: "image/svg+xml",
        name: "fixture-public-image-1.svg",
        alt: "公共挑战 fixture 图片素材 1",
        title: "社团海报图片",
      },
    },
    task: {
      prompt: "图片中文字边缘反复扭曲，人物手指数量不稳定。你会如何判断？",
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
    },
    correctOptionKey: "A",
    explanation: { text: "文字扭曲和手部结构异常都是常见 AI 图像线索，且多个位置同时出现，支持判断为明显存在 AI 痕迹。" },
    source: {
      sourceType: "fixture",
      sourceRecord: "fixture 图片导出记录，含工具和生成时间占位。",
      verificationNote: "可继续查看原始发布说明，确认是否标注了生成工具。",
    },
  },
  {
    runItemId: "fixture-l6-run-item-3",
    orderIndex: 3,
    kind: "news",
    material: {
      titleOrName: "活动通知新闻",
      displayNote: "关注来源记录、具体人物和现场信息。",
      asset: null,
    },
    task: {
      prompt: "新闻有明确采访对象、现场时间和可追溯链接，措辞也自然。你会如何判断？",
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
    },
    correctOptionKey: "B",
    explanation: { text: "明确来源和现场细节能降低 AI 生成嫌疑；目前没有看到典型 AI 痕迹。" },
    source: {
      sourceType: "web",
      sourceRecord: "fixture 学校官网活动通知页面。",
      verificationNote: "检查页面发布时间和署名是否与活动时间一致。",
    },
  },
  {
    runItemId: "fixture-l6-run-item-4",
    orderIndex: 4,
    kind: "image",
    material: {
      titleOrName: "操场合影图片",
      displayNote: "观察人物边缘、光影方向与背景重复。",
      asset: {
        dataUrl: svgDataUrl("公共挑战图片素材 2", "#fef3c7"),
        mimeType: "image/svg+xml",
        name: "fixture-public-image-2.svg",
        alt: "公共挑战 fixture 图片素材 2",
        title: "操场合影图片",
      },
    },
    task: {
      prompt: "图片分辨率较低，但人物边缘、光影和背景都比较一致。你会如何判断？",
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
    },
    correctOptionKey: "B",
    explanation: { text: "低分辨率本身不是 AI 痕迹；当前可见细节较一致，暂未看到明显 AI 生成线索。" },
    source: {
      sourceType: "local_record",
      sourceRecord: "fixture 班级活动相册记录。",
      verificationNote: "核对相册上下文和拍摄者说明，可进一步确认真实性。",
    },
  },
  {
    runItemId: "fixture-l6-run-item-5",
    orderIndex: 5,
    kind: "news",
    material: {
      titleOrName: "网络热点新闻片段",
      displayNote: "重点核查标题、来源和交叉证据。",
      asset: null,
    },
    task: {
      prompt: "标题夸张、来源只写“网友爆料”，正文没有原始链接。你会如何判断？",
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
    },
    correctOptionKey: "C",
    explanation: { text: "缺少来源会降低可信度，但不能直接等同于 AI 生成；应先补充原始链接和交叉证据。" },
    source: {
      sourceType: "web",
      sourceRecord: "fixture 热点网页截图摘要。",
      verificationNote: "使用关键词查找首发来源，确认是否有权威媒体或官方信息。",
    },
  },
  {
    runItemId: "fixture-l6-run-item-6",
    orderIndex: 6,
    kind: "image",
    material: {
      titleOrName: "建筑外观图片",
      displayNote: "观察窗户纹理、透视和重复结构。",
      asset: {
        dataUrl: svgDataUrl("公共挑战图片素材 3", "#dcfce7"),
        mimeType: "image/svg+xml",
        name: "fixture-public-image-3.svg",
        alt: "公共挑战 fixture 图片素材 3",
        title: "建筑外观图片",
      },
    },
    task: {
      prompt: "建筑窗户排列出现不规则重复，招牌文字局部无法辨认。你会如何判断？",
      options: [
        { key: "A", label: "明显存在 AI 痕迹" },
        { key: "B", label: "暂无明显 AI 痕迹" },
        { key: "C", label: "证据不足，仍需核验" },
      ],
    },
    correctOptionKey: "A",
    explanation: { text: "重复结构异常和文字不可读同时出现，是较强的 AI 图像生成线索。" },
    source: {
      sourceType: "fixture",
      sourceRecord: "fixture 图片生成记录。",
      verificationNote: "如要公开使用，应补充生成工具说明或替换为可核验真实图片。",
    },
  },
]

const fixtureQuestions = fixtureQuestionBank.slice(0, PUBLIC_CHALLENGE_FIXTURE_QUESTION_COUNT)

export function resolvePublicChallengeMode(): PublicChallengeMode {
  return import.meta.env.VITE_MODULE4_LESSON6_MODE === "http" ? "http" : "fixture"
}

function resolveEndpoint(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return `${base}${PUBLIC_CHALLENGE_BASE_PATH}${path}`
}

function mapPublicChallengeError(status: number): string {
  if (status === 400) return "公共挑战请求内容不完整，请刷新后重试。"
  if (status === 404) return "没有找到当前公共挑战，请重新开始一轮。"
  if (status === 409) return "公共题库暂时不足 6 题，请稍后再试。"
  if (status === 422) return "公共挑战字段格式不符合要求，请刷新后重试。"
  if (status === 429) return "公共挑战创建过于频繁，请稍后再试。"
  return "公共挑战服务暂时不可用，请稍后再试。"
}

async function fetchJson<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
  const response = await fetch(resolveEndpoint(path), init)
  if (!response.ok) {
    let detail = ""
    let error = ""
    let availableCount: number | undefined
    try {
      const body = await response.json() as {
        error?: string
        message?: string
        availableCount?: number
        detail?: string | Array<{ msg?: string }>
      }
      error = typeof body.error === "string" ? body.error : ""
      availableCount = typeof body.availableCount === "number" ? body.availableCount : undefined
      if (typeof body.message === "string" && body.message.trim()) {
        detail = body.message.trim()
      } else if (typeof body.detail === "string" && body.detail.trim()) {
        detail = body.detail.trim()
      }
    } catch {
      // 忽略非 JSON 错误体，回退到状态码映射文案。
    }

    if (response.status === 409 && error === "public_bank_not_ready") {
      throw new PublicChallengeHttpError(detail || mapPublicChallengeError(response.status), response.status, "not_ready", availableCount)
    }
    if (response.status === 429) {
      throw new PublicChallengeHttpError(detail || mapPublicChallengeError(response.status), response.status, "rate_limited")
    }
    throw new PublicChallengeHttpError(detail || mapPublicChallengeError(response.status), response.status)
  }
  return await response.json() as TResponse
}

function fixtureRunId(): string {
  return `fixture-l6run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function fixtureCreateRun(context: PublicChallengeContext): PublicChallengeRun {
  const run: PublicChallengeRun = {
    runId: fixtureRunId(),
    context,
    questionCount: fixtureQuestions.length,
    startedAt: new Date().toISOString(),
  }
  fixtureRuns[run.runId] = { run, answers: {} }
  writeActivePublicChallengeRunId(context, run.runId)
  return run
}

function fixtureCurrent(runId: string): PublicChallengeCurrentQuestion {
  const state = fixtureRuns[runId]
  if (!state) {
    throw new PublicChallengeHttpError("fixture 未找到当前公共挑战，请重新开始一轮。", 404)
  }
  const answeredCount = Object.keys(state.answers).length
  const question = fixtureQuestions.find(item => !state.answers[item.runItemId])
  if (!question) {
    return {
      runId,
      questionCount: state.run.questionCount,
      answeredCount,
      completed: true,
      material: {},
      task: {},
    }
  }
  return {
    runId,
    runItemId: question.runItemId,
    orderIndex: question.orderIndex,
    questionCount: state.run.questionCount,
    answeredCount,
    completed: false,
    kind: question.kind,
    material: question.material,
    task: question.task,
  }
}

function fixtureSubmitAnswer(runId: string, payload: PublicChallengeAnswerRequest): PublicChallengeAnswerResponse {
  const state = fixtureRuns[runId]
  if (!state) {
    throw new PublicChallengeHttpError("fixture 未找到当前公共挑战，请重新开始一轮。", 404)
  }
  const existing = state.answers[payload.runItemId]
  if (existing) return existing
  const question = fixtureQuestions.find(item => item.runItemId === payload.runItemId)
  if (!question) {
    throw new PublicChallengeHttpError("fixture 未找到当前题目，请刷新后重试。", 404)
  }
  const selectedOptionKey = payload.selectedOptionKey.trim()
  const legalKeys = new Set((question.task.options ?? []).map(option => option.key).filter(Boolean))
  if (!selectedOptionKey || !legalKeys.has(selectedOptionKey)) {
    throw new PublicChallengeHttpError("请选择题目中的有效选项后再提交。", 400)
  }
  const answeredCount = Object.keys(state.answers).length + 1
  const hasNext = answeredCount < state.run.questionCount
  const response: PublicChallengeAnswerResponse = {
    isCorrect: selectedOptionKey === question.correctOptionKey,
    correctOptionKey: question.correctOptionKey,
    explanation: question.explanation,
    source: question.source,
    progress: {
      answeredCount,
      questionCount: state.run.questionCount,
    },
    next: {
      hasNext,
      nextOrderIndex: hasNext ? answeredCount + 1 : null,
    },
  }
  state.answers[payload.runItemId] = response
  if (!hasNext) clearActivePublicChallengeRunId()
  return response
}

function fixtureSummary(runId: string): PublicChallengeSummary {
  const state = fixtureRuns[runId]
  if (!state) {
    throw new PublicChallengeHttpError("fixture 未找到当前公共挑战，请重新开始一轮。", 404)
  }
  const answeredCount = Object.keys(state.answers).length
  const completed = answeredCount >= state.run.questionCount
  return {
    runId,
    completed,
    questionCount: state.run.questionCount,
    answeredCount,
    context: state.run.context,
    completedAt: completed ? new Date().toISOString() : null,
  }
}

async function createRun(context: PublicChallengeContext): Promise<PublicChallengeRun> {
  if (resolvePublicChallengeMode() === "fixture") return fixtureCreateRun(context)
  const run = await fetchJson<PublicChallengeRun>("/runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-classquest-anon-session": ensureAnonSessionId(),
    },
    body: JSON.stringify({ context }),
  })
  writeActivePublicChallengeRunId(context, run.runId)
  return run
}

async function getCurrent(runId: string): Promise<PublicChallengeCurrentQuestion> {
  if (resolvePublicChallengeMode() === "fixture") return fixtureCurrent(runId)
  return fetchJson<PublicChallengeCurrentQuestion>(`/runs/${encodeURIComponent(runId)}/current`, {
    method: "GET",
    headers: {
      "x-classquest-anon-session": ensureAnonSessionId(),
    },
  })
}

async function submitAnswer(runId: string, payload: PublicChallengeAnswerRequest): Promise<PublicChallengeAnswerResponse> {
  if (resolvePublicChallengeMode() === "fixture") return fixtureSubmitAnswer(runId, payload)
  return fetchJson<PublicChallengeAnswerResponse>(`/runs/${encodeURIComponent(runId)}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-classquest-anon-session": ensureAnonSessionId(),
    },
    body: JSON.stringify(payload),
  })
}

async function getSummary(runId: string): Promise<PublicChallengeSummary> {
  if (resolvePublicChallengeMode() === "fixture") return fixtureSummary(runId)
  return fetchJson<PublicChallengeSummary>(`/runs/${encodeURIComponent(runId)}/summary`, {
    method: "GET",
    headers: {
      "x-classquest-anon-session": ensureAnonSessionId(),
    },
  })
}

export const publicChallengeAdapter = {
  createRun,
  getCurrent,
  submitAnswer,
  getSummary,
}
