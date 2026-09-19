/**
 * 文件说明：模块 1 课时 3 四关共用的主任务 / 外部 AI 分栏壳。
 * 职责：按 aiPlacement 决定左右比例与窄屏上下顺序。end（第1/2关）桌面左主任务 2/3、右可选 AI 1/3，窄屏 AI 在下；start（第3/4关）桌面左必用 AI 1/3、右主任务 2/3，窄屏 AI 在上。不承载完成判定或抽屉。
 * 更新触发：课时 3 四关桌面比例、AI 栏位置、窄屏堆叠或等高规则变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"

interface Lesson3StepSplitProps {
  main: ReactNode
  ai: ReactNode
  footer: ReactNode
  /** end：主任务在左、AI 在右；start：AI 在左、主任务在右。 */
  aiPlacement?: "end" | "start"
}

export function Lesson3StepSplit({
  main,
  ai,
  footer,
  aiPlacement = "end",
}: Lesson3StepSplitProps) {
  const aiFirst = aiPlacement === "start"
  return (
    <>
      <div
        className={
          aiFirst
            ? "grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
            : "grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        }
      >
        {aiFirst ? (
          <>
            <div className="min-w-0 [&>*]:h-full">{ai}</div>
            {/* 主任务在右栏时同样避开抽屉把手 */}
            <div className="min-w-0 lg:pr-8 [&>*]:h-full">{main}</div>
          </>
        ) : (
          <>
            <div className="min-w-0 [&>*]:h-full">{main}</div>
            {/* 桌面右栏留出抽屉把手宽度，避免与页内 AI 卡叠在一起 */}
            <div className="min-w-0 lg:pr-8 [&>*]:h-full">{ai}</div>
          </>
        )}
      </div>
      {footer}
    </>
  )
}
