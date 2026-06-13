/**
 * 文件说明：模块 4 课时 6 第 3 关可信复盘与阶段快照页面。
 * 职责：收集 3 条可信发布原则与发布责任说明，生成 lesson6-stage-v1 白名单快照，并写入课时 6 完成态。
 * 更新触发：可信复盘表单字段、lesson6 QuickCheck、阶段快照白名单或课时 6 完成出口变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import type { Module4Lesson6ReflectionPrinciple } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Lesson6StepLayout } from "../components/Lesson6StepLayout"
import { buildLesson6StageSnapshot, evaluateLesson6QuickCheck } from "../utils/build-lesson6-stage-snapshot"

const emptyPrinciple: Module4Lesson6ReflectionPrinciple = {
  principle: "",
  reason: "",
  scenario: "",
  action: "",
}

function createInitialPrinciples(saved?: Module4Lesson6ReflectionPrinciple[]): Module4Lesson6ReflectionPrinciple[] {
  return Array.from({ length: 3 }, (_, index) => saved?.[index] ?? { ...emptyPrinciple })
}

function trimPrinciple(item: Module4Lesson6ReflectionPrinciple): Module4Lesson6ReflectionPrinciple {
  return {
    principle: item.principle.trim(),
    reason: item.reason.trim(),
    scenario: item.scenario.trim(),
    action: item.action.trim(),
  }
}

export default function Step3ReflectionAndSnapshot() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [principles, setPrinciples] = useState<Module4Lesson6ReflectionPrinciple[]>(
    () => createInitialPrinciples(portfolio?.lesson6.reflection?.principles),
  )
  const [responsibilityText, setResponsibilityText] = useState(portfolio?.lesson6.reflection?.responsibilityText ?? "")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const trimmedPrinciples = useMemo(() => principles.map(trimPrinciple), [principles])
  const completedPrincipleCount = trimmedPrinciples.filter(item =>
    item.principle && item.reason && item.scenario && item.action
  ).length
  const publicChallenge = portfolio?.lesson6.publicChallenge
  const canSubmit = Boolean(
    portfolio?.lesson6.step1AckAt
      && publicChallenge?.completed
      && completedPrincipleCount === 3
      && responsibilityText.trim(),
  )
  const completed = portfolio?.lesson6.completed === true

  const updatePrinciple = (
    index: number,
    patch: Partial<Module4Lesson6ReflectionPrinciple>,
  ) => {
    setPrinciples(current => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )))
  }

  const handleSubmit = async () => {
    if (!portfolio || !canSubmit) return
    setSaving(true)
    setSaveError("")
    try {
      const now = new Date().toISOString()
      const reflection = {
        principles: trimmedPrinciples,
        responsibilityText: responsibilityText.trim(),
        submittedAt: now,
      }
      const quickCheck = evaluateLesson6QuickCheck(portfolio.lesson6, reflection, now)
      if (!quickCheck.completed) {
        setSaveError(quickCheck.blockers.join("；") || "课时 6 完成证据还不完整。")
        return
      }
      const stageSnapshot = buildLesson6StageSnapshot(portfolio.lesson6, reflection, quickCheck, now)
      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 6, stepId: 3 },
        lesson6: {
          ...portfolio.lesson6,
          reflection,
          quickCheck,
          stageSnapshot,
          completed: true,
          completedAt: now,
        },
      })
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "课时 6 完成证据保存失败，请稍后重试。")
    } finally {
      setSaving(false)
    }
  }

  if (!portfolio) return null

  return (
    <Lesson6StepLayout title="第3关 · 可信复盘与项目结营" subtitle="写下你会如何负责地发布和使用公共题库。提交后只生成白名单字段的本地快照，不保存 runId、答案、得分、排名或匿名 session。">
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>完成证据</CardTitle>
                <CardDescription>Step1 发布状态确认、Step2 公共挑战完成、Step3 可信复盘三项都达成后，课时 6 才会完成。</CardDescription>
              </div>
              <Badge variant={completed ? "success" : "outline"}>{completed ? "课时 6 已完成" : "待提交复盘"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <p className="font-semibold">发布状态确认</p>
              <p className="mt-1 text-muted-foreground">{portfolio.lesson6.step1AckAt ? "已确认" : "未确认"}</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="font-semibold">公共挑战</p>
              <p className="mt-1 text-muted-foreground">
                {publicChallenge?.completed ? `已答 ${publicChallenge.answeredCount}/${publicChallenge.questionCount} 题` : "未完成"}
              </p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="font-semibold">可信复盘</p>
              <p className="mt-1 text-muted-foreground">已写 {completedPrincipleCount}/3 条原则</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>可信发布三原则</CardTitle>
            <CardDescription>每条都写清楚原则、理由、适用场景和你会采取的具体操作。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {principles.map((item, index) => (
              <div key={index} className="rounded-2xl border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-semibold">原则 {index + 1}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">原则</span>
                    <Input
                      value={item.principle}
                      onChange={event => updatePrinciple(index, { principle: event.target.value })}
                      placeholder="例如：先看来源，再判断内容"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">理由</span>
                    <Input
                      value={item.reason}
                      onChange={event => updatePrinciple(index, { reason: event.target.value })}
                      placeholder="说明为什么这条原则重要"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">场景</span>
                    <Textarea
                      value={item.scenario}
                      onChange={event => updatePrinciple(index, { scenario: event.target.value })}
                      placeholder="这条原则适合用在哪类新闻、图片或讨论场景？"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">操作</span>
                    <Textarea
                      value={item.action}
                      onChange={event => updatePrinciple(index, { action: event.target.value })}
                      placeholder="你会怎么做？例如保留来源、标注不确定处、提醒同学复核。"
                    />
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>发布责任说明</CardTitle>
            <CardDescription>用一段话说明：如果你的题卡进入公共题库，你会如何对材料、解释和提醒负责。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={responsibilityText}
              onChange={event => setResponsibilityText(event.target.value)}
              placeholder="我会在发布前再次核对来源与解析，遇到不确定信息会标注提醒，并在发现问题后及时修改或告知老师。"
              className="min-h-[120px]"
            />
            {saveError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{saveError}</p>}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
                {saving ? "保存中..." : completed ? "更新课时 6 快照" : "提交复盘并完成课时 6"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/module/4")}>
                返回模块 4 首页
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              快照只包含发布状态摘要、公共挑战完成证明、可信复盘文本、QuickCheck 与完成时间；不会保存公共挑战题卡 JSON、答案、正确率、排名、访客数据或教师私密备注。
            </p>
          </CardContent>
        </Card>
      </div>
    </Lesson6StepLayout>
  )
}
