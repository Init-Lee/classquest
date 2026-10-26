/**
 * 文件说明：课时 1 第 2 关「谁来做决定」右侧滑出知识栏。
 * 职责：默认收起；点右侧竖标签滑出约 380px，再点标签、点关闭或按 Esc 收起。栏内是三步短段、已有教学图和可折叠的 AARON。开合只留在这一页，不写入档案，也不进学习包。窄屏仍从右侧滑出，不把整卡堆到四格下面。
 * 更新触发：职责短段、配图、AARON 折叠内容、滑出宽度、右侧标签位置，或窄屏仍从右侧滑出的规则变化时，需要同步更新本文件。
 */

import { useEffect, useId, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import { LESSON1_AARON, LESSON1_RESPONSIBILITIES } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"
import { guanDengAssetUrl } from "@/modules/module-2-ai-comic/lessons/lesson-1/sample/load-guan-deng-sample"

const PANEL_WIDTH = "min(100% - 2rem, 380px)"

function ResponsibilityFigures({
  figures,
}: {
  figures: (typeof LESSON1_RESPONSIBILITIES)[number]["figures"]
}) {
  return (
    <div className={figures.length > 1 ? "mt-2 grid grid-cols-2 gap-2" : "mt-2"}>
      {figures.map(figure => (
        <figure key={figure.file} className="min-w-0">
          <img
            src={guanDengAssetUrl(figure.file)}
            alt={figure.alt}
            width={1254}
            height={1254}
            className="h-auto w-full rounded-md border bg-muted/30"
          />
          <figcaption className="mt-1 text-xs leading-snug text-muted-foreground">{figure.caption}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export function SampleResponsibilityCard() {
  // 开合不落盘：只放在本组件状态里，离开页面即消失。
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const closeLabel = "收起谁来做决定"

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : "打开谁来做决定"}
        onClick={() => setOpen(current => !current)}
        className={cn(
          "fixed z-[22] flex w-8 items-center justify-center border bg-background shadow-md transition-[right,background-color] duration-300 hover:bg-accent",
          "right-0 top-[calc(var(--module2-sticky-stack-height,4rem)+var(--module2-lesson-chrome-height,5rem)+1.5rem)] h-36 rounded-l-md border-r-0",
        )}
        // 打开后标签贴在栏的左侧，仍可再点关闭。窄屏栏宽让出标签，避免一起超出屏幕。
        style={open ? { right: PANEL_WIDTH } : undefined}
      >
        <span className="text-[11px] font-medium leading-none [writing-mode:vertical-rl]">谁来做决定</span>
      </button>

      {/* 外层裁切收起中的栏，避免滑出视口后把页面撑出横向滚动。 */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-[21] overflow-hidden",
          "top-[calc(var(--module2-sticky-stack-height,4rem)+var(--module2-lesson-chrome-height,5rem))]",
          open ? "" : "pointer-events-none",
        )}
        style={{ width: PANEL_WIDTH }}
      >
        <aside
          id={panelId}
          role="complementary"
          aria-label="谁来做决定"
          aria-hidden={open ? undefined : true}
          inert={open ? undefined : true}
          className={cn(
            "flex h-full min-w-0 flex-col border-l bg-background shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <h2 className="text-sm font-semibold">谁来做决定</h2>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 shrink-0 p-0"
              onClick={() => setOpen(false)}
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <ol className="space-y-3">
              {LESSON1_RESPONSIBILITIES.map((item, index) => (
                <li key={item.title} className="text-sm">
                  <p className="font-medium">{index + 1}. {item.title}</p>
                  <p className="mt-1 leading-relaxed">{item.detail}</p>
                  <ResponsibilityFigures figures={item.figures} />
                </li>
              ))}
            </ol>
            <details className="rounded-lg border bg-muted/20 p-4">
              <summary className="cursor-pointer text-sm font-medium">{LESSON1_AARON.title}</summary>
              <p className="mt-2 text-sm leading-relaxed">{LESSON1_AARON.body}</p>
              <a className="mt-2 inline-block break-all text-sm text-primary underline" href={LESSON1_AARON.href} target="_blank" rel="noreferrer">
                {LESSON1_AARON.linkLabel}
              </a>
            </details>
          </div>
        </aside>
      </div>
    </>
  )
}
