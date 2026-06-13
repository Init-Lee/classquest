/**
 * 文件说明：课时 6 公共题库完整逐题统计表。
 * 职责：展示教师可见公共题库中每个 item-version 的作答量、正确率、context 拆分与最近作答时间，并提供关键列正序/逆序排序。
 * 更新触发：Lesson6 public-bank/item-stats 字段、逐题统计展示列、排序交互、not-ready 阈值或 C5 统计面板信息架构变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"
import type { Lesson6PublicItemStat } from "@/teacher-console/types"
import {
  getLesson6QualitySignal,
  getLesson6QualitySignalSortValue,
  LESSON6_QUALITY_SIGNAL_BADGE_CLASSES,
} from "@/teacher-console/utils/lesson6-stat-signals"

interface Lesson6ItemPerformanceTableProps {
  items: Lesson6PublicItemStat[]
  loading?: boolean
  publicBankCount?: number
}

type SortDirection = "asc" | "desc"
type SortKey =
  | "title"
  | "cardKind"
  | "publishStatus"
  | "qualitySignal"
  | "totalAnswerCount"
  | "totalCorrectRate"
  | "lesson6ClassCorrectRate"
  | "publicShowcaseCorrectRate"
  | "lastAnsweredAt"

interface SortState {
  key: SortKey
  direction: SortDirection
}

interface SortColumn {
  key: SortKey
  label: string
  getValue: (item: Lesson6PublicItemStat) => string | number | null
}

function formatRate(value: number | null | undefined): string {
  return value == null ? "暂无" : `${Math.round(value * 100)}%`
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "暂无"
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(time)
}

function publishStatusLabel(status: Lesson6PublicItemStat["publishStatus"]): string {
  return status === "publishable" ? "已发布" : "待确认"
}

function cardKindLabel(kind: Lesson6PublicItemStat["cardKind"]): string {
  return kind === "image" ? "图片" : "新闻"
}

function itemTitle(item: Lesson6PublicItemStat): string {
  return item.itemShortName.trim() || item.itemVersionId || item.itemId
}

function lastAnsweredTime(item: Lesson6PublicItemStat): number | null {
  if (!item.lastAnsweredAt) return null
  const time = new Date(item.lastAnsweredAt).getTime()
  return Number.isNaN(time) ? null : time
}

const SORT_COLUMNS: SortColumn[] = [
  { key: "title", label: "题目简称", getValue: item => itemTitle(item) },
  { key: "cardKind", label: "类型", getValue: item => cardKindLabel(item.cardKind) },
  { key: "publishStatus", label: "发布状态", getValue: item => publishStatusLabel(item.publishStatus) },
  { key: "qualitySignal", label: "质量信号", getValue: item => getLesson6QualitySignalSortValue(getLesson6QualitySignal(item.totalAnswerCount)) },
  { key: "totalAnswerCount", label: "总作答数", getValue: item => item.totalAnswerCount },
  { key: "totalCorrectRate", label: "总正确率", getValue: item => item.totalCorrectRate },
  { key: "lesson6ClassCorrectRate", label: "课上正确率", getValue: item => item.lesson6ClassCorrectRate },
  { key: "publicShowcaseCorrectRate", label: "访客正确率", getValue: item => item.publicShowcaseCorrectRate },
  { key: "lastAnsweredAt", label: "最近作答", getValue: item => lastAnsweredTime(item) },
]

function compareSortValue(a: string | number | null, b: string | number | null): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "zh-CN", { numeric: true })
}

export function Lesson6ItemPerformanceTable({
  items,
  loading = false,
  publicBankCount = items.length,
}: Lesson6ItemPerformanceTableProps) {
  const notReady = publicBankCount < 6
  const [sortState, setSortState] = useState<SortState>({
    key: "totalAnswerCount",
    direction: "desc",
  })

  const sortedItems = useMemo(() => {
    const column = SORT_COLUMNS.find(item => item.key === sortState.key) ?? SORT_COLUMNS[0]
    return items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const leftValue = column.getValue(left.item)
        const rightValue = column.getValue(right.item)
        const base = compareSortValue(leftValue, rightValue)
        const directed = leftValue == null || rightValue == null || sortState.direction === "asc" ? base : -base
        return directed || left.index - right.index
      })
      .map(entry => entry.item)
  }, [items, sortState])

  const handleSort = (key: SortKey) => {
    setSortState(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  const renderSortHeader = (column: SortColumn, className = "py-2 pr-4") => {
    const selected = sortState.key === column.key
    const sortLabel = selected ? (sortState.direction === "asc" ? "正序" : "逆序") : "未排序"

    return (
      <th
        className={className}
        aria-sort={selected ? (sortState.direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => handleSort(column.key)}
          className={cn(
            "inline-flex items-center gap-1 rounded px-1 py-0.5 text-left font-medium transition-colors hover:bg-slate-100 hover:text-slate-900",
            selected ? "text-slate-900" : "text-muted-foreground",
          )}
          title={`按${column.label}${selected && sortState.direction === "asc" ? "逆序" : "正序"}排序`}
        >
          <span>{column.label}</span>
          <span className="text-[10px]" aria-hidden="true">
            {selected ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}
          </span>
          <span className="sr-only">当前{sortLabel}，点击切换排序。</span>
        </button>
      </th>
    )
  }

  if (loading && items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>公共题库逐题统计</CardTitle>
          <CardDescription>正在加载完整逐题作答数据...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>公共题库逐题统计</CardTitle>
            <CardDescription>
              按公共题库 item-version 汇总作答量、总正确率与课上/访客拆分；不展示作者或应答者身份。
            </CardDescription>
          </div>
          {loading && <span className="text-xs text-muted-foreground">刷新中...</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notReady && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            公共题库当前少于 6 题，公共挑战完整抽题还未就绪；请先确认足够的新闻题与图片题进入公共题库。
          </p>
        )}

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
            还没有公共挑战作答数据。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  {SORT_COLUMNS.map(column => renderSortHeader(
                    column,
                    column.key === "lastAnsweredAt" ? "py-2" : "py-2 pr-4",
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedItems.map(item => (
                  <tr key={item.itemVersionId} className="border-b last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="max-w-[220px] truncate font-medium">{itemTitle(item)}</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{item.itemVersionId}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={item.cardKind === "image" ? "warning" : "secondary"}>
                        {cardKindLabel(item.cardKind)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="success">{publishStatusLabel(item.publishStatus)}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {(() => {
                        const signal = getLesson6QualitySignal(item.totalAnswerCount)
                        return (
                          <div>
                            <Badge variant="outline" className={LESSON6_QUALITY_SIGNAL_BADGE_CLASSES[signal.id]}>
                              {signal.label}
                            </Badge>
                            <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">{signal.description}</p>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="py-3 pr-4">{item.totalAnswerCount}</td>
                    <td className="py-3 pr-4">{formatRate(item.totalCorrectRate)}</td>
                    <td className="py-3 pr-4">
                      <div>{formatRate(item.lesson6ClassCorrectRate)}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.lesson6ClassAnswerCount} 次作答</p>
                    </td>
                    <td className="py-3 pr-4">
                      <div>{formatRate(item.publicShowcaseCorrectRate)}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.publicShowcaseAnswerCount} 次作答</p>
                    </td>
                    <td className="py-3">{formatDateTime(item.lastAnsweredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
