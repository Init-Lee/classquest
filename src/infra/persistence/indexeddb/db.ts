/**
 * 文件说明：IndexedDB 数据库连接管理
 * 职责：负责打开、升级数据库连接，所有 IndexedDB 操作的底层入口
 *       此文件仅在 infra 层使用，禁止在页面组件或 Domain 层直接调用
 * 更新触发：需要新增 object store 时；数据库版本升级时
 */

export const DB_NAME = "ai-science-station"
export const DB_VERSION = 1

/** 打开数据库，返回 IDBDatabase 实例 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // portfolios store：存储每位学生的完整模块档案
      if (!db.objectStoreNames.contains("portfolios")) {
        const portfolioStore = db.createObjectStore("portfolios", { keyPath: "id" })
        portfolioStore.createIndex("moduleId", "moduleId", { unique: false })
        portfolioStore.createIndex("studentName", "student.studentName", { unique: false })
        portfolioStore.createIndex("groupName", "student.groupName", { unique: false })
        portfolioStore.createIndex("updatedAt", "updatedAt", { unique: false })
      }

      // snapshots store：存储快照元数据（HTML 内容存文件系统，此处存元数据）
      if (!db.objectStoreNames.contains("snapshots")) {
        db.createObjectStore("snapshots", { keyPath: "id" })
      }

      // settings store：存储应用级设置（当前活跃 portfolio id 等）
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
