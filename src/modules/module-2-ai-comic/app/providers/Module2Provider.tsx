/**
 * 文件说明：模块 2 学习状态 Provider（阶段 A 骨架）。
 * 职责：提供教师讲解模式开关与内存演示态；学生档案在阶段 A 固定为空占位（loading=false），不读写任何本机存储。
 * 更新触发：阶段 B 接入本地保存与保存协调器、教师模式隔离规则或上下文字段变化时，需要同步更新本文件。
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useCallback, useContext, useState } from "react"
import type { Module2PortfolioSkeleton } from "@/modules/module-2-ai-comic/domains/portfolio/types"

interface Module2ContextValue {
  /** 当前生效档案：教师模式下为内存演示态，学生模式阶段 A 恒为 null。 */
  portfolio: Module2PortfolioSkeleton | null
  loading: boolean
  isTeacherMode: boolean
  enterTeacherMode: () => void
  exitTeacherMode: () => void
  resetTeacherMode: () => void
}

const Module2Context = createContext<Module2ContextValue | null>(null)

/** 教师演示态只记录当前关，不预置任何完成标记，演示不等于学生完成。 */
function createTeacherDemoState(): Module2PortfolioSkeleton {
  return { lesson1: { step: 1, completed: false } }
}

export function Module2Provider({ children }: { children: React.ReactNode }) {
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [demoPortfolio, setDemoPortfolio] = useState<Module2PortfolioSkeleton | null>(null)

  const enterTeacherMode = useCallback(() => {
    setDemoPortfolio(createTeacherDemoState())
    setIsTeacherMode(true)
  }, [])

  const exitTeacherMode = useCallback(() => {
    setIsTeacherMode(false)
    setDemoPortfolio(null)
  }, [])

  const resetTeacherMode = useCallback(() => {
    setDemoPortfolio(createTeacherDemoState())
  }, [])

  // 阶段 A 尚未接入本地保存：学生档案恒为 null，阶段 B 由档案仓库读取后替换。
  const studentPortfolio: Module2PortfolioSkeleton | null = null

  return (
    <Module2Context.Provider value={{
      portfolio: isTeacherMode ? demoPortfolio : studentPortfolio,
      loading: false,
      isTeacherMode,
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
