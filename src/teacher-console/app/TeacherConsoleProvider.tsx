/**
 * 文件说明：teacher-console 顶层状态 Provider。
 * 职责：维护教师控制台会话、刷新保活、登录/登出动作与当前运行模式，向登录页、首页和 admin 授权页提供统一上下文。
 * 更新触发：会话生命周期、adapter 契约、刷新保活策略或上下文字段变化时，需要同步更新本文件。
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { teacherAuthAdapter } from "@/teacher-console/api/teacher-auth.adapter"
import { resolveTeacherConsoleMode } from "@/teacher-console/api/teacher-auth.adapter"
import {
  clearTeacherSession,
  loadTeacherSession,
  saveTeacherSession,
} from "@/teacher-console/app/teacher-session-storage"
import type { TeacherAuthLoginRequest, TeacherConsoleMode, TeacherSession } from "@/teacher-console/types"

interface TeacherConsoleContextValue {
  session: TeacherSession | null
  loading: boolean
  mode: TeacherConsoleMode
  login: (payload: TeacherAuthLoginRequest) => Promise<TeacherSession>
  logout: () => Promise<void>
  refreshSession: () => Promise<TeacherSession | null>
}

const TeacherConsoleContext = createContext<TeacherConsoleContextValue | null>(null)

export function TeacherConsoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TeacherSession | null>(() => loadTeacherSession())
  const [loading, setLoading] = useState(true)
  const mode = resolveTeacherConsoleMode()

  const persistSession = useCallback((nextSession: TeacherSession | null) => {
    setSession(nextSession)
    if (nextSession) {
      saveTeacherSession(nextSession)
      return
    }
    clearTeacherSession()
  }, [])

  const refreshSession = useCallback(async () => {
    const current = loadTeacherSession()
    if (!current) {
      persistSession(null)
      return null
    }
    try {
      const response = await teacherAuthAdapter.me(current.token)
      const refreshed = {
        token: current.token,
        user: response.user,
        classPermissions: response.classPermissions,
      }
      persistSession(refreshed)
      return refreshed
    } catch {
      persistSession(null)
      return null
    }
  }, [persistSession])

  useEffect(() => {
    let active = true
    setLoading(true)
    void refreshSession().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [refreshSession])

  const login = useCallback(async (payload: TeacherAuthLoginRequest) => {
    const response = await teacherAuthAdapter.login(payload)
    const nextSession: TeacherSession = {
      token: response.token,
      user: response.user,
      classPermissions: response.classPermissions,
    }
    persistSession(nextSession)
    return nextSession
  }, [persistSession])

  const logout = useCallback(async () => {
    const currentToken = session?.token
    try {
      if (currentToken) await teacherAuthAdapter.logout(currentToken)
    } finally {
      persistSession(null)
    }
  }, [persistSession, session?.token])

  const value = useMemo<TeacherConsoleContextValue>(() => ({
    session,
    loading,
    mode,
    login,
    logout,
    refreshSession,
  }), [session, loading, mode, login, logout, refreshSession])

  return (
    <TeacherConsoleContext.Provider value={value}>
      {children}
    </TeacherConsoleContext.Provider>
  )
}

export function useTeacherConsole(): TeacherConsoleContextValue {
  const ctx = useContext(TeacherConsoleContext)
  if (!ctx) {
    throw new Error("useTeacherConsole 必须在 TeacherConsoleProvider 内使用")
  }
  return ctx
}
