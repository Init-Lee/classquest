/**
 * 文件说明：课时 5 试答进度表组件。
 * 职责：按 5 秒轮询读取 session progress，只展示全班 answered/rated/completed 聚合，不显示答案、解析、来源或作者身份。
 * 更新触发：教师 progress API 字段、轮询间隔、只读安全口径或控制台进度展示规则变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { teacherLesson5Adapter } from "@/teacher-console/api/teacher-lesson5.adapter"
import type { Lesson5SessionProgressResponse } from "@/teacher-console/types"

interface Lesson5TrialProgressTableProps {
  token: string
  sessionId: string
  embedded?: boolean
}

export function Lesson5TrialProgressTable({
  token,
  sessionId,
  embedded = false,
}: Lesson5TrialProgressTableProps) {
  const [progress, setProgress] = useState<Lesson5SessionProgressResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadProgress = async () => {
      if (!token || !sessionId) {
        setProgress(null)
        return
      }
      setLoading(true)
      setError("")
      try {
        const nextProgress = await teacherLesson5Adapter.fetchSessionProgress(token, sessionId)
        if (!cancelled) setProgress(nextProgress)
      } catch (err) {
        if (!cancelled) {
          setProgress(null)
          setError(err instanceof Error ? err.message : "试答进度加载失败，请稍后再试。")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProgress()
    const intervalId = window.setInterval(() => void loadProgress(), 5000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [sessionId, token])

  const body = (
    <div className="space-y-4">
      {loading && !progress && <p className="text-sm text-muted-foreground">正在加载试答进度...</p>}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {progress && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant={progress.phase === "trial_open" ? "success" : "outline"}>{progress.phase}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">已连接</p>
                <p className="mt-1 text-xl font-semibold">{progress.summary.attachedCount}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">作答总数</p>
                <p className="mt-1 text-xl font-semibold">{progress.summary.answeredCount}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">快评总数</p>
                <p className="mt-1 text-xl font-semibold">{progress.summary.ratedCount}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground">已完成学生</p>
                <p className="mt-1 text-xl font-semibold">{progress.summary.completedCount}</p>
              </div>
            </div>

            {progress.participants.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
                暂无学生 attach 到当前 session。
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">班学号</th>
                      <th className="py-2 pr-4 font-medium">姓名</th>
                      <th className="py-2 pr-4 font-medium">已作答</th>
                      <th className="py-2 pr-4 font-medium">已快评</th>
                      <th className="py-2 pr-4 font-medium">完成</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.participants.map(participant => (
                      <tr key={participant.participantId} className="border-b last:border-b-0">
                        <td className="py-2 pr-4">{participant.classSeatCode}</td>
                        <td className="py-2 pr-4">{participant.studentName}</td>
                        <td className="py-2 pr-4">{participant.answeredCount} / {progress.summary.questionCount}</td>
                        <td className="py-2 pr-4">{participant.ratedCount} / {progress.summary.questionCount}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={participant.completed ? "success" : "warning"}>
                            {participant.completed ? "已完成" : "进行中"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="outline" onClick={() => void teacherLesson5Adapter.fetchSessionProgress(token, sessionId).then(setProgress).catch(err => setError(err instanceof Error ? err.message : "试答进度加载失败，请稍后再试。"))}>
              手动刷新
            </Button>
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
            <CardTitle>试答进度</CardTitle>
            <CardDescription>每 5 秒刷新一次；这里只显示学生维度进度，不展示答案、解析或来源。</CardDescription>
          </div>
          {progress && <Badge variant={progress.phase === "trial_open" ? "success" : "outline"}>{progress.phase}</Badge>}
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
