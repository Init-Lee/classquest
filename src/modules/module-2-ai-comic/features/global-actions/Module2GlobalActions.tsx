/**
 * 文件说明：模块 2 顶栏全局学习包操作（阶段 A 占位）。
 * 职责：固定按钮文案“保存学习包”“导入学习包”的位置；阶段 A 两个按钮均禁用并提示“下一阶段开放”，不提供任何假功能。
 * 更新触发：阶段 C 接入学习包导出/导入、按钮文案或教师模式显示规则变化时，需要同步更新本文件。
 */

import { Download, Upload } from "lucide-react"
import { Button } from "@/shared/ui/button"

const PENDING_HINT = "下一阶段开放"

export function Module2GlobalActions() {
  return (
    <div className="flex items-center gap-2">
      <span title={PENDING_HINT}>
        <Button variant="outline" size="sm" disabled aria-label={`保存学习包（${PENDING_HINT}）`}>
          <Download className="mr-1 h-4 w-4" />
          保存学习包
        </Button>
      </span>
      <span title={PENDING_HINT}>
        <Button variant="outline" size="sm" disabled aria-label={`导入学习包（${PENDING_HINT}）`}>
          <Upload className="mr-1 h-4 w-4" />
          导入学习包
        </Button>
      </span>
    </div>
  )
}
