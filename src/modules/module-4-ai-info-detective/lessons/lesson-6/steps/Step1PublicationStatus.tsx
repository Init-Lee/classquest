/**
 * 文件说明：模块 4 课时 6 第 1 关 V3 发布状态页面。
 * 职责：从课时 5 本地 V3 提交记录构造发布状态查询，展示教师确认结果，并在学生确认后写入 lesson6.step1AckAt。
 * 更新触发：课时 5 V3 记录字段、my-v3-publication-status 契约、发布状态文案或 Step1 进入 Step2 的条件变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { fetchLesson6PublicationStatus } from "@/modules/module-4-ai-info-detective/api/lesson6-student.adapter"
import type { Lesson6PublicationStatusQueryItem } from "@/modules/module-4-ai-info-detective/api/lesson6-types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import type { Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Lesson6StepLayout } from "../components/Lesson6StepLayout"

const kindLabels: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

const statusVariants = {
  pending_teacher_check: "warning",
  publishable: "success",
  unknown: "outline",
} as const

function createLesson6ClientId(): string {
  return `l6c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export default function Step1PublicationStatus() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const initialLoadRef = useRef(false)

  const queryItems = useMemo<Lesson6PublicationStatusQueryItem[]>(() => {
    if (!portfolio?.lesson5.revision?.cards) return []
    return (["news", "image"] as const).flatMap(kind => {
      const card = portfolio.lesson5.revision?.cards[kind]
      if (!card?.itemId || !card.v3VersionId) return []
      return [{
        kind,
        itemId: card.itemId,
        itemVersionId: card.v3VersionId,
      }]
    })
  }, [portfolio?.lesson5.revision?.cards])

  const loadStatus = useCallback(async () => {
    if (!portfolio || queryItems.length === 0) return
    setLoading(true)
    setError("")
    try {
      const response = await fetchLesson6PublicationStatus(queryItems)
      await savePortfolio({
        ...portfolio,
        progress: { lessonId: 6, stepId: 1 },
        lesson6: {
          ...portfolio.lesson6,
          clientId: portfolio.lesson6.clientId || createLesson6ClientId(),
          publicationStatus: response,
        },
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发布状态加载失败，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }, [portfolio, queryItems, savePortfolio])

  useEffect(() => {
    if (initialLoadRef.current || queryItems.length === 0) return
    initialLoadRef.current = true
    void loadStatus()
  }, [loadStatus, queryItems.length])

  const acknowledgeAndContinue = async () => {
    if (!portfolio) return
    const now = new Date().toISOString()
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 6, stepId: 2 },
      lesson6: {
        ...portfolio.lesson6,
        clientId: portfolio.lesson6.clientId || createLesson6ClientId(),
        step1AckAt: portfolio.lesson6.step1AckAt || now,
      },
    })
    navigate("/module/4/lesson/6/step/2")
  }

  if (!portfolio) return null

  const publicationItems = portfolio.lesson6.publicationStatus?.items ?? []
  const hasV3Items = queryItems.length > 0

  return (
    <Lesson6StepLayout title="第1关 · 我的 V3 发布状态" subtitle="这里会按你在课时 5 提交的 V3 item/version 查询教师发布确认状态，不会按班级或座位枚举其他同学数据。">
      <div className="space-y-6">
        {!hasV3Items ? (
          <Card>
            <CardHeader>
              <CardTitle>还没有可查询的 V3 记录</CardTitle>
              <CardDescription>
                请先回到课时 5 第 4 关提交至少 1 张 V3 题卡，再查看发布状态。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/module/4/lesson/5/step/4")}>返回课时 5 第 4 关</Button>
              {import.meta.env.DEV && (
                <Button variant="outline" onClick={acknowledgeAndContinue}>
                  开发模式：继续联调第 2 关
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>发布状态同步</CardTitle>
                <CardDescription>
                  已找到 {queryItems.length} 张本地 V3 题卡。状态只代表教师是否确认可发布，不展示他人题卡或公共挑战表现。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {(publicationItems.length > 0 ? publicationItems : queryItems.map(item => ({
                    ...item,
                    status: "unknown" as const,
                    label: "暂未同步",
                    checkedAt: "",
                  }))).map(item => (
                    <div key={`${item.kind}-${item.itemVersionId}`} className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{kindLabels[item.kind]}</p>
                          <p className="mt-1 break-all text-xs text-muted-foreground">itemVersionId：{item.itemVersionId}</p>
                        </div>
                        <Badge variant={statusVariants[item.status]}>{item.label || "暂未同步"}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {item.checkedAt ? `教师确认时间：${item.checkedAt}` : "如仍在等待，请按老师节奏稍后刷新。"}
                      </p>
                    </div>
                  ))}
                </div>
                {portfolio.lesson6.publicationStatus?.syncedAt && (
                  <p className="text-xs text-muted-foreground">最近同步：{portfolio.lesson6.publicationStatus.syncedAt}</p>
                )}
                {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={loadStatus} disabled={loading}>
                    {loading ? "同步中..." : "刷新发布状态"}
                  </Button>
                  <Button onClick={acknowledgeAndContinue} disabled={loading}>
                    我已查看，进入公共挑战
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Lesson6StepLayout>
  )
}
