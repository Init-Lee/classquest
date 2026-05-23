/**
 * 文件说明：模块 4 课时 3 第 4 步单卡自测面板。
 * 职责：左中右三栏展示素材、判断作答与答题反馈，便于提交后并排对照；CTA 已上移至 SelfTrialStatusStrip。
 * 更新触发：自测交互阶段、三栏布局结构或反馈展示顺序变化时，需要同步更新本文件。
 */

import type {
  Lesson3CardSelfTrialRecord,
  Module4Lesson3OptionKey,
  Module4Lesson3QuestionCardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { isLesson3OptionKey } from "../data/default-options"
import { cn } from "@/shared/utils/cn"
import { SelfTrialFeedbackPanel } from "./SelfTrialFeedbackPanel"

export function QuestionCardSelfTrialPanel({
  card,
  record,
  onSelectOption,
  onSubmit,
}: {
  card: Module4Lesson3QuestionCardDraft
  record: Lesson3CardSelfTrialRecord
  onSelectOption: (key: Module4Lesson3OptionKey) => void
  onSubmit: () => void
}) {
  const cardLabel = card.kind === "news" ? "新闻题卡" : "图片题卡"
  const showFeedback = record.submitted && record.selectedOptionKey !== undefined
  const canSubmit = record.selectedOptionKey !== undefined && !record.submitted

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3 lg:grid-rows-1 lg:items-stretch">
        {/* 左：素材 */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-2xl border bg-white p-4">
          <p className="shrink-0 text-sm font-semibold tracking-wide text-primary">{cardLabel} · 素材</p>
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
        </div>

        {/* 中：判断任务 + 选项 + 提交 */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-2xl border bg-white p-4">
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
                  name={`${card.id}-self-trial`}
                  value={option.key}
                  checked={record.selectedOptionKey === option.key}
                  disabled={showFeedback}
                  onChange={() => {
                    if (isLesson3OptionKey(option.key)) onSelectOption(option.key)
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
              提交并查看反馈
            </Button>
          )}
        </div>

        {/* 右：答题反馈（提交前占位，提交后展示解析） */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border bg-white p-4">
          <p className="shrink-0 text-sm font-semibold tracking-wide text-primary">答题反馈</p>
          {showFeedback ? (
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              <SelfTrialFeedbackPanel
                card={card}
                selectedOptionKey={record.selectedOptionKey!}
                isCorrect={record.isCorrect === true}
              />
            </div>
          ) : (
            <div className="mt-3 flex min-h-[12rem] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-muted-foreground">
              提交后在此查看反馈
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
