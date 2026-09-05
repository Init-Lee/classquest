/**
 * 文件说明：模块 1 学习档案 Provider。
 * 职责：集中负责加载、显式保存、新建、导入替换与清档，并阻止清档后的旧页面回写。
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

export function shouldBlockModule1StaleSave(clearedPortfolioId: string | null, candidateId: string): boolean {
  return clearedPortfolioId === candidateId
}

interface Module1ContextValue {
  portfolio: Module1Portfolio | null
  loading: boolean
  savePortfolio: (portfolio: Module1Portfolio) => Promise<Module1Portfolio>
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
  const clearedPortfolioIdRef = useRef<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const current = await module1PortfolioRepository.getCurrent()
      if (!current) {
        setPortfolio(null)
        return
      }
      const repaired = repairPortfolio(current)
      const pointerChanged = repaired.progress.lessonId !== current.progress.lessonId
        || repaired.progress.stepId !== current.progress.stepId
      if (pointerChanged) await module1PortfolioRepository.save(repaired)
      setPortfolio(repaired)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const savePortfolio = useCallback(async (updated: Module1Portfolio) => {
    if (shouldBlockModule1StaleSave(clearedPortfolioIdRef.current, updated.id)) return updated
    const repaired = repairPortfolio({ ...updated, updatedAt: new Date().toISOString() })
    await module1PortfolioRepository.save(repaired)
    clearedPortfolioIdRef.current = null
    setPortfolio(repaired)
    return repaired
  }, [])

  const createPortfolio = useCallback(async (student: Module1Portfolio["student"]) => {
    return savePortfolio(createNewModule1Portfolio(student))
  }, [savePortfolio])

  const importPortfolio = useCallback(async (imported: Module1Portfolio) => {
    const repaired = repairPortfolio(imported)
    await module1PortfolioRepository.replaceWithImported(repaired)
    clearedPortfolioIdRef.current = null
    setPortfolio(repaired)
    return repaired
  }, [])

  const clearPortfolio = useCallback(async () => {
    clearedPortfolioIdRef.current = portfolio?.id ?? null
    await module1PortfolioRepository.clear()
    setPortfolio(null)
  }, [portfolio?.id])

  return (
    <Module1Context.Provider value={{
      portfolio,
      loading,
      savePortfolio,
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
