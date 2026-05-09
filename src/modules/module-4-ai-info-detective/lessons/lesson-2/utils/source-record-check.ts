/**
 * 文件说明：模块 4 课时 2 来源记录格式检查工具。
 * 职责：根据来源类型执行轻量字段完整性与格式检查，只判断“来源记录格式通过”，不判断来源真实可信。
 * 更新触发：来源类型、来源记录最低要求、模糊措辞黑名单或通过/失败文案变化时，需要同步更新本文件。
 */

import type { Module4MaterialSourceType } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface SourceRecordCheckResult {
  passed: boolean
  reason: string
}

const VAGUE_SOURCE_PHRASES = [
  "网上看到的",
  "别人发的",
  "朋友发的",
  "群里看到的",
  "朋友圈看到的",
  "不知道",
  "忘记了",
  "随便找的",
  "百度来的",
]

function isVagueSourceRecord(value: string): boolean {
  const normalized = value.trim().replace(/[，。,.！!？?\s]/g, "")
  return VAGUE_SOURCE_PHRASES.some(phrase => normalized === phrase || normalized.includes(phrase))
}

function hasUrlLikeText(value: string): boolean {
  return /^https?:\/\//i.test(value.trim()) || value.includes("www.")
}

export function checkSourceRecord(
  sourceType: Module4MaterialSourceType | undefined,
  sourceRecord: string,
): SourceRecordCheckResult {
  const text = sourceRecord.trim()
  if (!sourceType) return { passed: false, reason: "请选择来源类型。" }
  if (text.length < 6) return { passed: false, reason: "请补充来源记录。" }
  if (isVagueSourceRecord(text)) return { passed: false, reason: "来源记录还太模糊，请补充更具体的链接、平台、生成或采集线索。" }

  if (sourceType === "web") {
    if (hasUrlLikeText(text) || text.length >= 8) {
      return { passed: true, reason: "来源记录格式通过：已填写链接或平台线索。" }
    }
    return { passed: false, reason: "请补充链接、平台名称、栏目或发布时间线索。" }
  }

  if (sourceType === "ai_generated") {
    if (text.length >= 10) {
      return { passed: true, reason: "来源记录格式通过：已说明生成工具、Prompt 摘要或生成记录。" }
    }
    return { passed: false, reason: "请说明生成工具、Prompt 摘要、生成时间或生成记录。" }
  }

  if (sourceType === "field_capture") {
    if (text.length >= 8) {
      return { passed: true, reason: "来源记录格式通过：已说明拍摄时间、地点或采集方式。" }
    }
    return { passed: false, reason: "请补充拍摄时间、地点、采集方式或采集者备注。" }
  }

  if (text.length >= 12) {
    return { passed: true, reason: "来源记录格式通过：已说明原始来源和加工方式。" }
  }
  return { passed: false, reason: "请同时说明原始来源和裁剪、拼接、二次生成等加工方式。" }
}
