/**
 * 文件说明：模块 4 课时 4 互审文字 AI 审核 adapter。
 * 职责：分卡提交审查前调用后端 moderate-text 或本地 mock 规则，返回按 fieldKey 分组的不通过原因。
 * 更新触发：moderate-text endpoint、fieldKey 契约、环境变量、错误映射或分字段响应结构变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  collectLesson4ReviewCardModerationTexts,
  type Lesson4ReviewFieldKey,
  type Lesson4ReviewModerationCardKey,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import {
  moderateLesson4ReviewFieldsLocally,
  sanitizeLesson4RemoteModerationReasons,
  type Lesson4ReviewModerationByField,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local"
import { isModule4TeacherModeActive } from "@/modules/module-4-ai-info-detective/utils/module4-teacher-mode-flag"

const LESSON4_MODERATION_PATH = "/api/v1/module4/lesson4/review-requests/moderate-text"

export class Lesson4ReviewModerationHttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "Lesson4ReviewModerationHttpError"
    this.status = status
  }
}

export interface Lesson4ReviewCardModerationResult {
  pass: boolean
  byField: Lesson4ReviewModerationByField
  /** 后端未配置 AI 或 HTTP 失败时为 true，前端展示提示并阻断提交。 */
  unavailable?: boolean
  /** 网络/502/504 等不可达时为 true，Step1 应同步 offline 横幅。 */
  offline?: boolean
  unavailableMessage?: string
}

function isLesson4PeerReviewHttpEnabled(): boolean {
  return String(import.meta.env.VITE_MODULE4_LESSON4_PEER_REVIEW_MODE ?? "").trim() === "http"
}

/**
 * HTTP 互审模式 = peer review http 或 moderation http 显式开启；
 * 仅当 moderation=local|mock 且 peer review 非 http 时允许纯本地。
 */
function shouldUseHttp(): boolean {
  if (isModule4TeacherModeActive()) return false
  const mode = String(import.meta.env.VITE_MODULE4_LESSON4_REVIEW_MODERATION_MODE ?? "").trim()
  const peerHttp = isLesson4PeerReviewHttpEnabled()
  if (mode === "http") return true
  if (mode === "local" || mode === "mock") return peerHttp
  return peerHttp
}

/** 供 Step1 判断分卡 AI 审核是否必须走后端 HTTP（mock/local 且 peer 非 http 时为 false）。 */
export function isLesson4ReviewModerationHttpEnabled(): boolean {
  return shouldUseHttp()
}

/** @deprecated 使用 isLesson4ReviewModerationHttpEnabled */
export function isLesson4ReviewModerationHttpMode(): boolean {
  return shouldUseHttp()
}

const OFFLINE_HTTP_STATUSES = new Set([502, 503, 504])
const OFFLINE_MODERATION_MESSAGE = "无法连接服务器，请确认后端已启动后再试。"

function isModerationOfflineError(error: unknown): boolean {
  if (error instanceof Lesson4ReviewModerationHttpError) {
    return OFFLINE_HTTP_STATUSES.has(error.status)
  }
  if (error instanceof TypeError) return true
  if (error instanceof DOMException && error.name === "AbortError") return true
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("failed to fetch")
      || message.includes("network")
      || message.includes("load failed")
      || message.includes("econnrefused")
      || message.includes("connection refused")
      || message.includes("proxy error")
      || message.includes("bad gateway")
      || message.includes("service unavailable")
      || message.includes("gateway timeout")
    )
  }
  return false
}

function buildHttpModerationFailure(error: unknown): Lesson4ReviewCardModerationResult {
  if (error instanceof Lesson4ReviewModerationHttpError && error.status === 503) {
    return {
      pass: false,
      byField: {},
      unavailable: true,
      unavailableMessage: error.message || "AI 审核暂不可用，请联系老师检查服务端配置。",
    }
  }
  if (isModerationOfflineError(error)) {
    return {
      pass: false,
      byField: {},
      unavailable: true,
      offline: true,
      unavailableMessage: OFFLINE_MODERATION_MESSAGE,
    }
  }
  return {
    pass: false,
    byField: {},
    unavailable: true,
    unavailableMessage: error instanceof Error ? error.message : "AI 审核失败，请稍后重试。",
  }
}

