/**
 * 文件说明：模块 2 独立 IndexedDB 连接。
 * 职责：创建并打开数据库 classquest-module2-v1 的四个 store（portfolios / assets / settings / thumbnailCache），只供模块 2 仓库使用；与模块 1 数据库完全独立。
 * 更新触发：模块 2 数据库名称、版本、store 结构、主键或索引变化时，需要同步更新本文件（版本升级须提供迁移）。
 */

export const MODULE2_DB_NAME = "classquest-module2-v1"
export const MODULE2_DB_VERSION = 1

export const MODULE2_STORES = {
  portfolios: "portfolios",
  assets: "assets",
  settings: "settings",
  thumbnailCache: "thumbnailCache",
} as const

export type Module2StoreName = (typeof MODULE2_STORES)[keyof typeof MODULE2_STORES]

/** 打开数据库；factory 参数只用于测试注入 fake-indexeddb，生产环境使用浏览器 indexedDB。 */
export function openModule2DB(factory: IDBFactory = indexedDB, name: string = MODULE2_DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, MODULE2_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MODULE2_STORES.portfolios)) {
        const store = db.createObjectStore(MODULE2_STORES.portfolios, { keyPath: "id" })
        store.createIndex("updatedAt", "updatedAt", { unique: false })
      }
      if (!db.objectStoreNames.contains(MODULE2_STORES.assets)) {
        db.createObjectStore(MODULE2_STORES.assets, { keyPath: "assetId" })
      }
      if (!db.objectStoreNames.contains(MODULE2_STORES.settings)) {
        db.createObjectStore(MODULE2_STORES.settings, { keyPath: "key" })
      }
      if (!db.objectStoreNames.contains(MODULE2_STORES.thumbnailCache)) {
        db.createObjectStore(MODULE2_STORES.thumbnailCache, { keyPath: ["assetId", "presetVersion"] })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      // 其他标签页升级数据库时主动关闭旧连接，避免阻塞升级
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () => reject(request.error ?? new Error("无法打开模块 2 本机数据库"))
    request.onblocked = () => reject(new Error("模块 2 本机数据库被其他标签页占用，请关闭其他标签页后重试"))
  })
}

/** 复用同一连接的打开函数；连接被关闭或打开失败后，下次调用重新打开。 */
export function createModule2DbProvider(factory?: IDBFactory, name?: string): () => Promise<IDBDatabase> {
  let pending: Promise<IDBDatabase> | null = null
  return () => {
    if (!pending) {
      pending = openModule2DB(factory, name).then(
        (db) => {
          db.onclose = () => { pending = null }
          db.onversionchange = () => { pending = null; db.close() }
          return db
        },
        (error: unknown) => {
          pending = null
          throw error
        },
      )
    }
    return pending
  }
}
