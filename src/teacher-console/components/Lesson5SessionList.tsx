/**
 * 文件说明：课时 5 教师会话列表组件。
 * 职责：展示当前班级会话、支持班级切换与选择当前会话，提供创建会话入口，并在草稿阶段提供题量设置修改。
 * 更新触发：会话列表字段、阶段或运行类型展示、班级切换、创建入口、草稿设置编辑规则或列表选择交互变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"
import { ClassSelector } from "@/teacher-console/components/ClassSelector"
import type { Lesson5Session, TeacherVisibleClass } from "@/teacher-console/types"

interface Lesson5SessionListProps {
  classes: TeacherVisibleClass[]
  selectedClassId: string
  onClassChange: (classId: string) => void
  sessions: Lesson5Session[]
  selectedSessionId: string
  canManage: boolean
  loading?: boolean
  onSelect: (sessionId: string) => void
  onRefresh: () => void
  onCreateClick: () => void
  onUpdateQuestionCount: (sessionId: string, questionCount: number) => Promise<void>
}

const phaseLabels: Record<Lesson5Session["phase"], string> = {
  draft: "草稿",
  pool_locked: "题池已锁定",
  trial_open: "试答开放",
  trial_locked: "试答锁定",
  analytics_open: "统计反馈已开放 / 同步课堂已收口",
  revision_open: "统计反馈已开放 / 同步课堂已收口",
  closed: "统计反馈已开放 / 同步课堂已收口",
}

const runTypeLabels: Record<Lesson5Session["runType"], string> = {
  normal: "常规课",
  makeup: "补课/补测",
  test: "测试演练",
}

function formatSessionTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function SessionStatChip({
  label,
  value,
  toneClass,
}: {
  label: string
  value: string | number
  toneClass: string
}) {
  return (
    <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium leading-none", toneClass)}>
      <span className="mr-1 opacity-75">{label}</span>
      {value}
    </span>
  )
}

export function Lesson5SessionList({
  classes,
  selectedClassId,
  onClassChange,
  sessions,
  selectedSessionId,
  canManage,
  loading = false,
  onSelect,
  onRefresh,
  onCreateClick,
  onUpdateQuestionCount,
}: Lesson5SessionListProps) {
  const selectableClasses = classes.map(item => ({ ...item, active: true }))
  const [savingSessionId, setSavingSessionId] = useState("")
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({})

  const handleSave = async (session: Lesson5Session) => {
    const nextCount = draftCounts[session.sessionId] ?? session.settings.questionCount
    setSavingSessionId(session.sessionId)
    try {
      await onUpdateQuestionCount(session.sessionId, nextCount)
    } finally {
      setSavingSessionId("")
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>会话列表</CardTitle>
            <CardDescription>选择一个会话后，可在右侧查看题池概览并执行锁池。</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button size="sm" onClick={onCreateClick} disabled={loading}>
                创建会话
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              刷新
            </Button>
          </div>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">班级</span>
          <ClassSelector
            classes={selectableClasses}
            value={selectedClassId}
            onChange={onClassChange}
            disabled={loading}
          />
        </label>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">正在加载会话...</p>}
        {!loading && sessions.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-5 text-sm text-muted-foreground">
            当前班级还没有课时 5 会话。点击上方「创建会话」即可新建草稿会话。
          </div>
        )}
        {sessions.map(session => {
          const selected = session.sessionId === selectedSessionId
          const editable = canManage && session.phase === "draft"
          const draftCount = draftCounts[session.sessionId] ?? session.settings.questionCount
          const saving = savingSessionId === session.sessionId

          return (
            <div
              key={session.sessionId}
              className={`rounded-lg border bg-white p-4 ${selected ? "border-slate-900 ring-1 ring-slate-900" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelect(session.sessionId)}
                className="w-full space-y-2 text-left"
              >
                <p className="font-medium text-slate-900">{session.title}</p>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    创建于 {formatSessionTime(session.createdAt)}
                  </p>
                  <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-right text-[11px] font-medium leading-5 text-slate-700">
                    {phaseLabels[session.phase]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SessionStatChip label="题量" value={session.settings.questionCount} toneClass="bg-sky-100 text-sky-800" />
                  <SessionStatChip label="新闻" value={session.settings.newsCount} toneClass="bg-emerald-100 text-emerald-800" />
                  <SessionStatChip label="图片" value={session.settings.imageCount} toneClass="bg-amber-100 text-amber-900" />
                  <SessionStatChip label="类型" value={runTypeLabels[session.runType]} toneClass="bg-violet-100 text-violet-800" />
                </div>
              </button>

              {editable && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={draftCount}
                    onChange={event => setDraftCounts(current => ({
                      ...current,
                      [session.sessionId]: Number(event.target.value),
                    }))}
                    disabled={saving}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={6}>6 题</option>
                    <option value={8}>8 题</option>
                    <option value={10}>10 题</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleSave(session)}
                    disabled={saving || draftCount === session.settings.questionCount}
                  >
                    {saving ? "保存中..." : "保存设置"}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
