/**
 * 文件说明：模块 4 学习档案 IndexedDB 仓库。
 * 职责：封装 Module4Portfolio 的读取、保存、导入替换和清空逻辑，页面与组件不得直接访问 IndexedDB。
 * 更新触发：模块 4 持久化策略、当前档案指针或数据库 object store 结构变化时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { normalizeModule4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { openModule4DB } from "@/modules/module-4-ai-info-detective/infra/persistence/indexeddb/connection"

const CURRENT_PORTFOLIO_KEY = "currentModule4PortfolioId"

export interface Module4PortfolioRepository {
  getCurrent: () => Promise<Module4Portfolio | null>
  save: (portfolio: Module4Portfolio) => Promise<void>
  replaceWithImported: (portfolio: Module4Portfolio) => Promise<void>
  clear: () => Promise<void>
}

class IdbModule4PortfolioRepository implements Module4PortfolioRepository {
  async getCurrent(): Promise<Module4Portfolio | null> {
    const db = await openModule4DB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["settings", "portfolio"], "readonly")
      const settingsReq = tx.objectStore("settings").get(CURRENT_PORTFOLIO_KEY)

      settingsReq.onsuccess = () => {
        const setting = settingsReq.result as { key: string; value: string } | undefined
        if (!setting?.value) {
          resolve(null)
          return
        }

        const portfolioReq = tx.objectStore("portfolio").get(setting.value)
        portfolioReq.onsuccess = () => {
          const raw = portfolioReq.result as Module4Portfolio | undefined
          resolve(raw ? normalizeModule4Portfolio(raw) : null)
        }
        portfolioReq.onerror = () => reject(portfolioReq.error)
      }

      settingsReq.onerror = () => reject(settingsReq.error)
    })
  }

  async save(portfolio: Module4Portfolio): Promise<void> {
    const db = await openModule4DB()
    const normalized = normalizeModule4Portfolio(portfolio)

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolio", "settings"], "readwrite")
      tx.objectStore("portfolio").put(normalized)
      tx.objectStore("settings").put({ key: CURRENT_PORTFOLIO_KEY, value: normalized.id })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async replaceWithImported(portfolio: Module4Portfolio): Promise<void> {
    await this.save({
      ...normalizeModule4Portfolio(portfolio),
      updatedAt: new Date().toISOString(),
    })
  }

  async clear(): Promise<void> {
    const db = await openModule4DB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolio", "settings"], "readwrite")
      tx.objectStore("settings").delete(CURRENT_PORTFOLIO_KEY)
      tx.objectStore("portfolio").clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}

export const module4PortfolioRepository: Module4PortfolioRepository = new IdbModule4PortfolioRepository()
