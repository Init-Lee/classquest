/**
 * 文件说明：模块 4 课时 6 学生端 adapter。
 * 职责：为课时 6 学生端提供 fixture/http 双模式的 V3 发布状态查询，封装 my-v3-publication-status 端点与错误文案。
 * 更新触发：课时 6 学生端 endpoint、VITE_MODULE4_LESSON6_MODE、发布状态 DTO 或 fixture 演示数据变化时，需要同步更新本文件。
 */

import type {
  Lesson6PublicationStatusItem,
  Lesson6PublicationStatusQueryItem,
  Lesson6PublicationStatusResponse,
  Lesson6PublicationStatusRequest,
} from "./lesson6-types"

const LESSON6_STUDENT_BASE_PATH = "/api/v1/module4/lesson6"

export type Lesson6StudentMode = "fixture" | "http"

export class Lesson6StudentHttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "Lesson6StudentHttpError"
    this.status = status
  }
}

export function resolveLesson6StudentMode(): Lesson6StudentMode {
  return import.meta.env.VITE_MODULE4_LESSON6_MODE === "http" ? "http" : "fixture"
}

function resolveEndpoint(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return `${base}${LESSON6_STUDENT_BASE_PATH}${path}`
}

function mapLesson6StudentError(status: number): string {
  if (status === 400) return "发布状态请求内容不完整，请刷新后重试。"
  if (status === 422) return "发布状态字段格式不符合要求，请检查本地 V3 记录。"
  return "课时 6 发布状态服务暂时不可用，请稍后再试。"
}

async function fetchJson<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
  const response = await fetch(resolveEndpoint(path), init)
  if (!response.ok) {
    let detail = ""
    try {
      const body = await response.json() as { message?: string; detail?: string | Array<{ msg?: string }> }
      if (typeof body.message === "string" && body.message.trim()) {
        detail = body.message.trim()
      } else if (typeof body.detail === "string" && body.detail.trim()) {
        detail = body.detail.trim()
      }
    } catch {
      // 忽略非 JSON 错误体，回退到状态码映射文案。
    }
    throw new Lesson6StudentHttpError(detail || mapLesson6StudentError(response.status), response.status)
  }
  return await response.json() as TResponse
}

function fixturePublicationStatus(items: Lesson6PublicationStatusQueryItem[]): Lesson6PublicationStatusResponse {
  const now = new Date().toISOString()
  const responseItems: Lesson6PublicationStatusItem[] = items.map((item, index) => {
    const status = index % 2 === 0 ? "pending_teacher_check" : "publishable"
    return {
      ...item,
      status,
      label: status === "publishable" ? "已确认可发布" : "等待教师确认",
      checkedAt: status === "publishable" ? now : "",
    }
  })
  return {
    items: responseItems,
    syncedAt: now,
  }
}

export async function fetchLesson6PublicationStatus(
  items: Lesson6PublicationStatusQueryItem[],
): Promise<Lesson6PublicationStatusResponse> {
  if (resolveLesson6StudentMode() === "fixture") return fixturePublicationStatus(items)
  const payload: Lesson6PublicationStatusRequest = { items }
  return fetchJson<Lesson6PublicationStatusResponse>("/my-v3-publication-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}
