/**
 * 文件说明：模块 4 课时 4 反馈解决状态工具。
 * 职责：在 Step3 修改台中把指定反馈标记为已解决，并同步写入对应 V2 题卡的解决清单。
 * 更新触发：反馈 resolved 字段、V2 revision 结构或 Step3 解决动作语义变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function resolveLesson4FeedbackDecision(
  decisions: Lesson4FeedbackDecision[],
  card: Module4Lesson4V2CardDraft,
  decisionId: string,
  note: string,
): { decisions: Lesson4FeedbackDecision[]; card: Module4Lesson4V2CardDraft } {
  const now = new Date().toISOString()
  const decisionsResolved = new Set(card.revision.decisionIdsResolved)
  decisionsResolved.add(decisionId)
  return {
    decisions: decisions.map(decision => (
      decision.id === decisionId
        ? { ...decision, authorPlan: note.trim() || decision.authorPlan, resolved: true, resolvedAt: now }
        : decision
    )),
    card: {
      ...card,
      revision: {
        ...card.revision,
        decisionIdsResolved: Array.from(decisionsResolved),
      },
      updatedAt: now,
    },
  }
}

/** 确认 V2 题卡前允许撤销「已完成这条修改」，恢复为待改。 */
export function unresolveLesson4FeedbackDecision(
  decisions: Lesson4FeedbackDecision[],
  card: Module4Lesson4V2CardDraft,
  decisionId: string,
): { decisions: Lesson4FeedbackDecision[]; card: Module4Lesson4V2CardDraft } {
  const now = new Date().toISOString()
  const decisionsResolved = new Set(card.revision.decisionIdsResolved)
  decisionsResolved.delete(decisionId)
  return {
    decisions: decisions.map(decision => (
      decision.id === decisionId
        ? { ...decision, resolved: false, resolvedAt: "" }
        : decision
    )),
    card: {
      ...card,
      revision: {
        ...card.revision,
        decisionIdsResolved: Array.from(decisionsResolved),
      },
      updatedAt: now,
    },
  }
}

