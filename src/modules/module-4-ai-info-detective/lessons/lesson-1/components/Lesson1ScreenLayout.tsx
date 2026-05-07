/**
 * 文件说明：模块 4 课时 1 全屏滚动布局组件。
 * 职责：沉淀第 1 关已验证的屏幕式滚动体验，统一 scroll snap、固定关卡栏下方的可视高度和每屏基础排版，供课时 1 多个关卡复用。
 * 更新触发：课时 1 关卡栏高度变量、全屏段落滚动策略、屏幕段落内边距或后续提升到模块级布局时，需要同步更新本文件。
 */

import { useEffect, type ReactNode } from "react"
import { cn } from "@/shared/utils/cn"

interface Lesson1ScreenPageProps {
  children: ReactNode
  className?: string
}

interface Lesson1ScreenSectionProps {
  bgClassName: string
  children: ReactNode
  className?: string
  id?: string
}

export function Lesson1ScreenPage({ children, className }: Lesson1ScreenPageProps) {
  useEffect(() => {
    const root = document.documentElement
    const prevSnap = root.style.scrollSnapType
    const prevPad = root.style.scrollPaddingTop
    root.style.scrollSnapType = "y proximity"
    root.style.scrollPaddingTop =
      "calc(var(--module4-sticky-stack-height, 7rem) + var(--module4-lesson1-chrome-h, 8rem))"
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

export function Lesson1ScreenSection({
  bgClassName,
  children,
  className,
  id,
}: Lesson1ScreenSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "snap-start snap-always flex min-h-[var(--module4-lesson1-content-h,70dvh)] w-full flex-col justify-center px-4 py-8 sm:px-8 md:px-12 md:py-10 lg:px-16",
        bgClassName,
        className,
      )}
    >
      {children}
    </section>
  )
}
