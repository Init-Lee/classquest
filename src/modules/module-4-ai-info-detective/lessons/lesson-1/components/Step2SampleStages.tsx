/**
 * 文件说明：模块 4 课时 1 第 2 关样例卡分阶段学习组件。
 * 职责：将新闻类/图片类样例拆成观察判断与解析核验；田字型四部分配对由 `Step2SampleStructureStage` 实现，当前主要在课时 1 第 3 关复用；配对成功后在区域显示与结构含义对应的图标。
 * 更新触发：Step 2 分阶段流程、田字型结构区域（当前主要在 Step 3 复用）、是否隐藏与外层重复的顶栏标题（hideStageHeader）、结构图标映射、核验链接展示、拖拽配对交互或样例卡字段变化时，需要同步更新本文件。
 */

import { BookOpenCheck, CircleHelp, ExternalLink, ImageIcon, LayoutGrid, Link2, ListChecks, MousePointerClick, type LucideIcon } from "lucide-react"
import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import { STEP2_STRUCTURE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/data/step2-sample-cards"
import type { Step2OptionKey, Step2SampleCard, Step2StructureMatched } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"
import { SampleMaterialImage } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/SampleMaterialImage"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

interface SampleObserveStageProps {
  card: Step2SampleCard
  selectedOptionKey?: Step2OptionKey
  answered: boolean
  onSelectOption: (key: Step2OptionKey) => void
  onConfirmAnswer: () => void
  onContinue: () => void
  onPreviewOpen?: () => void
}

interface SampleRevealStageProps {
  card: Step2SampleCard
  selectedOptionKey: Step2OptionKey
  continueLabel: string
  onContinue: () => void
}

interface SampleStructureStageProps {
  eyebrow?: string
  title?: string
  /** 为 true 时不渲染顶栏图标+眉题+大标题（与外层 Lesson1StepLayout 标题重复时使用） */
  hideStageHeader?: boolean
  matchedParts: Step2StructureMatched
  activeLabelKey: CardPartKey | null
  feedback: string
  onSelectLabel: (key: CardPartKey) => void
  onDropLabel: (partKey: CardPartKey, droppedKey: CardPartKey) => void
  onTargetClick: (partKey: CardPartKey) => void
}

const STRUCTURE_ZONES: Array<{ key: CardPartKey; marker: string; hint: string }> = [
  { key: "material", marker: "区域 A", hint: "这里通常放原始材料" },
  { key: "task", marker: "区域 B", hint: "这里通常让同学作出判断" },
  { key: "explanation", marker: "区域 C", hint: "这里通常说明判断理由" },
  { key: "source", marker: "区域 D", hint: "这里通常给出核验入口" },
]

const STRUCTURE_ICONS: Record<CardPartKey, LucideIcon> = {
  material: ImageIcon,
  task: ListChecks,
  explanation: BookOpenCheck,
  source: Link2,
}

function optionText(card: Step2SampleCard, key: Step2OptionKey): string {
  const option = card.options.find(item => item.key === key)
  return option ? `${option.key}. ${option.label}` : key
}

function labelText(key: CardPartKey): string {
  return STEP2_STRUCTURE_LABELS.find(label => label.key === key)?.label ?? key
}

function sampleKindLabel(card: Step2SampleCard): string {
  return card.type === "news" ? "新闻报道" : "图片素材"
}

export function Step2SampleObserveStage({
  card,
  selectedOptionKey,
  answered,
  onSelectOption,
  onConfirmAnswer,
  onContinue,
  onPreviewOpen,
}: SampleObserveStageProps) {
  const selected = selectedOptionKey !== undefined

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] xl:gap-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold tracking-[0.16em] text-primary">{sampleKindLabel(card)}</p>
        <SampleMaterialImage material={card.material} onPreviewOpen={onPreviewOpen} />
      </div>

      <div className="rounded-[2rem] border bg-white/95 p-6 shadow-xl shadow-slate-900/5">
        <p className="text-sm font-semibold tracking-[0.16em] text-primary">你的判断</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{card.taskPrompt}</h2>
        <div className="mt-6 grid gap-3">
          {card.options.map(option => (
            <label
              key={option.key}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-base transition-colors",
                selectedOptionKey === option.key ? "border-primary bg-primary/5" : "border-input hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name={`${card.id}-stage-choice`}
                value={option.key}
                checked={selectedOptionKey === option.key}
                disabled={answered}
                onChange={() => onSelectOption(option.key)}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span>{option.key}. {option.label}</span>
            </label>
          ))}
        </div>
        <Button
          type="button"
          size="lg"
          disabled={!selected}
          className="mt-6 w-full rounded-full"
          onClick={answered ? onContinue : onConfirmAnswer}
        >
          {answered ? "查看解析与核验入口" : "确认判断并查看解析"}
        </Button>
      </div>
    </div>
  )
}

