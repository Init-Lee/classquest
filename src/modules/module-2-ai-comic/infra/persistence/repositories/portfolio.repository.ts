/**
 * 文件说明：模块 2 学习档案仓库（含跨 store 事务）。
 * 职责：封装档案读写、settings 中的 activePortfolioId、每次成功保存 revision 单调递增；saveImageVersion 在同一事务写入原图 / 主图资产（同哈希只写一次）与档案的版本和库存；
 *       一致快照读取（同一只读事务拿 revision、档案与全部库存 Blob）供导出；原子替换（assets + portfolio + activePortfolioId 同事务）供导入。页面不得直接访问 IndexedDB。
 * 更新触发：档案保存语义、活动档案指针、revision 规则、资产去重 / 冲突规则、快照或替换流程、store 结构变化时，需要同步更新本文件与 persistence 回归测试。
 *
 * 约定：校验、哈希与 Blob 字节比对都在事务外完成；事务内只同步写入已准备好的数据。
 */

import { validateModule2Portfolio } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import type { AssetId, Module2PortfolioV1, Module2StoredAsset } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { MODULE2_STORES } from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/connection"
import {
  Module2PersistenceError,
  runModule2Transaction,
  toModule2PersistenceError,
  type Module2TxContext,
} from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/transaction"
import { parseModule2StoredAsset } from "@/modules/module-2-ai-comic/infra/persistence/repositories/asset-record"

export const MODULE2_ACTIVE_PORTFOLIO_KEY = "activePortfolioId"

export interface Module2SaveResult {
  revision: number
}

export interface Module2SaveImageVersionResult extends Module2SaveResult {
  writtenAssetIds: AssetId[]
  reusedAssetIds: AssetId[]
}

export interface Module2ExportSnapshot {
  revision: number
  portfolio: Module2PortfolioV1
  assets: Module2StoredAsset[]
  /** 库存中登记但 assets store 里读不到的资产；非空时不能导出完整学习包。 */
  missingAssetIds: AssetId[]
}

interface SettingRecord {
  key: string
  value: unknown
}

function assertValidPortfolio(portfolio: unknown): Module2PortfolioV1 {
  const result = validateModule2Portfolio(portfolio)
  if (!result.ok) throw new Module2PersistenceError("invalid", `学习记录校验未通过：${result.message}`, result.errors)
  return result.value
}

/** 资产记录自身一致性：assetId 与 sha256 对应、byteLength 与 Blob 实际大小一致。 */
function assertAssetSelfConsistent(asset: Module2StoredAsset): void {
  if (asset.assetId !== `sha256:${asset.sha256}`) {
    throw new Module2PersistenceError("invalid", `资产 ID 与摘要不一致：${asset.assetId}`)
  }
  if (asset.byteLength !== asset.blob.size) {
    throw new Module2PersistenceError("invalid", `资产字节数与实际内容不一致：${asset.assetId}`)
  }
}

/** 同批次去重：同 ID 须逐字节相同，否则拒绝。 */
async function dedupeAssets(assets: Module2StoredAsset[]): Promise<Module2StoredAsset[]> {
  const seen = new Map<string, Module2StoredAsset>()
  for (const asset of assets) {
    const existing = seen.get(asset.assetId)
    if (!existing) {
      seen.set(asset.assetId, asset)
      continue
    }
    if (existing.blob !== asset.blob && !(await blobsEqual(existing.blob, asset.blob))) {
      throw new Module2PersistenceError("conflict", `同一资产 ID 对应不同内容：${asset.assetId}`)
    }
  }
  return [...seen.values()]
}

async function blobsEqual(left: Blob, right: Blob): Promise<boolean> {
  if (left.size !== right.size) return false
  const [a, b] = await Promise.all([left.arrayBuffer(), right.arrayBuffer()])
  const x = new Uint8Array(a)
  const y = new Uint8Array(b)
  for (let index = 0; index < x.length; index += 1) {
    if (x[index] !== y[index]) return false
  }
  return true
}