function resolveModerationEndpoint(): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return base ? `${base}${LESSON4_MODERATION_PATH}` : LESSON4_MODERATION_PATH
}

function mapHttpByField(
  raw: Partial<Record<string, { pass: boolean, reasons: string[] }>>,
): Lesson4ReviewModerationByField {
  const byField: Lesson4ReviewModerationByField = {}
  for (const [fieldKey, result] of Object.entries(raw)) {
    if (!result) continue
    byField[fieldKey as Lesson4ReviewFieldKey] = {
      pass: result.pass,
      reasons: result.reasons ?? [],
    }
  }
  return byField
}

function mergeRemoteModerationByField(
  remote: Lesson4ReviewModerationByField,
  contentByFieldKey: Partial<Record<Lesson4ReviewFieldKey, string>>,
): Lesson4ReviewModerationByField {
  const merged: Lesson4ReviewModerationByField = {}
  for (const [fieldKey, remoteResult] of Object.entries(remote)) {
    if (!remoteResult) continue
    const key = fieldKey as Lesson4ReviewFieldKey
    const sanitized = sanitizeLesson4RemoteModerationReasons(
      contentByFieldKey[key] ?? "",
      remoteResult.pass,
      remoteResult.reasons ?? [],
      [],
    )
    if (sanitized.pass) {
      merged[key] = { pass: true, reasons: [] }
      continue
    }
    merged[key] = {
      pass: false,
      reasons: sanitized.reasons,
    }
  }
  return merged
}

function logModerationDebug(payload: unknown): void {
  if (!import.meta.env.DEV) return
  console.debug("[lesson4 moderation]", payload)
}

function parseModerationHttpBody(body: unknown): { pass: boolean, byField: Lesson4ReviewModerationByField } {
  if (!body || typeof body !== "object" || !("pass" in body)) {
    throw new Lesson4ReviewModerationHttpError("AI 审核响应格式无效，请稍后重试。", 502)
  }
  const record = body as {
    pass?: unknown
    byField?: Partial<Record<string, { pass: boolean, reasons: string[] }>>
    byCard?: Partial<Record<Lesson4ReviewModerationCardKey, { pass: boolean, reasons: string[] }>>
  }
  if (typeof record.pass !== "boolean") {
    throw new Lesson4ReviewModerationHttpError("AI 审核响应缺少 pass 字段，请稍后重试。", 502)
  }
  return {
    pass: record.pass,
    byField: mapHttpByField(record.byField ?? {}),
  }
}

async function fetchModerationHttp(texts: ReturnType<typeof collectLesson4ReviewCardModerationTexts>): Promise<{
  pass: boolean
  byField: Lesson4ReviewModerationByField
  unavailable?: boolean
  offline?: boolean
  unavailableMessage?: string
}> {
  const response = await fetch(resolveModerationEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  })
  if (!response.ok) {
    let detail = ""
    try {
      const body = await response.json() as { detail?: string }
      if (typeof body.detail === "string" && body.detail.trim()) {
        detail = body.detail.trim()
      }
    } catch {
      // 忽略非 JSON 错误体。
    }
    if (response.status === 503) {
      return {
        pass: false,
        byField: {},
        unavailable: true,
        unavailableMessage: detail || "AI 审核暂不可用，请联系老师检查服务端配置。",
      }
    }
    if (OFFLINE_HTTP_STATUSES.has(response.status)) {
      return {
        pass: false,
        byField: {},
        unavailable: true,
        offline: true,
        unavailableMessage: OFFLINE_MODERATION_MESSAGE,
      }
    }
    throw new Lesson4ReviewModerationHttpError(
      detail || "AI 审核服务暂时不可用，请稍后再试。",
      response.status,
    )
  }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Lesson4ReviewModerationHttpError("AI 审核响应解析失败，请稍后重试。", 502)
  }
  const parsed = parseModerationHttpBody(body)
  logModerationDebug({ pass: parsed.pass, byField: parsed.byField })
  return parsed
}

