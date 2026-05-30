/**
 * 文件说明：模块 4 课时 4 互审试答反馈面板（兼容层，逻辑已迁至左右分栏子组件）。
 * 职责：保留文件名避免断裂引用；新布局请使用 PeerReviewAuthorAnalysisPanel + PeerReviewTrialResultStrip。
 * 更新触发：若确认无外部 import 后可删除本文件。
 */

import type {
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { PeerReviewAuthorAnalysisPanel } from "./PeerReviewAuthorAnalysisPanel"
import { PeerReviewTrialResultStrip } from "./PeerReviewTrialResultStrip"

export function PeerReviewSelfTrialFeedbackPanel({
  card,
  selectedOptionKey,
  isCorrect,
}: {
  card: Module4Lesson3QuestionCardDraft
  selectedOptionKey: Module4Lesson3OptionKey
  isCorrect: boolean
}) {
  return (
    <div className="space-y-4">
      <PeerReviewTrialResultStrip
        card={card}
        selectedOptionKey={selectedOptionKey}
        isCorrect={isCorrect}
      />
      <PeerReviewAuthorAnalysisPanel
        card={card}
        mode="trial"
        selectedOptionKey={selectedOptionKey}
        showSelectedRationale={!isCorrect}
      />
    </div>
  )
}
