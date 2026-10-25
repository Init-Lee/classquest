/**
 * 文件说明：模块 2 学习档案 Provider。
 * 职责：从本机数据库读取活动档案、学生首次进入课时 1 时按需创建空草稿档案；通过保存协调器提供乐观更新、串行保存、flush、重试与原子替换，并发布 saveState；
 *       教师讲解模式使用独立内存档案与内存 persistence，不碰数据库，替换学生档案一律 no-op。
 * 更新触发：模块 2 状态容器字段、仓库边界、首次建档策略、保存状态展示、导入替换流程或教师模式隔离规则变化时，需要同步更新本文件。
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import {
  createNewModule2Portfolio,
  type Module2PortfolioV1,
  type Module2StoredAsset,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { syncModule2Lesson1Flags } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import { module2PortfolioRepository } from "@/modules/module-2-ai-comic/infra/persistence/module2-persistence"
import {
  Module2SaveCoordinator,
  type Module2PersistenceBoundary,
  type Module2SaveStatus,
} from "@/modules/module-2-ai-comic/app/providers/module2-save-coordinator"
import {
  createModule2MemoryPersistence,
  runModule2StudentArchiveMutation,
} from "@/modules/module-2-ai-comic/app/providers/module2-teacher-mode"

interface Module2ContextValue {
  /** 当前生效档案：教师模式下为内存演示档案，学生模式为本机活动档案（尚未建档时为 null）。 */
  portfolio: Module2PortfolioV1 | null
  loading: boolean
  /** 本机记录读取失败的课堂提示；非空时不会自动新建档案，避免覆盖原记录。 */
  loadError: string | null
  saveStatus: Module2SaveStatus
  isTeacherMode: boolean
  updatePortfolio: (updater: (current: Module2PortfolioV1) => Module2PortfolioV1) => Module2PortfolioV1
  flushPortfolio: () => Promise<Module2PortfolioV1>
  retrySave: () => void
  ensureStudentPortfolio: () => Promise<Module2PortfolioV1 | null>
  /** 阶段 C 导入学习包使用；教师模式下 no-op 返回 false。 */
  replaceStudentPortfolio: (portfolio: Module2PortfolioV1, assets: Module2StoredAsset[]) => Promise<boolean>
  enterTeacherMode: () => void
  exitTeacherMode: () => void
  resetTeacherMode: () => void
}

const Module2Context = createContext<Module2ContextValue | null>(null)

const IDLE_STATUS: Module2SaveStatus = { state: "idle", error: null }

const studentPersistence: Module2PersistenceBoundary = {
  save: portfolio => module2PortfolioRepository.savePortfolio(portfolio),
  replace: (portfolio, assets) => module2PortfolioRepository.replaceAtomically(portfolio, assets),
}

/** 教师演示档案：空草稿，不预置任何完成标记，演示不等于学生完成。 */
function createTeacherDemoPortfolio(): Module2PortfolioV1 {
  return createNewModule2Portfolio()
}

function hydrateFlags(portfolio: Module2PortfolioV1): Module2PortfolioV1 {
  return syncModule2Lesson1Flags(portfolio, new Date().toISOString())
}

