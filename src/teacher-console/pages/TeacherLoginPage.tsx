/**
 * 文件说明：teacher-console 登录页。
 * 职责：提供五个允许账号的下拉选择、demo 免密码提示与非 demo 口令输入，提交到 auth adapter；不在前端保存或硬编码真实口令。
 * 更新触发：允许登录账号、登录字段、登录后跳转或错误展示方式变化时，需要同步更新本文件。
 */

import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { useTeacherConsole } from "@/teacher-console/app/TeacherConsoleProvider"
import { TEACHER_LOGIN_ACCOUNTS, type TeacherLoginAccount } from "@/teacher-console/types"

function getRedirectTarget(state: unknown): string {
  if (!state || typeof state !== "object") return "/teacher"
  const from = (state as { from?: unknown }).from
  return typeof from === "string" && from.startsWith("/teacher") ? from : "/teacher"
}

export default function TeacherLoginPage() {
  const { session, login, mode } = useTeacherConsole()
  const navigate = useNavigate()
  const location = useLocation()
  const [account, setAccount] = useState<TeacherLoginAccount>("xnwy-li")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const isDemoAccount = account === "xnwy-demo"

  if (session) return <Navigate to="/teacher" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login({ account, password })
      navigate(getRedirectTarget(location.state), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后再试。")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-66px)] w-full max-w-5xl items-center px-4 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-2xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm text-slate-300">Lesson 5 · C1b 停点</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">教师控制台登录与班级授权</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            本批只开放登录、刷新保活、角色首页、管理员授权页与教师班级只读视图。Live Session 的建课、锁池和阶段机留到后续 C3。
          </p>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
            当前运行：
            <span className="font-semibold">{mode === "http" ? "HTTP 后端联调" : "Fixture 前端演示"}</span>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>登录教师控制台</CardTitle>
            <CardDescription>
              请选择账号；demo 免密码，其它账号需输入服务端配置的统一口令。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="teacher-account">账号</label>
                <select
                  id="teacher-account"
                  value={account}
                  onChange={event => setAccount(event.target.value as TeacherLoginAccount)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TEACHER_LOGIN_ACCOUNTS.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="teacher-password">
                  {isDemoAccount ? "统一口令（demo 免密码）" : "统一口令"}
                </label>
                <Input
                  id="teacher-password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder={isDemoAccount ? "demo 可留空直接登录" : "输入服务端配置的口令"}
                />
                {isDemoAccount && (
                  <p className="text-xs text-slate-500">xnwy-demo 为只读演示账号，可不输入密码。</p>
                )}
              </div>
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button className="w-full" type="submit" disabled={submitting || (!isDemoAccount && !password.trim())}>
                {submitting ? "登录中..." : "登录"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