export function Step2SampleRevealStage({
  card,
  selectedOptionKey,
  continueLabel,
  onContinue,
}: SampleRevealStageProps) {
  const isCorrect = selectedOptionKey === card.correctOptionKey
  const optionFeedback = card.feedbackByOption?.[selectedOptionKey] ?? (isCorrect ? card.correctFeedback : card.incorrectFeedback)
  const sourceUrl = card.source.sourceUrl ?? card.source.verificationUrl

  return (
    <div className="mx-auto w-full max-w-7xl">
      <style>
        {`
          @keyframes step2SlideIn {
            from { opacity: 0; transform: translateX(1.25rem); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] xl:gap-10">
        <div className="grid min-h-0 gap-4">
          <div className="rounded-[1.75rem] border bg-white/90 p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-primary">样例缩略</p>
            <div className="origin-top scale-[0.92]">
              <SampleMaterialImage material={card.material} allowPreview={false} />
            </div>
          </div>
          <div
            className={cn(
              "rounded-[1.75rem] border p-5 shadow-sm",
              isCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950",
            )}
          >
            <p className="text-sm font-semibold tracking-[0.14em]">答题结果</p>
            <p className="mt-3 text-base"><strong>你的选择：</strong>{optionText(card, selectedOptionKey)}</p>
            <p className="mt-1 text-base"><strong>参考判断：</strong>{optionText(card, card.correctOptionKey)}</p>
            <p className="mt-3 text-sm leading-relaxed">{optionFeedback}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border bg-white/95 p-7 shadow-xl shadow-slate-900/5 motion-safe:animate-[step2SlideIn_420ms_ease-out]">
          <p className="text-sm font-semibold tracking-[0.16em] text-primary">解析与核验</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">为什么这样判断？</h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">{card.explanation}</p>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="font-semibold text-primary">素材来源与核验入口</p>
            <p className="mt-2 text-sm text-muted-foreground">来源类型：{card.source.sourceTypeLabel}</p>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {card.source.verificationLabel ?? "打开核验网页"}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {card.source.sourceLocator && (
              <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-relaxed text-muted-foreground">
                页面定位：{card.source.sourceLocator}
              </p>
            )}
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {card.source.verificationTips.map(tip => (
                <li key={tip} className="flex gap-2">
                  <span className="text-primary">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button type="button" size="lg" className="mt-6 rounded-full px-8" onClick={onContinue}>
            {continueLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Step2SampleStructureStage({
  eyebrow = "标准题目卡结构",
  title = "把四部分放进田字型区域",
  hideStageHeader = false,
  matchedParts,
  activeLabelKey,
  feedback,
  onSelectLabel,
  onDropLabel,
  onTargetClick,
}: SampleStructureStageProps) {
  const completedCount = STEP2_STRUCTURE_LABELS.filter(label => matchedParts[label.key]).length

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 xl:grid-cols-[3fr_1fr] xl:gap-8">
      <div className="rounded-[2rem] border bg-white/90 p-5 shadow-xl shadow-slate-900/5">
        {!hideStageHeader && (
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary">{eyebrow}</p>
              <h2 className="text-2xl font-bold">{title}</h2>
            </div>
          </div>
        )}

        <div className="grid min-h-[28rem] grid-cols-2 gap-4 rounded-[1.5rem] bg-muted/35 p-4">
          {STRUCTURE_ZONES.map(zone => {
            const matched = matchedParts[zone.key]
            const active = activeLabelKey !== null
            const MatchedIcon = STRUCTURE_ICONS[zone.key]
            return (
              <div
                key={zone.key}
                role="button"
                tabIndex={0}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onTargetClick(zone.key)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return
                  event.preventDefault()
                  onTargetClick(zone.key)
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const droppedKey = event.dataTransfer.getData("text/plain") as CardPartKey
                  onDropLabel(zone.key, droppedKey)
                }}
                className={cn(
                  "group flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 text-center transition-all",
                  "bg-white/55 backdrop-blur-sm",
                  active && !matched && "hover:border-primary hover:bg-primary/5",
                  matched ? "border-green-300 bg-green-50/90 text-green-900" : "border-slate-200 text-muted-foreground",
                )}
              >
                <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold shadow-sm">{zone.marker}</span>
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm",
                    matched ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary",
                  )}
                  aria-hidden
                >
                  {matched ? <MatchedIcon className="h-8 w-8" /> : <CircleHelp className="h-8 w-8" />}
                </span>
                <span className={cn("text-2xl font-bold", matched ? "text-green-800" : "text-primary")}>
                  {matched ? labelText(zone.key) : "等待配对"}
                </span>
                <span className={cn("text-sm", matched ? "font-semibold text-green-700" : "text-muted-foreground")}>
                  {matched ? "匹配正确，已放入结构标签" : zone.hint}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border bg-white/95 p-5 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-5 w-5 text-primary" />
          <p className="font-semibold">拖拽四张结构卡片</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          可以拖动标签到左侧区域，也可以先点标签再点区域。
        </p>
        <div className="mt-4 grid gap-3">
          {STEP2_STRUCTURE_LABELS.map(label => {
            const matched = matchedParts[label.key]
            const active = activeLabelKey === label.key
            const LabelIcon = STRUCTURE_ICONS[label.key]
            return (
              <div
                key={label.key}
                role="button"
                tabIndex={matched ? -1 : 0}
                aria-disabled={matched}
                draggable={!matched}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (matched) return
                  onSelectLabel(label.key)
                }}
                onKeyDown={(event) => {
                  if (matched || (event.key !== "Enter" && event.key !== " ")) return
                  event.preventDefault()
                  onSelectLabel(label.key)
                }}
                onDragStart={(event) => {
                  if (matched) {
                    event.preventDefault()
                    return
                  }
                  event.dataTransfer.setData("text/plain", label.key)
                  event.dataTransfer.effectAllowed = "move"
                }}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left text-sm transition-all",
                  matched && "border-green-200 bg-green-50 text-green-800",
                  active && !matched && "border-primary bg-primary/10 text-primary ring-2 ring-primary/30",
                  !matched && !active && "border-input bg-white hover:bg-accent",
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {matched && <LabelIcon className="h-4 w-4 text-green-600" />}
                  {label.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {matched ? "已完成匹配" : active ? "已选中，请点左侧对应区域" : label.hint}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 rounded-2xl bg-muted/40 p-3 text-sm text-muted-foreground">
          <p>完成进度：{completedCount} / {STEP2_STRUCTURE_LABELS.length}</p>
          {feedback && <p className="mt-1 text-primary">{feedback}</p>}
        </div>
      </div>
    </div>
  )
}
