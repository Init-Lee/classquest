/**
 * 文件说明：课时 6 V3 发布审核队列组件。
 * 职责：展示待确认、已确认与全部审核记录，并提供班级、题型、状态筛选、勾选批量确认和预览操作入口。
 * 更新触发：Lesson6 审核列表字段、筛选维度、表格列、状态标签或 C2/C5 审核流程变化时，需要同步更新本文件。
 */

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type {
  Lesson6PublicationCheckStatus,
  Lesson6ReviewItem,
  Lesson6ReviewsSummary,
  TeacherPoolCardKind,
  TeacherVisibleClass,
} from "@/teacher-console/types"

type Lesson6StatusFilter = Lesson6PublicationCheckStatus | "all"
type Lesson6KindFilter = TeacherPoolCardKind | "all"

interface Lesson6V3ReviewQueueProps {
  classes: TeacherVisibleClass[]
  items: Lesson6ReviewItem[]
  summary: Lesson6ReviewsSummary | null
  selectedClassId: string
  selectedStatus: Lesson6StatusFilter
  loading?: boolean
  bulkPublishing?: boolean
  canPublishItem: (item: Lesson6ReviewItem) => boolean
  onClassChange: (classId: string) => void
  onStatusChange: (status: Lesson6StatusFilter) => void
  onRefresh: () => void
  onPreview: (item: Lesson6ReviewItem) => void
  onBulkPublish: (items: Lesson6ReviewItem[]) => void
}

