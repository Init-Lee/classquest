/**
 * 文件说明：模块 1 课时 3 四关共用的主任务 / 外部 AI 分栏壳。
 * 职责：桌面左 2/3 主任务、右 1/3 外部 AI；窄屏上下堆叠且 AI 在下。不承载完成判定或抽屉。
 * 更新触发：课时 3 四关桌面比例、窄屏堆叠或等高规则变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"

interface Lesson3StepSplitProps {
  main: ReactNode
  ai: ReactNode
  footer: ReactNode
}

export function Lesson3StepSplit({ main, ai, footer }: Lesson3StepSplitProps) {
  return (
    <>
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 [&>*]:h-full">{main}</div>
        {/* 桌面右栏留出抽屉把手宽度，避免与页内 AI 卡叠在一起 */}
        <div className="min-w-0 lg:pr-8 [&>*]:h-full">{ai}</div>
      </div>
      {footer}
    </>
  )
}
