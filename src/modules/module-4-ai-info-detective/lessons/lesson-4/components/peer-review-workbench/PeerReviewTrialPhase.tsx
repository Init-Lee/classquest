/**
 * 文件说明：模块 4 课时 4 互审试答阶段面板（遗留，已由 PeerReviewWorkbench 固定分栏取代）。
 * 职责：历史阶段 A 整屏试答编排；新布局请使用 PeerReviewWorkbench + PeerReviewSelfTrialPanel。
 * 更新触发：若重新启用分阶段整屏试答流程时再更新；否则以 Workbench 为准。
 */

import type { Module4Lesson3OptionKey, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/api/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { PeerReviewSelfTrialPanel, type PeerReviewTrialRecord } from "./PeerReviewSelfTrialPanel"

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

/** @deprecated 请使用 PeerReviewWorkbench 固定左右分栏。 */
export function PeerReviewTrialPhase({
  requestJson,
  trialRecords,
  activeKind,
  onActiveKindChange,
  onTrialRecordsChange,
  onTrialAnswerChange,
}: {
  requestJson: Lesson4ReviewRequestJson
  trialRecords: Record<Module4MaterialKind, PeerReviewTrialRecord>
  activeKind: Module4MaterialKind
  onActiveKindChange: (kind: Module4MaterialKind) => void
  onTrialRecordsChange: (records: Record<Module4MaterialKind, PeerReviewTrialRecord>) => void
  onTrialAnswerChange: (kind: Module4MaterialKind, key: Module4Lesson3OptionKey) => void
}) {
  const card = requestJson.cards[activeKind]
  const record = trialRecords[activeKind]
  const bothSubmitted = trialRecords.news.submitted && trialRecords.image.submitted

  const updateRecord = (patch: Partial<PeerReviewTrialRecord>) => {
    onTrialRecordsChange({
      ...trialRecords,
      [activeKind]: { ...record, ...patch },
    })
  }

  const handleSubmit = () => {
    if (!record.selectedOptionKey) return
    const correctKey = card.task.correctOptionKey
    const isCorrect = correctKey ? record.selectedOptionKey === correctKey : undefined
    updateRecord({ submitted: true, isCorrect })
    onTrialAnswerChange(activeKind, record.selectedOptionKey)
  }

  return (
    <div className="flex min-h-[28rem] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">试答题卡</p>
          <p className="text-xs text-muted-foreground">左栏试答；右栏评价请使用 PeerReviewWorkbench 固定分栏。</p>
        </div>
        {bothSubmitted && <Badge variant="success">试答已完成</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["news", "image"] as Module4MaterialKind[]).map(kind => (
          <Button
            key={kind}
            type="button"
            variant={activeKind === kind ? "default" : "outline"}
            onClick={() => onActiveKindChange(kind)}
          >
            {CARD_LABEL[kind]}
            {trialRecords[kind].submitted ? " · 已试答" : ""}
          </Button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white">
        <PeerReviewSelfTrialPanel
          card={card}
          record={record}
          onSelectOption={key => updateRecord({ selectedOptionKey: key })}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
