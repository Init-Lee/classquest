/**
 * 文件说明：模块 4 课时 4 V2 单卡确认校验工具。
 * 职责：检查 V2 题卡必填字段、修改说明与本卡重改/安全反馈解决状态，决定 Step3 是否允许确认该卡。
 * 更新触发：V2 必填字段、重改解决规则、修改说明要求或 Step3 确认条件变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { areAllCardSectionsPass } from "./get-lesson4-v2-revision-sections"

export interface Lesson4V2CardReadiness {
  ready: boolean
  missing: string[]
  unresolvedDecisionIds: string[]
}

export function evaluateLesson4V2CardReadiness(
  card: Module4Lesson4V2CardDraft,
  decisions: Lesson4FeedbackDecision[],
): Lesson4V2CardReadiness {
  const missing: string[] = []
  if (!card.material.titleOrName.trim()) missing.push("素材标题/名称")
  if (!card.material.displayNote.trim()) missing.push("素材展示说明")
  if (!card.task.prompt.trim()) missing.push("判断任务")
  if (card.task.options.length < 2) missing.push("至少 2 个选项")
  if (!card.task.correctOptionKey) missing.push("参考答案")
  if (!card.explanation.text.trim()) missing.push("核心解析")
  if (!card.source.sourceRecord.trim() && !card.source.verificationNote.trim()) missing.push("来源记录或核验说明")
  const allSectionsPass = areAllCardSectionsPass(decisions, card, card.kind)
  if (!allSectionsPass && !card.revision.summary.trim()) missing.push("V2 修改说明")

  const blockingDecisions = decisions.filter(decision =>
    decision.cardKind === card.kind && (decision.level === "major_fix" || decision.level === "content_violation")
  )
  const unresolvedDecisionIds = blockingDecisions
    .filter(decision => !decision.resolved && !card.revision.decisionIdsResolved.includes(decision.id))
    .map(decision => decision.id)

  return {
    ready: missing.length === 0 && unresolvedDecisionIds.length === 0,
    missing,
    unresolvedDecisionIds,
  }
}