export class Module2PortfolioRepository {
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

  async getActivePortfolioId(): Promise<string | null> {
    const db = await this.db()
    return runModule2Transaction<string | null>(db, [MODULE2_STORES.settings], "readonly", (tx, ctx) => {
      ctx.setResult(null)
      ctx.request(tx.objectStore(MODULE2_STORES.settings).get(MODULE2_ACTIVE_PORTFOLIO_KEY), (record: SettingRecord | undefined) => {
        ctx.setResult(typeof record?.value === "string" ? record.value : null)
      })
    })
  }

  /** 读取活动档案；记录损坏时抛出 invalid 错误，不静默替换为空档案。 */
  async getActivePortfolio(): Promise<Module2PortfolioV1 | null> {
    const db = await this.db()
    const raw = await runModule2Transaction<unknown>(db, [MODULE2_STORES.settings, MODULE2_STORES.portfolios], "readonly", (tx, ctx) => {
      ctx.setResult(null)
      ctx.request(tx.objectStore(MODULE2_STORES.settings).get(MODULE2_ACTIVE_PORTFOLIO_KEY), (pointer: SettingRecord | undefined) => {
        if (typeof pointer?.value !== "string") return
        ctx.request(tx.objectStore(MODULE2_STORES.portfolios).get(pointer.value), (record: unknown) => {
          ctx.setResult(record ?? null)
        })
      })
    })
    return raw === null ? null : assertValidPortfolio(raw)
  }

  async getPortfolio(id: string): Promise<Module2PortfolioV1 | null> {
    const db = await this.db()
    const raw = await runModule2Transaction<unknown>(db, [MODULE2_STORES.portfolios], "readonly", (tx, ctx) => {
      ctx.setResult(null)
      ctx.request(tx.objectStore(MODULE2_STORES.portfolios).get(id), (record: unknown) => ctx.setResult(record ?? null))
    })
    return raw === null ? null : assertValidPortfolio(raw)
  }

  /** 保存档案（默认同时设为活动档案）；revision = max(库中, 传入) + 1。 */
  async savePortfolio(portfolio: Module2PortfolioV1, options: { activate?: boolean } = {}): Promise<Module2SaveResult> {
    const valid = assertValidPortfolio(portfolio)
    const db = await this.db()
    return runModule2Transaction<Module2SaveResult>(
      db,
      [MODULE2_STORES.portfolios, MODULE2_STORES.assets, MODULE2_STORES.settings],
      "readwrite",
      (tx, ctx) => this.writePortfolioInTx(tx, ctx, valid, options.activate ?? true, saved => ctx.setResult(saved)),
    )
  }

  /**
   * 同一事务写入图片资产与包含新版本 / 库存的档案。
   * portfolio 须已包含新 ImageVersion 及其全部 assetId；assets 为本次需要落盘的资产（原图与主图相同时只传一份即可，重复会自动去重）。
   */
  async saveImageVersion(
    portfolio: Module2PortfolioV1,
    assets: Module2StoredAsset[],
    options: { activate?: boolean } = {},
  ): Promise<Module2SaveImageVersionResult> {
    const valid = assertValidPortfolio(portfolio)
    const unique = await dedupeAssets(assets)
    const inventory = new Set(valid.assetIds)
    for (const asset of unique) {
      assertAssetSelfConsistent(asset)
      if (!inventory.has(asset.assetId)) {
        throw new Module2PersistenceError("invalid", `待写入资产未登记在档案库存中：${asset.assetId}`)
      }
    }
    await this.assertNoByteConflicts(unique)
    const db = await this.db()
    return runModule2Transaction<Module2SaveImageVersionResult>(
      db,
      [MODULE2_STORES.portfolios, MODULE2_STORES.assets, MODULE2_STORES.settings],
      "readwrite",
      (tx, ctx) => {
        const written: AssetId[] = []
        const reused: AssetId[] = []
        this.writeAssetsInTx(tx, ctx, unique, written, reused, () => {
          this.writePortfolioInTx(tx, ctx, valid, options.activate ?? true, (saved) => {
            ctx.setResult({ ...saved, writtenAssetIds: written, reusedAssetIds: reused })
          })
        })
      },
    )
  }

