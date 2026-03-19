/**
 * 文件说明：全局应用 Provider
 * 职责：挂载 PortfolioContext，向全应用提供档案读写能力
 *       是应用状态的顶层容器
 * 更新触发：需要新增全局 Context 时（如主题切换、教师模式等）
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { ModulePortfolio } from "@/domains/portfolio/types"
import { portfolioRepository } from "@/infra/persistence/repositories/portfolio.repository.idb"

/** Portfolio Context 的 Shape */
interface PortfolioContextValue {
  /** 当前档案，null 表示尚未创建 */
  portfolio: ModulePortfolio | null
  /** 是否正在加载 */
  loading: boolean
  /** 保存档案（自动更新 updatedAt） */
  savePortfolio: (updated: ModulePortfolio) => Promise<void>
  /** 替换为导入的档案 */
  importPortfolio: (imported: ModulePortfolio) => Promise<void>
  /** 重新从 DB 加载（一般在导入后调用） */
  reload: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<ModulePortfolio | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const current = await portfolioRepository.getCurrent()
      setPortfolio(current)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const savePortfolio = useCallback(async (updated: ModulePortfolio) => {
    const withTimestamp: ModulePortfolio = {
      ...updated,
      updatedAt: new Date().toISOString(),
    }
    await portfolioRepository.save(withTimestamp)
    setPortfolio(withTimestamp)
  }, [])

  const importPortfolio = useCallback(async (imported: ModulePortfolio) => {
    await portfolioRepository.replaceWithImported(imported)
    setPortfolio(imported)
  }, [])

  return (
    <PortfolioContext.Provider value={{ portfolio, loading, savePortfolio, importPortfolio, reload }}>
      {children}
    </PortfolioContext.Provider>
  )
}

/** 获取 Portfolio Context，必须在 AppProvider 内使用 */
export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext)
  if (!ctx) {
    throw new Error("usePortfolio 必须在 AppProvider 内使用")
  }
  return ctx
}
