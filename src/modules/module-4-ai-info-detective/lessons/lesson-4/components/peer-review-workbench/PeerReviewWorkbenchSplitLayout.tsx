/**
 * 文件说明：课时 4 互审工作台左右分栏布局（自 lesson-3 工作台拷贝微调）。
 * 职责：提供 lg 双栏固定高度容器：左栏题卡试答与解析，右栏常驻互审评价（不再分两阶段整屏切换）。
 * 更新触发：互审工作台整体布局、响应式断点或高度约束变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { cn } from "@/shared/utils/cn"

export function PeerReviewWorkbenchSplitLayout({
  left,
  right,
  className,
}: {
  left: ReactNode
  right: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:min-h-[28rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch",
        className,
      )}
    >
      <section className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-2xl border bg-white">
        {left}
      </section>
      <section className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-2xl border bg-white">
        {right}
      </section>
    </div>
  )
}
