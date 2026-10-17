/**
 * 文件说明：模块 2 课时 1 关卡建设中占位卡。
 * 职责：在四关正式实现前，明确告知“本关将在后续阶段实现”；不提供任何教学内容、输入框或完成按钮，避免被误认成已完成。
 * 更新触发：阶段 D 某一关正式实现后，该关不再使用本组件；全部四关实现后删除本文件。
 */

import { Construction } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { MODULE2_LESSON1_STEPS } from "@/modules/module-2-ai-comic/lessons/lesson-1/config"

export function Module2StepPlaceholder({ stepId }: { stepId: number }) {
  const navigate = useNavigate()
  const step = MODULE2_LESSON1_STEPS.find(item => item.id === stepId)

  return (
    <Card className="mx-auto max-w-2xl border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Construction className="h-5 w-5 text-muted-foreground" />
          第 {stepId} 关 · {step?.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium">本关将在后续阶段实现。</p>
        <p className="text-sm text-muted-foreground">
          这里暂时没有可完成的任务，也不会记录任何完成状态。请等待老师通知开放后再来。
        </p>
        <Button variant="outline" onClick={() => navigate("/module/2")}>返回模块首页</Button>
      </CardContent>
    </Card>
  )
}
