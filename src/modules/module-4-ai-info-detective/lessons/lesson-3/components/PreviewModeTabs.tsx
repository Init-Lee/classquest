/**
 * 文件说明：模块 4 课时 3 预览模式切换组件。
 * 职责：在答题前与答题后两种预览状态之间切换，并把切换事件交给调用方记录。
 * 更新触发：题卡预览模式、切换文案或计数策略变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

export type Lesson3PreviewMode = "before" | "after"

export function PreviewModeTabs({
  mode,
  onModeChange,
}: {
  mode: Lesson3PreviewMode
  onModeChange: (mode: Lesson3PreviewMode) => void
}) {
  return (
    <div className="inline-flex w-auto shrink-0 rounded-lg border bg-slate-50 p-0.5">
      {[
        { key: "before" as const, label: "答题前" },
        { key: "after" as const, label: "答题后" },
      ].map(item => (
        <Button
          key={item.key}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 rounded-md px-2.5 text-xs",
            mode === item.key && "bg-white shadow-sm",
          )}
          onClick={() => onModeChange(item.key)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}
