/**
 * 文件说明：模块 4 课时 4 就绪保存操作栏。
 * 职责：展示 Lesson4 到 Lesson5 的数据库边界说明，并提供保存 ready_for_lesson5 本地准备包的最终 CTA。
 * 更新触发：Step4 最终 CTA 文案、保存边界或阻塞态交互变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import type { Lesson4ReadyStatus } from "../../utils/evaluate-lesson4-ready-for-lesson5"

export function ReadyForLesson5ActionBar({
  status,
  saving = false,
  postSaveLabel = "进入课时五网页试答",
  onSave,
}: {
  status: Lesson4ReadyStatus
  saving?: boolean
  postSaveLabel?: string
  onSave: () => void
}) {
  return (
    <div className="sticky bottom-4 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          本课只保存 V2 入库准备包。正式进入网页试答题库将在课时五开始时完成。
        </p>
        <Button type="button" disabled={status === "red" || saving} onClick={onSave}>
          {saving ? "保存中…" : `保存 V2 入库准备包，${postSaveLabel}`}
        </Button>
      </div>
    </div>
  )
}

