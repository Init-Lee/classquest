/**
 * 文件说明：模块 4 课时 4 合并式分卡反馈面板。
 * 职责：单张题卡内纵向展示统计、四维度逐项评价、整体建议与（不合规时）内容合规说明，并承载作者决策。
 * 更新触发：Step2 合并卡片布局、评价展示顺序或分卡反馈结构变化时，需要同步更新本文件。
 */

import type { Lesson4FeedbackDecision, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson4FeedbackDigestCard, Lesson4FeedbackDigestItem } from "../../utils/build-lesson4-feedback-digest"
import {
  RUBRIC_DIMENSION_KEYS,
  getLesson4CardLabel,
  getLesson4FeedbackAreaLabel,
} from "../../utils/build-lesson4-feedback-digest"
import { FeedbackCardStatsRow } from "./FeedbackCardStatsRow"
import { FeedbackDecisionControls } from "./FeedbackDecisionControls"
import { FeedbackDecisionItem } from "./FeedbackDecisionItem"
import { FeedbackLevelBadge } from "./FeedbackLevelBadge"

function findRubricItem(card: Lesson4FeedbackDigestCard, area: typeof RUBRIC_DIMENSION_KEYS[number]): Lesson4FeedbackDigestItem {
  return card.items.find(item => item.area === area)!
}

function FeedbackDimensionRow({
  item,
  decision,
  onDecisionChange,
}: {
  item: Lesson4FeedbackDigestItem
  decision?: Lesson4FeedbackDecision
  onDecisionChange: (decisionId: string, patch: Partial<Lesson4FeedbackDecision>) => void
}) {
  if (decision) {
    return (
      <FeedbackDecisionItem
        decision={decision}
        onChange={patch => onDecisionChange(decision.id, patch)}
      />
    )
  }

  const level = item.level === "content_violation" ? "major_fix" : item.level
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-[2.5rem] text-sm font-medium">{getLesson4FeedbackAreaLabel(item.area)}</span>
        <FeedbackLevelBadge level={level} />
      </div>
      <div className="mt-2 flex flex-wrap items-start gap-x-2 gap-y-2">
        <p className="shrink-0 text-sm font-medium">理由</p>
        <div className="min-w-0 flex-1 rounded-lg bg-sky-50 px-3 py-2 text-sm leading-6 text-foreground">
          {item.reviewerReason || "同伴没有填写详细理由。"}
        </div>
      </div>
    </div>
  )
}

export function FeedbackCardPanel({
  card,
  decisions,
  onDecisionChange,
}: {
  card: Lesson4FeedbackDigestCard
  decisions: Lesson4FeedbackDecision[]
  onDecisionChange: (decisionId: string, patch: Partial<Lesson4FeedbackDecision>) => void
}) {
  const cardDecisions = decisions.filter(decision => decision.cardKind === card.cardKind)
  const decisionsById = new Map(cardDecisions.map(decision => [decision.id, decision]))
  const safetyDecision = cardDecisions.find(decision => decision.area === "safety")

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl">{getLesson4CardLabel(card.cardKind as Module4MaterialKind)}</CardTitle>
          <FeedbackCardStatsRow card={card} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {RUBRIC_DIMENSION_KEYS.map(area => {
            const item = findRubricItem(card, area)
            const decision = decisionsById.get(item.id)
            return (
              <FeedbackDimensionRow
                key={area}
                item={item}
                decision={decision}
                onDecisionChange={onDecisionChange}
              />
            )
          })}
        </div>

        {card.overallComment.trim() && (
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">整体建议</h3>
            <p className="text-sm leading-6 text-muted-foreground">{card.overallComment}</p>
          </section>
        )}

        {card.contentViolation === true && (
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-red-800">内容合规</h3>
            <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
              <p className="shrink-0 text-sm font-medium">理由</p>
              <div className="min-w-0 flex-1 rounded-lg bg-sky-50 px-3 py-2 text-sm leading-6 text-foreground">
                {card.contentViolationNote || "同伴标记了安全、隐私、侵权或不适宜风险。"}
              </div>
            </div>
            {safetyDecision && (
              <FeedbackDecisionControls
                decision={safetyDecision}
                onChange={patch => onDecisionChange(safetyDecision.id, patch)}
              />
            )}
          </section>
        )}
      </CardContent>
    </Card>
  )
}
