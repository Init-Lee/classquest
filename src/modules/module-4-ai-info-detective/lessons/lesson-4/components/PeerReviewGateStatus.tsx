/**
 * 文件说明：模块 4 课时 4 双条件通关状态组件。
 * 职责：展示“我的题卡已被同伴审查”和“我已完成一次同伴题卡审查”两个独立 gate 条件。
 * 更新触发：课时 4 通关条件、状态文案或顶部提示布局变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import type { Lesson4GateEvaluation } from "../utils/evaluate-lesson4-gate"

function ConditionRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
      <span className="text-sm">{done ? "☑" : "□"} {label}</span>
      <Badge variant={done ? "success" : "secondary"}>{done ? "已完成" : "待完成"}</Badge>
    </div>
  )
}

export function PeerReviewGateStatus({ gate }: { gate: Lesson4GateEvaluation }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-primary">通关条件</p>
            <p className="text-xs text-muted-foreground">两个条件互相独立，三人环形互审也可以通关。</p>
          </div>
          <Badge variant={gate.gatePassed ? "success" : "warning"}>
            {gate.gatePassed ? "可以进入 V2 修改" : "还需完成互审"}
          </Badge>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <ConditionRow done={gate.outboundReviewed} label="我的题卡已被同伴审查" />
          <ConditionRow done={gate.inboundReviewed} label="我已完成一次同伴题卡审查" />
        </div>
        {gate.gatePassed && <p className="text-sm font-medium text-green-700">两个条件都已完成，可以进入 V2 修改。</p>}
      </CardContent>
    </Card>
  )
}
