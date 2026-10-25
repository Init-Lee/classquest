/**
 * 文件说明：模块 2 图片资产读取与缩略图缓存仓库。
 * 职责：按 assetId 读取持久资产 Blob（用于刷新后重建预览 URL），以及读写 thumbnailCache（键为 assetId + presetVersion，可删可重建，不进学习包）。
 * 更新触发：资产读取方式、缩略图缓存键或缓存记录字段变化时，需要同步更新本文件。
 *
 * 写入持久资产只能走 portfolio.repository 的 saveImageVersion / replaceAtomically，保证与档案库存同事务提交。
 */

import type { AssetId, Module2StoredAsset } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { MODULE2_STORES } from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/connection"
import {
  runModule2Transaction,
  toModule2PersistenceError,
} from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/transaction"
import { parseModule2StoredAsset } from "@/modules/module-2-ai-comic/infra/persistence/repositories/asset-record"

export interface Module2ThumbnailRecord {
  assetId: AssetId
  presetVersion: number
  blob: Blob
  width: number
  height: number
  createdAt: string
}

export class Module2AssetRepository {
  private readonly getDb: () => Promise<IDBDatabase>

  constructor(getDb: () => Promise<IDBDatabase>) {
    this.getDb = getDb
  }

  private async db(): Promise<IDBDatabase> {
    try {
      return await this.getDb()
    } catch (cause) {
      throw toModule2PersistenceError(cause, "unavailable")
    }
  }

  /** 读取持久资产记录；不存在或记录损坏时返回 null。 */
  async getAsset(assetId: AssetId): Promise<Module2StoredAsset | null> {
    const db = await this.db()
    const raw = await runModule2Transaction<unknown>(db, [MODULE2_STORES.assets], "readonly", (tx, ctx) => {
      ctx.setResult(null)
      ctx.request(tx.objectStore(MODULE2_STORES.assets).get(assetId), (record: unknown) => ctx.setResult(record ?? null))
    })
    return raw === null ? null : parseModule2StoredAsset(raw)
  }

  async getAssetBlob(assetId: AssetId): Promise<Blob | null> {
    return (await this.getAsset(assetId))?.blob ?? null
  }

  async getThumbnail(assetId: AssetId, presetVersion: number): Promise<Module2ThumbnailRecord | null> {
    const db = await this.db()
    const raw = await runModule2Transaction<unknown>(db, [MODULE2_STORES.thumbnailCache], "readonly", (tx, ctx) => {
      ctx.setResult(null)
      ctx.request(tx.objectStore(MODULE2_STORES.thumbnailCache).get([assetId, presetVersion]), (record: unknown) => ctx.setResult(record ?? null))
    })
    if (typeof raw !== "object" || raw === null) return null
    const record = raw as Partial<Module2ThumbnailRecord>
    return record.blob instanceof Blob ? (record as Module2ThumbnailRecord) : null
  }

  /** 缩略图是派生缓存：写入失败不影响持久资产，由调用方决定是否忽略。 */
  async putThumbnail(record: Module2ThumbnailRecord): Promise<void> {
    const db = await this.db()
    await runModule2Transaction<void>(db, [MODULE2_STORES.thumbnailCache], "readwrite", (tx, ctx) => {
      ctx.request(tx.objectStore(MODULE2_STORES.thumbnailCache).put(record))
    })
  }
}
