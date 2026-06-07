/**
 * 文件说明：课时 5 会话阶段控制条。
 * 职责：以横向步骤条展示课堂阶段，并提供当前阶段可用入口；统计反馈开放后视为同步课堂收口，后续 V3 学习任务由学生端完成。
 * 更新触发：阶段顺序、阶段中文展示、锁池/试答/统计入口、C3-C7 边界或教师端状态控制策略变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson5Session, Lesson5SessionPhase } from "@/teacher-console/types"

interface Lesson5PhaseControlBarProps {
  session: Lesson5Session | null
  canManage: boolean
  busy?: boolean
  hasComputedStats?: boolean
  onLockPool: () => Promise<void>
  onOpenTrial: () => Promise<void>
  onLockTrial: () => Promise<void>
  onComputeStats: () => Promise<void>
  onOpenAnalytics: () => Promise<void>
}

const phaseSteps: Array<{ phase: Lesson5SessionPhase; label: string }> = [
  { phase: "draft", label: "草稿" },
  { phase: "pool_locked", label: "题池已锁定" },
  { phase: "trial_open", label: "试答开放" },
  { phase: "trial_locked", label: "试答锁定" },
  { phase: "analytics_open", label: "统计开放" },
]

const phaseLabels: Record<Lesson5SessionPhase, string> = {
  draft: "草稿",
  pool_locked: "题池已锁定",
  trial_open: "试答开放",
  trial_locked: "试答锁定",
  analytics_open: "统计反馈已开放 / 同步课堂已收口",
  revision_open: "统计反馈已开放 / 同步课堂已收口",
  closed: "统计反馈已开放 / 同步课堂已收口",
}

const phaseDescriptions: Partial<Record<Lesson5SessionPhase, string>> = {
  draft: "锁池会冻结当前 V2 题池，并由后端推进到题池已锁定。",
  pool_locked: "开放试答后，学生端 Step2 会启用逐题作答、揭示和快评。",
  trial_open: "学生可开始试答，教师端 progress 表会轮询更新；锁定试答后学生端只读。",
  trial_locked: "先计算统计，可重复覆盖；确认后再开放统计反馈给学生。",
  analytics_open: "学生端第 3 关可查看本人题卡报告，并可进入第 4 关 V3 学习任务；本轮同步课堂已收口。",
  revision_open: "学生端第 3 关可查看本人题卡报告，并可进入第 4 关 V3 学习任务；本轮同步课堂已收口。",
  closed: "学生端第 3 关可查看本人题卡报告，并可进入第 4 关 V3 学习任务；本轮同步课堂已收口。",
}

export function Lesson5PhaseControlBar({
  session,
  canManage,
  busy = false,
  hasComputedStats = false,
  onLockPool,
  onOpenTrial,
  onLockTrial,
  onComputeStats,
  onOpenAnalytics,
}: Lesson5PhaseControlBarProps) {
  const rawCurrentIndex = session ? phaseSteps.findIndex(item => item.phase === session.phase) : -1
  const currentIndex = rawCurrentIndex >= 0 ? rawCurrentIndex : session ? phaseSteps.length - 1 : -1
  const phaseAction = (() => {
    if (!session) {
      return {
        label: "请选择会话",
        busyLabel: "处理中...",
        disabled: true,
        hint: "请选择或创建一个会话后再推进阶段。",
        onClick: undefined,
      }
    }
    if (session.phase === "draft") {
      return {
        label: "锁定当前题池",
        busyLabel: "锁池中...",
        disabled: !canManage,
        hint: "冻结当前 V2 题池后，课堂会进入题池已锁定阶段。",
        onClick: onLockPool,
      }
    }
    if (session.phase === "pool_locked") {
      return {
        label: "开放试答",
        busyLabel: "开放中...",
        disabled: !canManage,
        hint: "推进到试答开放后，学生端可以逐题作答、揭示并快评。",
        onClick: onOpenTrial,
      }
    }
    if (session.phase === "trial_open") {
      return {
        label: "锁定试答",
        busyLabel: "锁定中...",
        disabled: !canManage,
        hint: "锁定后学生端进入只读，不再提交新的 answer 或 rating。",
        onClick: onLockTrial,
      }
    }
    if (session.phase === "analytics_open" || session.phase === "revision_open" || session.phase === "closed") {
      return {
        label: "统计反馈已开放，课堂已收口",
        busyLabel: "处理中...",
        disabled: true,
        hint: "学生端已经可以从第 3 关进入第 4 关 V3 学习任务；教师端后续只需查看提交观察面板。",
        onClick: undefined,
      }
    }
    return {
      label: `等待后续：${phaseLabels[session.phase]}`,
      busyLabel: "处理中...",
      disabled: true,
      hint: "当前阶段没有可用推进动作。",
      onClick: undefined,
    }
  })()

  return (
    <Card>
      <CardHeader>
        <CardTitle>阶段控制</CardTitle>
        <CardDescription>
          先锁定题池，再开放试答；试答锁定后先计算统计，再开放统计反馈并完成同步课堂收口。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!session ? (
          <p className="text-sm text-muted-foreground">请选择或创建一个会话。</p>
        ) : (
          <>
            <div className="grid gap-2 md:grid-cols-5">
              {phaseSteps.map((item, index) => {
                const completed = index < currentIndex
                const active = item.phase === session.phase
                return (
                  <div
                    key={item.phase}
                    className={`rounded-2xl border px-3 py-2 text-xs transition-colors ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : completed
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wide opacity-70">
                      {completed ? "已完成" : active ? "当前" : "后续"}
                    </span>
                    <span className="mt-1 block truncate font-medium">{item.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-muted-foreground">
              当前阶段：<span className="font-medium text-slate-900">{phaseLabels[session.phase]}</span>
              。{phaseDescriptions[session.phase]}
            </div>

            {session.phase === "trial_locked" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void onComputeStats()}
                    disabled={!canManage || busy}
                    title="聚合当前 session 的题卡统计；可重复计算覆盖。"
                  >
                    {busy ? "处理中..." : "① 计算统计"}
                  </Button>
                  <span className="text-xs text-muted-foreground" aria-hidden="true">→</span>
                  <Button
                    onClick={() => void onOpenAnalytics()}
                    disabled={!canManage || busy || !hasComputedStats}
                    title={
                      hasComputedStats
                        ? "开放统计反馈给学生，并推进到 analytics_open。"
                        : "请先点击「计算统计」生成题卡统计，再开放给学生。"
                    }
                  >
                    {busy ? "处理中..." : "② 开放统计"}
                  </Button>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {hasComputedStats
                    ? "统计已就绪，可开放给学生；如需更新数据，可先重新计算统计。"
                    : "试答锁定后须先完成「计算统计」，「开放统计」才会解锁。"}
                  {" "}
                  计算统计只更新教师 analytics，不推进阶段；开放统计会推进到 analytics_open，并允许学生进入第 3 关与第 4 关 V3 学习任务。
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    if (phaseAction.onClick) void phaseAction.onClick()
                  }}
                  disabled={phaseAction.disabled || busy}
                  title={phaseAction.hint}
                >
                  {busy && !phaseAction.disabled ? phaseAction.busyLabel : phaseAction.label}
                </Button>
                <p className="min-w-[220px] flex-1 text-xs leading-5 text-muted-foreground">{phaseAction.hint}</p>
              </div>
            )}

            {!canManage && (
              <p className="text-xs text-muted-foreground">当前班级为只读权限，不能推进阶段。</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
