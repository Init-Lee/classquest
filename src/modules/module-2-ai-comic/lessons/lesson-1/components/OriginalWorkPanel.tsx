/**
 * 文件说明：课时 1 学生原作阅读面板。
 * 职责：展示已确认小说的题目和起承转合，供选画面时随时对照；窄屏放在表单下方，宽屏放在右侧并可收起。
 * 更新触发：原作展示字段、收起方式或窄屏位置变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { LESSON1_PARTS } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"
import type { SourceSnapshot } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export function OriginalWorkPanel({ source }: { source: SourceSnapshot }) {
  const [open, setOpen] = useState(true)

  return (
    <section className="min-w-0 rounded-lg border bg-muted/20 p-4" aria-label="我的原作">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">我的原作</h2>
          <p className="truncate text-sm text-muted-foreground">{source.storyTitle}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(value => !value)}>
          {open ? "收起" : "打开"}
        </Button>
      </div>
      {open && (
        <div className="mt-3 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {LESSON1_PARTS.map(part => (
            <article key={part.id}>
              <h3 className="text-sm font-medium">{part.label}</h3>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{source.parts[part.id]}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