const statusLabels: Record<Lesson6PublicationCheckStatus, string> = {
  pending_teacher_check: "待确认",
  publishable: "已确认可发布",
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function formatRate(value: number | null | undefined): string {
  return value == null ? "暂无" : `${Math.round(value * 100)}%`
}

function itemTitle(item: Lesson6ReviewItem): string {
  return item.itemShortName.trim() || (item.cardKind === "news" ? "新闻 V3 题卡" : "图片 V3 题卡")
}

function StatusBadge({ status }: { status: Lesson6PublicationCheckStatus }) {
  if (status === "publishable") return <Badge variant="success">已确认可发布</Badge>
  return <Badge variant="warning">待确认</Badge>
}

export function Lesson6V3ReviewQueue({
  classes,
  items,
  summary,
  selectedClassId,
  selectedStatus,
  loading = false,
  bulkPublishing = false,
  canPublishItem,
  onClassChange,
  onStatusChange,
  onRefresh,
  onPreview,
  onBulkPublish,
}: Lesson6V3ReviewQueueProps) {
  const [kindFilter, setKindFilter] = useState<Lesson6KindFilter>("all")
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([])
  const filteredItems = useMemo(
    () => items.filter(item => kindFilter === "all" || item.cardKind === kindFilter),
    [items, kindFilter],
  )
  const bulkPublishItems = useMemo(
    () => filteredItems.filter(item => item.checkStatus === "pending_teacher_check" && canPublishItem(item)),
    [canPublishItem, filteredItems],
  )
  const bulkPublishIdSet = useMemo(
    () => new Set(bulkPublishItems.map(item => item.reviewId)),
    [bulkPublishItems],
  )
  const selectedIdSet = useMemo(() => new Set(selectedReviewIds), [selectedReviewIds])
  const selectedBulkPublishItems = useMemo(
    () => bulkPublishItems.filter(item => selectedIdSet.has(item.reviewId)),
    [bulkPublishItems, selectedIdSet],
  )
  const allBulkPublishItemsSelected = bulkPublishItems.length > 0
    && selectedBulkPublishItems.length === bulkPublishItems.length

  useEffect(() => {
    setSelectedReviewIds(current => current.filter(reviewId => bulkPublishIdSet.has(reviewId)))
  }, [bulkPublishIdSet])

  const handleToggleAll = (checked: boolean) => {
    setSelectedReviewIds(checked ? bulkPublishItems.map(item => item.reviewId) : [])
  }

  const handleToggleItem = (item: Lesson6ReviewItem, checked: boolean) => {
    if (!bulkPublishIdSet.has(item.reviewId)) return
    setSelectedReviewIds(current => {
      if (checked) return current.includes(item.reviewId) ? current : [...current, item.reviewId]
      return current.filter(reviewId => reviewId !== item.reviewId)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>V3 发布审核队列</CardTitle>
            <CardDescription>
              先预览学生 V3 题卡和课时 5 统计，再确认是否进入公共题库。
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onBulkPublish(selectedBulkPublishItems)}
              disabled={loading || bulkPublishing || selectedBulkPublishItems.length === 0}
            >
              {bulkPublishing ? "批量确认中..." : `批量确认已选 ${selectedBulkPublishItems.length} 张`}
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading || bulkPublishing}>
              {loading ? "刷新中..." : "刷新队列"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            ["pending_teacher_check", `待确认 ${summary?.pendingCount ?? 0}`],
            ["publishable", `已确认可发布 ${summary?.publishableCount ?? 0}`],
            ["all", `全部 ${(summary?.pendingCount ?? 0) + (summary?.publishableCount ?? 0)}`],
          ] as const).map(([status, label]) => (
            <Button
              key={status}
              type="button"
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(status)}
            >
              {label}
            </Button>
          ))}
          <span className="self-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
            公共题库 active {summary?.activePublicCount ?? 0}
          </span>
        </div>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            班级
            <select
              value={selectedClassId}
              onChange={event => onClassChange(event.target.value)}
              className="h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
            >
              <option value="">全部可见班级</option>
              {classes.map(item => (
                <option key={item.classId} value={item.classId}>
                  {item.className} · {item.permission === "manage" ? "可管理" : "只读"}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            题型
            <select
              value={kindFilter}
              onChange={event => setKindFilter(event.target.value as Lesson6KindFilter)}
              className="h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
            >
              <option value="all">全部题型</option>
              <option value="news">新闻</option>
              <option value="image">图片</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            状态
            <select
              value={selectedStatus}
              onChange={event => onStatusChange(event.target.value as Lesson6StatusFilter)}
              className="h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
            >
              <option value="pending_teacher_check">{statusLabels.pending_teacher_check}</option>
              <option value="publishable">{statusLabels.publishable}</option>
              <option value="all">全部</option>
            </select>
          </label>
        </div>

        {loading && <p className="text-sm text-muted-foreground">正在加载审核队列...</p>}

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-5 text-sm text-muted-foreground">
            当前筛选下暂无 V3 发布审核记录。
          </div>
        )}

        {filteredItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">
                    <input
                      type="checkbox"
                      aria-label="全选当前可批量发布记录"
                      checked={allBulkPublishItemsSelected}
                      disabled={bulkPublishItems.length === 0}
                      onChange={event => handleToggleAll(event.target.checked)}
                      className="mt-1"
                    />
                  </th>
                  <th className="py-2 pr-4 font-medium">题目简称</th>
                  <th className="py-2 pr-4 font-medium">类型</th>
                  <th className="py-2 pr-4 font-medium">班级座位</th>
                  <th className="py-2 pr-4 font-medium">V3 提交时间</th>
                  <th className="py-2 pr-4 font-medium">L5 样本/正确率</th>
                  <th className="py-2 pr-4 font-medium">状态</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const canSelectItem = bulkPublishIdSet.has(item.reviewId)
                  return (
                    <tr key={item.reviewId} className="border-b align-top last:border-b-0">
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          aria-label={`选择 ${itemTitle(item)}`}
                          checked={selectedIdSet.has(item.reviewId)}
                          disabled={!canSelectItem}
                          onChange={event => handleToggleItem(item, event.target.checked)}
                          className="mt-1"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <p className="max-w-[200px] truncate font-medium">{itemTitle(item)}</p>
                        <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{item.itemVersionId}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={item.cardKind === "news" ? "secondary" : "warning"}>
                          {item.cardKind === "news" ? "新闻" : "图片"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{item.className}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.studentDisplay}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatTime(item.submittedAt)}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{item.lesson5StatsSummary?.validAnswerCount ?? 0} 份</p>
                        <p className="mt-1 text-xs text-muted-foreground">正确率 {formatRate(item.lesson5StatsSummary?.correctRate)}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={item.checkStatus} />
                        {item.isActivePublic && <p className="mt-1 text-xs text-emerald-700">当前公共版本</p>}
                      </td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" onClick={() => onPreview(item)}>
                          预览审核
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
