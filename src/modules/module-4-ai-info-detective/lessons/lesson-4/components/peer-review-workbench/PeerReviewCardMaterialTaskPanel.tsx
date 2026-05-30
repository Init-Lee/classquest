/**
 * 文件说明：课时 4 互审左栏题卡素材区。
 * 职责：展示作者题卡素材；判断任务与可交互试答由 PeerReviewSelfTrialPanel 承接，避免静态选项与 radio 重复。
 * 更新触发：题卡素材字段、materialOnly 开关或左栏滚动布局变化时，需要同步更新本文件。
 */

import type { Module4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function PeerReviewCardMaterialTaskPanel({
  card,
  header,
  materialOnly = false,
}: {
  card: Module4Lesson3QuestionCardDraft
  header?: string
  /** 为 true 时仅展示素材，不渲染静态判断任务（试答区另有交互选项）。 */
  materialOnly?: boolean
}) {
  const cardLabel = card.kind === "news" ? "新闻题卡" : "图片题卡"

  return (
    <div className="flex min-h-0 flex-col overflow-y-auto p-4">
      {header && (
        <p className="shrink-0 text-sm font-semibold tracking-wide text-primary">{header}</p>
      )}
      {!header && (
        <p className="shrink-0 text-sm font-semibold tracking-wide text-primary">{cardLabel} · 题卡内容</p>
      )}
      {card.material.asset ? (
        <div className="mt-3 flex min-h-[10rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50">
          <img
            src={card.material.asset.dataUrl}
            alt={card.material.titleOrName || cardLabel}
            className="max-h-56 max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="mt-3 flex min-h-[10rem] shrink-0 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          暂无素材图片
        </div>
      )}
      <h3 className="mt-3 text-base font-semibold">{card.material.titleOrName || "未填写素材短名"}</h3>
      {card.material.displayNote && (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.material.displayNote}</p>
      )}

      {!materialOnly && (
        <div className="mt-4 rounded-2xl border bg-slate-50/80 p-3">
          <p className="text-sm font-medium">判断任务</p>
          <p className="mt-2 text-sm leading-6">{card.task.prompt || "未填写题干"}</p>
          <div className="mt-3 space-y-1.5">
            {card.task.options.map(option => (
              <div key={option.key} className="rounded-xl border bg-white px-3 py-2 text-sm">
                {option.key}. {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
