/**
 * 文件说明：模块 4 课时 4 V2 修改说明组件。
 * 职责：在 Step3 中收集当前题卡的 V2 修改/沿用说明，并展示确认前缺失项。
 * 更新触发：V2 修改说明要求、确认校验反馈或 Step3 底部确认区布局变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import type { Lesson4V2CardReadiness } from "../../utils/evaluate-lesson4-v2-card-readiness"

export function V2RevisionSummaryPanel({
  summary,
  readiness,
  confirmed,
  onSummaryChange,
  onConfirm,
}: {
  summary: string
  readiness: Lesson4V2CardReadiness
  confirmed: boolean
  onSummaryChange: (summary: string) => void
  onConfirm: () => void
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-white p-5">
      <h3 className="font-semibold">V2 修改说明</h3>
      <Textarea
        value={summary}
        onChange={event => onSummaryChange(event.target.value)}
        placeholder="例如：根据同伴反馈补充了来源核验说明，并调整了判断任务表述。"
      />
      {(!readiness.ready || readiness.missing.length > 0 || readiness.unresolvedDecisionIds.length > 0) && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {readiness.missing.length > 0 && <p>缺少：{readiness.missing.join("、")}</p>}
          {readiness.unresolvedDecisionIds.length > 0 && <p>还有重改/安全反馈未标记解决。</p>}
        </div>
      )}
      <Button type="button" onClick={onConfirm} disabled={!readiness.ready}>
        {confirmed ? "已确认这张题卡为 V2" : "确认这张题卡为 V2"}
      </Button>
    </div>
  )
}

