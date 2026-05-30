/**
 * 文件说明：模块 4 课时 4 互审文字本地规则审核（mock 模式）及 HTTP AI 理由净化。
 * 职责：仅拦合规问题（过短、重复灌水、不文明词）；正常「请作者改题卡」类互审句应通过；过滤 AI 复述评语的理由。
 * 更新触发：本地规则、后端 moderation 对齐、AI 理由净化策略或分字段返回结构变化时，需要同步更新本文件。
 */

import type {
  Lesson4ReviewFieldKey,
  Lesson4ReviewModerationTextItem,
} from "./collect-lesson4-review-texts"
import { countMeaningfulReviewChars } from "./count-meaningful-review-chars"

export interface Lesson4ReviewModerationFieldResult {
  pass: boolean
  reasons: string[]
}

export type Lesson4ReviewModerationByField = Partial<Record<Lesson4ReviewFieldKey, Lesson4ReviewModerationFieldResult>>

/** @deprecated 分卡整块结果，HTTP 回退时使用 */
export interface Lesson4ReviewModerationCardResult {
  pass: boolean
  reasons: string[]
}

/** @deprecated 保留类型以兼容 adapter HTTP 响应映射 */
export type Lesson4ReviewModerationByCard = Partial<Record<string, Lesson4ReviewModerationCardResult>>

/** 量规原因、违规说明等字段：去掉标点后至少 4 个有效文字。 */
const MIN_MEANINGFUL_CHARS = 4
/** 总体建议仅要求非空，不沿用量规原因的过短阈值。 */
const MIN_OVERALL_COMMENT_CHARS = 1
/** 同一字/短语连续重复达到此次数视为灌水。 */
const MIN_CONSECUTIVE_UNIT_REPEATS = 3
const PROFANITY_HINTS = ["傻逼", "操你", "去死", "滚蛋", "妈的", "他妈"]
/** 与后端 moderation.py 一致：不通过理由须描述评语本身违规，而非继续给作者提修改建议。 */
const COMMENT_VIOLATION_KEYWORDS = [
  "不文明",
  "不当",
  "灌水",
  "重复",
  "敷衍",
  "过短",
  "无意义",
  "违规",
  "暴力",
  "歧视",
  "辱骂",
  "粗俗",
  "违法",
  "为空",
  "空白",
  "实质",
]
const RUBRIC_PREFIX_PATTERN = /^【[^】]{1,24}】/
const RUBRIC_LEVEL_PATTERN = /^【[^】]*·([^】]+)】/

function stripRubricPrefix(content: string): string {
  let stripped = content.trim()
  for (;;) {
    const match = RUBRIC_PREFIX_PATTERN.exec(stripped)
    if (!match) break
    stripped = stripped.slice(match[0].length).trimStart()
  }
  return stripped
}

function normalizeForSimilarity(value: string): string {
  return value.replace(/[\s\W_]+/gu, "").toLowerCase()
}

function reasonEchoesUserContent(content: string, reason: string): boolean {
  const body = stripRubricPrefix(content)
  if (!body.trim() || !reason.trim()) return false
  const normBody = normalizeForSimilarity(body)
  const normReason = normalizeForSimilarity(reason)
  if (!normBody || !normReason) return false
  if (normReason.includes(normBody) || normBody.includes(normReason)) return true
  const shorter = normBody.length <= normReason.length ? normBody : normReason
  const longer = normBody.length > normReason.length ? normBody : normReason
  let matches = 0
  for (let index = 0; index < shorter.length; index += 1) {
    if (shorter[index] === longer[index]) matches += 1
  }
  const ratio = matches / Math.max(shorter.length, 1)
  return ratio >= 0.62
}

function aiReasonsIndicateCommentViolation(reasons: string[]): boolean {
  const joined = reasons.join("")
  return COMMENT_VIOLATION_KEYWORDS.some(keyword => joined.includes(keyword))
}

/**
 * 净化后端 AI 返回的 reasons：丢弃复述用户评语或「让审查者改题卡」类误判理由。
 */
export function sanitizeLesson4RemoteModerationReasons(
  content: string,
  remotePass: boolean,
  remoteReasons: string[],
  localReasons: string[],
): { pass: boolean, reasons: string[] } {
  if (remotePass) return { pass: true, reasons: [] }
  const filtered = remoteReasons
    .map(reason => reason.trim())
    .filter(reason => reason.length > 0 && !reasonEchoesUserContent(content, reason))
  if (localReasons.length > 0) {
    return { pass: false, reasons: filtered }
  }
  if (filtered.length === 0) return { pass: true, reasons: [] }
  if (!aiReasonsIndicateCommentViolation(filtered)) return { pass: true, reasons: [] }
  return { pass: false, reasons: filtered }
}

