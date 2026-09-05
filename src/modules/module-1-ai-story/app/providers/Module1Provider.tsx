/**
 * 文件说明：模块 1 学习档案 Provider。
 * 职责：集中负责乐观更新、串行保存、flush、新建、导入替换与清档，并阻止旧代次保存回写。
 * 更新触发：模块 1 状态容器、仓库边界、导入流程或清档保护规则变化时，需要同步更新本文件。
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

interface Module1ContextValue {
  portfolio: Module1Portfolio | null
  loading: boolean
  saveError: string | null
  updatePortfolio: (updater: (current: Module1Portfolio) => Module1Portfolio) => Module1Portfolio
  flushPortfolio: () => Promise<Module1Portfolio>
  createPortfolio: (student: Module1Portfolio["student"]) => Promise<Module1Portfolio>
  importPortfolio: (portfolio: Module1Portfolio) => Promise<Module1Portfolio>
  clearPortfolio: () => Promise<void>
  reload: () => Promise<void>
}

const Module1Context = createContext<Module1ContextValue | null>(null)

function repairPortfolio(portfolio: unknown): Module1Portfolio {
  const normalized = normalizeModule1Portfolio(portfolio)
  return { ...normalized, progress: resolveModule1PortfolioPointer(normalized) }
}

export function Module1Provider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<Module1Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const coordinatorRef = useRef<Module1SaveCoordinator | null>(null)
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
    setSaveError(null)
    const next = coordinator.update(updater)
    setPortfolio(next)
    return next
  }, [coordinator])

  const flushPortfolio = useCallback(async () => {
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
  }, [coordinator])

  const createPortfolio = useCallback(async (student: Module1Portfolio["student"]) => {
    const created = await coordinator.replace(createNewModule1Portfolio(student))
    setSaveError(null)
    setPortfolio(created)
    return created
  }, [coordinator])

  const importPortfolio = useCallback(async (imported: Module1Portfolio) => {
    const repaired = repairPortfolio(imported)
    const replaced = await coordinator.replace(repaired)
    setSaveError(null)
    setPortfolio(replaced)
    return replaced
  }, [coordinator])

  const clearPortfolio = useCallback(async () => {
    await coordinator.clear()
    setSaveError(null)
    setPortfolio(null)
  }, [coordinator])

  return (
    <Module1Context.Provider value={{
      portfolio,
      loading,
      saveError,
      updatePortfolio,
      flushPortfolio,
      createPortfolio,
      importPortfolio,
      clearPortfolio,
      reload,
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
