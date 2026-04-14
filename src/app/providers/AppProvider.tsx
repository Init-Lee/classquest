/**
 * 文件说明：全局应用 Provider
 * 职责：挂载 PortfolioContext，向全应用提供档案读写能力和教师模式开关
 *       是应用状态的顶层容器
 * 更新触发：需要新增全局 Context 时（如主题切换）；教师模式逻辑调整时；
 *           新增全局操作（如 clearPortfolio）时
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { ModulePortfolio } from "@/domains/portfolio/types"
import { normalizeModulePortfolio } from "@/domains/portfolio/types"
import { portfolioRepository } from "@/infra/persistence/repositories/portfolio.repository.idb"
import { createDemoPortfolio } from "@/shared/constants/demo-portfolio"
import { resolvePortfolioPointer } from "@/app/lesson-registry"

/** Portfolio Context 的 Shape */
interface PortfolioContextValue {
  /** 当前档案：学生模式为真实档案，教师模式为演示档案，null 表示尚未创建 */
  portfolio: ModulePortfolio | null
  /** 是否正在加载 */
  loading: boolean
  /** 保存档案（教师模式下为 no-op） */
  savePortfolio: (updated: ModulePortfolio) => Promise<void>
  /** 替换为导入的档案（教师模式下为 no-op） */
  importPortfolio: (imported: ModulePortfolio) => Promise<void>
  /** 重新从 DB 加载（一般在导入后调用） */
  reload: () => Promise<void>
  /** 清空所有持久化数据并重置状态 */
  clearPortfolio: () => Promise<void>
  /** 是否处于教师演示模式 */
  isTeacherMode: boolean
  /** 进入教师演示模式（传入演示档案，不写入 DB） */
  enterTeacherMode: () => void
  /** 退出教师演示模式，恢复正常学生视图 */
  exitTeacherMode: () => void
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<ModulePortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  /** 教师模式下显示的演示档案（不持久化） */
  const [demoPortfolio, setDemoPortfolio] = useState<ModulePortfolio | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const current = await portfolioRepository.getCurrent()
      // #region agent log
      fetch('http://127.0.0.1:7867/ingest/f477b48f-d907-4d17-af01-17b6b09ded5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2a660e'},body:JSON.stringify({sessionId:'2a660e',location:'AppProvider.tsx:reload',message:'reload from IDB',data:{pointer:current?.pointer,lesson3_missionAck:current?.lesson3?.missionAcknowledged,lesson3_toolboxDone:current?.lesson3?.toolboxCompleted},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (!current) { setPortfolio(null); return }
      const normalized = normalizeModulePortfolio(current)
      /** 修正可能落后的进度指针（与 importPortfolio 逻辑保持一致） */
      const repairedPointer = resolvePortfolioPointer(normalized)
      const repairedPortfolio = { ...normalized, pointer: repairedPointer }
      // #region agent log
      fetch('http://127.0.0.1:7867/ingest/f477b48f-d907-4d17-af01-17b6b09ded5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2a660e'},body:JSON.stringify({sessionId:'2a660e',location:'AppProvider.tsx:reload-after-repair',message:'pointer after resolvePointerFromState',data:{pointerBefore:current.pointer,pointerAfter:repairedPointer,changed:repairedPointer!==normalized.pointer},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      /** 若指针发生变化则回写 IDB，避免下次仍需修正 */
      if (repairedPointer !== normalized.pointer) {
        const withTimestamp = { ...repairedPortfolio, updatedAt: new Date().toISOString() }
        await portfolioRepository.save(withTimestamp)
        setPortfolio(withTimestamp)
      } else {
        setPortfolio(repairedPortfolio)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const savePortfolio = useCallback(async (updated: ModulePortfolio) => {
    // 教师模式下不持久化，仅更新演示档案内存状态
    if (isTeacherMode) {
      setDemoPortfolio({ ...updated, updatedAt: new Date().toISOString() })
      return
    }
    const withTimestamp: ModulePortfolio = {
      ...updated,
      updatedAt: new Date().toISOString(),
    }
    await portfolioRepository.save(withTimestamp)
    setPortfolio(withTimestamp)
  }, [isTeacherMode])

  const importPortfolio = useCallback(async (imported: ModulePortfolio) => {
    // 教师模式下跳过导入
    if (isTeacherMode) return
    const normalized = normalizeModulePortfolio(imported)
    await portfolioRepository.replaceWithImported(normalized)
    setPortfolio(normalized)
  }, [isTeacherMode])

  const clearPortfolio = useCallback(async () => {
    await portfolioRepository.clear()
    setPortfolio(null)
  }, [])

  const enterTeacherMode = useCallback(() => {
    setDemoPortfolio(createDemoPortfolio())
    setIsTeacherMode(true)
  }, [])

  const exitTeacherMode = useCallback(() => {
    setIsTeacherMode(false)
    setDemoPortfolio(null)
  }, [])

  /** 教师模式下暴露演示档案，否则暴露真实档案 */
  const effectivePortfolio = isTeacherMode ? demoPortfolio : portfolio

  return (
    <PortfolioContext.Provider
      value={{
        portfolio: effectivePortfolio,
        loading,
        savePortfolio,
        importPortfolio,
        reload,
        clearPortfolio,
        isTeacherMode,
        enterTeacherMode,
        exitTeacherMode,
      }}
    >
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
