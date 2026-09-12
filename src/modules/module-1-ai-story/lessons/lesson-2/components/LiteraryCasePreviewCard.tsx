/**
 * 文件说明：模块 1 课时 2 第 1 关课堂文学案例预览卡。
 * 职责：用轻量标题、出处短标、封面和一句提示展示一则案例；点卡片打开详情，点选用按钮才写入观察对象。
 * 更新触发：第 1 关预览字段、选中高亮或「查看 / 选用」分工变化时，需要同步更新本文件。
 */

import { CheckCircle2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import type { Module1LiteraryCase } from "@/modules/module-1-ai-story/constants/literary-cases"
import { cn } from "@/shared/utils/cn"

interface LiteraryCasePreviewCardProps {
  literaryCase: Module1LiteraryCase
  selected: boolean
  onOpen: () => void
  onSelect: () => void
}

export function LiteraryCasePreviewCard({
  literaryCase,
  selected,
  onOpen,
  onSelect,
}: LiteraryCasePreviewCardProps) {
  return (
    <article
      className={cn(
        "flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-colors",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-background hover:border-primary/40",
      )}
      onClick={onOpen}
    >
      <img
        src={literaryCase.illustrationSrc}
        alt={literaryCase.illustrationAlt}
        className="aspect-[3/2] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">{literaryCase.cardTitle}</h3>
          {selected && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {literaryCase.author} · {literaryCase.teachingRole}
        </p>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{literaryCase.focus}</p>
        <p className="text-xs text-primary">{MODULE1_LESSON2_SHARED_COPY.viewStudyCaseHint}</p>
        <Button
          type="button"
          size="sm"
          className="mt-auto w-full"
          variant={selected ? "default" : "outline"}
          aria-pressed={selected}
          onClick={event => {
            event.stopPropagation()
            onSelect()
          }}
        >
          {selected ? MODULE1_LESSON2_SHARED_COPY.selectedStudyCase : MODULE1_LESSON2_SHARED_COPY.selectStudyCase}
        </Button>
      </div>
    </article>
  )
}
