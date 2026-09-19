/**
 * 文件说明：模块 1 共用的右侧写作设定滑动抽屉壳。
 * 职责：提供与课时 2 第 2 关相同的右侧标签、Esc 关闭、有内容小圆点与约 380px 面板；默认收起，开合不落盘。课时 2/3 只往里塞各自汇总，不复制整套交互。
 * 更新触发：抽屉交互、默认开合、宽度、分层或窄屏底部全宽规则变化时，需要同步更新本文件。
 */

import { useEffect, useId, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

export interface Module1WritingDrawerProps {
  title: string
  handleLabel: string
  openLabel: string
  closeLabel: string
  hasContent: boolean
  children: ReactNode
}

export function Module1WritingDrawer({
  title,
  handleLabel,
  openLabel,
  closeLabel,
  hasContent,
  children,
}: Module1WritingDrawerProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

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
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen(current => !current)}
        className={cn(
          "fixed z-20 flex items-center justify-center gap-1.5 border bg-background shadow-md transition-colors hover:bg-accent",
          "right-0 top-[calc(var(--module1-sticky-stack-height,4rem)+var(--module1-lesson-chrome-height,5rem)+1.5rem)] h-28 w-8 rounded-l-md border-r-0",
          "md:h-32",
          "max-md:bottom-4 max-md:right-4 max-md:top-auto max-md:h-10 max-md:w-auto max-md:rounded-full max-md:border max-md:px-3",
        )}
      >
        {hasContent && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary max-md:static max-md:h-1.5 max-md:w-1.5"
          />
        )}
        <span className="text-[11px] font-medium leading-none [writing-mode:vertical-rl] max-md:[writing-mode:horizontal-tb]">
          {handleLabel}
        </span>
      </button>

      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={closeLabel}
          className="fixed inset-x-0 bottom-0 z-20 bg-black/20 md:hidden"
          style={{
            top: "calc(var(--module1-sticky-stack-height, 4rem) + var(--module1-lesson-chrome-height, 5rem))",
          }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id={panelId}
        role="complementary"
        aria-label={title}
        className={cn(
          "fixed z-[21] flex flex-col overflow-hidden border bg-background shadow-xl transition-transform duration-300",
          "bottom-0 right-0 top-[calc(var(--module1-sticky-stack-height,4rem)+var(--module1-lesson-chrome-height,5rem))] w-[min(100%,380px)] border-l",
          "max-md:inset-x-0 max-md:top-auto max-md:h-[min(85dvh,640px)] max-md:w-full max-md:rounded-t-xl max-md:border-l-0 max-md:border-t",
          open ? "translate-x-0 max-md:translate-y-0" : "translate-x-full pointer-events-none max-md:translate-x-0 max-md:translate-y-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">{title}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {children}
        </div>
      </aside>
    </>
  )
}
