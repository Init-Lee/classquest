/**
 * 文件说明：课时 1 第 2 关右侧职责知识卡。
 * 职责：展示「谁来做决定」的三步顺序，以及可折叠的 AARON 小故事；宽屏贴在主区右侧，窄屏堆在主区下方并可整卡收起。
 * 更新触发：职责顺序文案、AARON 折叠内容、整卡收起方式，或与第 3 关原作栏相同的宽窄布局变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { LESSON1_AARON, LESSON1_RESPONSIBILITIES } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"

export function SampleResponsibilityCard() {
  const [open, setOpen] = useState(true)

  return (
    <section className="min-w-0 rounded-lg border bg-muted/20 p-4" aria-label="谁来做决定">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">谁来做决定</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(value => !value)}>
          {open ? "收起" : "打开"}
        </Button>
      </div>
      {open && (
        <div className="mt-3 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <ol className="flex flex-col gap-2 text-sm">
            {LESSON1_RESPONSIBILITIES.map((item, index) => (
              <li key={item} className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0 rounded-md bg-secondary px-2 py-1 break-words">{index + 1}. {item}</span>
                {index < LESSON1_RESPONSIBILITIES.length - 1 && (
                  <span aria-hidden="true" className="text-muted-foreground">→</span>
                )}
              </li>
            ))}
          </ol>
          <details className="rounded-lg border bg-background p-4">
            <summary className="cursor-pointer text-sm font-medium">{LESSON1_AARON.title}</summary>
            <p className="mt-2 text-sm leading-relaxed">{LESSON1_AARON.body}</p>
            <a className="mt-2 inline-block break-all text-sm text-primary underline" href={LESSON1_AARON.href} target="_blank" rel="noreferrer">
              {LESSON1_AARON.linkLabel}
            </a>
          </details>
        </div>
      )}
    </section>
  )
}
