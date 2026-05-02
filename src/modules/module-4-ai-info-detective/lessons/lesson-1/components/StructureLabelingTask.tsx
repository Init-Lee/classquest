/**
 * 文件说明：模块 4 课时 1 第 2 关结构标注任务组件。
 * 职责：提供四部分标签的拖拽与点击匹配交互，绑定 HTML 题卡区域，帮助学生识别素材展示、判断任务、解析、来源核验入口。
 * 更新触发：结构标签文案、匹配反馈、拖拽/点击交互规则或完成判定变化时，需要同步更新本文件。
 */

import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import type { Step2StructureLabel, Step2StructureMatched } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"
import { STEP2_STRUCTURE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/data/step2-sample-cards"
import { cn } from "@/shared/utils/cn"

interface StructureLabelingTaskProps {
  matchedParts: Step2StructureMatched
  activeLabelKey: CardPartKey | null
  feedback: string
  onSelectLabel: (key: CardPartKey) => void
}

function labelByKey(key: CardPartKey): Step2StructureLabel {
  return STEP2_STRUCTURE_LABELS.find(label => label.key === key) ?? STEP2_STRUCTURE_LABELS[0]
}

export function buildStructureFeedback(partKey: CardPartKey, droppedKey: CardPartKey): string {
  if (partKey === droppedKey) {
    return `已找到：${labelByKey(partKey).label}`
  }

  return `再想想：${labelByKey(droppedKey).hint}`
}

export function StructureLabelingTask({
  matchedParts,
  activeLabelKey,
  feedback,
  onSelectLabel,
}: StructureLabelingTaskProps) {
  const completedCount = STEP2_STRUCTURE_LABELS.filter(label => matchedParts[label.key]).length

  return (
    <div className="rounded-2xl border bg-background/90 p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">结构标注任务</p>
        <h3 className="mt-2 text-xl font-bold">把四个标签放到题卡对应区域</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          可以拖动标签到左侧题卡区域，也可以先点击标签，再点击题卡里的对应区域。
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {STEP2_STRUCTURE_LABELS.map(label => {
          const matched = matchedParts[label.key]
          const active = activeLabelKey === label.key
          return (
            <button
              key={label.key}
              type="button"
              draggable={!matched}
              disabled={matched}
              onClick={() => onSelectLabel(label.key)}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", label.key)
                event.dataTransfer.effectAllowed = "move"
              }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-all",
                matched && "border-green-200 bg-green-50 text-green-800",
                active && !matched && "border-primary bg-primary/10 text-primary ring-2 ring-primary/30",
                !matched && !active && "border-input bg-white hover:bg-accent",
              )}
            >
              <span className="font-semibold">{label.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{matched ? "已完成匹配" : label.hint}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
        <p>完成进度：{completedCount} / {STEP2_STRUCTURE_LABELS.length}</p>
        {feedback && <p className="mt-1 text-primary">{feedback}</p>}
      </div>
    </div>
  )
}