  /**
   * 一致快照：同一只读事务内读取活动指针、档案与库存全部 Blob。
   * 没有活动档案时返回 null；指定 portfolioId 时读取该档案（不要求是活动档案）。
   */
  async readExportSnapshot(portfolioId?: string): Promise<Module2ExportSnapshot | null> {
    const db = await this.db()
    const raw = await runModule2Transaction<{ portfolio: unknown; assets: unknown[]; missing: string[] } | null>(
      db,
      [MODULE2_STORES.settings, MODULE2_STORES.portfolios, MODULE2_STORES.assets],
      "readonly",
      (tx, ctx) => {
        ctx.setResult(null)
        const readPortfolio = (id: string) => {
          ctx.request(tx.objectStore(MODULE2_STORES.portfolios).get(id), (record: unknown) => {
            if (!record) return
            const assetIds = typeof record === "object" && record !== null && Array.isArray((record as { assetIds?: unknown }).assetIds)
              ? ((record as { assetIds: unknown[] }).assetIds.filter((item): item is string => typeof item === "string"))
              : []
            const collected: unknown[] = []
            const missing: string[] = []
            ctx.setResult({ portfolio: record, assets: collected, missing })
            const assetStore = tx.objectStore(MODULE2_STORES.assets)
            for (const assetId of assetIds) {
              ctx.request(assetStore.get(assetId), (asset: unknown) => {
                if (asset) collected.push(asset)
                else missing.push(assetId)
              })
            }
          })
        }
        if (portfolioId) {
          readPortfolio(portfolioId)
          return
        }
        ctx.request(tx.objectStore(MODULE2_STORES.settings).get(MODULE2_ACTIVE_PORTFOLIO_KEY), (pointer: SettingRecord | undefined) => {
          if (typeof pointer?.value === "string") readPortfolio(pointer.value)
        })
      },
    )
    if (!raw) return null
    const portfolio = assertValidPortfolio(raw.portfolio)
    const assets = raw.assets.map((record) => {
      const parsed = parseModule2StoredAsset(record)
      if (!parsed) throw new Module2PersistenceError("invalid", "本机图片记录已损坏")
      return parsed
    })
    return { revision: portfolio.revision, portfolio, assets, missingAssetIds: raw.missing }
  }

  /**
   * 原子替换：assets、portfolio、activePortfolioId 在同一事务提交；QuotaExceeded / abort 时整体回滚，旧档案与指针不变。
   * assets 必须与 portfolio.assetIds 完全对应；同 ID 同字节复用，同 ID 不同字节拒绝。旧资产不自动删除。
   */
  async replaceAtomically(portfolio: Module2PortfolioV1, assets: Module2StoredAsset[]): Promise<Module2SaveResult> {
    const valid = assertValidPortfolio(portfolio)
    const unique = await dedupeAssets(assets)
    for (const asset of unique) assertAssetSelfConsistent(asset)
    const provided = new Set(unique.map(asset => asset.assetId))
    const inventory = new Set(valid.assetIds)
    const missing = valid.assetIds.filter(id => !provided.has(id))
    const extra = [...provided].filter(id => !inventory.has(id))
    if (missing.length || extra.length) {
      throw new Module2PersistenceError("invalid", "资产集合与档案库存不一致", [
        ...missing.map(id => `缺少资产：${id}`),
        ...extra.map(id => `未登记资产：${id}`),
      ])
    }
    await this.assertNoByteConflicts(unique)
    const db = await this.db()
    return runModule2Transaction<Module2SaveResult>(
      db,
      [MODULE2_STORES.assets, MODULE2_STORES.portfolios, MODULE2_STORES.settings],
      "readwrite",
      (tx, ctx) => {
        this.writeAssetsInTx(tx, ctx, unique, [], [], () => {
          this.writePortfolioInTx(tx, ctx, valid, true, saved => ctx.setResult(saved))
        })
      },
    )
  }

