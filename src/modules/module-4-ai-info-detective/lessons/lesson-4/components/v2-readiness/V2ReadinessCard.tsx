/**
 * 文件说明：模块 4 课时 4 V2 就绪报告卡片。
 * 职责：展示单张 V2 题卡的 green/amber/red 就绪状态、阻塞说明和检查清单。
 * 更新触发：Step4 分卡报告布局、状态文案或三色状态规则变化时，需要同步更新本文件。
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { getLesson4CardLabel } from "../../utils/build-lesson4-feedback-digest"
import type { Lesson4CardReadinessReport, Lesson4ReadyStatus } from "../../utils/evaluate-lesson4-ready-for-lesson5"
import { V2ReadinessChecklist } from "./V2ReadinessChecklist"

const STATUS_LABELS: Record<Lesson4ReadyStatus, string> = {
  green: "就绪",
  amber: "可继续，带提醒",
  red: "阻塞",
}

const STATUS_CLASS_NAMES: Record<Lesson4ReadyStatus, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
}

export function V2ReadinessCard({ report }: { report: Lesson4CardReadinessReport }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{getLesson4CardLabel(report.cardKind)} V2</CardTitle>
          <Badge variant="outline" className={STATUS_CLASS_NAMES[report.status]}>{STATUS_LABELS[report.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.messages.length > 0 && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {report.messages.join("；")}
          </div>
        )}
        <V2ReadinessChecklist report={report} />
      </CardContent>
    </Card>
  )
}

