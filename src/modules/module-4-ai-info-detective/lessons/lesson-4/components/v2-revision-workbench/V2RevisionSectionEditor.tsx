/**
 * 文件说明：模块 4 课时 4 V2 修改台单段编辑区。
 * 职责：在 Step3 左侧 wizard 当前 Tab 内以左 3/4 编辑、右 1/4 展示本项修改反馈摘要，避免反馈与编辑区上下堆叠。
 * 更新触发：V2 可编辑字段、分区字段归属、Tab 内左右分栏、必改/采纳跟进或确认前撤销完成逻辑变化时，需要同步更新本文件。
 */

import type { Lesson4FeedbackDecision, Module4Lesson3OptionKey, Module4Lesson4V2CardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { FeedbackLevelBadge } from "../feedback-inbox/FeedbackLevelBadge"
import { getLesson4FeedbackAreaLabel } from "../../utils/build-lesson4-feedback-digest"
import {
  isDecisionResolved,
  isSectionRevisionDecision,
  type V2RevisionSectionId,
} from "../../utils/get-lesson4-v2-revision-sections"

const REVISION_ACTION_LABEL: Partial<Record<Lesson4FeedbackDecision["action"], string>> = {
  must_revise: "必改",
  accept: "采纳修改",
  partial_accept: "部分采纳",
}

export function V2RevisionSectionEditor({
  sectionId,
  card,
  sectionDecisions,
  locked,
  resolveNote,
  onResolveNoteChange,
  onResolveDecision,
  onUnresolveDecision,
  onChange,
}: {
  sectionId: V2RevisionSectionId
  card: Module4Lesson4V2CardDraft
  sectionDecisions: Lesson4FeedbackDecision[]
  locked: boolean
  resolveNote: string
  onResolveNoteChange: (value: string) => void
  onResolveDecision: (decisionId: string) => void
  onUnresolveDecision: (decisionId: string) => void
  onChange: (card: Module4Lesson4V2CardDraft) => void
}) {
  const touch = (patch: Partial<Module4Lesson4V2CardDraft>) => {
    if (locked) return
    onChange({ ...card, ...patch, status: "draft", updatedAt: new Date().toISOString() })
  }

  const revisionDecisions = sectionDecisions.filter(isSectionRevisionDecision)
  const unresolvedRevision = revisionDecisions.filter(decision => !isDecisionResolved(decision, card))
  const resolvedRevision = revisionDecisions.filter(decision => isDecisionResolved(decision, card))
  const optionalPeerDecisions = sectionDecisions.filter(decision => !isSectionRevisionDecision(decision))
  const hasFeedbackPanel = (
    unresolvedRevision.length > 0
    || resolvedRevision.length > 0
    || optionalPeerDecisions.length > 0
  )

  const editContent = (
    <>
      {sectionId === "material" && (
        <div className="space-y-3">
          {card.material.asset ? (
            <div className="flex max-h-48 items-center justify-center overflow-hidden rounded-xl border bg-slate-50 p-2">
              <img
                src={card.material.asset.dataUrl}
                alt={card.material.titleOrName || "素材预览"}
                className="max-h-44 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              暂无素材图片
            </div>
          )}
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">素材短名</span>
            <Input
              value={card.material.titleOrName}
              disabled={locked}
              onChange={event => touch({ material: { ...card.material, titleOrName: event.target.value } })}
              placeholder="给素材起一个便于识别的短名"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">展示说明</span>
            <Textarea
              value={card.material.displayNote}
              disabled={locked}
              onChange={event => touch({ material: { ...card.material, displayNote: event.target.value } })}
              placeholder="只描述素材可见信息，不写最终判断。"
              rows={3}
            />
          </label>
        </div>
      )}

      {sectionId === "task" && (
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">题干</span>
            <Textarea
              value={card.task.prompt}
              disabled={locked}
              onChange={event => touch({ task: { ...card.task, prompt: event.target.value } })}
              placeholder="填写判断题任务"
              rows={3}
            />
          </label>
          <div className="space-y-2">
            {card.task.options.map((option, index) => (
              <div key={option.key} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[3rem_1fr_1fr_5rem]">
                <span className="font-semibold">{option.key}</span>
                <Input
                  value={option.label}
                  disabled={locked}
                  onChange={event => {
                    const options = card.task.options.map((item, itemIndex) => (
                      itemIndex === index ? { ...item, label: event.target.value } : item
                    ))
                    touch({ task: { ...card.task, options } })
                  }}
                  placeholder="选项文案"
                />
                <Input
                  value={option.rationale}
                  disabled={locked}
                  onChange={event => {
                    const options = card.task.options.map((item, itemIndex) => (
                      itemIndex === index ? { ...item, rationale: event.target.value } : item
                    ))
                    touch({ task: { ...card.task, options } })
                  }}
                  placeholder="选项解析"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`${card.id}-answer`}
                    disabled={locked}
                    checked={card.task.correctOptionKey === option.key}
                    onChange={() => touch({ task: { ...card.task, correctOptionKey: option.key as Module4Lesson3OptionKey } })}
                  />
                  正解
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {sectionId === "explanation" && (
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">核心解析</span>
          <Textarea
            value={card.explanation.text}
            disabled={locked}
            onChange={event => touch({
              explanation: {
                ...card.explanation,
                text: event.target.value,
                editCount: card.explanation.editCount + 1,
                updatedAt: new Date().toISOString(),
              },
            })}
            placeholder="解释参考答案与关键证据"
            rows={6}
          />
        </label>
      )}

      {sectionId === "source" && (
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">来源记录</span>
            <Textarea
              value={card.source.sourceRecord}
              disabled={locked}
              onChange={event => touch({ source: { ...card.source, sourceRecord: event.target.value } })}
              placeholder="填写链接、平台、生成记录或其它可追溯信息"
              rows={4}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">核验观察指引</span>
            <Textarea
              value={card.source.verificationNote}
              disabled={locked}
              onChange={event => touch({ source: { ...card.source, verificationNote: event.target.value } })}
              placeholder="说明你如何核验来源"
              rows={4}
            />
          </label>
        </div>
      )}
    </>
  )

  const feedbackPanel = (
    <aside className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3 lg:max-w-none">
      <div>
        <p className="text-xs font-semibold text-foreground">本项修改反馈</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
          摘要；完整理由见右侧建议卡。
        </p>
      </div>

      {unresolvedRevision.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
          <p className="text-xs font-medium leading-5 text-amber-900">
            需跟进：先改内容并标记完成，再进下一项。
          </p>
          {unresolvedRevision.map(decision => (
            <div key={decision.id} className="rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs">
              <p className="font-medium text-amber-950">
                {getLesson4FeedbackAreaLabel(decision.area)} · {REVISION_ACTION_LABEL[decision.action] ?? "需修改"}
              </p>
              <p className="mt-1 line-clamp-3 text-muted-foreground">{decision.reviewerReason}</p>
              {decision.authorPlan && (
                <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                  Step2 计划：{decision.authorPlan}
                </p>
              )}
              {!locked && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1.5 h-7 w-full px-2 text-xs"
                  disabled={resolveNote.trim().length < 4}
                  onClick={() => onResolveDecision(decision.id)}
                >
                  已完成这条修改
                </Button>
              )}
            </div>
          ))}
          {!locked && (
            <Textarea
              value={resolveNote}
              onChange={event => onResolveNoteChange(event.target.value)}
              placeholder="写具体修改说明后再标记完成。"
              rows={2}
              className="min-h-[56px] resize-none bg-white text-xs"
            />
          )}
        </div>
      )}

      {resolvedRevision.length > 0 && (
        <ul className="space-y-1.5">
          {resolvedRevision.map(decision => (
            <li key={decision.id} className="rounded-md border border-green-200 bg-white px-2 py-1.5 text-xs leading-5">
              <div className="mb-0.5 flex flex-wrap items-center gap-1">
                <span className="font-medium text-foreground">
                  {getLesson4FeedbackAreaLabel(decision.area)} · {REVISION_ACTION_LABEL[decision.action] ?? "需修改"}
                </span>
                <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800">
                  已修改
                </span>
              </div>
              {decision.reviewerReason && (
                <p className="line-clamp-2 text-[10px] text-muted-foreground">
                  同伴建议：{decision.reviewerReason}
                </p>
              )}
              <div className="mt-1 flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-foreground">
                  {decision.authorPlan.trim() || "（未填写修改说明）"}
                </p>
                {!locked && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => onUnresolveDecision(decision.id)}
                  >
                    取消完成
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {optionalPeerDecisions.length > 0 && (
        <ul className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">同伴建议摘要</p>
          {optionalPeerDecisions.map(decision => (
            <li key={decision.id} className="rounded-md bg-white px-2 py-1.5 text-xs leading-5">
              <div className="mb-0.5 flex flex-wrap items-center gap-1">
                <FeedbackLevelBadge
                  level={decision.level === "content_violation" ? "content_violation" : decision.level}
                />
              </div>
              <p className="line-clamp-3 text-muted-foreground">
                {decision.reviewerReason || "同伴未写详细理由。"}
              </p>
              {decision.authorPlan && (
                <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                  Step2 说明：{decision.authorPlan}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!hasFeedbackPanel && (
        <p className="text-xs text-muted-foreground">同伴未对本项提出修改建议。</p>
      )}
    </aside>
  )

  return (
    <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0 space-y-3">{editContent}</div>
      {feedbackPanel}
    </div>
  )
}
