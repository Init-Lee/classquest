/**
 * 文件说明：模块 4 课时 4 反馈决策校验工具。
 * 职责：校验 Step2 作者决策是否满足小修需表态、重改/内容合规必须进入修改的规则。
 * 更新触发：Step2 完成条件、反馈决策动作或小修/重改语义变化时，需要同步更新本文件。
 */

import type { Lesson4FeedbackDecision } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

/** Step2 顶部横幅不展示、改由输入框高亮提示的校验文案 */
export const LESSON4_AUTHOR_PLAN_REQUIRED_MESSAGE = "部分采纳或暂不修改时，请写一句具体说明。"

export interface Lesson4FeedbackDecisionEvaluation {
  valid: boolean
  errors: string[]
  pendingDecisionIds: string[]
}

export function evaluateLesson4FeedbackDecisions(
  decisions: Lesson4FeedbackDecision[],
): Lesson4FeedbackDecisionEvaluation {
  const errors: string[] = []
  const pendingDecisionIds: string[] = []

  decisions.forEach(decision => {
    if (decision.level === "minor_fix") {
      if (decision.action === "must_revise") {
        errors.push("小修建议需要选择采纳、部分采纳或暂不修改。")
        pendingDecisionIds.push(decision.id)
      }
      if (
        (decision.action === "partial_accept" || decision.action === "keep_with_reason")
        && decision.authorPlan.trim().length < 4
      ) {
        errors.push(LESSON4_AUTHOR_PLAN_REQUIRED_MESSAGE)
        pendingDecisionIds.push(decision.id)
      }
      return
    }

    if (decision.action !== "must_revise") {
      errors.push("重改与内容合规反馈必须进入 V2 修改。")
      pendingDecisionIds.push(decision.id)
    }
  })

  return {
    valid: pendingDecisionIds.length === 0,
    errors: Array.from(new Set(errors)),
    pendingDecisionIds: Array.from(new Set(pendingDecisionIds)),
  }
}

