/**
 * 文件说明：模块 1 课时 3 待复核横幅。
 * 职责：提示上游或本课前文更新后保留的正文，并在必填齐全时允许确认保留。
 * 更新触发：课时 3 复核文案、可确认条件或清除标记范围变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"

interface Lesson3ReviewBannerProps {
  visible: boolean
  message?: string
  confirmEnabled: boolean
  onConfirm: () => void
}

export function Lesson3ReviewBanner({
  visible,
  message = MODULE1_LESSON3_SHARED_COPY.upstreamChanged,
  confirmEnabled,
  onConfirm,
}: Lesson3ReviewBannerProps) {
  if (!visible) return null
  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p>{message}</p>
      <Button type="button" size="sm" variant="outline" disabled={!confirmEnabled} onClick={onConfirm}>
        {MODULE1_LESSON3_SHARED_COPY.confirmReview}
      </Button>
    </div>
  )
}
