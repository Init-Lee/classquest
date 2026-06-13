/**
 * 文件说明：模块 4 课时 6 公共挑战进度条。
 * 职责：根据 answeredCount/questionCount 展示匿名公共挑战当前完成进度，供 PublicChallengeShell 编排使用。
 * 更新触发：公共挑战进度字段、进度条视觉样式或题数展示规则变化时，需要同步更新本文件。
 */

import { Progress } from "@/shared/ui/progress"

export function PublicChallengeProgress({
  answeredCount,
  questionCount,
}: {
  answeredCount: number
  questionCount: number
}) {
  const safeQuestionCount = Math.max(questionCount, 1)
  const safeAnsweredCount = Math.min(Math.max(answeredCount, 0), safeQuestionCount)
  const value = Math.round((safeAnsweredCount / safeQuestionCount) * 100)

  return (
    <div className="space-y-2 rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">挑战进度</span>
        <span className="text-muted-foreground">
          已答 {safeAnsweredCount} / {safeQuestionCount} 题
        </span>
      </div>
      <Progress value={value} className="h-2.5" aria-label={`公共挑战进度 ${value}%`} />
    </div>
  )
}
