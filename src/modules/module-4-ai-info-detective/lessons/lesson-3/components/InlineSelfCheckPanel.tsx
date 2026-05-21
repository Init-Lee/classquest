/**
 * 文件说明：模块 4 课时 3 嵌入式自审面板。
 * 职责：在题卡编辑区块内展示材料、任务、答案、解析和来源的轻量完成状态。
 * 更新触发：课时 3 自审指标、状态文案或区块展示方式变化时，需要同步更新本文件。
 */

import type { Module4Lesson3CardSelfCheck } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { cn } from "@/shared/utils/cn"

const ITEMS: Array<{ key: keyof Module4Lesson3CardSelfCheck; label: string }> = [
  { key: "materialReady", label: "素材展示" },
  { key: "taskReady", label: "判断任务" },
  { key: "answerSelected", label: "参考答案" },
  { key: "explanationReady", label: "核心解析" },
  { key: "sourceReady", label: "来源记录" },
  { key: "verificationReady", label: "核验入口" },
]

export function InlineSelfCheckPanel({ selfCheck }: { selfCheck: Module4Lesson3CardSelfCheck }) {
  return (
    <div className="rounded-2xl border bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">嵌入式自审</p>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          selfCheck.allRequiredPassed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900",
        )}
        >
          {selfCheck.allRequiredPassed ? "可以保存 V1" : "建议补充"}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {ITEMS.map(item => {
          const ok = Boolean(selfCheck[item.key])
          return (
            <div key={item.key} className="flex items-center gap-2 text-xs text-slate-700">
              <span className={ok ? "text-green-600" : "text-amber-600"}>{ok ? "已完成" : "待补充"}</span>
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
