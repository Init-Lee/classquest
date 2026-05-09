/**
 * 文件说明：模块 4 课时 2 全屏滚动布局组件。
 * 职责：为课时 2 独立提供上下吸附分屏体验，使用课时 2 自己的高度变量与背景出血规则，不依赖课时 1 组件。
 * 更新触发：课时 2 关卡栏高度变量、全屏段落滚动策略、背景出血范围或后续课时 2 分屏交互变化时，需要同步更新本文件。
 */

import { useEffect, type ReactNode } from "react"
import { cn } from "@/shared/utils/cn"

interface Lesson2ScreenPageProps {
  children: ReactNode
  className?: string
}

interface Lesson2ScreenSectionProps {
  bgClassName: string
  children: ReactNode
  className?: string
  id?: string
}

export function Lesson2ScreenPage({ children, className }: Lesson2ScreenPageProps) {
  useEffect(() => {
    const root = document.documentElement
    const prevSnap = root.style.scrollSnapType
    const prevPad = root.style.scrollPaddingTop
    root.style.scrollSnapType = "y proximity"
    root.style.scrollPaddingTop =
      "calc(var(--module4-sticky-stack-height, 7rem) + var(--module4-lesson2-chrome-h, 8rem))"
    return () => {
      root.style.scrollSnapType = prevSnap
      root.style.scrollPaddingTop = prevPad
    }
  }, [])

  return (
    <div className={cn("w-full max-w-none", className)}>
      {children}
    </div>
  )
}

export function Lesson2ScreenSection({
  bgClassName,
  children,
  className,
  id,
}: Lesson2ScreenSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "snap-start snap-always flex min-h-[var(--module4-lesson2-content-h,70dvh)] w-full flex-col justify-center px-4 py-8 sm:px-8 md:px-12 md:py-10 lg:px-16",
        bgClassName,
        className,
      )}
    >
      {children}
    </section>
  )
}
