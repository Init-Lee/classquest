/**
 * 文件说明：课时 1 阶段快照下载按钮。
 * 职责：供完成弹窗、首页课卡和教师课时页共用同一份 HTML 导出。外观为描边按钮，绿色边框和文字；默认文案标明交作业用。是否占满整行由调用方的 className 决定。按钮不可点时不下载。下载不写入学生本机档案。
 * 更新触发：按钮文案、颜色、禁用旁注或三个下载入口的启用规则变化时，需要同步更新本文件。
 */

import { Camera } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import type { Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { downloadModule2Lesson1StageSnapshot } from "@/modules/module-2-ai-comic/features/global-actions/lesson1-stage-snapshot"

export function Lesson1StageSnapshotButton({
  portfolio,
  enabled,
  label = "下载本课阶段快照（交作业用）",
  disabledHint = "完成本课后可下载",
  className,
}: {
  portfolio: Module2PortfolioV1
  enabled: boolean
  label?: string
  disabledHint?: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("border-green-600 text-green-800 hover:bg-green-50", className)}
      disabled={!enabled}
      title={enabled ? "交作业用。阶段快照不能恢复进度。" : disabledHint}
      onClick={() => {
        if (!enabled) return
        downloadModule2Lesson1StageSnapshot(portfolio)
      }}
    >
      <Camera className="mr-1 h-4 w-4" />
      {label}
    </Button>
  )
}
