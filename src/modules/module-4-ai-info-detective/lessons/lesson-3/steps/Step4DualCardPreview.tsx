/**
 * 文件说明：模块 4 课时 3 第 4 步双卡总览页。
 * 职责：展示新闻/图片两张 V1 题卡的最终预览，并将两张卡保存为等待课时 4 的 V1 初稿。
 * 更新触发：课时 3 完成状态、保存出口、总览字段或下一课衔接文案变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { evaluateLesson3QuickCheck } from "../utils/evaluate-lesson3-quickcheck"
import { Lesson3StepLayout } from "../components/Lesson3StepLayout"
import { QuestionCardLivePreview } from "../components/QuestionCardLivePreview"
import type { Lesson3PreviewMode } from "../components/PreviewModeTabs"

export default function Step4DualCardPreview() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const [newsMode, setNewsMode] = useState<Lesson3PreviewMode>("before")
  const [imageMode, setImageMode] = useState<Lesson3PreviewMode>("before")
  if (!portfolio) return null

  const lesson3 = portfolio.lesson3
  const canSave = lesson3.newsCard.selfCheck.allRequiredPassed && lesson3.imageCard.selfCheck.allRequiredPassed
  const saveV1 = () => {
    if (!canSave) return
    const now = new Date().toISOString()
    const nextLesson3 = {
      ...lesson3,
      step4Completed: true,
      newsCard: { ...lesson3.newsCard, status: "ready_for_lesson4" as const, updatedAt: now },
      imageCard: { ...lesson3.imageCard, status: "ready_for_lesson4" as const, updatedAt: now },
      finalPreviewConfirmed: true,
      finalPreviewConfirmedAt: now,
      completed: true,
      completedAt: now,
    }
    void savePortfolio({
      ...portfolio,
      progress: { lessonId: 3, stepId: 4 },
      lesson3: {
        ...nextLesson3,
        quickCheck: evaluateLesson3QuickCheck(nextLesson3),
      },
    })
  }

  return (
    <Lesson3StepLayout
      title="第4步 · 双卡总览保存"
      subtitle="最后检查两张题卡 V1 的答题前与答题后视图，确认后保存为课时3初稿。"
      footer={(
        <Button onClick={saveV1} disabled={!canSave || lesson3.completed}>
          {lesson3.completed ? "课时3 V1 初稿已保存" : "保存为课时3 V1 初稿，等待课时4互审与 V2 优化"}
        </Button>
      )}
    >
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">新闻题卡</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{lesson3.newsCard.selfCheck.allRequiredPassed ? "四部分齐全" : "仍需补充"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">图片题卡</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{lesson3.imageCard.selfCheck.allRequiredPassed ? "四部分齐全" : "仍需补充"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">保存状态</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{lesson3.completed ? "已保存，下一课进入互审与 V2 优化" : "尚未保存 V1 初稿"}</CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <QuestionCardLivePreview card={lesson3.newsCard} mode={newsMode} onModeChange={setNewsMode} />
        <QuestionCardLivePreview card={lesson3.imageCard} mode={imageMode} onModeChange={setImageMode} />
      </div>
    </Lesson3StepLayout>
  )
}
