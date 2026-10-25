/**
 * 文件说明：模块 2 顶栏本机保存状态提示。
 * 职责：按保存协调器的 saveState 显示“正在保存… / 已保存到本机 / 保存失败（保留输入，请重试）”，失败时提供重试按钮；“已保存到本机”只在事务完成后出现，教师模式与空闲时不显示。
 * 更新触发：saveState 状态、学生可见保存文案、重试交互或教师模式显示规则变化时，需要同步更新本文件。
 */

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"

export function Module2SaveStatus() {
  const { saveStatus, isTeacherMode, retrySave } = useModule2State()
  if (isTeacherMode || saveStatus.state === "idle") return null

  if (saveStatus.state === "saving") {
    return (
      <span role="status" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        正在保存…
      </span>
    )
  }
  if (saveStatus.state === "saved") {
    return (
      <span role="status" className="flex items-center gap-1 text-xs text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        已保存到本机
      </span>
    )
  }
  return (
    <span role="alert" className="flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      保存失败（保留输入，请重试）
      <Button variant="outline" size="sm" className="ml-1 h-6 px-2 text-xs" onClick={retrySave}>重试</Button>
    </span>
  )
}
