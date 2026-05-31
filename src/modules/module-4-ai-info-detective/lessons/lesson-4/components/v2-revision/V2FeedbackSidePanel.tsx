/**
 * 文件说明：模块 4 课时 4 V2 反馈侧栏组件。
 * 职责：在 Step3 中展示当前题卡相关的同伴反馈、作者决策和重改/安全项解决入口。
 * 更新触发：Step3 反馈侧栏布局、解决按钮语义或决策状态展示变化时，需要同步更新本文件。
 */

import type { Lesson4FeedbackDecision, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { getLesson4FeedbackAreaLabel } from "../../utils/build-lesson4-feedback-digest"

export function V2FeedbackSidePanel({
  cardKind,
  decisions,
  resolveNote,
  onResolveNoteChange,
  onResolveDecision,
}: {
  cardKind: Module4MaterialKind
  decisions: Lesson4FeedbackDecision[]
  resolveNote: string
  onResolveNoteChange: (value: string) => void
  onResolveDecision: (decisionId: string) => void
}) {
  const cardDecisions = decisions.filter(decision => decision.cardKind === cardKind)

  if (cardDecisions.length === 0) {
    return (
      <aside className="rounded-xl border bg-green-50 p-5 text-sm text-green-800">
        同伴没有给这张题卡提出小修、重改或安全底线问题。
      </aside>
    )
  }

  return (
    <aside className="space-y-4 rounded-xl border bg-white p-5">
      <div>
        <h3 className="font-semibold">本卡反馈清单</h3>
        <p className="mt-1 text-sm text-muted-foreground">重改和安全底线需要在确认 V2 前逐条标记为已解决。</p>
      </div>
      {cardDecisions.map(decision => {
        const blocking = decision.level === "major_fix" || decision.level === "content_violation"
        return (
          <div key={decision.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{getLesson4FeedbackAreaLabel(decision.area)}</p>
              <span className="text-xs text-muted-foreground">{decision.resolved ? "已解决" : blocking ? "待解决" : "已决策"}</span>
            </div>
            <p className="text-sm text-muted-foreground">{decision.reviewerReason}</p>
            {decision.authorPlan && <p className="text-xs text-muted-foreground">作者计划：{decision.authorPlan}</p>}
            {blocking && !decision.resolved && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resolveNote.trim().length < 4}
                onClick={() => onResolveDecision(decision.id)}
              >
                我已完成这条修改
              </Button>
            )}
          </div>
        )
      })}
      <Textarea
        value={resolveNote}
        onChange={event => onResolveNoteChange(event.target.value)}
        placeholder="先写具体修改说明，再点击“我已完成这条修改”。"
      />
    </aside>
  )
}

