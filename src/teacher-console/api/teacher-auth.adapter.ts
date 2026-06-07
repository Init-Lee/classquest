/**
 * 文件说明：teacher-console 认证 adapter。
 * 职责：提供登录、me 与登出入口，默认使用 fixture 数据，设置 VITE_TEACHER_CONSOLE_MODE=http 后对接 C1a 后端 auth API。
 * 更新触发：认证 endpoint、Authorization 头格式、环境变量、fixture 账号或错误映射变化时，需要同步更新本文件。
 */

import type {
  TeacherAuthAdapter,
  TeacherAuthLoginRequest,
  TeacherAuthLoginResponse,
  TeacherAuthLogoutResponse,
  TeacherAuthMeResponse,
  TeacherClassPermissionItem,
  TeacherConsoleMode,
  TeacherLoginAccount,
  TeacherSession,
  TeacherUser,
} from "@/teacher-console/types"

const TEACHER_AUTH_BASE_PATH = "/api/v1/module4/auth"

export class TeacherConsoleHttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "TeacherConsoleHttpError"
    this.status = status
  }
}

const fixtureUsers: Record<TeacherLoginAccount, TeacherUser> = {
  "xnwy-admin": {
    userId: "user_xnwy_admin",
    account: "xnwy-admin",
    displayName: "西南位育管理员",
    role: "admin",
  },
  "xnwy-li": {
    userId: "user_xnwy_li",
    account: "xnwy-li",
    displayName: "李老师",
    role: "teacher",
  },
  "xnwy-zhang": {
    userId: "user_xnwy_zhang",
    account: "xnwy-zhang",
    displayName: "张老师",
    role: "teacher",
  },
  "xnwy-tang": {
    userId: "user_xnwy_tang",
    account: "xnwy-tang",
    displayName: "唐老师",
    role: "teacher",
  },
  "xnwy-demo": {
    userId: "user_xnwy_demo",
    account: "xnwy-demo",
    displayName: "演示账号",
    role: "demo",
  },
}

export const fixtureClassPermissions: Record<TeacherLoginAccount, TeacherClassPermissionItem[]> = {
  "xnwy-admin": [],
  "xnwy-li": [
    { classId: "g7c03", className: "七年级 3 班", permission: "manage" },
    { classId: "g7c04", className: "七年级 4 班", permission: "view" },
  ],
  "xnwy-zhang": [
    { classId: "g7c05", className: "七年级 5 班", permission: "manage" },
  ],
  "xnwy-tang": [
    { classId: "g7c06", className: "七年级 6 班", permission: "view" },
  ],
  "xnwy-demo": [],
}

export function resolveTeacherConsoleMode(): TeacherConsoleMode {
  return import.meta.env.VITE_TEACHER_CONSOLE_MODE === "http" ? "http" : "fixture"
}

export function resolveTeacherConsoleEndpoint(path: string, basePath: string): string {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
  return `${base}${basePath}${path}`
}

export function buildTeacherAuthHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export function buildTeacherJsonHeaders(token?: string): HeadersInit {
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

export async function fetchTeacherJson<TResponse>(url: string, init: RequestInit): Promise<TResponse> {
  const response = await fetch(url, init)
  if (!response.ok) {
    let detail = ""
    try {
      const body = await response.json() as { detail?: string | Array<{ msg?: string }> }
      if (typeof body.detail === "string" && body.detail.trim()) {
        detail = body.detail.trim()
      }
    } catch {
      // 忽略非 JSON 错误体，回退到状态码映射文案。
    }
    throw new TeacherConsoleHttpError(detail || mapTeacherHttpError(response.status), response.status)
  }
  return await response.json() as TResponse
}

function mapTeacherHttpError(status: number): string {
  if (status === 400) return "提交的数据不完整或包含无效班级，请检查后重试。"
  if (status === 401) return "登录状态已失效，请重新登录。"
  if (status === 403) return "当前账号没有执行该操作的权限。"
  if (status === 404) return "没有找到对应的数据，请刷新后重试。"
  if (status === 422) return "提交字段格式不符合服务端要求，请检查后重试。"
  return "教师控制台服务暂时不可用，请稍后再试。"
}

function buildFixtureToken(account: TeacherLoginAccount): string {
  return `fixture_teacher_console_${account}`
}

function parseFixtureAccount(token: string): TeacherLoginAccount | null {
  const prefix = "fixture_teacher_console_"
  if (!token.startsWith(prefix)) return null
  const account = token.slice(prefix.length)
  return account in fixtureUsers ? account as TeacherLoginAccount : null
}

function buildFixtureSession(account: TeacherLoginAccount): TeacherSession {
  return {
    token: buildFixtureToken(account),
    user: fixtureUsers[account],
    classPermissions: fixtureClassPermissions[account],
  }
}

async function loginFixture(payload: TeacherAuthLoginRequest): Promise<TeacherAuthLoginResponse> {
  if (payload.account !== "xnwy-demo" && !payload.password.trim()) {
    throw new TeacherConsoleHttpError("请输入教师统一口令。", 401)
  }
  return buildFixtureSession(payload.account)
}

async function meFixture(token: string): Promise<TeacherAuthMeResponse> {
  const account = parseFixtureAccount(token)
  if (!account) {
    throw new TeacherConsoleHttpError("登录状态已失效，请重新登录。", 401)
  }
  const session = buildFixtureSession(account)
  return {
    user: session.user,
    classPermissions: session.classPermissions,
  }
}

async function logoutFixture(): Promise<TeacherAuthLogoutResponse> {
  return { ok: true }
}

async function loginHttp(payload: TeacherAuthLoginRequest): Promise<TeacherAuthLoginResponse> {
  return await fetchTeacherJson<TeacherAuthLoginResponse>(
    resolveTeacherConsoleEndpoint("/login", TEACHER_AUTH_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

async function meHttp(token: string): Promise<TeacherAuthMeResponse> {
  return await fetchTeacherJson<TeacherAuthMeResponse>(
    resolveTeacherConsoleEndpoint("/me", TEACHER_AUTH_BASE_PATH),
    {
      method: "GET",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

async function logoutHttp(token: string): Promise<TeacherAuthLogoutResponse> {
  return await fetchTeacherJson<TeacherAuthLogoutResponse>(
    resolveTeacherConsoleEndpoint("/logout", TEACHER_AUTH_BASE_PATH),
    {
      method: "POST",
      headers: buildTeacherAuthHeaders(token),
    },
  )
}

export const teacherAuthAdapter: TeacherAuthAdapter = {
  login: payload => resolveTeacherConsoleMode() === "http" ? loginHttp(payload) : loginFixture(payload),
  me: token => resolveTeacherConsoleMode() === "http" ? meHttp(token) : meFixture(token),
  logout: token => resolveTeacherConsoleMode() === "http" ? logoutHttp(token) : logoutFixture(),
}
