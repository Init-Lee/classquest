/**
 * 文件说明：模块 4 课时 3 第 4 步自测状态条。
 * 职责：以极简 chip 展示新闻/图片两张题卡的自测确认进度，并在同排右侧承载当前题卡的返回编辑与确认 CTA。
 * 更新触发：自测状态字段、卡片切换交互、CTA 可见条件或状态文案变化时，需要同步更新本文件。
 */

import type {
  Lesson3CardSelfTrialRecord,
  Module4Lesson3SelfTrialState,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

type SelfTrialCardKey = "news" | "image"

const CARD_LABELS: Record<SelfTrialCardKey, string> = {
  news: "新闻",
  image: "图片",
}

function statusLabel(record: Module4Lesson3SelfTrialState[SelfTrialCardKey]): string {
  if (record.confirmed) return "已确认"
  if (record.submitted) return "待确认"
  if (record.needsRetrial) return "需要重新作答"
  return "未自测"
}

export function SelfTrialStatusStrip({
  selfTrial,
  activeCard,
  activeRecord,
  onSelectCard,
  onReturnEditor,
  onConfirm,
  hint,
}: {
  selfTrial: Module4Lesson3SelfTrialState
  activeCard: SelfTrialCardKey
  activeRecord: Lesson3CardSelfTrialRecord
  onSelectCard: (key: SelfTrialCardKey) => void
  onReturnEditor: () => void
  onConfirm: () => void
  /** 与进度 chip 同排展示的步骤提示，传入时替代默认「自测进度」标签 */
  hint?: string
}) {
  const bothConfirmed = selfTrial.news.confirmed && selfTrial.image.confirmed
  const showConfirm = activeRecord.submitted && activeRecord.selectedOptionKey !== undefined
  const canConfirm = showConfirm && activeRecord.feedbackViewed && !activeRecord.confirmed

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border bg-white/90 px-3 py-2.5 shadow-sm">
      <span className="text-sm text-muted-foreground">{hint ?? "自测进度"}</span>
      {(["news", "image"] as const).map(key => {
        const record = selfTrial[key]
        const active = activeCard === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectCard(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
              active ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-accent",
            )}
          >
            <span className="font-medium">{CARD_LABELS[key]}</span>
            <span className={cn(
              "text-xs",
              record.confirmed ? "text-green-700" : record.submitted ? "text-amber-700" : record.needsRetrial ? "text-orange-700" : "text-muted-foreground",
            )}
            >
              {statusLabel(record)}
            </span>
          </button>
        )
      })}
      <span className="text-xs text-muted-foreground">
        {bothConfirmed ? "两张均已确认，可保存 V1" : "两张都需完成自测确认"}
      </span>
      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
        <Button type="button" variant="outline" size="sm" onClick={onReturnEditor}>
          返回编辑器
        </Button>
        {showConfirm && (
          <Button type="button" size="sm" disabled={!canConfirm} onClick={onConfirm}>
            {activeRecord.confirmed ? "这张题卡已确认" : "确认这张题卡自测完成"}
          </Button>
        )}
      </div>
    </div>
  )
}
