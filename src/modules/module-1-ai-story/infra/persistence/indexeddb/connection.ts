/**
 * 文件说明：模块 1 独立 IndexedDB 连接。
 * 职责：创建并打开 portfolio 与 settings 两个存储区，只供模块 1 repository 使用。
 * 更新触发：模块 1 数据库名称、版本、索引或 object store 结构变化时，需要同步更新本文件。
 */

export const MODULE1_DB_NAME = "classquest-module1-v1"
export const MODULE1_DB_VERSION = 1

export function openModule1DB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MODULE1_DB_NAME, MODULE1_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("portfolio")) {
        const store = db.createObjectStore("portfolio", { keyPath: "id" })
        store.createIndex("moduleId", "moduleId", { unique: false })
        store.createIndex("updatedAt", "updatedAt", { unique: false })
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
