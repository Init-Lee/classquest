/**
 * 文件说明：模块 4 课时 4 互审试答左栏面板。
 * 职责：左栏集中展示素材、可交互判断试答与提交；提交后在同栏展示结果摘要与作者解析，并支持重新答题。
 * 更新触发：互审试答交互、重新答题、左栏解析展示或试答提交逻辑变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import { isLesson4PeerReviewOptionKey } from "../../utils/is-lesson4-option-key"
import { PeerReviewAuthorAnalysisPanel } from "./PeerReviewAuthorAnalysisPanel"
import { PeerReviewCardMaterialTaskPanel } from "./PeerReviewCardMaterialTaskPanel"
import { PeerReviewTrialResultStrip } from "./PeerReviewTrialResultStrip"

export interface PeerReviewTrialRecord {
  selectedOptionKey?: Module4Lesson3OptionKey
  submitted: boolean
  isCorrect?: boolean
}

export function PeerReviewSelfTrialPanel({
  card,
  record,
  onSelectOption,
  onSubmit,
  onRetake,
}: {
  card: Module4Lesson3QuestionCardDraft
  record: PeerReviewTrialRecord
  onSelectOption: (key: Module4Lesson3OptionKey) => void
  onSubmit: () => void
  /** 传入时在答题结果区展示「重新答题」；主工作台用于清除试答状态。 */
  onRetake?: () => void
}) {
  const cardLabel = card.kind === "news" ? "新闻题卡" : "图片题卡"
  const showFeedback = record.submitted && record.selectedOptionKey !== undefined
  const canSubmit = record.selectedOptionKey !== undefined && !record.submitted
  const showWrongRationale = showFeedback && record.isCorrect !== true

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PeerReviewCardMaterialTaskPanel
        card={card}
        header={`${cardLabel} · 题卡素材`}
        materialOnly
      />

      <div className="border-t p-4">
        <p className="shrink-0 text-sm font-semibold tracking-wide text-primary">你的判断</p>
        <h2 className="mt-2 text-xl font-bold leading-snug">{card.task.prompt || "未填写题干"}</h2>
        <div className="mt-4 grid gap-2">
          {card.task.options.map(option => (
            <label
              key={option.key}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                record.selectedOptionKey === option.key ? "border-primary bg-primary/5" : "border-input hover:bg-accent",
                showFeedback && "pointer-events-none opacity-70",
              )}
            >
              <input
                type="radio"
                name={`${card.id}-peer-review-trial`}
                value={option.key}
                checked={record.selectedOptionKey === option.key}
                disabled={showFeedback}
                onChange={() => {
                  if (isLesson4PeerReviewOptionKey(option.key)) onSelectOption(option.key)
                }}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span>{option.key}. {option.label}</span>
            </label>
          ))}
        </div>
        {!showFeedback && (
          <Button
            type="button"
            size="lg"
            disabled={!canSubmit}
            className="mt-4 w-full shrink-0 rounded-full"
            onClick={onSubmit}
          >
            提交并查看解析
          </Button>
        )}
        {!showFeedback && (
          <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
            提交前不展示作者解析；提交后将在下方对照区出现。
          </p>
        )}
      </div>

      {showFeedback && record.selectedOptionKey && (
        <>
          <div className="border-t px-4 pb-2 pt-4">
            <PeerReviewTrialResultStrip
              card={card}
              selectedOptionKey={record.selectedOptionKey}
              isCorrect={record.isCorrect}
              onRetake={onRetake}
            />
          </div>
          <PeerReviewAuthorAnalysisPanel
            card={card}
            mode="trial"
            selectedOptionKey={record.selectedOptionKey}
            showSelectedRationale={showWrongRationale}
          />
        </>
      )}
    </div>
  )
}
