/**
 * 文件说明：模块 4 学习档案 Provider。
 * 职责：向模块 4 页面提供 local-first 档案读写、继续学习包导入、重置和教师讲解模式状态，是模块 4 状态的顶层容器。
 * 更新触发：模块 4 档案字段、持久化仓库、教师模式或全局操作能力变化时，需要同步更新本文件。
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  createNewModule4Portfolio,
  normalizeModule4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { module4PortfolioRepository } from "@/modules/module-4-ai-info-detective/infra/persistence/repositories/portfolio.repository.idb"
import { createModule4TeacherLecturePortfolio } from "@/modules/module-4-ai-info-detective/constants/demo-portfolio"
import { resolveModule4PortfolioPointer } from "@/modules/module-4-ai-info-detective/app/lesson-registry"

interface Module4ContextValue {
  portfolio: Module4Portfolio | null
  loading: boolean
  savePortfolio: (updated: Module4Portfolio) => Promise<void>
  importPortfolio: (imported: Module4Portfolio) => Promise<void>
  createPortfolio: (student?: Partial<Module4Portfolio["student"]>) => Promise<Module4Portfolio>
  reload: () => Promise<void>
  clearPortfolio: () => Promise<void>
  isTeacherMode: boolean
  enterTeacherMode: () => void
  exitTeacherMode: () => void
  resetTeacherMode: () => void
}

const Module4Context = createContext<Module4ContextValue | null>(null)

export function Module4Provider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<Module4Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [demoPortfolio, setDemoPortfolio] = useState<Module4Portfolio | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const current = await module4PortfolioRepository.getCurrent()
      if (!current) {
        setPortfolio(null)
        return
      }

      const normalized = normalizeModule4Portfolio(current)
      const repairedPointer = resolveModule4PortfolioPointer(normalized)
      const repairedPortfolio = { ...normalized, progress: repairedPointer }
      if (
        repairedPointer.lessonId !== normalized.progress.lessonId
        || repairedPointer.stepId !== normalized.progress.stepId
      ) {
        const withTimestamp = { ...repairedPortfolio, updatedAt: new Date().toISOString() }
        await module4PortfolioRepository.save(withTimestamp)
        setPortfolio(withTimestamp)
      } else {
        setPortfolio(repairedPortfolio)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const savePortfolio = useCallback(async (updated: Module4Portfolio) => {
    const normalized = normalizeModule4Portfolio(updated)
    const withTimestamp = { ...normalized, updatedAt: new Date().toISOString() }

    if (isTeacherMode) {
      setDemoPortfolio(withTimestamp)
      return
    }

    await module4PortfolioRepository.save(withTimestamp)
    setPortfolio(withTimestamp)
  }, [isTeacherMode])

  const importPortfolio = useCallback(async (imported: Module4Portfolio) => {
    if (isTeacherMode) return
    const normalized = normalizeModule4Portfolio(imported)
    const repaired = { ...normalized, progress: resolveModule4PortfolioPointer(normalized) }
    await module4PortfolioRepository.replaceWithImported(repaired)
    setPortfolio(repaired)
  }, [isTeacherMode])

  const createPortfolio = useCallback(async (student: Partial<Module4Portfolio["student"]> = {}) => {
    const next = createNewModule4Portfolio(student)
    await savePortfolio(next)
    return next
  }, [savePortfolio])

  const clearPortfolio = useCallback(async () => {
    if (isTeacherMode) return
    await module4PortfolioRepository.clear()
    setPortfolio(null)
  }, [isTeacherMode])

  const enterTeacherMode = useCallback(() => {
    setDemoPortfolio(normalizeModule4Portfolio(createModule4TeacherLecturePortfolio()))
    setIsTeacherMode(true)
  }, [])

  const exitTeacherMode = useCallback(() => {
    setIsTeacherMode(false)
    setDemoPortfolio(null)
  }, [])

  const resetTeacherMode = useCallback(() => {
    setDemoPortfolio(normalizeModule4Portfolio(createModule4TeacherLecturePortfolio()))
  }, [])

  const effectivePortfolio = isTeacherMode ? demoPortfolio : portfolio

  return (
    <Module4Context.Provider
      value={{
        portfolio: effectivePortfolio,
        loading,
        savePortfolio,
        importPortfolio,
        createPortfolio,
        reload,
        clearPortfolio,
        isTeacherMode,
        enterTeacherMode,
        exitTeacherMode,
        resetTeacherMode,
      }}
    >
      {children}
    </Module4Context.Provider>
  )
}

export function useModule4Portfolio(): Module4ContextValue {
  const ctx = useContext(Module4Context)
  if (!ctx) {
    throw new Error("useModule4Portfolio 必须在 Module4Provider 内使用")
  }
  return ctx
}
