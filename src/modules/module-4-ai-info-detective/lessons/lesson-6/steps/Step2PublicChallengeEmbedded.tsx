/**
 * 文件说明：模块 4 课时 6 第 2 关公共挑战嵌入页。
 * 职责：在课时 6 内嵌入 lesson6_class 公共 6 题挑战，并把完成摘要的允许字段写入 portfolio.lesson6.publicChallenge。
 * 更新触发：公共挑战 Shell 回调、课时 6 隐私边界、Step2 完成证据或 C4b Step3 入口策略变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { PublicChallengeSummary } from "@/modules/module-4-ai-info-detective/api/lesson6-types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { PublicChallengeShell } from "@/modules/module-4-ai-info-detective/features/public-challenge/PublicChallengeShell"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Lesson6StepLayout } from "../components/Lesson6StepLayout"

export default function Step2PublicChallengeEmbedded() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState("")

  const handleCompleted = async (summary: PublicChallengeSummary) => {
    if (!portfolio) return
    setSaveError("")
    try {
      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 6, stepId: 3 },
        lesson6: {
          ...portfolio.lesson6,
          publicChallenge: {
            context: "lesson6_class",
            questionCount: summary.questionCount,
            answeredCount: summary.answeredCount,
            completedAt: summary.completedAt || new Date().toISOString(),
            completed: summary.completed,
          },
        },
      })
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "公共挑战完成证据保存失败，请稍后重试。")
    }
  }

  if (!portfolio) return null

  const completed = portfolio.lesson6.publicChallenge?.completed === true

  return (
    <Lesson6StepLayout title="第2关 · 公共题库 6 题挑战" subtitle="完成一轮课时内公共挑战。系统只会在本地档案保存完成摘要，不保存 runId、答案、得分、排名或匿名 session。">
      <div className="space-y-6">
        {completed && (
          <Card className="border-emerald-100 bg-emerald-50/80">
            <CardHeader>
              <CardTitle className="text-emerald-950">公共挑战完成证据已保存</CardTitle>
              <CardDescription className="text-emerald-900/80">
                已答 {portfolio.lesson6.publicChallenge?.answeredCount ?? 0} / {portfolio.lesson6.publicChallenge?.questionCount ?? 6} 题；现在可以进入可信复盘并生成阶段快照。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/module/4/lesson/6/step/3")}>进入第 3 关复盘</Button>
            </CardContent>
          </Card>
        )}
        {saveError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{saveError}</p>}
        {!completed && (
          <PublicChallengeShell
            context="lesson6_class"
            embeddedInLesson6
            onLesson6Completed={handleCompleted}
          />
        )}
      </div>
    </Lesson6StepLayout>
  )
}
