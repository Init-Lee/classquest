/**
 * 文件说明：课时 5 教师 V3 学习任务观察面板。
 * 职责：在 analytics_open 后只读展示班级 V3 提交计划、学生准备度与每张题卡的动作摘要，不作为学生任务门槛。
 * 更新触发：教师 revision-plans API 字段、C7 V3 观察展示口径、准备度统计或控制台布局位置变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { teacherLesson5Adapter } from "@/teacher-console/api/teacher-lesson5.adapter"
import type {
  Lesson5RevisionAction,
  Lesson5RevisionPlanItemDto,
  Lesson5RevisionPlansResponse,
  Lesson5SessionPhase,
} from "@/teacher-console/types"

interface Lesson5RevisionPlansPanelProps {
  token: string
  sessionId: string
  phase: Lesson5SessionPhase
  embedded?: boolean
}

const actionLabels: Partial<Record<Lesson5RevisionAction, string>> = {
  keep: "基本保留",
  minor_fix: "小修优化",
  major_fix: "重改关键部分",
}

const phaseLabels: Record<Lesson5SessionPhase, string> = {
  draft: "草稿",
  pool_locked: "题池已锁定",
  trial_open: "试答开放",
  trial_locked: "试答锁定",
  analytics_open: "统计反馈已开放 / 同步课堂已收口",
  revision_open: "统计反馈已开放 / 同步课堂已收口",
  closed: "统计反馈已开放 / 同步课堂已收口",
}

function diagnosisText(diagnosis: Record<string, unknown>): string {
  const selected = Array.isArray(diagnosis.selectedProblems)
    ? diagnosis.selectedProblems.filter((item): item is string => typeof item === "string")
    : []
  const evidence = typeof diagnosis.evidence === "string" ? diagnosis.evidence : ""
  return [selected.join("、"), evidence].filter(Boolean).join("；") || "未填写"
}

function RevisionPlanRow({ item }: { item: Lesson5RevisionPlanItemDto }) {
  return (
    <tr className="border-b align-top last:border-b-0">
      <td className="py-3 pr-4">
        <p className="font-medium">{item.studentSeatCode}</p>
        <p className="text-xs text-muted-foreground">{item.studentName}</p>
      </td>
      <td className="py-3 pr-4">
        <Badge variant={item.cardKind === "news" ? "secondary" : "warning"}>
          {item.cardKind === "news" ? "新闻" : "图片"}
        </Badge>
      </td>
      <td className="py-3 pr-4">
        <Badge variant={item.status === "submitted" ? "success" : "outline"}>
          {item.status === "submitted" ? "已提交" : "未提交"}
        </Badge>
      </td>
      <td className="py-3 pr-4">
        <p className="font-medium">{item.revisionAction ? actionLabels[item.revisionAction] ?? "已停用选项" : "未填写"}</p>
        <p className="mt-1 max-w-[260px] text-xs leading-5 text-muted-foreground">{diagnosisText(item.diagnosis)}</p>
      </td>
      <td className="py-3 pr-4">
        <p className="max-w-[260px] text-xs leading-5 text-muted-foreground">{item.revisionReason || "未填写"}</p>
      </td>
      <td className="py-3">
        <p className="max-w-[260px] text-xs leading-5 text-muted-foreground">{item.expectedEffect || "未填写"}</p>
        {item.submittedAt && <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.submittedAt).toLocaleString()}</p>}
      </td>
    </tr>
  )
}

export function Lesson5RevisionPlansPanel({
  token,
  sessionId,
  phase,
  embedded = false,
}: Lesson5RevisionPlansPanelProps) {
  const [plans, setPlans] = useState<Lesson5RevisionPlansResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canReadRevisionPlans = phase === "analytics_open" || phase === "revision_open" || phase === "closed"

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const nextPlans = await teacherLesson5Adapter.fetchRevisionPlans(token, sessionId)
      setPlans(nextPlans)
    } catch (err) {
      setPlans(null)
      setError(err instanceof Error ? err.message : "V3 学习任务观察加载失败，请确认统计反馈已开放。")
    } finally {
      setLoading(false)
    }
  }, [sessionId, token])

  useEffect(() => {
    if (canReadRevisionPlans) {
      void loadPlans()
    } else {
      setPlans(null)
      setError("")
    }
  }, [canReadRevisionPlans, loadPlans])

  const body = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void loadPlans()} disabled={loading || !canReadRevisionPlans}>
          {loading ? "刷新中..." : "刷新观察"}
        </Button>
      </div>
      {!canReadRevisionPlans && (
        <p className="rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
          统计反馈开放后会显示每位学生 news/image 题卡的 V3 提交状态和计划；本面板只读观察，不控制学生任务入口。
        </p>
      )}
        {error && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}
        {plans && (
          <>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">题卡总数</p>
                <p className="mt-1 text-xl font-semibold">{plans.summary.totalItems}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">已提交</p>
                <p className="mt-1 text-xl font-semibold">{plans.summary.submittedItems}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">双卡准备</p>
                <p className="mt-1 text-xl font-semibold">{plans.summary.readyFullStudents}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">部分准备</p>
                <p className="mt-1 text-xl font-semibold">{plans.summary.readyPartialStudents}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">未准备</p>
                <p className="mt-1 text-xl font-semibold">{plans.summary.readyNoneStudents}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>生成时间：{new Date(plans.generatedAt).toLocaleString()}</span>
              <span>阶段：{phaseLabels[plans.phase]}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">学生</th>
                    <th className="py-2 pr-4 font-medium">题卡</th>
                    <th className="py-2 pr-4 font-medium">状态</th>
                    <th className="py-2 pr-4 font-medium">动作与诊断</th>
                    <th className="py-2 pr-4 font-medium">修订原因</th>
                    <th className="py-2 font-medium">预期效果</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.items.map(item => (
                    <RevisionPlanRow key={`${item.participantId ?? item.studentSeatCode}:${item.itemId}`} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
    </div>
  )

  if (embedded) return body

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>V3 学习任务观察</CardTitle>
            <CardDescription>统计反馈开放后展示学生提交的 V3 计划与准备度；demo/只读账号仅可查看。</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadPlans()} disabled={loading || !canReadRevisionPlans}>
            {loading ? "刷新中..." : "刷新观察"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
