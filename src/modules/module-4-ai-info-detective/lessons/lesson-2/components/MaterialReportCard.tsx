/**
 * 文件说明：模块 4 课时 2 素材体检报告卡片。
 * 职责：在第 5 关和快照前预览中汇总单份素材的资产、来源、自检、线索与完成状态。
 * 更新触发：课时 2 报告字段、绿勾含义或进入下一课条件变化时，需要同步更新本文件。
 */

import { CheckCircle2 } from "lucide-react"
import type { Module4MaterialScreeningRecord } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON2_SOURCE_TYPE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { isLesson2MaterialComplete } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/material-completion"
import { Badge } from "@/shared/ui/badge"

export function MaterialReportCard({ title, record }: { title: string; record: Module4MaterialScreeningRecord }) {
  const complete = isLesson2MaterialComplete(record)
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant={complete ? "success" : "warning"}>{complete ? "基础准备已完成" : "仍需补充"}</Badge>
      </div>
      {record.asset && <img src={record.asset.dataUrl} alt={`${title}预览`} className="mb-4 max-h-64 w-full rounded-2xl border object-contain" />}
      <div className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">素材短名：</span>{record.titleOrName || "未填写"}</p>
        <p><span className="text-muted-foreground">来源类型：</span>{record.sourceType ? LESSON2_SOURCE_TYPE_LABELS[record.sourceType] : "未选择"}</p>
        <p><span className="text-muted-foreground">来源记录：</span>{record.sourceRecord || "未填写"}</p>
        <p><span className="text-muted-foreground">来源格式：</span>{record.sourceAutoPassed ? "来源记录格式通过" : "尚未通过"}</p>
        <p><span className="text-muted-foreground">初步疑点：</span>{record.clueNote || "未填写"}</p>
        <p><span className="text-muted-foreground">交流记录：</span>{record.peerFeedbackNote || "未填写"}</p>
      </div>
      {complete && (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          这份素材已完成进入下一课所需的基础准备，不代表它已经是最终优秀题目。
        </p>
      )}
    </div>
  )
}
