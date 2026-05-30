/**
 * 文件说明：模块 4 课时 4 送审题卡 JSON coercion 工具。
 * 职责：将 B5 claim HTTP 响应中的 requestJson 规范化为前端可渲染结构，供 adapter 与 Step1 共用。
 * 更新触发：requestJson 契约、题卡字段或 claim 响应结构变化时，需要同步更新本文件。
 */

import type { Module4Lesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewRequestJson } from "./types"

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return undefined
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

/** 将 claim 响应或 portfolio 原始值转为完整 requestJson；无法识别时返回 undefined。 */
export function coerceLesson4ReviewRequestJson(value: unknown): Module4Lesson4ReviewRequestJson | undefined {
  const parsed = parseJsonIfString(value)
  if (!isObjectRecord(parsed)) return undefined

  const cardsRaw = parsed.cards
  if (!isObjectRecord(cardsRaw)) return undefined

  const newsRaw = cardsRaw.news
  const imageRaw = cardsRaw.image
  if (!isObjectRecord(newsRaw) || !isObjectRecord(imageRaw)) return undefined

  const snapshotMetaRaw = isObjectRecord(parsed.snapshotMeta) ? parsed.snapshotMeta : {}

  return {
    cards: {
      news: newsRaw as unknown as Module4Lesson4ReviewRequestJson["cards"]["news"],
      image: imageRaw as unknown as Module4Lesson4ReviewRequestJson["cards"]["image"],
    },
    snapshotMeta: {
      version: "v1",
      snapshotCreatedAt: typeof snapshotMetaRaw.snapshotCreatedAt === "string"
        ? snapshotMetaRaw.snapshotCreatedAt
        : "",
    },
  } satisfies Lesson4ReviewRequestJson
}
