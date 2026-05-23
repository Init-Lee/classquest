/**
 * 文件说明：模块 4 课时 3 结构完成度面板。
 * 职责：在编辑工作台右侧聚合四 Tab 必填项的本地自审状态，供学生确认可否保存 V1。
 * 更新触发：课时 3 自审指标、四段聚合规则或状态文案变化时，需要同步更新本文件。
 */

import type { Module4Lesson3CardSelfCheck } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { cn } from "@/shared/utils/cn"

const SECTIONS = [
  { label: "素材展示", complete: (check: Module4Lesson3CardSelfCheck) => check.materialReady },
  { label: "判断任务", complete: (check: Module4Lesson3CardSelfCheck) => check.taskReady && check.answerSelected },
  { label: "核心解析", complete: (check: Module4Lesson3CardSelfCheck) => check.explanationReady },
  { label: "来源核验", complete: (check: Module4Lesson3CardSelfCheck) => check.sourceReady && check.verificationReady },
] as const

export function InlineSelfCheckPanel({ selfCheck }: { selfCheck: Module4Lesson3CardSelfCheck }) {
  return (
    <div className="rounded-2xl border bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">结构完成度</p>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          selfCheck.allRequiredPassed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900",
        )}
        >
          {selfCheck.allRequiredPassed ? "可以保存 V1" : "建议补充"}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SECTIONS.map(section => {
          const ok = section.complete(selfCheck)
          return (
            <div key={section.label} className="flex items-center gap-2 text-xs text-slate-700">
              <span className={ok ? "text-green-600" : "text-amber-600"}>{ok ? "已完成" : "待补充"}</span>
              <span>{section.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
