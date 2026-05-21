/**
 * 文件说明：模块 4 课时 3 全屏滚动布局组件。
 * 职责：为课时 3 第 1 步提供上下吸附分屏体验，使用课时 3 自己的高度变量与背景出血规则，与课时 1、2 屏幕式步骤一致。
 * 更新触发：课时 3 关卡栏高度变量、全屏段落滚动策略、背景出血范围或后续课时 3 分屏交互变化时，需要同步更新本文件。
 */

import { useEffect, type ReactNode } from "react"
import { cn } from "@/shared/utils/cn"

interface Lesson3ScreenPageProps {
  children: ReactNode
  className?: string
}

interface Lesson3ScreenSectionProps {
  bgClassName: string
  children: ReactNode
  className?: string
  id?: string
}

export function Lesson3ScreenPage({ children, className }: Lesson3ScreenPageProps) {
  useEffect(() => {
    const root = document.documentElement
    const prevSnap = root.style.scrollSnapType
    const prevPad = root.style.scrollPaddingTop
    root.style.scrollSnapType = "y proximity"
    root.style.scrollPaddingTop =
      "calc(var(--module4-sticky-stack-height, 7rem) + var(--module4-lesson3-chrome-h, 8rem))"
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

export function Lesson3ScreenSection({
  bgClassName,
  children,
  className,
  id,
}: Lesson3ScreenSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "snap-start snap-always flex min-h-[var(--module4-lesson3-content-h,70dvh)] w-full flex-col justify-center px-4 py-8 sm:px-8 md:px-12 md:py-10 lg:px-16",
        bgClassName,
        className,
      )}
    >
      {children}
    </section>
  )
}
