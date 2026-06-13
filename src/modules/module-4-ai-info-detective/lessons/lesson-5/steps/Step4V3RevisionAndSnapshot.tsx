/**
 * 文件说明：模块 4 课时 5 第 4 关 V3 修订与快照页面。
 * 职责：在 analytics_open 后复用课时 4 V2 单段编辑器，基于本人统计报告填写 revisionPlan、提交 V3，保存 completion-summary、QuickCheck 与本地阶段快照，并提供完成课时 5 后进入课时 6 的主线出口。
 * 更新触发：C7 V3 提交 API、revisionPlan 字段、V2 编辑器接口、lesson5 本地快照结构、课时 5 到课时 6 出口或课时 6 准备度口径变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  fetchLesson5MyCompletionSummary,
  submitLesson5V3,
} from "@/modules/module-4-ai-info-detective/api/lesson5-student.adapter"
import type { Lesson5MyCompletionSummaryResponse } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import type {
  Module4Lesson4V2CardDraft,
  Module4Lesson5RevisionPlanState,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { V2RevisionSectionEditor } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/components/v2-revision-workbench/V2RevisionSectionEditor"
import {
  V2_REVISION_SECTIONS,
  type V2RevisionSectionId,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/get-lesson4-v2-revision-sections"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Lesson5StepLayout } from "../components/Lesson5StepLayout"
import { buildLesson5StageSnapshot } from "../utils/build-lesson5-stage-snapshot"
import { buildLesson5V3SubmissionPayload } from "../utils/build-lesson5-v3-submission-payload"
import { evaluateLesson5QuickCheck } from "../utils/evaluate-lesson5-quick-check"
import { isLesson5Step4Complete } from "../utils/is-lesson5-step4-complete"
import { validateLesson5V3Submission } from "../utils/validate-lesson5-v3-submission"

const kindLabels: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

type SelectableRevisionAction = Exclude<Module4Lesson5RevisionPlanState["revisionAction"], "hold">

const revisionActionLabels: Record<SelectableRevisionAction, string> = {
  keep: "基本保留，仅补充说明",
  minor_fix: "小修优化",
  major_fix: "重改关键部分",
}

const readyForLesson6Labels = {
  none: "课时 6 暂未准备",
  partial: "课时 6 部分准备",
  full: "课时 6 双卡已准备",
} as const

const problemOptions = [
  { id: "needs_more_samples", label: "样本不足" },
  { id: "low_correct_rate", label: "正确率偏低" },
  { id: "low_clarity", label: "题干不够清晰" },
  { id: "low_thinking_value", label: "思考价值不足" },
  { id: "low_explanation_helpfulness", label: "解析帮助度不足" },
  { id: "high_issue_flag_rate", label: "问题标记偏高" },
]

function createDefaultRevisionPlan(itemHints: string[] = []): Module4Lesson5RevisionPlanState {
  return {
    revisionAction: "minor_fix",
    selectedProblems: itemHints,
    evidence: "",
    revisionReason: "",
    expectedEffect: "",
  }
}

function normalizeSelectableRevisionAction(
  revisionAction: Module4Lesson5RevisionPlanState["revisionAction"],
): SelectableRevisionAction {
  return revisionAction === "keep" || revisionAction === "major_fix" ? revisionAction : "minor_fix"
}

function normalizeStep4RevisionPlan(plan: Module4Lesson5RevisionPlanState): Module4Lesson5RevisionPlanState {
  return {
    ...plan,
    revisionAction: normalizeSelectableRevisionAction(plan.revisionAction),
  }
}

function cloneCardForLesson5(card: Module4Lesson4V2CardDraft): Module4Lesson4V2CardDraft {
  return {
    ...card,
    status: "draft",
    updatedAt: new Date().toISOString(),
  }
}

export default function Step4V3RevisionAndSnapshot() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [cardKind, setCardKind] = useState<Module4MaterialKind>("news")
  const [sectionId, setSectionId] = useState<V2RevisionSectionId>("material")
  const [cards, setCards] = useState<Record<Module4MaterialKind, Module4Lesson4V2CardDraft> | null>(null)
  const [plans, setPlans] = useState<Record<Module4MaterialKind, Module4Lesson5RevisionPlanState> | null>(null)
  const [completionSummary, setCompletionSummary] = useState<Lesson5MyCompletionSummaryResponse | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [finishingStep, setFinishingStep] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const portfolioRef = useRef(portfolio)
  const loadingSummaryRef = useRef(false)
  const initialSummaryLoadRef = useRef(false)

  useEffect(() => {
    portfolioRef.current = portfolio
  }, [portfolio])

  const connectedSession = portfolio?.lesson5.connectedSession
  const currentCard = cards?.[cardKind]
  const currentPlan = plans?.[cardKind]
  const currentStats = (completionSummary?.myItemStats ?? portfolio?.lesson5.myReport?.items ?? [])
    .find(item => item.kind === cardKind)
  const currentStatsSummary = currentStats
    ? `报告参考：有效作答 ${currentStats.validAnswerCount}，正确率 ${Math.round(currentStats.correctRate * 100)}%，问题率 ${Math.round(currentStats.issueFlagRate * 100)}%。`
    : "可先回看第 3 关报告，再用一句证据说明本次修订计划。"
  const revisionCard = portfolio?.lesson5.revision?.cards[cardKind]
  const itemId = currentStats?.itemId
    ?? revisionCard?.itemId
    ?? portfolio?.lesson5.submissionSummary?.items[cardKind].itemId
    ?? ""
  const baseV2VersionId = currentStats?.itemVersionId
    ?? revisionCard?.baseV2VersionId
    ?? portfolio?.lesson5.submissionSummary?.items[cardKind].v2VersionId
    ?? ""
  const submittedKinds = useMemo(() => {
    const revision = portfolio?.lesson5.revision
    if (!revision) return []
    return (["news", "image"] as const).filter(kind => Boolean(revision.cards[kind].v3VersionId || revision.cards[kind].submittedAt))
  }, [portfolio?.lesson5.revision])
  const readyForLesson6 = portfolio?.lesson5.revision?.readyForLesson6
    ?? portfolio?.lesson5.quickCheck.readyForLesson6
    ?? "none"
  const hasLesson5Step4Completion = isLesson5Step4Complete(portfolio?.lesson5)
  const step4Available = connectedSession?.phase === "analytics_open"
    || connectedSession?.phase === "revision_open"
    || connectedSession?.phase === "closed"

  useEffect(() => {
    if (!portfolio || cards || plans) return
    const reportItems = portfolio.lesson5.myReport?.items ?? []
    setCards({
      news: portfolio.lesson5.revision?.cards.news.card ?? cloneCardForLesson5(portfolio.lesson4.v2.newsCard),
      image: portfolio.lesson5.revision?.cards.image.card ?? cloneCardForLesson5(portfolio.lesson4.v2.imageCard),
    })
    setPlans({
      news: portfolio.lesson5.revision?.cards.news.revisionPlan
        ? normalizeStep4RevisionPlan(portfolio.lesson5.revision.cards.news.revisionPlan)
        : createDefaultRevisionPlan(reportItems.find(item => item.kind === "news")?.diagnosisHints),
      image: portfolio.lesson5.revision?.cards.image.revisionPlan
        ? normalizeStep4RevisionPlan(portfolio.lesson5.revision.cards.image.revisionPlan)
        : createDefaultRevisionPlan(reportItems.find(item => item.kind === "image")?.diagnosisHints),
    })
  }, [cards, plans, portfolio])

  const loadCompletionSummary = useCallback(async () => {
    const currentPortfolio = portfolioRef.current
    const currentSession = currentPortfolio?.lesson5.connectedSession
    if (!currentPortfolio || !currentSession || loadingSummaryRef.current) return
    loadingSummaryRef.current = true
    setLoadingSummary(true)
    setError("")
    try {
      const summary = await fetchLesson5MyCompletionSummary(
        currentSession.sessionId,
        currentSession.participantId,
        currentPortfolio.lesson5.clientId,
      )
      const now = new Date().toISOString()
      const quickCheck = evaluateLesson5QuickCheck(currentPortfolio.lesson5, now, summary)
      const hasSummaryV3Submission = summary.revision.submittedCount >= 1
        || summary.revision.readyForLesson6 !== "none"
        || quickCheck.T3.achieved
      setCompletionSummary(summary)
      await savePortfolio({
        ...currentPortfolio,
        lesson5: {
          ...currentPortfolio.lesson5,
          myReport: {
            sessionId: summary.sessionId,
            participantId: summary.participantId,
            items: summary.myItemStats,
            generatedAt: summary.generatedAt,
          },
          quickCheck,
          stageSnapshot: buildLesson5StageSnapshot(summary, quickCheck, now),
          completed: currentPortfolio.lesson5.completed || hasSummaryV3Submission,
          completedAt: currentPortfolio.lesson5.completedAt || (hasSummaryV3Submission ? now : ""),
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取完成摘要失败，请稍后重试。")
    } finally {
      setLoadingSummary(false)
      loadingSummaryRef.current = false
    }
  }, [savePortfolio])

  useEffect(() => {
    if (!connectedSession || initialSummaryLoadRef.current) return
    initialSummaryLoadRef.current = true
    void loadCompletionSummary()
  }, [connectedSession, loadCompletionSummary])

  if (!portfolio) return null

  const handleCardChange = (nextCard: Module4Lesson4V2CardDraft) => {
    if (!cards) return
    setCards({ ...cards, [cardKind]: nextCard })
  }

  const handlePlanChange = (patch: Partial<Module4Lesson5RevisionPlanState>) => {
    if (!plans || !currentPlan) return
    setPlans({ ...plans, [cardKind]: { ...currentPlan, ...patch } })
  }

  const saveLocalDraft = async () => {
    if (!cards || !plans) return
    setSavingDraft(true)
    try {
      const now = new Date().toISOString()
      const previousRevision = portfolio.lesson5.revision
      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 5, stepId: 4 },
        lesson5: {
          ...portfolio.lesson5,
          revision: {
            readyForLesson6: previousRevision?.readyForLesson6 ?? "none",
            submittedCount: previousRevision?.submittedCount ?? 0,
            lastSubmittedAt: previousRevision?.lastSubmittedAt ?? "",
            cards: {
              news: {
                card: cards.news,
                revisionPlan: plans.news,
                itemId: previousRevision?.cards.news.itemId || portfolio.lesson5.submissionSummary?.items.news.itemId || "",
                baseV2VersionId: previousRevision?.cards.news.baseV2VersionId || portfolio.lesson5.submissionSummary?.items.news.v2VersionId || "",
                v3VersionId: previousRevision?.cards.news.v3VersionId,
                submittedAt: previousRevision?.cards.news.submittedAt ?? "",
                updatedAt: now,
                deduped: previousRevision?.cards.news.deduped ?? false,
              },
              image: {
                card: cards.image,
                revisionPlan: plans.image,
                itemId: previousRevision?.cards.image.itemId || portfolio.lesson5.submissionSummary?.items.image.itemId || "",
                baseV2VersionId: previousRevision?.cards.image.baseV2VersionId || portfolio.lesson5.submissionSummary?.items.image.v2VersionId || "",
                v3VersionId: previousRevision?.cards.image.v3VersionId,
                submittedAt: previousRevision?.cards.image.submittedAt ?? "",
                updatedAt: now,
                deduped: previousRevision?.cards.image.deduped ?? false,
              },
            },
          },
        },
      })
      setMessage("已保存本地 V3 修订草稿。")
    } finally {
      setSavingDraft(false)
    }
  }

  const finishStep4AndEnterLesson6 = async () => {
    if (!isLesson5Step4Complete(portfolio.lesson5)) {
      setError("请先提交至少 1 张 V3 题卡，再完成第 4 关。")
      return
    }
    setFinishingStep(true)
    setError("")
    try {
      const now = new Date().toISOString()
      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 6, stepId: 1 },
        lesson5: {
          ...portfolio.lesson5,
          completed: true,
          completedAt: portfolio.lesson5.completedAt || now,
        },
      })
      navigate("/module/4/lesson/6/step/1")
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存第 4 关完成状态失败，请稍后重试。")
    } finally {
      setFinishingStep(false)
    }
  }

  const submitCurrentCard = async () => {
    if (!connectedSession || !currentCard || !currentPlan || !cards || !plans || !itemId || !baseV2VersionId) return
    const validation = validateLesson5V3Submission(currentCard, currentPlan)
    if (!validation.valid) {
      setError(`请先补齐：${validation.missing.join("、")}。`)
      return
    }
    setSubmitting(true)
    setError("")
    setMessage("")
    try {
      const response = await submitLesson5V3(buildLesson5V3SubmissionPayload({
        connectedSession,
        lesson5ClientId: portfolio.lesson5.clientId,
        itemId,
        baseV2VersionId,
        card: currentCard,
        revisionPlan: currentPlan,
      }))
      const now = new Date().toISOString()
      const previousRevision = portfolio.lesson5.revision
      const nextRevision = {
        readyForLesson6: response.readyForLesson6,
        submittedCount: Math.max(previousRevision?.submittedCount ?? 0, new Set([...submittedKinds, cardKind]).size),
        lastSubmittedAt: now,
        cards: {
          news: {
            card: cards.news,
            revisionPlan: plans.news,
            itemId: cardKind === "news" ? response.itemId : previousRevision?.cards.news.itemId || portfolio.lesson5.submissionSummary?.items.news.itemId || "",
            baseV2VersionId: cardKind === "news" ? baseV2VersionId : previousRevision?.cards.news.baseV2VersionId || portfolio.lesson5.submissionSummary?.items.news.v2VersionId || "",
            v3VersionId: cardKind === "news" ? response.v3VersionId : previousRevision?.cards.news.v3VersionId,
            submittedAt: cardKind === "news" ? now : previousRevision?.cards.news.submittedAt ?? "",
            updatedAt: now,
            deduped: cardKind === "news" ? response.deduped : previousRevision?.cards.news.deduped ?? false,
          },
          image: {
            card: cards.image,
            revisionPlan: plans.image,
            itemId: cardKind === "image" ? response.itemId : previousRevision?.cards.image.itemId || portfolio.lesson5.submissionSummary?.items.image.itemId || "",
            baseV2VersionId: cardKind === "image" ? baseV2VersionId : previousRevision?.cards.image.baseV2VersionId || portfolio.lesson5.submissionSummary?.items.image.v2VersionId || "",
            v3VersionId: cardKind === "image" ? response.v3VersionId : previousRevision?.cards.image.v3VersionId,
            submittedAt: cardKind === "image" ? now : previousRevision?.cards.image.submittedAt ?? "",
            updatedAt: now,
            deduped: cardKind === "image" ? response.deduped : previousRevision?.cards.image.deduped ?? false,
          },
        },
      }
      const summary = await fetchLesson5MyCompletionSummary(
        connectedSession.sessionId,
        connectedSession.participantId,
        portfolio.lesson5.clientId,
      )
      const nextLesson5 = {
        ...portfolio.lesson5,
        revision: nextRevision,
        myReport: {
          sessionId: summary.sessionId,
          participantId: summary.participantId,
          items: summary.myItemStats,
          generatedAt: summary.generatedAt,
        },
        completed: true,
        completedAt: now,
      }
      const quickCheck = evaluateLesson5QuickCheck(nextLesson5, now, summary)
      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 5, stepId: 4 },
        lesson5: {
          ...nextLesson5,
          quickCheck,
          stageSnapshot: buildLesson5StageSnapshot(summary, quickCheck, now),
        },
      })
      setCompletionSummary(summary)
      setMessage(`${kindLabels[cardKind]} V3 已提交；${readyForLesson6Labels[response.readyForLesson6]}。`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交 V3 失败，请稍后重试。")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Lesson5StepLayout title="第4关 · V3 修订与本地快照" subtitle="根据本人统计反馈修订题卡，提交 V3，并生成课时 5 完成摘要。">
      <div className="space-y-6">
        {!connectedSession ? (
          <Card>
            <CardContent className="space-y-4 p-6 text-sm">
              <p className="font-medium">还没有连接课堂身份</p>
              <p className="text-muted-foreground">请先完成第 1-2 关连接课堂，并在统计反馈开放后进入本页。</p>
              <Button onClick={() => navigate("/module/4/lesson/5/step/2")}>返回第 2 关</Button>
            </CardContent>
          </Card>
        ) : hasLesson5Step4Completion && !step4Available ? (
          <Card className="border-emerald-100 bg-emerald-50/80">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
              <div>
                <p className="font-semibold text-emerald-900">第 4 关已完成</p>
                <p className="mt-1 text-emerald-800">
                  V3 修订已提交，{readyForLesson6Labels[readyForLesson6]}；可以进入课时 6，后续也可在反馈开放后继续更新。
                </p>
              </div>
              <Button onClick={() => void finishStep4AndEnterLesson6()} disabled={finishingStep}>
                {finishingStep ? "保存中..." : "完成课时 5，进入课时 6"}
              </Button>
            </CardContent>
          </Card>
        ) : !step4Available ? (
          <Card>
            <CardContent className="space-y-4 p-6 text-sm">
              <p className="font-medium">统计反馈尚未开放</p>
              <p className="text-muted-foreground">当前本地课堂阶段为 {connectedSession.phase}，开放到 analytics_open 后即可提交 V3。</p>
              <Button variant="outline" onClick={() => navigate("/module/4/lesson/5/step/3")}>返回第 3 关报告</Button>
            </CardContent>
          </Card>
        ) : currentCard && currentPlan ? (
          <>
            <Card className="border-slate-200 bg-slate-950 text-white">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-300">C7 V3 修订工作台</p>
                    <h2 className="mt-1 text-2xl font-semibold">把统计反馈转成可提交的 V3 题卡</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                      建议先看第 3 关报告，再在这里选择新闻/图片题卡逐项修订。提交后会同步保存本地完成摘要，可用顶部“阶段快照”导出 HTML。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">已提交 {submittedKinds.length}/2</Badge>
                    <Badge variant="outline" className="border-white/40 text-white">
                      {readyForLesson6Labels[readyForLesson6]}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => void loadCompletionSummary()} disabled={loadingSummary}>
                    {loadingSummary ? "刷新中..." : "刷新完成摘要"}
                  </Button>
                  <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={() => navigate("/module/4/lesson/5/step/3")}>
                    回看第 3 关报告
                  </Button>
                </div>
              </CardContent>
            </Card>

            {(message || error) && (
              <div className={`rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {error || message}
              </div>
            )}

            {hasLesson5Step4Completion && (
              <Card className="border-emerald-100 bg-emerald-50/80">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
                  <div>
                    <p className="font-semibold text-emerald-900">第 4 关已完成</p>
                    <p className="mt-1 text-emerald-800">
                      V3 修订已提交，{readyForLesson6Labels[readyForLesson6]}；完成摘要与本地快照已保存，可以进入课时 6。
                    </p>
                  </div>
                  <Button onClick={() => void finishStep4AndEnterLesson6()} disabled={finishingStep}>
                    {finishingStep ? "保存中..." : "完成课时 5，进入课时 6"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
              <Card className="xl:sticky xl:top-4 xl:self-start">
                <CardHeader>
                  <CardTitle>修订计划</CardTitle>
                  <CardDescription>先用一句证据写清本次修订计划，再提交对应题卡的 V3。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                    {currentStatsSummary}
                  </p>
                  <label className="block space-y-1.5">
                    <span className="font-medium">修订动作</span>
                    <select
                      value={normalizeSelectableRevisionAction(currentPlan.revisionAction)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      onChange={event => handlePlanChange({ revisionAction: event.target.value as SelectableRevisionAction })}
                    >
                      {Object.entries(revisionActionLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="space-y-2">
                    <p className="font-medium">选择诊断问题</p>
                    <div className="grid gap-2">
                      {problemOptions.map(option => (
                        <label key={option.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                          <input
                            type="checkbox"
                            checked={currentPlan.selectedProblems.includes(option.id)}
                            onChange={event => {
                              const selectedProblems = event.target.checked
                                ? [...currentPlan.selectedProblems, option.id]
                                : currentPlan.selectedProblems.filter(item => item !== option.id)
                              handlePlanChange({ selectedProblems })
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="font-medium">诊断证据</span>
                    <Input
                      value={currentPlan.evidence}
                      onChange={event => handlePlanChange({ evidence: event.target.value })}
                      placeholder="引用正确率、问题标记或第 3 关报告中的一句发现。"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="font-medium">修订原因</span>
                    <Textarea
                      value={currentPlan.revisionReason}
                      onChange={event => handlePlanChange({ revisionReason: event.target.value })}
                      rows={3}
                      placeholder="说明为什么这样改。"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="font-medium">预期效果</span>
                    <Textarea
                      value={currentPlan.expectedEffect}
                      onChange={event => handlePlanChange({ expectedEffect: event.target.value })}
                      rows={3}
                      placeholder="说明希望降低哪类误解、提升哪项质量。"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => void saveLocalDraft()} disabled={savingDraft}>
                      {savingDraft ? "保存中..." : "保存本地草稿"}
                    </Button>
                    <Button onClick={() => void submitCurrentCard()} disabled={submitting || !itemId || !baseV2VersionId}>
                      {submitting ? "提交中..." : `提交${kindLabels[cardKind]} V3`}
                    </Button>
                  </div>
                  {(!itemId || !baseV2VersionId) && (
                    <p className="text-xs text-red-600">缺少 itemId 或 V2 基线版本，请先刷新完成摘要。</p>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>V3 题卡编辑</CardTitle>
                      <CardDescription>复用课时 4 V2 单段编辑器；本页只保存 V3 修订草稿，不回写课时 4。</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["news", "image"] as const).map(kind => (
                        <Button
                          key={kind}
                          type="button"
                          size="sm"
                          variant={cardKind === kind ? "default" : "outline"}
                          onClick={() => {
                            setCardKind(kind)
                            setSectionId("material")
                          }}
                        >
                          {kindLabels[kind]}
                          {submittedKinds.includes(kind) ? " · 已提交" : ""}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {V2_REVISION_SECTIONS.map(section => (
                      <Button
                        key={section.id}
                        type="button"
                        size="sm"
                        variant={sectionId === section.id ? "default" : "outline"}
                        onClick={() => setSectionId(section.id)}
                      >
                        {section.shortLabel}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <V2RevisionSectionEditor
                    sectionId={sectionId}
                    card={currentCard}
                    sectionDecisions={[]}
                    locked={false}
                    showFeedbackPanel={false}
                    resolveNote=""
                    onResolveNoteChange={() => undefined}
                    onResolveDecision={() => undefined}
                    onUnresolveDecision={() => undefined}
                    onChange={handleCardChange}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">正在准备 V3 修订工作台...</CardContent>
          </Card>
        )}
      </div>
    </Lesson5StepLayout>
  )
}
