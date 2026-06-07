/**
 * 文件说明：模块 4 课时 4 V2 修改台右侧反馈明细卡。
 * 职责：在单个 Card 内纵向展示当前分区同伴建议、分卡总体建议与内容合规、以及作者修改后的整体反馈。
 * 更新触发：右侧三区布局、receivedReviewJson 字段映射或整体反馈字段变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Module4Lesson4ReviewCardFeedback,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Textarea } from "@/shared/ui/textarea"
import { FeedbackLevelBadge } from "../feedback-inbox/FeedbackLevelBadge"
import { getLesson4CardLabel, getLesson4FeedbackAreaLabel } from "../../utils/build-lesson4-feedback-digest"
import type { V2RevisionSectionId } from "../../utils/get-lesson4-v2-revision-sections"
import { getSectionDecisions } from "../../utils/get-lesson4-v2-revision-sections"

export function V2RevisionAdviceCard({
  cardKind,
  sectionId,
  cardFeedback,
  decisions,
  authorRevisionReply,
  onAuthorRevisionReplyChange,
  requiresRevisionSummary,
}: {
  cardKind: Module4MaterialKind
  sectionId: V2RevisionSectionId
  cardFeedback?: Module4Lesson4ReviewCardFeedback
  decisions: Lesson4FeedbackDecision[]
  authorRevisionReply: string
  onAuthorRevisionReplyChange: (value: string) => void
  requiresRevisionSummary: boolean
}) {
  const sectionDecisions = getSectionDecisions(decisions, cardKind, sectionId)
  const peerItems = sectionDecisions

  return (
    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border bg-white">
      <div className="flex min-h-0 flex-1 flex-col divide-y overflow-hidden">
        <div className="min-h-0 flex-[2] overflow-y-auto px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">本项同伴建议</p>
          <p className="mt-0.5 text-sm font-semibold">
            {getLesson4CardLabel(cardKind)} · {getLesson4FeedbackAreaLabel(sectionId)}
          </p>
          {peerItems.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">当前分区暂无同伴修改建议。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {peerItems.map(decision => (
                <li key={decision.id} className="rounded-lg bg-sky-50 px-3 py-2 text-sm leading-6">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <FeedbackLevelBadge level={decision.level === "content_violation" ? "content_violation" : decision.level} />
                    {decision.resolved && <span className="text-xs text-green-700">已处理</span>}
                  </div>
                  {decision.reviewerReason || "同伴没有填写详细理由。"}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-2 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">总体建议 · 内容合规</p>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6">
            <p className="font-medium text-foreground">整体建议</p>
            <p className="mt-1 text-muted-foreground">
              {cardFeedback?.overallComment?.trim() || "同伴没有填写整体建议。"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6">
            <p className="font-medium text-foreground">内容合规</p>
            {cardFeedback?.contentViolation === true ? (
              <p className="mt-1 text-red-800">
                {cardFeedback.contentViolationNote?.trim() || "同伴标记了安全、隐私、侵权或不适宜风险。"}
              </p>
            ) : cardFeedback?.contentViolation === false ? (
              <p className="mt-1 text-green-800">同伴判定内容合规。</p>
            ) : (
              <p className="mt-1 text-muted-foreground">同伴未明确选择是否违规。</p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-[2] flex-col overflow-hidden px-4 py-3">
          {requiresRevisionSummary ? (
            <label className="flex min-h-0 flex-1 flex-col gap-1.5 text-sm">
              <span className="shrink-0 font-medium">我修改后的整体反馈</span>
              <Textarea
                value={authorRevisionReply}
                onChange={event => onAuthorRevisionReplyChange(event.target.value)}
                placeholder="例如：根据同伴反馈补充了来源核验说明，并调整了判断任务表述。"
                className="min-h-[88px] flex-1 resize-none"
              />
            </label>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">本题卡无需修改，确认即可。</p>
          )}
        </div>
      </div>
    </aside>
  )
}
