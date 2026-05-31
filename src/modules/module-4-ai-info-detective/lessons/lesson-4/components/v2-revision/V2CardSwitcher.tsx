/**
 * 文件说明：模块 4 课时 4 V2 题卡切换组件。
 * 职责：在 Step3 修改台顶部切换新闻题卡与图片题卡，并展示各卡确认状态。
 * 更新触发：Step3 卡片数量、分卡命名或确认状态展示规则变化时，需要同步更新本文件。
 */

import type { Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { getLesson4CardLabel } from "../../utils/build-lesson4-feedback-digest"

export function V2CardSwitcher({
  activeKind,
  confirmed,
  onChange,
}: {
  activeKind: Module4MaterialKind
  confirmed: Record<Module4MaterialKind, boolean>
  onChange: (kind: Module4MaterialKind) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["news", "image"] as Module4MaterialKind[]).map(kind => (
        <Button
          key={kind}
          type="button"
          variant={activeKind === kind ? "default" : "outline"}
          onClick={() => onChange(kind)}
        >
          {getLesson4CardLabel(kind)}
          {confirmed[kind] ? " · 已确认" : " · 待确认"}
        </Button>
      ))}
    </div>
  )
}

