/**
 * 文件说明：teacher-console 独立页面外壳。
 * 职责：承载教师控制台顶栏、登录态闸门、角色导航与 Outlet 内容区，独立于平台门户和模块学习外壳运行。
 * 更新触发：教师控制台路由结构、顶栏导航、登录态跳转或独立外壳视觉规范变化时，需要同步更新本文件。
 */

import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import { canAccessTeacherAdmin } from "@/teacher-console/app/teacher-permissions"
import { RoleBadge } from "@/teacher-console/components/RoleBadge"

export function TeacherShell() {
  const { session, loading, logout, mode } = useTeacherConsole()
  const location = useLocation()
  const isLoginRoute = location.pathname === "/teacher/login"

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-muted-foreground">
        正在恢复教师控制台会话...
      </div>
    )
  }

  if (!session && !isLoginRoute) {
    return <Navigate to="/teacher/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/teacher" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              TC
            </div>
            <div>
              <div className="text-sm font-semibold">ClassQuest 教师控制台</div>
              <div className="text-xs text-muted-foreground">模块 4 · 教师控制台</div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {mode === "http" ? "HTTP 模式" : "Fixture 模式"}
            </span>
            {session && (
              <>
                <RoleBadge role={session.user.role} />
                <span className="text-sm text-slate-700">{session.user.displayName}</span>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/teacher">首页</Link>
                </Button>
                {canAccessTeacherAdmin(session) && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/teacher/admin">授权管理</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => void logout()}>
                  退出
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
