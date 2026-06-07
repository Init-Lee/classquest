/**
 * 文件说明：模块 4 课时 5 assignment 列表组件。
 * 职责：在课堂标题框内只读展示学生本轮分配到的紧凑题序摘要，包括题型、序号、标题和当前进度状态，不展示完整题干、选项或解析。
 * 更新触发：assignment DTO 展示字段、C4b 列表文案、标题框布局或后续 C5 作答入口拆分变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import type { Lesson5AssignmentDto } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { cn } from "@/shared/utils/cn"

function getCardKindLabel(kind: Lesson5AssignmentDto["cardKind"]): string {
  return kind === "news" ? "新闻题卡" : "图片题卡"
}

function getMaterialTitle(assignment: Lesson5AssignmentDto): string {
  return assignment.material.titleOrName || assignment.itemShortName || getCardKindLabel(assignment.cardKind)
}

export function AssignmentList({
  assignments,
  loading,
  error,
  currentIndex = 0,
  answeredCount = 0,
  ratedCount = 0,
}: {
  assignments: Lesson5AssignmentDto[]
  loading: boolean
  error: string
  currentIndex?: number
  answeredCount?: number
  ratedCount?: number
}) {
  return (
    <div className="space-y-3">
      {loading && <p className="text-sm text-muted-foreground">正在读取分配列表...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && assignments.length === 0 && (
        <p className="text-sm text-muted-foreground">暂未读取到分配题卡，请稍后刷新课堂状态。</p>
      )}
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {assignments.map((assignment, index) => {
          const status = index < ratedCount ? "已评" : index < answeredCount ? "已答" : index === currentIndex ? "当前" : "未开始"
          const active = status === "当前"
          return (
            <div
              key={assignment.assignmentId}
              className={cn(
                "min-w-0 rounded-xl border px-2.5 py-2",
                active ? "border-slate-900 bg-slate-50" : "bg-white",
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <Badge variant={active ? "default" : "outline"}>第 {assignment.orderIndex} 题</Badge>
                <Badge variant={assignment.cardKind === "news" ? "secondary" : "warning"}>
                  {getCardKindLabel(assignment.cardKind)}
                </Badge>
              </div>
              <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                <h3 className="min-w-0 truncate text-xs font-semibold">{getMaterialTitle(assignment)}</h3>
                <span className="shrink-0 text-[11px] text-muted-foreground">{status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
