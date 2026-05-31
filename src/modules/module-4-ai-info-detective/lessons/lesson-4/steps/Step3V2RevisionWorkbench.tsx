/**
 * 文件说明：模块 4 课时 4 第 3 关 V2 修改台页面。
 * 职责：从课时 3 V1 题卡初始化本地 V2 草稿，挂载满屏 wizard 修改台，根据 Step2 决策完成两卡确认。
 * 更新触发：Step3 修改流程、V2 草稿字段、反馈解决规则或两卡确认完成语义变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Lesson4FeedbackDecision, Module4Lesson4V2CardDraft, Module4Lesson4V2State, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { V2RevisionWorkbench } from "../components/v2-revision-workbench/V2RevisionWorkbench"
import { buildLesson4V2DraftFromLesson3Card } from "../utils/build-lesson4-v2-draft"
import { evaluateLesson4V2CardReadiness } from "../utils/evaluate-lesson4-v2-card-readiness"
import {
  getPendingLesson4V2CardKind,
  isLesson4V2Step3Complete,
} from "../utils/lesson4-v2-step3-progress"
import { resolveLesson4FeedbackDecision, unresolveLesson4FeedbackDecision } from "../utils/resolve-lesson4-feedback-decision"

function buildInitialV2State(portfolio: NonNullable<ReturnType<typeof useModule4Portfolio>["portfolio"]>): Module4Lesson4V2State {
  const saved = portfolio.lesson4.v2
  if (saved.newsCard.baseV1CardId || saved.imageCard.baseV1CardId) return saved
  return {
    newsCard: buildLesson4V2DraftFromLesson3Card(portfolio.lesson3.newsCard),
    imageCard: buildLesson4V2DraftFromLesson3Card(portfolio.lesson3.imageCard),
    newsConfirmed: false,
    imageConfirmed: false,
    confirmedAt: "",
  }
}

export default function Step3V2RevisionWorkbench() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [activeKind, setActiveKind] = useState<Module4MaterialKind>("news")
  const initialV2 = useMemo(() => portfolio ? buildInitialV2State(portfolio) : null, [portfolio])
  const [v2, setV2] = useState<Module4Lesson4V2State | null>(initialV2)
  const [decisions, setDecisions] = useState<Lesson4FeedbackDecision[]>(portfolio?.lesson4.feedbackInbox.decisions ?? [])
  const [resolveNote, setResolveNote] = useState("")

  if (!portfolio || !v2) return null

  const activeCard = activeKind === "news" ? v2.newsCard : v2.imageCard
  const activeConfirmed = activeKind === "news" ? v2.newsConfirmed : v2.imageConfirmed
  const readiness = evaluateLesson4V2CardReadiness(activeCard, decisions)
  const noActionItems = decisions.length === 0
  const receivedReviewJson = portfolio.lesson4.outbound.receivedReviewJson
  const step3Complete = isLesson4V2Step3Complete(v2) || portfolio.lesson4.step3Completed

  const goToStep4 = async () => {
    if (!step3Complete) return
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 4, stepId: 4 },
      lesson4: {
        ...portfolio.lesson4,
        feedbackInbox: {
          ...portfolio.lesson4.feedbackInbox,
          decisions,
        },
        v2,
        step3Completed: true,
      },
    })
    navigate("/module/4/lesson/4/step/4", { replace: true })
  }

  const patchActiveCard = (card: Module4Lesson4V2CardDraft) => {
    setV2(current => {
      if (!current) return current
      return activeKind === "news"
        ? { ...current, newsCard: card, newsConfirmed: false }
        : { ...current, imageCard: card, imageConfirmed: false }
    })
  }

  const persist = async (nextV2: Module4Lesson4V2State, nextDecisions = decisions, step3Completed = false) => {
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 4, stepId: step3Completed ? 4 : 3 },
      lesson4: {
        ...portfolio.lesson4,
        feedbackInbox: {
          ...portfolio.lesson4.feedbackInbox,
          decisions: nextDecisions,
        },
        v2: nextV2,
        step3Completed,
      },
    })
  }

  const resolveDecision = (decisionId: string) => {
    const result = resolveLesson4FeedbackDecision(decisions, activeCard, decisionId, resolveNote)
    setDecisions(result.decisions)
    patchActiveCard(result.card)
    setResolveNote("")
  }

  const unresolveDecision = (decisionId: string) => {
    const result = unresolveLesson4FeedbackDecision(decisions, activeCard, decisionId)
    setDecisions(result.decisions)
    patchActiveCard(result.card)
  }

  const confirmActiveCard = async () => {
    if (activeConfirmed || !readiness.ready) return
    const now = new Date().toISOString()
    const confirmedCard: Module4Lesson4V2CardDraft = {
      ...activeCard,
      status: "confirmed",
      revision: { ...activeCard.revision, confirmedAt: now },
      updatedAt: now,
    }
    const nextV2: Module4Lesson4V2State = activeKind === "news"
      ? { ...v2, newsCard: confirmedCard, newsConfirmed: true, confirmedAt: v2.imageConfirmed ? now : v2.confirmedAt }
      : { ...v2, imageCard: confirmedCard, imageConfirmed: true, confirmedAt: v2.newsConfirmed ? now : v2.confirmedAt }
    const completed = isLesson4V2Step3Complete(nextV2)
    setV2(nextV2)
    await persist(nextV2, decisions, completed)
    const nextPending = getPendingLesson4V2CardKind(nextV2.newsConfirmed, nextV2.imageConfirmed)
    if (nextPending) setActiveKind(nextPending)
  }

  const reuseV1AsV2 = async () => {
    const now = new Date().toISOString()
    const summary = "同伴反馈未指出必改项，本次沿用 V1 作为 V2。"
    const newsCard = {
      ...buildLesson4V2DraftFromLesson3Card(portfolio.lesson3.newsCard),
      status: "confirmed" as const,
      revision: { summary, decisionIdsResolved: [], confirmedAt: now },
      updatedAt: now,
    }
    const imageCard = {
      ...buildLesson4V2DraftFromLesson3Card(portfolio.lesson3.imageCard),
      status: "confirmed" as const,
      revision: { summary, decisionIdsResolved: [], confirmedAt: now },
      updatedAt: now,
    }
    const nextV2: Module4Lesson4V2State = {
      newsCard,
      imageCard,
      newsConfirmed: true,
      imageConfirmed: true,
      confirmedAt: now,
    }
    setV2(nextV2)
    await persist(nextV2, decisions, true)
    await goToStep4()
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {noActionItems && (
        <div className="shrink-0 px-4 pt-3 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">同伴没有指出必改问题。</p>
                <p className="mt-1 text-sm text-muted-foreground">你可以沿用 V1 生成 V2，也可以自愿微调后再确认。</p>
              </div>
              <Button type="button" onClick={reuseV1AsV2}>沿用 V1 生成 V2</Button>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden py-3">
        <V2RevisionWorkbench
          cardKind={activeKind}
          card={activeCard}
          decisions={decisions}
          receivedReviewJson={receivedReviewJson}
          newsConfirmed={v2.newsConfirmed}
          imageConfirmed={v2.imageConfirmed}
          step3Complete={step3Complete}
          readiness={readiness}
          resolveNote={resolveNote}
          onResolveNoteChange={setResolveNote}
          onResolveDecision={resolveDecision}
          onUnresolveDecision={unresolveDecision}
          onCardChange={patchActiveCard}
          onCardKindChange={setActiveKind}
          onConfirmCard={() => void confirmActiveCard()}
          onEnterStep4={() => void goToStep4()}
        />
      </div>
    </div>
  )
}
