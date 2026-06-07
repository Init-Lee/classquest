/**
 * 文件说明：课时 5 教师控制台会话数据标签页容器。
 * 职责：以文件夹标签样式叠堆题池/试答/统计/V3 四个面板，按 session 阶段解锁并在阶段推进时自动切换推荐标签。
 * 更新触发：标签页数量、解锁规则、自动切换策略、嵌入面板或控制台右侧信息架构变化时，需要同步更新本文件。
 */

import { Lock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/shared/utils/cn"
import { Lesson5AnalyticsPanel } from "@/teacher-console/components/Lesson5AnalyticsPanel"
import { Lesson5PoolOverview } from "@/teacher-console/components/Lesson5PoolOverview"
import { Lesson5RevisionPlansPanel } from "@/teacher-console/components/Lesson5RevisionPlansPanel"
import { Lesson5TrialProgressTable } from "@/teacher-console/components/Lesson5TrialProgressTable"
import type {
  Lesson5Session,
  Lesson5SessionOverview,
  TeacherClassPoolOverview,
} from "@/teacher-console/types"
import {
  getLesson5SessionDataTabLockHint,
  getRecommendedLesson5SessionDataTab,
  isLesson5SessionDataTabUnlocked,
  LESSON5_SESSION_DATA_TABS,
  type Lesson5SessionDataTabId,
} from "@/teacher-console/utils/lesson5-session-data-tabs"

interface Lesson5SessionDataTabsProps {
  token: string
  selectedSession: Lesson5Session | null
  selectedSessionId: string
  sessionOverview: Lesson5SessionOverview | null
  classPoolOverview: TeacherClassPoolOverview | null
  loadingOverview?: boolean
  analyticsRefreshKey?: number
}

export function Lesson5SessionDataTabs({
  token,
  selectedSession,
  selectedSessionId,
  sessionOverview,
  classPoolOverview,
  loadingOverview = false,
  analyticsRefreshKey = 0,
}: Lesson5SessionDataTabsProps) {
  const hasSession = Boolean(selectedSessionId)
  const phase = selectedSession?.phase
  const [activeTab, setActiveTab] = useState<Lesson5SessionDataTabId>("pool")
  const prevSessionIdRef = useRef("")
  const prevPhaseRef = useRef(selectedSession?.phase)

  useEffect(() => {
    const recommended = getRecommendedLesson5SessionDataTab(phase, hasSession)
    const sessionChanged = selectedSessionId !== prevSessionIdRef.current
    const phaseChanged = phase !== prevPhaseRef.current

    if (sessionChanged) {
      setActiveTab(recommended)
      prevSessionIdRef.current = selectedSessionId
      prevPhaseRef.current = phase
      return
    }

    if (phaseChanged) {
      setActiveTab(recommended)
      prevPhaseRef.current = phase
      return
    }

    setActiveTab(current =>
      isLesson5SessionDataTabUnlocked(current, phase, hasSession) ? current : recommended,
    )
  }, [hasSession, phase, selectedSessionId])

  const activeMeta = LESSON5_SESSION_DATA_TABS.find(item => item.id === activeTab) ?? LESSON5_SESSION_DATA_TABS[0]

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-end gap-1 px-1" role="tablist" aria-label="会话数据标签页">
        {LESSON5_SESSION_DATA_TABS.map(tab => {
          const unlocked = isLesson5SessionDataTabUnlocked(tab.id, phase, hasSession)
          const selected = activeTab === tab.id
          const lockHint = getLesson5SessionDataTabLockHint(tab.id, phase, hasSession)

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-disabled={!unlocked}
              disabled={!unlocked}
              title={unlocked ? tab.description : lockHint}
              onClick={() => {
                if (unlocked) setActiveTab(tab.id)
              }}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "z-10 -mb-px border-slate-200 bg-white text-slate-900 shadow-sm"
                  : unlocked
                    ? "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    : "cursor-not-allowed border-transparent bg-slate-50 text-slate-400",
              )}
            >
              {!unlocked && <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      <section
        role="tabpanel"
        aria-label={activeMeta.label}
        className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">{activeMeta.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{activeMeta.description}</p>
        </div>

        {activeTab === "pool" && (
          <Lesson5PoolOverview
            embedded
            token={token}
            overview={sessionOverview}
            classPoolOverview={classPoolOverview}
            loading={loadingOverview}
          />
        )}

        {activeTab === "trial" && hasSession && (
          <Lesson5TrialProgressTable
            key={`${selectedSessionId}:${phase ?? ""}`}
            embedded
            token={token}
            sessionId={selectedSessionId}
          />
        )}

        {activeTab === "analytics" && selectedSession && (
          <Lesson5AnalyticsPanel
            key={`${selectedSession.sessionId}:${selectedSession.phase}:analytics`}
            embedded
            token={token}
            sessionId={selectedSession.sessionId}
            phase={selectedSession.phase}
            refreshKey={analyticsRefreshKey}
          />
        )}

        {activeTab === "revision" && selectedSession && (
          <Lesson5RevisionPlansPanel
            key={`${selectedSession.sessionId}:${selectedSession.phase}:revision-plans`}
            embedded
            token={token}
            sessionId={selectedSession.sessionId}
            phase={selectedSession.phase}
          />
        )}
      </section>
    </div>
  )
}
