/**
 * 文件说明：PortfolioRepository 的 IndexedDB 实现
 * 职责：通过 IndexedDB 实现档案的持久化存储，是 infra 层的核心实现
 *       禁止在此层外部引用，外部只应依赖 PortfolioRepository 接口
 * 更新触发：需要调整 IndexedDB 读写逻辑时；数据库 schema 变更时
 */

import { openDB } from "@/infra/persistence/indexeddb/db"
import type { PortfolioRepository } from "./portfolio.repository"
import type { ModulePortfolio } from "@/domains/portfolio/types"

/** 保存当前活跃 portfolio id 的 settings key */
const CURRENT_PORTFOLIO_KEY = "currentPortfolioId"

export class IdbPortfolioRepository implements PortfolioRepository {
  async getCurrent(): Promise<ModulePortfolio | null> {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["settings", "portfolios"], "readonly")

      const settingsReq = tx.objectStore("settings").get(CURRENT_PORTFOLIO_KEY)

      settingsReq.onsuccess = () => {
        const setting = settingsReq.result as { key: string; value: string } | undefined
        if (!setting?.value) {
          resolve(null)
          return
        }

        const portfolioReq = tx.objectStore("portfolios").get(setting.value)
        portfolioReq.onsuccess = () => resolve(portfolioReq.result ?? null)
        portfolioReq.onerror = () => reject(portfolioReq.error)
      }

      settingsReq.onerror = () => reject(settingsReq.error)
    })
  }

  async save(portfolio: ModulePortfolio): Promise<void> {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolios", "settings"], "readwrite")

      tx.objectStore("portfolios").put(portfolio)
      tx.objectStore("settings").put({ key: CURRENT_PORTFOLIO_KEY, value: portfolio.id })

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async replaceWithImported(portfolio: ModulePortfolio): Promise<void> {
    // 导入时更新 updatedAt，确保时间戳准确
    const updated: ModulePortfolio = {
      ...portfolio,
      updatedAt: new Date().toISOString(),
    }
    await this.save(updated)
  }

  async clear(): Promise<void> {
    const db = await openDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["portfolios", "settings"], "readwrite")

      // 删除当前指针记录 + 清空所有 portfolio 数据
      tx.objectStore("settings").delete(CURRENT_PORTFOLIO_KEY)
      tx.objectStore("portfolios").clear()

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}

/** 单例：全局共享一个 repository 实例 */
export const portfolioRepository: PortfolioRepository = new IdbPortfolioRepository()