  /** 事务外预检：与库中同 ID 资产逐字节比对，不同即拒绝。 */
  private async assertNoByteConflicts(assets: Module2StoredAsset[]): Promise<void> {
    if (assets.length === 0) return
    const db = await this.db()
    const existing = await runModule2Transaction<Map<string, unknown>>(db, [MODULE2_STORES.assets], "readonly", (tx, ctx) => {
      const found = new Map<string, unknown>()
      ctx.setResult(found)
      const store = tx.objectStore(MODULE2_STORES.assets)
      for (const asset of assets) {
        ctx.request(store.get(asset.assetId), (record: unknown) => {
          if (record) found.set(asset.assetId, record)
        })
      }
    })
    for (const asset of assets) {
      const record = existing.get(asset.assetId)
      if (!record) continue
      const stored = parseModule2StoredAsset(record)
      if (!stored || !(await blobsEqual(stored.blob, asset.blob))) {
        throw new Module2PersistenceError("conflict", `本机已有同 ID 但内容不同的图片，已拒绝覆盖：${asset.assetId}`)
      }
    }
  }

  /** 事务内写资产：先逐个读取，已存在且摘要 / 字节数一致则复用，不一致则中止；全部处理完再调用 next。 */
  private writeAssetsInTx<T>(
    tx: IDBTransaction,
    ctx: Module2TxContext<T>,
    assets: Module2StoredAsset[],
    written: AssetId[],
    reused: AssetId[],
    next: () => void,
  ): void {
    if (assets.length === 0) {
      next()
      return
    }
    const store = tx.objectStore(MODULE2_STORES.assets)
    let remaining = assets.length
    for (const asset of assets) {
      ctx.request(store.get(asset.assetId), (record: unknown) => {
        if (record) {
          const stored = parseModule2StoredAsset(record)
          if (!stored || stored.sha256 !== asset.sha256 || stored.byteLength !== asset.byteLength) {
            throw new Module2PersistenceError("conflict", `本机已有同 ID 但内容不同的图片，已拒绝覆盖：${asset.assetId}`)
          }
          reused.push(asset.assetId)
        } else {
          ctx.request(store.put(asset))
          written.push(asset.assetId)
        }
        remaining -= 1
        if (remaining === 0) next()
      })
    }
  }

  /** 事务内写档案：核对库存资产都存在，revision 递增，按需更新活动指针。 */
  private writePortfolioInTx<T>(
    tx: IDBTransaction,
    ctx: Module2TxContext<T>,
    portfolio: Module2PortfolioV1,
    activate: boolean,
    onSaved: (saved: Module2SaveResult) => void,
  ): void {
    const portfolioStore = tx.objectStore(MODULE2_STORES.portfolios)
    ctx.request(tx.objectStore(MODULE2_STORES.assets).getAllKeys(), (keys: IDBValidKey[]) => {
      const stored = new Set(keys.map(String))
      const missing = portfolio.assetIds.filter(id => !stored.has(id))
      if (missing.length) {
        throw new Module2PersistenceError("missing", "档案库存中有图片未能在本机找到", missing)
      }
      ctx.request(portfolioStore.get(portfolio.id), (existing: { revision?: unknown } | undefined) => {
        const previous = typeof existing?.revision === "number" ? existing.revision : 0
        const revision = Math.max(previous, portfolio.revision) + 1
        ctx.request(portfolioStore.put({ ...portfolio, revision }))
        if (activate) {
          ctx.request(tx.objectStore(MODULE2_STORES.settings).put({ key: MODULE2_ACTIVE_PORTFOLIO_KEY, value: portfolio.id }))
        }
        onSaved({ revision })
      })
    })
  }
}
