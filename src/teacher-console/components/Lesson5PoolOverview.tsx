/**
 * 文件说明：课时 5 会话与班级题池概览组件。
 * 职责：展示当前会话冻结计数、班级当前 V2 提交缺口和 C2 题池只读明细，并支持授权教师点击题池卡片预览当前 V2 题卡。
 * 更新触发：会话概览字段、班级题池概览/详情字段、题卡预览弹窗、就绪提示或 C2/C3 题池可视口径变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { teacherAdminAdapter } from "@/teacher-console/api/teacher-admin.adapter"
import type {
  Lesson5SessionOverview,
  TeacherClassPoolItem,
  TeacherClassPoolItemDetail,
  TeacherClassPoolOverview,
} from "@/teacher-console/types"

interface Lesson5PoolOverviewProps {
  overview: Lesson5SessionOverview | null
  classPoolOverview: TeacherClassPoolOverview | null
  loading?: boolean
  embedded?: boolean
  token?: string
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function optionLabel(option: Record<string, unknown>): string {
  return textValue(option.text)
    || textValue(option.label)
    || textValue(option.content)
    || textValue(option.value)
    || "未填写选项内容"
}

function renderSource(source: unknown): string {
  if (source == null || source === "") return "未提供来源摘要。"
  if (typeof source === "string") return source
  if (typeof source !== "object" || Array.isArray(source)) return "来源摘要格式暂不可展示。"
  const record = source as Record<string, unknown>
  const parts = [
    textValue(record.sourceType) || textValue(record.type),
    textValue(record.sourceRecord) || textValue(record.record) || textValue(record.url) || textValue(record.link),
    textValue(record.verificationNote) || textValue(record.note),
  ].filter(Boolean)
  return parts.join("；") || "未提供来源摘要。"
}

function poolCardTitle(shortName?: string | null): string {
  const normalized = shortName?.trim()
  return normalized || "未命名题卡"
}

function PoolItemPreview({ detail }: { detail: TeacherClassPoolItemDetail }) {
  const asset = detail.material.asset && typeof detail.material.asset === "object"
    ? detail.material.asset as Record<string, unknown>
    : null
  const assetUrl = textValue(asset?.dataUrl)
  const assetAlt = textValue(asset?.alt) || textValue(asset?.title) || textValue(detail.material.title) || "题卡素材"
  const question = textValue(detail.task.question) || textValue(detail.task.prompt) || "未填写题干"
  const explanation = textValue(detail.task.explanation) || textValue(detail.task.explanationText)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-2xl border bg-slate-50/70 p-4">
        <p className="text-xs font-semibold tracking-wide text-primary">素材区</p>
        {assetUrl ? (
          <div className="mt-3 flex min-h-56 items-center justify-center overflow-hidden rounded-xl border bg-white">
            <img src={assetUrl} alt={assetAlt} className="max-h-72 max-w-full object-contain" />
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed bg-white p-4 text-sm text-muted-foreground">
            当前题卡没有图片素材，或素材为文字/网页来源。
          </div>
        )}
        <h3 className="mt-3 text-sm font-semibold">
          {textValue(detail.material.title) || textValue(detail.material.headline) || detail.itemShortName || "未填写素材短名"}
        </h3>
        {(textValue(detail.material.displayNote) || textValue(detail.material.description)) && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {textValue(detail.material.displayNote) || textValue(detail.material.description)}
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary">题卡任务</p>
            <h3 className="mt-2 text-base font-semibold leading-6">{question}</h3>
          </div>
          <Badge variant={detail.cardKind === "news" ? "secondary" : "warning"}>
            {detail.cardKind === "news" ? "新闻题卡" : "图片题卡"}
          </Badge>
        </div>

        <div className="space-y-2">
          {detail.options.length > 0 ? detail.options.map(option => {
            const key = textValue(option.key) || "?"
            const correct = key === detail.correctOptionKey
            return (
              <div key={`${key}:${optionLabel(option)}`} className={`rounded-xl border p-3 text-sm ${correct ? "border-emerald-200 bg-emerald-50" : "bg-slate-50"}`}>
                <div className="flex items-start gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">{key}</span>
                  <p className="flex-1 leading-6">{optionLabel(option)}</p>
                  {correct && <Badge variant="success">正解</Badge>}
                </div>
              </div>
            )
          }) : (
            <p className="rounded-xl border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">未填写选项。</p>
          )}
        </div>

        {explanation && (
          <div className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            <p className="font-medium">解析</p>
            <p className="mt-1">{explanation}</p>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
          <p>来源摘要：{renderSource(detail.task.source ?? detail.task.sourceRecord ?? detail.material.source)}</p>
        </div>
      </section>
    </div>
  )
}

export function Lesson5PoolOverview({
  overview,
  classPoolOverview,
  loading = false,
  embedded = false,
  token,
}: Lesson5PoolOverviewProps) {
  const poolItems = classPoolOverview?.items ?? []
  const newsCount = poolItems.filter(item => item.cardKind === "news").length
  const imageCount = poolItems.filter(item => item.cardKind === "image").length
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<TeacherClassPoolItem | null>(null)
  const [previewDetail, setPreviewDetail] = useState<TeacherClassPoolItemDetail | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState("")

  const handlePreview = async (item: TeacherClassPoolItem) => {
    if (!token) return
    setPreviewOpen(true)
    setPreviewItem(item)
    setPreviewDetail(null)
    setPreviewError("")
    setPreviewLoading(true)
    try {
      const detail = await teacherAdminAdapter.getClassPoolItemDetail(token, item.classId, item.itemId)
      setPreviewDetail(detail)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "题卡详情加载失败，请稍后再试。")
    } finally {
      setPreviewLoading(false)
    }
  }

  const body = (
    <div className="space-y-5">
        {loading && <p className="text-sm text-muted-foreground">正在加载概览...</p>}

        {!loading && !overview && (
          <div className="rounded-lg border border-dashed bg-white p-5 text-sm text-muted-foreground">
            请选择一个会话查看冻结池与就绪提示。
          </div>
        )}

        {overview && (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">冻结总数</p>
              <p className="mt-1 text-xl font-semibold">{overview.frozen.total}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">新闻题</p>
              <p className="mt-1 text-xl font-semibold">{overview.frozen.news}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">图片题</p>
              <p className="mt-1 text-xl font-semibold">{overview.frozen.image}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-muted-foreground">当前 V2</p>
              <p className="mt-1 text-xl font-semibold">{overview.classPoolItemsCurrentV2}</p>
            </div>
          </div>
        )}

        {overview && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            <p>
              已提交学生：{overview.classPoolAuthorsSubmitted}
              {" · "}
              缺口：{overview.classPoolAuthorsMissing}
            </p>
            {overview.readiness.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {overview.readiness.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          </div>
        )}

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="font-medium">班级当前 V2 题池</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              共 {poolItems.length} 张
            </span>
            <span className="text-xs text-muted-foreground">
              新闻 {newsCount} · 图片 {imageCount}
            </span>
          </div>

          {poolItems.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
              当前班级题池暂无学生 V2 提交；HTTP 模式下请先完成学生 Step1 提交。
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {poolItems.map(item => (
                <button
                  key={item.itemId}
                  type="button"
                  onClick={() => void handlePreview(item)}
                  disabled={!token}
                  className="rounded-lg border bg-white p-3 text-left text-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-default disabled:hover:border-border disabled:hover:bg-white"
                  title={token ? "点击预览当前 V2 题卡" : "登录状态可用后才能预览题卡"}
                >
                  <p className="font-medium">
                    {item.cardKind === "news" ? "新闻题卡" : "图片题卡"}
                    {" · "}
                    {poolCardTitle(item.currentV2ShortName)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.authorName}
                    {" · "}
                    {item.authorSeatCode}
                    {" · "}
                    {item.currentV2Status ?? item.status}
                  </p>
                  <p className="mt-2 text-xs text-primary">点击预览题卡</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {previewItem ? `${previewItem.cardKind === "news" ? "新闻题卡" : "图片题卡"} · ${poolCardTitle(previewItem.currentV2ShortName)}` : "题卡预览"}
              </DialogTitle>
              <DialogDescription>
                教师只读预览当前 V2 版本；内容来自班级长期题池，不会影响已冻结 session。
              </DialogDescription>
            </DialogHeader>
            {previewLoading && <p className="text-sm text-muted-foreground">正在加载题卡详情...</p>}
            {previewError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {previewError}
              </div>
            )}
            {previewDetail && <PoolItemPreview detail={previewDetail} />}
            {previewError && previewItem && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => void handlePreview(previewItem)}>重试</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  )

  if (embedded) return body

  return (
    <Card>
      <CardHeader>
        <CardTitle>题池概览</CardTitle>
        <CardDescription>
          上半部分来自会话概览，下半部分沿用 C2 班级当前 V2 题池只读视图。
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
