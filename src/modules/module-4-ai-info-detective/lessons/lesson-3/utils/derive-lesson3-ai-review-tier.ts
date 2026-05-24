/**
 * 文件说明：模块 4 课时 3 AI 自检结果分层工具。
 * 职责：把后端/Qwen 返回的 pass、needs_revision、blocked 与检查项等级归一为教学用三层反馈。
 * 更新触发：AI 自检返回 schema、强制修改规则、三层文案或保存门禁策略变化时，需要同步更新本文件。
 */

import type { Module4Lesson3AiReviewResult } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export type Lesson3AiReviewTier = "excellent" | "good" | "blocked" | "not_checked"

export function deriveLesson3AiReviewTier(result?: Module4Lesson3AiReviewResult): Lesson3AiReviewTier {
  if (!result) return "not_checked"

  const errorCount = result.checks.filter(check => check.level === "error").length
  const warningCount = result.checks.filter(check => check.level === "warning").length
  if (result.status === "blocked" || errorCount > 0 || result.missingRequiredFields.length > 0) {
    return "blocked"
  }

  if (result.status === "needs_revision" || warningCount > 0 || result.suggestedEdits.length > 0) {
    return "good"
  }

  return "excellent"
}

export function getLesson3AiReviewTierLabel(tier: Lesson3AiReviewTier): string {
  if (tier === "excellent") return "优秀"
  if (tier === "good") return "基本合格"
  if (tier === "blocked") return "不通过"
  return "未自检"
}
