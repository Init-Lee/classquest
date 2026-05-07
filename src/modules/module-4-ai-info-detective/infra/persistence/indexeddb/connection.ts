/**
 * 文件说明：模块 4 IndexedDB 数据库连接管理。
 * 职责：负责打开和升级模块 4 独立本地数据库，只供模块 4 infra 层 repository 使用。
 * 更新触发：模块 4 本地数据库名称、版本或 object store 结构变化时，需要同步更新本文件。
 */

export const MODULE4_DB_NAME = "classquest-module4-v1"
export const MODULE4_DB_VERSION = 1

export function openModule4DB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MODULE4_DB_NAME, MODULE4_DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains("portfolio")) {
        const portfolioStore = db.createObjectStore("portfolio", { keyPath: "id" })
        portfolioStore.createIndex("moduleId", "moduleId", { unique: false })
        portfolioStore.createIndex("updatedAt", "updatedAt", { unique: false })
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
