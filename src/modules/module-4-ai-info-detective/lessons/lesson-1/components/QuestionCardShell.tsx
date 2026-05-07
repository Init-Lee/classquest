/**
 * 文件说明：模块 4 课时 1 第 2 关 HTML 题卡壳组件。
 * 职责：用结构化 HTML 展示样例题卡的素材展示、判断任务、解析和来源核验入口，支持答题前、答题后和结构标注三种模式。
 * 更新触发：Step 2 题卡四区域结构、答题前后可见区域、区域点击/拖拽标注绑定或题卡视觉规范变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import type { QuestionCardMode, Step2OptionKey, Step2SampleCard, Step2StructureMatched } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"
import { SampleMaterialImage } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/SampleMaterialImage"
import { SampleAnswerReveal } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/SampleAnswerReveal"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

interface QuestionCardShellProps {
  card: Step2SampleCard
  mode: QuestionCardMode
  selectedOptionKey?: Step2OptionKey
  onSelectOption?: (key: Step2OptionKey) => void
  onConfirmAnswer?: () => void
  matchedParts?: Step2StructureMatched
  activeLabelKey?: CardPartKey | null
  onDropLabel?: (partKey: CardPartKey, droppedKey: CardPartKey) => void
  onTargetClick?: (partKey: CardPartKey) => void
}

interface CardRegionProps {
  partKey: CardPartKey
  title: string
  children: ReactNode
  mode: QuestionCardMode
  matchedParts?: Step2StructureMatched
  activeLabelKey?: CardPartKey | null
  onDropLabel?: (partKey: CardPartKey, droppedKey: CardPartKey) => void
  onTargetClick?: (partKey: CardPartKey) => void
}

function CardRegion({
  partKey,
  title,
  children,
  mode,
  matchedParts,
  activeLabelKey,
  onDropLabel,
  onTargetClick,
}: CardRegionProps) {
  const structureMode = mode === "structure-labeling"
  const matched = Boolean(matchedParts?.[partKey])
  const active = structureMode && activeLabelKey !== null

  return (
    <section
      data-card-part={partKey}
      onClick={() => structureMode && onTargetClick?.(partKey)}
      onDragOver={(event) => {
        if (!structureMode) return
        event.preventDefault()
      }}
      onDrop={(event) => {
        if (!structureMode) return
        const droppedKey = event.dataTransfer.getData("text/plain") as CardPartKey
        onDropLabel?.(partKey, droppedKey)
      }}
      className={cn(
        "rounded-2xl border bg-background p-4 transition-all",
        structureMode && "cursor-pointer",
        active && !matched && "hover:border-primary hover:bg-primary/5",
        matched && "border-green-300 bg-green-50 ring-1 ring-green-200",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        {structureMode && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs", matched ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground")}>
            {matched ? "已标注" : "待标注"}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

export function QuestionCardShell({
  card,
  mode,
  selectedOptionKey,
  onSelectOption,
  onConfirmAnswer,
  matchedParts,
  activeLabelKey = null,
  onDropLabel,
  onTargetClick,
}: QuestionCardShellProps) {
  const showAfter = mode === "quiz-after-answer" || mode === "structure-labeling"
  const selected = selectedOptionKey !== undefined

  return (
    <article className="rounded-[1.75rem] border border-border/80 bg-white/95 p-4 shadow-xl shadow-slate-900/5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{card.type === "news" ? "新闻类" : "图片类"}标准样例</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{card.title}</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {mode === "quiz-before-answer" ? "答题前" : mode === "quiz-after-answer" ? "答题后" : "结构标注"}
        </span>
      </div>

      <div className="space-y-4">
        <CardRegion
          partKey="material"
          title="① 素材展示"
          mode={mode}
          matchedParts={matchedParts}
          activeLabelKey={activeLabelKey}
          onDropLabel={onDropLabel}
          onTargetClick={onTargetClick}
        >
          <SampleMaterialImage material={card.material} />
        </CardRegion>

        <CardRegion
          partKey="task"
          title="② 判断任务"
          mode={mode}
          matchedParts={matchedParts}
          activeLabelKey={activeLabelKey}
          onDropLabel={onDropLabel}
          onTargetClick={onTargetClick}
        >
          <p className="text-sm leading-relaxed">{card.taskPrompt}</p>
          <div className="mt-3 grid gap-2">
            {card.options.map(option => (
              <label
                key={option.key}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  selectedOptionKey === option.key ? "border-primary bg-primary/5" : "border-input hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name={`${card.id}-choice`}
                  value={option.key}
                  checked={selectedOptionKey === option.key}
                  disabled={mode !== "quiz-before-answer"}
                  onChange={() => onSelectOption?.(option.key)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span>{option.key}. {option.label}</span>
              </label>
            ))}
          </div>
          {mode === "quiz-before-answer" && (
            <Button type="button" className="mt-4 w-full" disabled={!selected} onClick={onConfirmAnswer}>
              确认判断
            </Button>
          )}
        </CardRegion>

        {showAfter && selectedOptionKey && (
          <>
            <CardRegion
              partKey="explanation"
              title="③ 解析"
              mode={mode}
              matchedParts={matchedParts}
              activeLabelKey={activeLabelKey}
              onDropLabel={onDropLabel}
              onTargetClick={onTargetClick}
            >
              <SampleAnswerReveal card={card} selectedOptionKey={selectedOptionKey} />
            </CardRegion>

            <CardRegion
              partKey="source"
              title="④ 来源与核验入口"
              mode={mode}
              matchedParts={matchedParts}
              activeLabelKey={activeLabelKey}
              onDropLabel={onDropLabel}
              onTargetClick={onTargetClick}
            >
              <p className="text-sm text-muted-foreground">来源类型：{card.source.sourceTypeLabel}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {card.source.verificationTips.map(tip => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-primary">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardRegion>
          </>
        )}
      </div>
    </article>
  )
}
