/**
 * 文件说明：模块 1 写作设定按课时分组的展示壳。
 * 职责：给课时 2/3/4/5 汇总提供统一的课组标题、分课色条和块内交替浅底，不参与存档或完成判定。
 * 更新触发：课组标题、分课色条、块交替底色或分组结构变化时，需要同步更新本文件。
 */

import { Children, type ReactNode } from "react"
import { cn } from "@/shared/utils/cn"
import {
  MODULE1_WRITING_SUMMARY_GROUP_TITLES,
  type Module1WritingSummaryLessonKey,
} from "@/modules/module-1-ai-story/features/writing-drawer/module1-writing-summary-groups"

const LESSON_TONE: Record<Module1WritingSummaryLessonKey, {
  group: string
  header: string
  blockEven: string
  blockOdd: string
}> = {
  lesson1: {
    group: "rounded-lg border border-slate-200/80 border-l-4 border-l-slate-500 bg-slate-50/40",
    header: "bg-slate-100/90 text-slate-800",
    blockEven: "bg-background/90",
    blockOdd: "bg-slate-100/80",
  },
  lesson2: {
    group: "rounded-lg border border-emerald-200/70 border-l-4 border-l-emerald-600 bg-emerald-50/30",
    header: "bg-emerald-50 text-emerald-900",
    blockEven: "bg-background/90",
    blockOdd: "bg-emerald-50/80",
  },
  lesson3: {
    group: "rounded-lg border border-border border-l-4 border-l-stone-400 bg-muted/20",
    header: "bg-muted/70 text-foreground",
    blockEven: "bg-background/90",
    blockOdd: "bg-muted/50",
  },
  lesson4: {
    group: "rounded-lg border border-sky-200/70 border-l-4 border-l-sky-600 bg-sky-50/30",
    header: "bg-sky-50 text-sky-900",
    blockEven: "bg-background/90",
    blockOdd: "bg-sky-50/80",
  },
  lesson5: {
    group: "rounded-lg border border-amber-200/70 border-l-4 border-l-amber-600 bg-amber-50/30",
    header: "bg-amber-50 text-amber-900",
    blockEven: "bg-background/90",
    blockOdd: "bg-amber-50/80",
  },
}

interface Module1WritingSummaryGroupProps {
  lesson: Module1WritingSummaryLessonKey
  children: ReactNode
}

export function Module1WritingSummaryGroup({
  lesson,
  children,
}: Module1WritingSummaryGroupProps) {
  const tone = LESSON_TONE[lesson]
  return (
    <section className={cn("overflow-hidden", tone.group)}>
      <h3 className={cn("px-3 py-2 text-sm font-bold tracking-wide", tone.header)}>
        {MODULE1_WRITING_SUMMARY_GROUP_TITLES[lesson]}
      </h3>
      <div>
        {Children.map(children, (child, index) => (
          <div
            className={cn(
              "space-y-1 px-3 py-2.5",
              index % 2 === 0 ? tone.blockEven : tone.blockOdd,
            )}
          >
            {child}
          </div>
        ))}
      </div>
    </section>
  )
}

interface Module1WritingSummaryBlockProps {
  title?: string
  extra?: ReactNode
  children: ReactNode
}

export function Module1WritingSummaryBlock({
  title,
  extra,
  children,
}: Module1WritingSummaryBlockProps) {
  return (
    <>
      {(title || extra) && (
        <div className="flex items-center justify-between gap-2">
          {title ? <p className="font-semibold text-foreground">{title}</p> : <span />}
          {extra}
        </div>
      )}
      {children}
    </>
  )
}