export function Module2Provider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<Module2PortfolioV1 | null>(null)
  const [demoPortfolio, setDemoPortfolio] = useState<Module2PortfolioV1 | null>(null)
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<Module2SaveStatus>(IDLE_STATUS)
  const teacherCoordinatorRef = useRef<Module2SaveCoordinator | null>(null)
  const creatingRef = useRef<Promise<Module2PortfolioV1 | null> | null>(null)
  const [coordinator] = useState(() => new Module2SaveCoordinator(studentPersistence, (status) => {
    if (status.error) console.error("[module2 persistence] save failed", status.error)
    setSaveStatus(status)
  }))

  const getTeacherCoordinator = useCallback(() => {
    if (!teacherCoordinatorRef.current) {
      teacherCoordinatorRef.current = new Module2SaveCoordinator(createModule2MemoryPersistence())
    }
    return teacherCoordinatorRef.current
  }, [])

  useEffect(() => {
    let cancelled = false
    module2PortfolioRepository.getActivePortfolio()
      .then((loaded) => {
        if (cancelled) return
        const hydrated = loaded ? hydrateFlags(loaded) : null
        coordinator.hydrate(hydrated)
        setPortfolio(hydrated)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error("[module2 persistence] load failed", error)
        setLoadError("本机学习记录暂时无法读取。请刷新页面重试；如果仍然失败，请告诉老师。")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [coordinator])

  const updatePortfolio = useCallback((updater: (current: Module2PortfolioV1) => Module2PortfolioV1) => {
    if (isTeacherMode) {
      const next = getTeacherCoordinator().update(updater)
      setDemoPortfolio(next)
      return next
    }
    const next = coordinator.update(updater)
    setPortfolio(next)
    return next
  }, [coordinator, getTeacherCoordinator, isTeacherMode])

  const flushPortfolio = useCallback(async () => {
    if (isTeacherMode) return getTeacherCoordinator().flush()
    const latest = await coordinator.flush()
    setPortfolio(latest)
    return latest
  }, [coordinator, getTeacherCoordinator, isTeacherMode])

  const retrySave = useCallback(() => {
    if (isTeacherMode) return
    void coordinator.retry().then(() => setPortfolio(coordinator.getCurrent()))
  }, [coordinator, isTeacherMode])

  const ensureStudentPortfolio = useCallback(async () => {
    if (isTeacherMode) return getTeacherCoordinator().getCurrent()
    if (loading || loadError) return null
    const existing = coordinator.getCurrent()
    if (existing) return existing
    if (!creatingRef.current) {
      creatingRef.current = coordinator.replace(createNewModule2Portfolio())
        .then((created) => {
          setPortfolio(created)
          return created
        })
        .catch((error: unknown) => {
          console.error("[module2 persistence] create draft failed", error)
          return null
        })
        .finally(() => { creatingRef.current = null })
    }
    return creatingRef.current
  }, [coordinator, getTeacherCoordinator, isTeacherMode, loadError, loading])

  const replaceStudentPortfolio = useCallback(async (next: Module2PortfolioV1, assets: Module2StoredAsset[]) => {
    return runModule2StudentArchiveMutation(isTeacherMode, async () => {
      const replaced = await coordinator.replace(next, assets)
      setPortfolio(hydrateFlags(replaced))
    })
  }, [coordinator, isTeacherMode])

  const enterTeacherMode = useCallback(() => {
    const demo = createTeacherDemoPortfolio()
    getTeacherCoordinator().hydrate(demo)
    setDemoPortfolio(demo)
    setIsTeacherMode(true)
  }, [getTeacherCoordinator])

  const exitTeacherMode = useCallback(() => {
    setIsTeacherMode(false)
    setDemoPortfolio(null)
    teacherCoordinatorRef.current = null
  }, [])

  const resetTeacherMode = useCallback(() => {
    const demo = createTeacherDemoPortfolio()
    getTeacherCoordinator().hydrate(demo)
    setDemoPortfolio(demo)
  }, [getTeacherCoordinator])

  return (
    <Module2Context.Provider value={{
      portfolio: isTeacherMode ? demoPortfolio : portfolio,
      loading,
      loadError: isTeacherMode ? null : loadError,
      saveStatus: isTeacherMode ? IDLE_STATUS : saveStatus,
      isTeacherMode,
      updatePortfolio,
      flushPortfolio,
      retrySave,
      ensureStudentPortfolio,
      replaceStudentPortfolio,
      enterTeacherMode,
      exitTeacherMode,
      resetTeacherMode,
    }}>
      {children}
    </Module2Context.Provider>
  )
}

export function useModule2State(): Module2ContextValue {
  const context = useContext(Module2Context)
  if (!context) throw new Error("useModule2State 必须在 Module2Provider 内使用")
  return context
}
