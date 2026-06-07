/**
 * 文件说明：模块 4 课时 5 教师控制台页面。
 * 职责：串联可管理班级选择、会话创建/列表、草稿设置修改、锁池控制、试答开放、试答锁定、统计计算/开放、同步课堂收口、概览、进度表、analytics 与 revision-plans 观察面板，作为课时 5 教师端操作入口。
 * 更新触发：课时 5 教师端 C3-C7 范围、页面信息架构、会话/progress/analytics/revision-plans API 契约、中文展示口径或人机验证路径变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { teacherAdminAdapter } from "@/teacher-console/api/teacher-admin.adapter"
import { teacherLesson5Adapter } from "@/teacher-console/api/teacher-lesson5.adapter"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import { Lesson5PhaseControlBar } from "@/teacher-console/components/Lesson5PhaseControlBar"
import { Lesson5SessionCreatePanel } from "@/teacher-console/components/Lesson5SessionCreatePanel"
import { Lesson5SessionDataTabs } from "@/teacher-console/components/Lesson5SessionDataTabs"
import { Lesson5SessionList } from "@/teacher-console/components/Lesson5SessionList"
import { PermissionGuard } from "@/teacher-console/components/PermissionGuard"
import type {
  CreateLesson5SessionRequest,
  Lesson5Session,
  Lesson5SessionOverview,
  Lesson5SessionPhase,
  TeacherClassPoolOverview,
  TeacherVisibleClass,
} from "@/teacher-console/types"

const phaseLabels: Record<Lesson5SessionPhase, string> = {
  draft: "草稿",
  pool_locked: "题池已锁定",
  trial_open: "试答开放",
  trial_locked: "试答锁定",
  analytics_open: "统计反馈已开放 / 同步课堂已收口",
  revision_open: "统计反馈已开放 / 同步课堂已收口",
  closed: "统计反馈已开放 / 同步课堂已收口",
}

export default function Module4Lesson5ConsolePage() {
  const { session } = useTeacherConsole()
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState<TeacherVisibleClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState("")
  const [sessions, setSessions] = useState<Lesson5Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [classPoolOverview, setClassPoolOverview] = useState<TeacherClassPoolOverview | null>(null)
  const [sessionOverview, setSessionOverview] = useState<Lesson5SessionOverview | null>(null)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [hasComputedStats, setHasComputedStats] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const selectedClass = classes.find(item => item.classId === selectedClassId)
  const selectedSession = useMemo(
    () => sessions.find(item => item.sessionId === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  )
  const canManageSelectedClass = selectedClass?.permission === "manage"

  const loadOverview = useCallback(async (sessionId: string) => {
    if (!session || !sessionId) {
      setSessionOverview(null)
      return
    }
    setLoadingOverview(true)
    try {
      const overview = await teacherLesson5Adapter.getOverview(session.token, sessionId)
      setSessionOverview(overview)
    } catch (err) {
      setSessionOverview(null)
      setError(err instanceof Error ? err.message : "会话概览加载失败，请稍后再试。")
    } finally {
      setLoadingOverview(false)
    }
  }, [session])

  const reloadClassData = useCallback(async (classId: string, preferredSessionId = "") => {
    if (!session || !classId) {
      setSessions([])
      setClassPoolOverview(null)
      setSelectedSessionId("")
      setSessionOverview(null)
      return
    }
    setLoadingSessions(true)
    setError("")
    try {
      const [sessionList, poolOverview] = await Promise.all([
        teacherLesson5Adapter.listSessions(session.token, classId),
        teacherAdminAdapter.getClassPoolOverview(session.token, classId),
      ])
      setSessions(sessionList.sessions)
      setClassPoolOverview(poolOverview)
      const nextSessionId = preferredSessionId
        || sessionList.sessions.find(item => item.sessionId === selectedSessionId)?.sessionId
        || sessionList.sessions[0]?.sessionId
        || ""
      setSelectedSessionId(nextSessionId)
      if (!nextSessionId) setSessionOverview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "课时 5 控制台数据加载失败，请稍后再试。")
    } finally {
      setLoadingSessions(false)
    }
  }, [selectedSessionId, session])

  useEffect(() => {
    if (!session) return
    setLoadingClasses(true)
    setError("")
    void teacherAdminAdapter.listTeacherClasses(session.token)
      .then(nextClasses => {
        const manageableClasses = nextClasses.filter(item => item.permission === "manage")
        setClasses(manageableClasses)
        const requestedClassId = searchParams.get("classId") ?? ""
        const requestedManageable = manageableClasses.some(item => item.classId === requestedClassId)
        setSelectedClassId(current => {
          if (manageableClasses.some(item => item.classId === current)) return current
          if (requestedManageable) return requestedClassId
          return manageableClasses[0]?.classId || ""
        })
      })
      .catch(err => setError(err instanceof Error ? err.message : "班级列表加载失败，请稍后再试。"))
      .finally(() => setLoadingClasses(false))
  }, [searchParams, session])

  useEffect(() => {
    if (selectedClassId) {
      void reloadClassData(selectedClassId)
    }
  }, [selectedClassId, reloadClassData])

  useEffect(() => {
    if (selectedSessionId) {
      void loadOverview(selectedSessionId)
      return
    }
    setSessionOverview(null)
  }, [selectedSessionId, loadOverview])

  const refreshStatsComputedState = useCallback(async (sessionId: string, phase: Lesson5SessionPhase | undefined) => {
    if (!session || !sessionId) {
      setHasComputedStats(false)
      return
    }
    if (phase === "analytics_open" || phase === "revision_open" || phase === "closed") {
      setHasComputedStats(true)
      return
    }
    if (phase !== "trial_locked") {
      setHasComputedStats(false)
      return
    }
    const computed = await teacherLesson5Adapter.checkSessionStatsComputed(session.token, sessionId)
    setHasComputedStats(computed)
  }, [session])

  useEffect(() => {
    void refreshStatsComputedState(selectedSessionId, selectedSession?.phase)
  }, [refreshStatsComputedState, selectedSession?.phase, selectedSessionId])

  const handleCreate = async (payload: CreateLesson5SessionRequest) => {
    if (!session) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const created = await teacherLesson5Adapter.createSession(session.token, payload)
      setMessage(`已创建会话：${created.title}`)
      await reloadClassData(created.classId, created.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建会话失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateQuestionCount = async (sessionId: string, questionCount: number) => {
    if (!session || !selectedClassId) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      await teacherLesson5Adapter.updateSettings(session.token, sessionId, {
        settings: { questionCount },
      })
      setMessage("已保存草稿会话设置。")
      await reloadClassData(selectedClassId, sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存会话设置失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handleLockPool = async () => {
    if (!session || !selectedSession || !selectedClassId) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const response = await teacherLesson5Adapter.lockPool(session.token, selectedSession.sessionId)
      setMessage(`已锁定题池：共 ${response.frozen.total} 张，当前阶段为${phaseLabels[response.phase]}。`)
      await reloadClassData(selectedClassId, selectedSession.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "锁池失败，请稍后再试。")
    } finally {
      setBusy(false)
    }
  }

  const handleOpenTrial = async () => {
    if (!session || !selectedSession || !selectedClassId) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const response = await teacherLesson5Adapter.changePhase(session.token, selectedSession.sessionId, {
        targetPhase: "trial_open",
      })
      setMessage(`已开放试答：当前阶段为${phaseLabels[response.phase]}。`)
      await reloadClassData(selectedClassId, selectedSession.sessionId)
      await loadOverview(selectedSession.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "开放试答失败，请确认当前会话已锁池且账号有管理权限。")
    } finally {
      setBusy(false)
    }
  }

  const handleLockTrial = async () => {
    if (!session || !selectedSession || !selectedClassId) return
    const confirmed = window.confirm("锁定试答后，学生端将不能再提交新的答案或快评。确认锁定当前试答吗？")
    if (!confirmed) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const response = await teacherLesson5Adapter.changePhase(session.token, selectedSession.sessionId, {
        targetPhase: "trial_locked",
      })
      setMessage(`已锁定试答：当前阶段为${phaseLabels[response.phase]}。请先计算统计，再开放统计反馈。`)
      await reloadClassData(selectedClassId, selectedSession.sessionId)
      await loadOverview(selectedSession.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "锁定试答失败，请确认当前会话处于试答开放阶段且账号有管理权限。")
    } finally {
      setBusy(false)
    }
  }

  const handleComputeStats = async () => {
    if (!session || !selectedSession || !selectedClassId) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const response = await teacherLesson5Adapter.computeStats(session.token, selectedSession.sessionId)
      setHasComputedStats(true)
      setMessage(`已计算统计：共 ${response.computedItemCount} 张题卡；样本不足 ${response.statsStatusBreakdown.insufficient}，初步参考 ${response.statsStatusBreakdown.preliminary}，较稳定 ${response.statsStatusBreakdown.stable}。`)
      await reloadClassData(selectedClassId, selectedSession.sessionId)
      await loadOverview(selectedSession.sessionId)
      setAnalyticsRefreshKey(key => key + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "计算统计失败，请确认当前会话已锁定试答且账号有管理权限。")
    } finally {
      setBusy(false)
    }
  }

  const handleOpenAnalytics = async () => {
    if (!session || !selectedSession || !selectedClassId) return
    const confirmed = window.confirm("开放统计后，学生端第 3 关会显示本人题卡报告，并可进入第 4 关 V3 学习任务；本轮同步课堂到此收口。确认开放统计反馈吗？")
    if (!confirmed) return
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const response = await teacherLesson5Adapter.changePhase(session.token, selectedSession.sessionId, {
        targetPhase: "analytics_open",
      })
      setMessage(`已开放统计反馈，同步课堂已收口：当前阶段为${phaseLabels[response.phase]}。`)
      await reloadClassData(selectedClassId, selectedSession.sessionId)
      await loadOverview(selectedSession.sessionId)
      setAnalyticsRefreshKey(key => key + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "开放统计失败，请先计算统计；后端会在未计算时返回 409。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PermissionGuard allow={["teacher"]}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">模块 4 · 课时 5 教师控制台</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                操作控制台只面向可管理班级，覆盖创建会话、查看会话列表、修改草稿设置、锁池冻结、阶段状态、题池概览、C5 试答进度与统计反馈开放；统计开放后同步课堂收口，V3 由学生端学习任务完成。
              </p>
            </div>
            {selectedClass && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {selectedClass.className} · {selectedClass.permission === "manage" ? "可管理" : "只读"}
              </span>
            )}
          </div>
        </section>

        {loadingClasses ? (
          <p className="text-sm text-muted-foreground">正在加载教师班级...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="space-y-6">
              <Lesson5SessionList
                classes={classes}
                selectedClassId={selectedClassId}
                onClassChange={classId => {
                  setSelectedClassId(classId)
                  setMessage("")
                  setError("")
                }}
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                canManage={canManageSelectedClass}
                loading={loadingSessions}
                onSelect={sessionId => {
                  setSelectedSessionId(sessionId)
                  setMessage("")
                  setError("")
                }}
                onRefresh={() => void reloadClassData(selectedClassId)}
                onCreateClick={() => setCreateDialogOpen(true)}
                onUpdateQuestionCount={handleUpdateQuestionCount}
              />
              <Lesson5SessionCreatePanel
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                classes={classes}
                selectedClassId={selectedClassId}
                onClassChange={classId => {
                  setSelectedClassId(classId)
                  setMessage("")
                  setError("")
                }}
                onCreate={handleCreate}
                disabled={busy}
              />
            </div>

            <div className="space-y-6">
              {(message || error) && (
                <div className={`rounded-lg px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {error || message}
                </div>
              )}
              <Lesson5PhaseControlBar
                session={selectedSession}
                canManage={canManageSelectedClass}
                busy={busy}
                hasComputedStats={hasComputedStats}
                onLockPool={handleLockPool}
                onOpenTrial={handleOpenTrial}
                onLockTrial={handleLockTrial}
                onComputeStats={handleComputeStats}
                onOpenAnalytics={handleOpenAnalytics}
              />
              {session && (
                <Lesson5SessionDataTabs
                  token={session.token}
                  selectedSession={selectedSession}
                  selectedSessionId={selectedSessionId}
                  sessionOverview={sessionOverview}
                  classPoolOverview={classPoolOverview}
                  loadingOverview={loadingOverview || loadingSessions}
                  analyticsRefreshKey={analyticsRefreshKey}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
