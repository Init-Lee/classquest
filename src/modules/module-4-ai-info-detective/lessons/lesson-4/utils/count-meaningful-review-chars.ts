/**
 * 文件说明：模块 4 课时 4 互审文字「有效字数」统计工具。
 * 职责：去掉空白与标点符号后统计字母/数字（含中文）长度，供本地规则审核与回归测试复用。
 * 更新触发：本地审核过短阈值、Unicode 分词规则或与后端 moderation 对齐策略变化时，需要同步更新本文件。
 */

/** 统计去掉空白与标点后的有效文字数（Unicode 字母与数字，含中文）。 */
export function countMeaningfulReviewChars(value: string): number {
  const normalized = value.trim().replace(/\s+/g, " ")
  return normalized.replace(/[^\p{L}\p{N}]+/gu, "").length
}
