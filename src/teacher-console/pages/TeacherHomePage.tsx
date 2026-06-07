/**
 * 文件说明：teacher-console 角色首页。
 * 职责：按 admin/teacher/demo 角色展示当前账号能力；teacher/demo 列出可见班级的只读题池概览与最近会话，manage 班级提供课时 5 控制台入口。
 * 更新触发：角色首页信息架构、教师可见班级字段、题池概览展示、最近会话摘要、课时 5 控制台入口、demo 只读口径或 admin 入口变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { getTeacherPermissionLabel } from "@/teacher-console/app/teacher-permissions"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import { teacherAdminAdapter } from "@/teacher-console/api/teacher-admin.adapter"
import { teacherLesson5Adapter } from "@/teacher-console/api/teacher-lesson5.adapter"
import { RoleBadge } from "@/teacher-console/components/RoleBadge"
import type { Lesson5Session, TeacherClassPoolOverview, TeacherVisibleClass } from "@/teacher-console/types"

function poolCardTitle(shortName?: string | null): string {
  const normalized = shortName?.trim()
  return normalized || "未命名题卡"
}

const runTypeLabels: Record<Lesson5Session["runType"], string> = {
  normal: "常规课",
  makeup: "补课/补测",
  test: "测试演练",
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

function formatUpdatedTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function ClassList({
  classes,
  poolOverviews,
  sessionsByClass,
}: {
  classes: TeacherVisibleClass[]
  poolOverviews: Record<string, TeacherClassPoolOverview>
  sessionsByClass: Record<string, Lesson5Session[]>
}) {
  if (classes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-6 text-sm text-muted-foreground">
        当前账号暂无可见班级。
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {classes.map(item => {
        const overview = poolOverviews[item.classId]
        const poolItems = overview?.items ?? []
        const newsCount = poolItems.filter(poolItem => poolItem.cardKind === "news").length
        const imageCount = poolItems.filter(poolItem => poolItem.cardKind === "image").length
        const recentSessions = (sessionsByClass[item.classId] ?? []).slice(0, 3)

        return (
          <Card key={item.classId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{item.className}</CardTitle>
              <CardDescription>
                {item.gradeLabel}
                {" · "}
                {item.classId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  {getTeacherPermissionLabel(item.permission)}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  题池 {poolItems.length} 张
                </span>
                <span className="text-xs text-muted-foreground">
                  新闻 {newsCount} · 图片 {imageCount}
                </span>
              </div>

              <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-3">
                <span>最近会话 {recentSessions.length} 个</span>
                <span>题池更新时间 {overview ? formatUpdatedTime(overview.generatedAt) : "待加载"}</span>
                <span>{item.permission === "manage" ? "可创建/锁池" : "仅看板只读"}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-slate-900">最近课时 5 会话</h3>
                  {item.permission === "manage" && (
                    <Button asChild size="sm">
                      <Link to={`/teacher/module/4/lesson/5?classId=${encodeURIComponent(item.classId)}`}>
                        进入课时5控制台
                      </Link>
                    </Button>
                  )}
                </div>
                {recentSessions.length > 0 ? (
                  recentSessions.map(session => (
                    <div key={session.sessionId} className="rounded-lg border bg-white px-3 py-2 text-xs">
                      <p className="font-medium text-slate-800">{session.title}</p>
                      <p className="mt-1 text-muted-foreground">
                        {runTypeLabels[session.runType]}
                        {" · "}
                        {phaseLabels[session.phase]}
                        {" · "}
                        题量 {session.settings.questionCount}
                        {" · "}
                        更新 {formatUpdatedTime(session.updatedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed bg-white p-3 text-xs text-muted-foreground">
                    当前班级暂无课时 5 会话。
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-900">题池概览</h3>
                {poolItems.length > 0 ? (
                  <>
                    {poolItems.slice(0, 3).map(poolItem => (
                      <div key={poolItem.itemId} className="rounded-lg border bg-slate-50 px-3 py-2 text-xs">
                        <p className="font-medium text-slate-800">
                          {poolItem.cardKind === "news" ? "新闻题卡" : "图片题卡"}
                          {" · "}
                          {poolCardTitle(poolItem.currentV2ShortName)}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {poolItem.authorName}
                          {" · "}
                          {poolItem.authorSeatCode}
                          {" · "}
                          {poolItem.currentV2Status ?? poolItem.status}
                        </p>
                      </div>
                    ))}
                    {poolItems.length > 3 && (
                      <p className="text-xs text-muted-foreground">还有 {poolItems.length - 3} 张题卡未展开。</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">当前班级题池暂无学生 V2 提交。</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function TeacherHomePage() {
  const { session } = useTeacherConsole()
  const [classes, setClasses] = useState<TeacherVisibleClass[]>([])
  const [poolOverviews, setPoolOverviews] = useState<Record<string, TeacherClassPoolOverview>>({})
  const [sessionsByClass, setSessionsByClass] = useState<Record<string, Lesson5Session[]>>({})
  const [loading, setLoading] = useState(Boolean(session))
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session) return
    void teacherAdminAdapter.listTeacherClasses(session.token)
      .then(async nextClasses => {
        setClasses(nextClasses)
        if (nextClasses.length === 0) {
          setPoolOverviews({})
          setSessionsByClass({})
          return
        }
        const entries = await Promise.all(nextClasses.map(async item => {
          const [overview, sessionList] = await Promise.all([
            teacherAdminAdapter.getClassPoolOverview(session.token, item.classId),
            teacherLesson5Adapter.listSessions(session.token, item.classId),
          ])
          return [item.classId, overview, sessionList.sessions] as const
        }))
        setPoolOverviews(Object.fromEntries(entries.map(([classId, overview]) => [classId, overview])))
        setSessionsByClass(Object.fromEntries(entries.map(([classId, , sessions]) => [classId, sessions])))
      })
      .catch(err => setError(err instanceof Error ? err.message : "班级列表加载失败，请稍后再试。"))
      .finally(() => setLoading(false))
  }, [session])

  if (!session) return null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <RoleBadge role={session.user.role} />
              <span className="text-sm text-muted-foreground">{session.user.account}</span>
            </div>
            <h1 className="text-2xl font-semibold">你好，{session.user.displayName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              这里是课时 5 C3b 教师看板。只读账号可查看可见班级的题池规模与最近会话；可管理班级才开放控制台操作。
            </p>
          </div>
        </div>
      </section>

      {session.user.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>管理员入口</CardTitle>
            <CardDescription>
              管理员可以查看全部班级、账号与教师班级授权，并以全量覆盖方式保存教师授权。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/teacher/admin">进入授权管理</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {session.user.role === "teacher" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">我的可见班级</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              可管理班级可进入课时 5 控制台执行 C3b 操作；只读班级展示题池规模、最近会话和阶段状态。
            </p>
          </div>
          {loading ? <p className="text-sm text-muted-foreground">正在加载班级、题池与最近会话...</p> : <ClassList classes={classes} poolOverviews={poolOverviews} sessionsByClass={sessionsByClass} />}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </section>
      )}

      {session.user.role === "demo" && (
        <Card>
          <CardHeader>
            <CardTitle>演示只读账号</CardTitle>
            <CardDescription>
              demo 账号是全局只读看板，可查看全部班级的题池规模、最近会话和阶段状态，不进入操作控制台。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              当前账号无创建、修改、锁池或阶段推进权限；如需操作，请使用有 manage 授权的教师账号登录。
            </p>
            {loading ? <p className="text-sm text-muted-foreground">正在加载班级、题池与最近会话...</p> : <ClassList classes={classes} poolOverviews={poolOverviews} sessionsByClass={sessionsByClass} />}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
