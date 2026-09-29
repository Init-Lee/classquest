/**
 * 文件说明：模块 1 学习档案 Provider。
 * 职责：集中负责乐观更新、串行保存、flush、新建、导入替换、清档，以及教师讲解模式的内存演示档案。
 * 更新触发：模块 1 状态容器、仓库边界、导入流程、清档保护或教师模式旁路规则变化时，需要同步更新本文件。
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import {
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { resolveModule1PortfolioPointer } from "@/modules/module-1-ai-story/app/lesson-registry"
import { module1PortfolioRepository } from "@/modules/module-1-ai-story/infra/persistence/repositories/portfolio.repository"
import { Module1SaveCoordinator } from "@/modules/module-1-ai-story/app/providers/module1-save-coordinator"
import {
  createModule1MemoryPersistence,
  runModule1StudentArchiveMutation,
} from "@/modules/module-1-ai-story/app/providers/module1-teacher-mode"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { applyModule1Lesson1UpstreamReview } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import { applyModule1Lesson3UpstreamReview } from "@/modules/module-1-ai-story/domains/portfolio/lesson3-update"
import { applyModule1Lesson4UpstreamReview } from "@/modules/module-1-ai-story/domains/portfolio/lesson4-update"
import { applyModule1Lesson5UpstreamReview } from "@/modules/module-1-ai-story/domains/portfolio/lesson5-update"

interface Module1ContextValue {
  portfolio: Module1Portfolio | null
  loading: boolean
  saveError: string | null
  isTeacherMode: boolean
  updatePortfolio: (updater: (current: Module1Portfolio) => Module1Portfolio) => Module1Portfolio
  flushPortfolio: () => Promise<Module1Portfolio>
  createPortfolio: (student: Module1Portfolio["student"]) => Promise<Module1Portfolio>
  importPortfolio: (portfolio: Module1Portfolio) => Promise<Module1Portfolio>
  clearPortfolio: () => Promise<void>
  reload: () => Promise<void>
  enterTeacherMode: () => void
  exitTeacherMode: () => void
  resetTeacherMode: () => void
}

const Module1Context = createContext<Module1ContextValue | null>(null)

function repairPortfolio(portfolio: unknown): Module1Portfolio {
  const normalized = normalizeModule1Portfolio(portfolio)
  return { ...normalized, progress: resolveModule1PortfolioPointer(normalized) }
}

function prepareTeacherDemo(): Module1Portfolio {
  return createModule1TeacherLecturePortfolio()
}

export function Module1Provider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<Module1Portfolio | null>(null)
  const [demoPortfolio, setDemoPortfolio] = useState<Module1Portfolio | null>(null)
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const coordinatorRef = useRef<Module1SaveCoordinator | null>(null)
  const teacherCoordinatorRef = useRef<Module1SaveCoordinator | null>(null)
  if (!coordinatorRef.current) {
    coordinatorRef.current = new Module1SaveCoordinator(
      module1PortfolioRepository,
      repairPortfolio,
      (error, operation) => {
        console.error(`[module1 persistence] ${operation} failed`, error)
        setSaveError(`本机进度保存失败：${error.message}。请不要关闭页面，并重试当前操作。`)
      },
    )
  }
  const coordinator = coordinatorRef.current

  const getTeacherCoordinator = useCallback(() => {
    if (!teacherCoordinatorRef.current) {
      teacherCoordinatorRef.current = new Module1SaveCoordinator(
        createModule1MemoryPersistence(),
        current => current,
      )
    }
    return teacherCoordinatorRef.current
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const current = await module1PortfolioRepository.getCurrent()
      if (!current) {
        coordinator.hydrate(null)
        setPortfolio(null)
        return
      }
      const repaired = repairPortfolio(current)
      const pointerChanged = repaired.progress.lessonId !== current.progress.lessonId
        || repaired.progress.stepId !== current.progress.stepId
      coordinator.hydrate(repaired)
      let loaded = repaired
      if (pointerChanged) {
        loaded = coordinator.update(() => repaired)
        await coordinator.flush()
      }
      setSaveError(null)
      setPortfolio(loaded)
    } finally {
      setLoading(false)
    }
  }, [coordinator])

  useEffect(() => {
    void reload()
  }, [reload])

  const updatePortfolio = useCallback((updater: (current: Module1Portfolio) => Module1Portfolio) => {
    const withUpstreamReview = (current: Module1Portfolio) => applyModule1Lesson5UpstreamReview(
      current,
      applyModule1Lesson4UpstreamReview(
        current,
        applyModule1Lesson3UpstreamReview(
          current,
          applyModule1Lesson1UpstreamReview(current, updater(current)),
        ),
      ),
    )
    if (isTeacherMode) {
      const next = getTeacherCoordinator().update(withUpstreamReview)
      setDemoPortfolio(next)
      return next
    }
    setSaveError(null)
    const next = coordinator.update(withUpstreamReview)
    setPortfolio(next)
    return next
  }, [coordinator, getTeacherCoordinator, isTeacherMode])

  const flushPortfolio = useCallback(async () => {
    if (isTeacherMode) {
      const latest = await getTeacherCoordinator().flush()
      setDemoPortfolio(latest)
      return latest
    }
    try {
      const latest = await coordinator.flush()
      setPortfolio(latest)
      return latest
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error("[module1 persistence] flush failed", error)
      setSaveError(`无法完成保存：${detail}。当前操作已停止，请重试。`)
      throw error
    }
  }, [coordinator, getTeacherCoordinator, isTeacherMode])

  const createPortfolio = useCallback(async (student: Module1Portfolio["student"]) => {
    if (isTeacherMode) {
      return getTeacherCoordinator().getCurrent() ?? prepareTeacherDemo()
    }
    const created = await coordinator.replace(createNewModule1Portfolio(student))
    setSaveError(null)
    setPortfolio(created)
    return created
  }, [coordinator, getTeacherCoordinator, isTeacherMode])

  const importPortfolio = useCallback(async (imported: Module1Portfolio) => {
    if (isTeacherMode) {
      return getTeacherCoordinator().getCurrent() ?? prepareTeacherDemo()
    }
    const repaired = repairPortfolio(imported)
    const replaced = await coordinator.replace(repaired)
    setSaveError(null)
    setPortfolio(replaced)
    return replaced
  }, [coordinator, getTeacherCoordinator, isTeacherMode])

  const clearPortfolio = useCallback(async () => {
    const ran = await runModule1StudentArchiveMutation(isTeacherMode, () => coordinator.clear())
    if (!ran) return
    setSaveError(null)
    setPortfolio(null)
  }, [coordinator, isTeacherMode])

  const enterTeacherMode = useCallback(() => {
    const demo = prepareTeacherDemo()
    const teacherCoordinator = getTeacherCoordinator()
    teacherCoordinator.hydrate(demo)
    setDemoPortfolio(demo)
    setIsTeacherMode(true)
  }, [getTeacherCoordinator])

  const exitTeacherMode = useCallback(() => {
    setIsTeacherMode(false)
    setDemoPortfolio(null)
    teacherCoordinatorRef.current = null
  }, [])

  const resetTeacherMode = useCallback(() => {
    const demo = prepareTeacherDemo()
    getTeacherCoordinator().hydrate(demo)
    setDemoPortfolio(demo)
  }, [getTeacherCoordinator])

  const effectivePortfolio = isTeacherMode ? demoPortfolio : portfolio

  return (
    <Module1Context.Provider value={{
      portfolio: effectivePortfolio,
      loading,
      saveError,
      isTeacherMode,
      updatePortfolio,
      flushPortfolio,
      createPortfolio,
      importPortfolio,
      clearPortfolio,
      reload,
      enterTeacherMode,
      exitTeacherMode,
      resetTeacherMode,
    }}>
      {children}
    </Module1Context.Provider>
  )
}

export function useModule1Portfolio(): Module1ContextValue {
  const context = useContext(Module1Context)
  if (!context) throw new Error("useModule1Portfolio 必须在 Module1Provider 内使用")
  return context
}
