/**
 * 文件说明：四部分题目卡结构图组件。
 * 职责：用卡片化方式展示素材展示、判断任务、解析、来源与核验入口四个结构部分，服务样例讲解和结构拆解。
 * 更新触发：题目卡结构、四部分文案或确认态展示方式变化时，需要同步更新本文件。
 */

import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import { CARD_PARTS } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/data/anatomy-cards"
import { cn } from "@/shared/utils/cn"

interface FourPartCardDiagramProps {
  highlightedPart?: CardPartKey
  confirmedParts?: CardPartKey[]
}

export function FourPartCardDiagram({ highlightedPart, confirmedParts = [] }: FourPartCardDiagramProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {CARD_PARTS.map((part, index) => {
        const confirmed = confirmedParts.includes(part.key)
        return (
          <div
            key={part.key}
            className={cn(
              "rounded-lg border p-4 space-y-2 bg-white",
              highlightedPart === part.key && "border-primary bg-primary/5",
              confirmed && "border-green-200 bg-green-50",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="font-semibold">{part.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{part.description}</p>
            <p className="text-xs text-muted-foreground">
              {part.key === "material" || part.key === "task" ? "答题前可见" : "答题后展开"}
              {confirmed ? " · 已确认" : ""}
            </p>
          </div>
        )
      })}
    </div>
  )
}
