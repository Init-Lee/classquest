/**
 * 文件说明：模块 4 课时 3 编辑区块容器。
 * 职责：统一题卡编辑器内各区块的标题、说明、状态和内容排版。
 * 更新触发：课时 3 编辑区块布局、状态展示或视觉层级变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"

export function CardEditorSection({
  id,
  title,
  description,
  complete,
  children,
}: {
  id: string
  title: string
  description: string
  complete: boolean
  children: ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-36">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            complete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900",
          )}
          >
            {complete ? "已完成" : "待补充"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
