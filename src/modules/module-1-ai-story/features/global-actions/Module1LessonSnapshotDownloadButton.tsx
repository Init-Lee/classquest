/**
 * 文件说明：模块 1 课时阶段快照下载按钮。
 * 职责：按指定课时号触发同一套 HTML 快照导出，供首页课卡和完成弹窗复用；文案标明交作业用，不能恢复进度。
 * 更新触发：快照按钮文案、禁用旁注、课时号导出入口或课卡/完成弹窗样式变化时，需要同步更新本文件。
 */

import { Camera } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import type { Module1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { downloadModule1SnapshotByLessonId } from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"

export function Module1LessonSnapshotDownloadButton({
  portfolio,
  lessonId,
  enabled,
  disabledHint = "完成本课后可下载",
  className,
}: {
  portfolio: Module1Portfolio
  lessonId: number
  enabled: boolean
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
      onClick={() => downloadModule1SnapshotByLessonId(portfolio, lessonId)}
    >
      <Camera className="mr-1 h-4 w-4" />
      下载本课阶段快照（交作业用）
    </Button>
  )
}