/** 后端 schema 要求每条 content 非空；过滤后再送 HTTP。 */
function filterModerationTextsForHttp(
  texts: ReturnType<typeof collectLesson4ReviewCardModerationTexts>,
): ReturnType<typeof collectLesson4ReviewCardModerationTexts> {
  return texts.filter(item => item.content.trim().length > 0)
}

/** 提交本卡审查前审核该题卡文字；HTTP 模式必须成功 moderate-text 才能通过。 */
export async function moderateLesson4ReviewCard(
  reviewJson: Module4Lesson4ReviewJson,
  kind: Module4MaterialKind,
): Promise<Lesson4ReviewCardModerationResult> {
  const texts = collectLesson4ReviewCardModerationTexts(reviewJson, kind)

  if (!shouldUseHttp()) {
    const localResult = moderateLesson4ReviewFieldsLocally(texts)
    logModerationDebug({ source: "local", kind, byField: localResult.byField })
    return { pass: localResult.pass, byField: localResult.byField }
  }

  const httpTexts = filterModerationTextsForHttp(texts)
  if (httpTexts.length === 0) {
    logModerationDebug({ source: "http-skipped-empty", kind, texts })
    return {
      pass: false,
      byField: {},
      unavailable: true,
      unavailableMessage: "未采集到待审核文字，请确认本题卡评价已填写完整。",
    }
  }

  logModerationDebug({ source: "http-request", kind, fieldKeys: httpTexts.map(item => item.fieldKey) })

  try {
    const httpResult = await fetchModerationHttp(httpTexts)
    if (httpResult.unavailable) {
      return {
        pass: false,
        byField: {},
        unavailable: true,
        offline: httpResult.offline,
        unavailableMessage: httpResult.unavailableMessage,
      }
    }
    const contentByFieldKey = Object.fromEntries(
      texts.map(item => [item.fieldKey, item.content]),
    ) as Partial<Record<Lesson4ReviewFieldKey, string>>
    const byField = mergeRemoteModerationByField(httpResult.byField, contentByFieldKey)
    const pass = httpResult.pass
      && Object.values(byField).every(result => result?.pass !== false)
    if (!pass) {
      return { pass: false, byField }
    }
    return { pass: true, byField }
  } catch (error) {
    // HTTP 模式下禁止 fallback 到本地 mock 通过；网络/502 等一律阻断。
    return buildHttpModerationFailure(error)
  }
}

/** @deprecated 旧版整批审核，保留类型导出 */
export interface Lesson4ReviewModerationResult {
  pass: boolean
  byCard: Partial<Record<string, { pass: boolean, reasons: string[] }>>
  unavailable?: boolean
  unavailableMessage?: string
}

/** @deprecated */
export async function moderateLesson4ReviewFeedback(reviewJson: Module4Lesson4ReviewJson): Promise<Lesson4ReviewModerationResult> {
  const kinds: Module4MaterialKind[] = ["news", "image"]
  let byField: Lesson4ReviewModerationByField = {}
  for (const kind of kinds) {
    const result = await moderateLesson4ReviewCard(reviewJson, kind)
    if (result.unavailable) {
      return { pass: false, byCard: {}, unavailable: true, unavailableMessage: result.unavailableMessage }
    }
    byField = { ...byField, ...result.byField }
    if (!result.pass) {
      const byCard: Lesson4ReviewModerationResult["byCard"] = {}
      for (const [key, fieldResult] of Object.entries(result.byField)) {
        const cardKey = key.split(".")[0] as Module4MaterialKind
        if (!fieldResult || fieldResult.pass) continue
        const existing = byCard[cardKey]
        byCard[cardKey] = {
          pass: false,
          reasons: [...(existing?.reasons ?? []), ...fieldResult.reasons],
        }
      }
      return { pass: false, byCard }
    }
  }
  return { pass: true, byCard: {} }
}
