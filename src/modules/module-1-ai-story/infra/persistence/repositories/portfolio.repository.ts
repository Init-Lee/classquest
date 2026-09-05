/**
 * 文件说明：模块 1 学习档案 IndexedDB 仓库。
 * 职责：封装当前档案读取、保存、原子替换与清空，页面不得直接访问 IndexedDB。
 * 更新触发：模块 1 当前档案指针、替换语义或数据库 store 结构变化时，需要同步更新本文件。
 */

import {
  normalizeModule1Portfolio,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { openModule1DB } from "@/modules/module-1-ai-story/infra/persistence/indexeddb/connection"

const CURRENT_PORTFOLIO_KEY = "currentModule1PortfolioId"

export function prepareModule1ImportedReplacement(portfolio: Module1Portfolio): Module1Portfolio {
  return normalizeModule1Portfolio({
    ...portfolio,
    updatedAt: new Date().toISOString(),
  })
}

export interface Module1PortfolioRepository {
  getCurrent: () => Promise<Module1Portfolio | null>
  save: (portfolio: Module1Portfolio) => Promise<void>
  replaceWithImported: (portfolio: Module1Portfolio) => Promise<void>
  clear: () => Promise<void>
}

class IdbModule1PortfolioRepository implements Module1PortfolioRepository {
  async getCurrent(): Promise<Module1Portfolio | null> {
    const db = await openModule1DB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["settings", "portfolio"], "readonly")
      const pointerRequest = tx.objectStore("settings").get(CURRENT_PORTFOLIO_KEY)
      pointerRequest.onerror = () => reject(pointerRequest.error)
      pointerRequest.onsuccess = () => {
        const pointer = pointerRequest.result as { value?: string } | undefined
        if (!pointer?.value) {
          resolve(null)
          return
        }
        const portfolioRequest = tx.objectStore("portfolio").get(pointer.value)
        portfolioRequest.onerror = () => reject(portfolioRequest.error)
        portfolioRequest.onsuccess = () => {
          resolve(portfolioRequest.result ? normalizeModule1Portfolio(portfolioRequest.result) : null)
        }
      }
    })
  }

  async save(portfolio: Module1Portfolio): Promise<void> {
    const db = await openModule1DB()
    const normalized = normalizeModule1Portfolio(portfolio)
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolio", "settings"], "readwrite")
      tx.objectStore("portfolio").put(normalized)
      tx.objectStore("settings").put({ key: CURRENT_PORTFOLIO_KEY, value: normalized.id })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  async replaceWithImported(portfolio: Module1Portfolio): Promise<void> {
    const db = await openModule1DB()
    const normalized = prepareModule1ImportedReplacement(portfolio)
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolio", "settings"], "readwrite")
      const portfolioStore = tx.objectStore("portfolio")
      portfolioStore.clear()
      portfolioStore.put(normalized)
      tx.objectStore("settings").put({ key: CURRENT_PORTFOLIO_KEY, value: normalized.id })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  async clear(): Promise<void> {
    const db = await openModule1DB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolio", "settings"], "readwrite")
      tx.objectStore("portfolio").clear()
      tx.objectStore("settings").delete(CURRENT_PORTFOLIO_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }
}

export const module1PortfolioRepository: Module1PortfolioRepository = new IdbModule1PortfolioRepository()
