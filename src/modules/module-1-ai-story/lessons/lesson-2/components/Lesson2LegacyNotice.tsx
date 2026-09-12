/**
 * 文件说明：模块 1 课时 2 旧版记录提示。
 * 职责：说明当前档案来自旧风格卡版本，原内容已归档，需按新课补齐参照与人物。
 * 更新触发：旧档迁移提示文案或归档查看交互变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"

interface Lesson2LegacyNoticeProps {
  legacy: Record<string, unknown> | null
}

export function Lesson2LegacyNotice({ legacy }: Lesson2LegacyNoticeProps) {
  const [open, setOpen] = useState(false)
  if (!legacy) return null
  const styleName = typeof legacy.styleName === "string" ? legacy.styleName : ""
  const styleWhy = typeof legacy.styleWhy === "string" ? legacy.styleWhy : ""
  const who = typeof legacy.protagonistIdentity === "string" ? legacy.protagonistIdentity : ""
  const want = typeof legacy.goal === "string" ? legacy.goal : ""
  const blocked = typeof legacy.obstacle === "string" ? legacy.obstacle : ""
  const change = typeof legacy.changeAction === "string" ? legacy.changeAction : ""

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <p>{MODULE1_LESSON2_SHARED_COPY.legacyNotice}</p>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(current => !current)}>
        {open ? "收起旧版记录" : "查看旧版记录"}
      </Button>
      {open && (
        <div className="space-y-1 rounded-md bg-white/70 p-3 text-xs leading-relaxed">
          <p>已保留旧版内容。旧风格卡名称只作归档查看，不能当作真实文学参照。</p>
          {styleName && <p>原风格名称：{styleName}</p>}
          {styleWhy && <p>原选择理由：{styleWhy}</p>}
          {who && <p>原我是谁：{who}</p>}
          {want && <p>原我想要：{want}</p>}
          {blocked && <p>原我卡在：{blocked}</p>}
          {change && <p>原我改变（未自动拆成行动与变化）：{change}</p>}
        </div>
      )}
    </div>
  )
}