function normalizeContent(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function compactReviewBody(body: string): string {
  return body.replace(/[^\p{L}\p{N}]+/gu, "")
}

function hasMeaninglessRepetition(body: string): boolean {
  const compact = compactReviewBody(body)
  if (compact.length < MIN_CONSECUTIVE_UNIT_REPEATS) return false
  if (/(.)\1{2,}/u.test(compact)) return true
  const maxUnitLen = Math.floor(compact.length / MIN_CONSECUTIVE_UNIT_REPEATS)
  for (let unitLen = 1; unitLen <= maxUnitLen; unitLen += 1) {
    const unit = compact.slice(0, unitLen)
    const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = new RegExp(`(?:${escaped}){${MIN_CONSECUTIVE_UNIT_REPEATS},}`, "u")
    if (pattern.test(compact)) return true
  }
  return false
}

function hasLowInformationEntropy(body: string): boolean {
  const compact = compactReviewBody(body)
  if (compact.length < 6) return false
  return new Set([...compact]).size <= 2
}

function extractRubricLevel(content: string): string | null {
  const match = RUBRIC_LEVEL_PATTERN.exec(content.trim())
  return match ? match[1].trim() : null
}

function isPassLevelContent(content: string): boolean {
  const level = extractRubricLevel(content)
  if (!level) return false
  const normalized = level.toLowerCase()
  return normalized === "pass" || normalized === "通过"
}

function detectMeaninglessReviewBody(content: string): string | null {
  const body = stripRubricPrefix(content)
  if (!body.trim()) return null
  if (hasMeaninglessRepetition(body) || hasLowInformationEntropy(body)) {
    return isPassLevelContent(content)
      ? "评语无实质内容，通过档位需写明具体肯定理由。"
      : "存在无意义重复或灌水，请改写。"
  }
  if (isPassLevelContent(content) && countMeaningfulReviewChars(body) < MIN_MEANINGFUL_CHARS) {
    return "评语无实质内容，通过档位需写明具体肯定理由。"
  }
  return null
}

function isOverallCommentField(fieldKey: Lesson4ReviewFieldKey): boolean {
  return fieldKey.endsWith(".overallComment")
}

function ruleCheckText(content: string, fieldKey?: Lesson4ReviewFieldKey): string[] {
  const normalized = normalizeContent(content)
  if (!normalized) return ["内容为空，请填写具体评价。"]
  const reasons: string[] = []
  const bodyForLength = stripRubricPrefix(normalized)
  const meaningfulLength = countMeaningfulReviewChars(bodyForLength)
  const minMeaningfulChars = fieldKey && isOverallCommentField(fieldKey)
    ? MIN_OVERALL_COMMENT_CHARS
    : MIN_MEANINGFUL_CHARS
  if (meaningfulLength < minMeaningfulChars) {
    reasons.push(
      fieldKey && isOverallCommentField(fieldKey)
        ? "请填写总体建议。"
        : "评价过短或缺少有效文字，请写清具体理由。",
    )
  }
  const meaninglessReason = detectMeaninglessReviewBody(normalized)
  if (meaninglessReason) {
    reasons.push(meaninglessReason)
  }
  for (const hint of PROFANITY_HINTS) {
    if (normalized.includes(hint)) {
      reasons.push("含有不文明或不当用语，请修改后重试。")
      break
    }
  }
  return reasons
}

export function moderateLesson4ReviewFieldsLocally(texts: Lesson4ReviewModerationTextItem[]): {
  pass: boolean
  byField: Lesson4ReviewModerationByField
} {
  const byField: Lesson4ReviewModerationByField = {}
  for (const item of texts) {
    const reasons = ruleCheckText(item.content, item.fieldKey)
    byField[item.fieldKey] = { pass: reasons.length === 0, reasons }
  }
  const pass = Object.values(byField).every(result => result?.pass)
  return { pass, byField }
}

/** @deprecated 旧版按题卡块审核，保留供联调参考 */
export function moderateLesson4ReviewTextsLocally(texts: Lesson4ReviewModerationTextItem[]): {
  pass: boolean
  byCard: Lesson4ReviewModerationByCard
} {
  const byCard: Lesson4ReviewModerationByCard = {}
  for (const item of texts) {
    const reasons = ruleCheckText(item.content, item.fieldKey)
    const existing = byCard[item.card]
    if (existing) {
      byCard[item.card] = {
        pass: existing.pass && reasons.length === 0,
        reasons: [...existing.reasons, ...reasons],
      }
    } else {
      byCard[item.card] = { pass: reasons.length === 0, reasons }
    }
  }
  const pass = Object.values(byCard).every(result => result?.pass)
  return { pass, byCard }
}
