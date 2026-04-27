/**
 * 文件说明：材料加工「统一逻辑」课堂全屏翻页演示
 * 职责：全屏遮罩、键盘与侧缘翻页；大屏左图右文、小屏上图下文；阅读区灰底实色
 * 更新触发：演示交互、版式、视口撑满（Portal + dvh）或与 unified-logic-content 联动调整时；缺图提示文案（assets 根目录 jpg）变化时
 */

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { UNIFIED_LOGIC_STEPS, UNIFIED_LOGIC_SLIDE_COUNT } from "../lib/unified-logic-content"

export interface UnifiedLogicPresentationProps {
  open: boolean
  /** false 表示关闭 */
  onOpenChange: (open: boolean) => void
  /** 与步骤顺序一致的配图 URL，可为空串占位 */
  imageUrls: string[]
}

export function UnifiedLogicPresentation({
  open,
  onOpenChange,
  imageUrls,
}: UnifiedLogicPresentationProps) {
  const [slideIndex, setSlideIndex] = useState(0)

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const goPrev = useCallback(() => {
    setSlideIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setSlideIndex((i) => Math.min(UNIFIED_LOGIC_SLIDE_COUNT - 1, i + 1))
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, close, goNext, goPrev])

  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [open])

  if (!open) return null

  const flowStep = UNIFIED_LOGIC_STEPS[slideIndex]
  const n = flowStep.narration
  const src = imageUrls[slideIndex]
  const pageNum = slideIndex + 1

  /** 挂到 body，避免被 AppShell/main 的层叠上下文与 padding 影响；h-dvh 锁一屏高度 */
  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-stone-900 text-stone-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unified-logic-present-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-600/80 px-3 py-2 sm:px-4">
        <h2 id="unified-logic-present-title" className="text-sm font-semibold sm:text-base truncate pr-2">
          材料加工的统一逻辑 · 第 {pageNum} / {UNIFIED_LOGIC_SLIDE_COUNT} 页
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-stone-200 hover:bg-stone-800 hover:text-white"
          onClick={close}
        >
          <X className="h-4 w-4 mr-1" aria-hidden />
          退出（Esc）
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <button
          type="button"
          aria-label="上一张"
          className="absolute left-0 top-0 z-10 h-full w-[18%] max-w-[120px] border-0 bg-transparent hover:bg-white/5 sm:max-w-[160px]"
          onClick={goPrev}
          disabled={slideIndex <= 0}
        />
        <button
          type="button"
          aria-label="下一张"
          className="absolute right-0 top-0 z-10 h-full w-[18%] max-w-[120px] border-0 bg-transparent hover:bg-white/5 sm:max-w-[160px]"
          onClick={goNext}
          disabled={slideIndex >= UNIFIED_LOGIC_SLIDE_COUNT - 1}
        />

        {/* 主阅读区：占满剩余高度，不撑开整页滚动；仅右侧文稿区在极矮屏可内滚 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-stone-300">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-3 py-3 text-stone-900 sm:px-6 sm:py-4 lg:flex-row lg:gap-8 xl:gap-10">
            {/* 左：配图在可用高度内居中，不额外撑高整页 */}
            <div className="flex min-h-0 w-full shrink-0 items-center justify-center lg:w-[56%] xl:w-[54%] lg:max-h-full">
              <div className="flex max-h-full min-h-[min(28vh,220px)] w-full items-center justify-center sm:min-h-[min(30vh,240px)] lg:min-h-0 lg:h-full">
                {src ? (
                  <img
                    src={src}
                    alt={`材料加工统一逻辑第 ${flowStep.step} 步示意图`}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-[0_20px_50px_-12px_rgba(28,25,23,0.45),0_8px_24px_-8px_rgba(28,25,23,0.25)] ring-1 ring-stone-600/15"
                  />
                ) : (
                  <div className="flex max-h-full min-h-[12rem] w-full items-center justify-center rounded-xl border border-dashed border-stone-400/70 bg-stone-200/40 px-4 text-center text-sm text-stone-600">
                    本页暂无配图：请将第 {flowStep.step} 格对应的 .jpg / .jpeg 放在 lesson-3/assets 根目录（按文件名排序）
                  </div>
                )}
              </div>
            </div>

            {/* 右：标题+讲稿整体在栏内垂直居中；过长时仅本块内滚动 */}
            <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden lg:max-h-full">
              <div className="mx-auto w-full min-h-0 max-h-full overflow-y-auto overscroll-y-contain pr-1 [scrollbar-gutter:stable]">
                <div className="mb-3 flex flex-wrap items-center gap-2 lg:mb-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-800 text-sm font-bold text-amber-50">
                    {flowStep.step}
                  </span>
                  <h3 className="text-base font-bold leading-tight sm:text-lg">
                    第 {pageNum} 页：{flowStep.headline}
                  </h3>
                </div>

                <div className="space-y-4 text-sm leading-snug sm:space-y-4 sm:text-[15px] sm:leading-relaxed">
                  <p className="text-base font-semibold leading-snug text-stone-900">{n.goldenSentence}</p>

                  <div>
                    <p className="mb-1 font-bold text-stone-800">内容解析</p>
                    <p className="text-stone-800">{n.analysis}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-bold text-stone-800">关键动作</p>
                    <p className="text-stone-800">{n.keyAction}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-bold text-stone-800">避坑指南</p>
                    <p className="text-stone-800">{n.pitfall}</p>
                  </div>

                  <div>
                    <p className="mb-1 font-bold text-stone-800">
                      <span aria-hidden>💡 </span>课堂提问
                    </p>
                    <p className="text-stone-800">{n.classroomQuestion}</p>
                  </div>

                  <footer className="border-t border-stone-400/80 pt-4">
                    <p className="font-semibold text-stone-900">{n.footerGoal}</p>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-stone-700 bg-stone-900 px-3 py-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-stone-500 bg-stone-800 text-stone-100 hover:bg-stone-700"
            onClick={goPrev}
            disabled={slideIndex <= 0}
            aria-label="上一张"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-stone-300">
            {slideIndex + 1} / {UNIFIED_LOGIC_SLIDE_COUNT}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-stone-500 bg-stone-800 text-stone-100 hover:bg-stone-700"
            onClick={goNext}
            disabled={slideIndex >= UNIFIED_LOGIC_SLIDE_COUNT - 1}
            aria-label="下一张"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
