/**
 * 文件说明：模块 4 课时 4 第 2 关反馈收件箱页面。
 * 职责：读取 Step1 作者侧收到的同伴反馈，生成反馈摘要和作者决策，并在本地 portfolio 中标记 Step2 完成。
 * 更新触发：Step2 完成条件、反馈 digest 规则、作者决策交互或进入 Step3 的保存语义变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Lesson4FeedbackDecision } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Lesson4StepLayout } from "../components/Lesson4StepLayout"
import { FeedbackCardPanel } from "../components/feedback-inbox/FeedbackCardPanel"
import {
  buildLesson4FeedbackDigest,
  createLesson4FeedbackDecisionsFromDigest,
} from "../utils/build-lesson4-feedback-digest"
import {
  evaluateLesson4FeedbackDecisions,
  LESSON4_AUTHOR_PLAN_REQUIRED_MESSAGE,
} from "../utils/evaluate-lesson4-feedback-decisions"

export default function Step2FeedbackInbox() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const reviewJson = portfolio?.lesson4.outbound.receivedReviewJson
  const digest = useMemo(() => reviewJson ? buildLesson4FeedbackDigest(reviewJson) : null, [reviewJson])
  const initialDecisions = useMemo(() => {
    if (!digest) return []
    const saved = portfolio?.lesson4.feedbackInbox.decisions ?? []
    return saved.length > 0 ? saved : createLesson4FeedbackDecisionsFromDigest(digest)
  }, [digest, portfolio?.lesson4.feedbackInbox.decisions])
  const [decisions, setDecisions] = useState<Lesson4FeedbackDecision[]>(initialDecisions)
  const evaluation = evaluateLesson4FeedbackDecisions(decisions)
  const bannerErrors = evaluation.errors.filter(error => error !== LESSON4_AUTHOR_PLAN_REQUIRED_MESSAGE)
  const allPass = decisions.length === 0

  const updateDecision = (decisionId: string, patch: Partial<Lesson4FeedbackDecision>) => {
    setDecisions(current => current.map(decision => (
      decision.id === decisionId ? { ...decision, ...patch } : decision
    )))
  }

  const completeStep2 = async () => {
    if (!portfolio || !reviewJson || !digest || !evaluation.valid) return
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 4, stepId: 3 },
      lesson4: {
        ...portfolio.lesson4,
        feedbackInbox: {
          digestedAt: digest.createdAt,
          decisions,
          allFeedbackReviewed: true,
        },
        step2Completed: true,
      },
    })
    navigate("/module/4/lesson/4/step/3")
  }

  if (!portfolio) return null

  if (!reviewJson || !digest) {
    return (
      <Lesson4StepLayout title="第2关 · 反馈收件箱" subtitle="看懂同伴指出了什么，再决定怎么处理">
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-lg font-semibold">还没有收到可处理的同伴反馈</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Step2 只读取“我的题卡收到的反馈”。请先回到第 1 关，完成送审并拉取同伴审查结果。
            </p>
            <Button onClick={() => navigate("/module/4/lesson/4/step/1")}>返回第 1 关</Button>
          </CardContent>
        </Card>
      </Lesson4StepLayout>
    )
  }

  return (
    <Lesson4StepLayout
      title="第2关 · 反馈收件箱"
      subtitle="看懂同伴指出了什么，再决定怎么处理"
      footer={(
        <Button onClick={completeStep2} disabled={!evaluation.valid}>
          {allPass ? "确认反馈已读，进入 V2 确认" : "保存作者决策，进入第 3 关"}
        </Button>
      )}
    >
      <div className="space-y-6">
        {allPass && (
          <Card>
            <CardContent className="p-5">
              <p className="font-semibold">同伴没有指出必改问题</p>
              <p className="mt-1 text-sm text-muted-foreground">你可以在第 3 关沿用 V1 生成 V2，也可以自愿微调。</p>
            </CardContent>
          </Card>
        )}
        {bannerErrors.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {bannerErrors.join(" ")}
          </div>
        )}
        <div className="grid gap-5 xl:grid-cols-2">
          <FeedbackCardPanel card={digest.cards.news} decisions={decisions} onDecisionChange={updateDecision} />
          <FeedbackCardPanel card={digest.cards.image} decisions={decisions} onDecisionChange={updateDecision} />
        </div>
      </div>
    </Lesson4StepLayout>
  )
}

