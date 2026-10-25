/**
 * 文件说明：模块 2 本机持久化事务回归测试（fake-indexeddb）。
 * 职责：在 fake-indexeddb 上验证跨 store 提交、注入 QuotaExceeded / abort 后整体回滚（旧档案与活动指针不变）、revision 单调递增、一致快照、资产按哈希去重、同 ID 不同字节拒绝、缩略图缓存读写。
 * 更新触发：portfolio / asset repository、事务运行器、store 结构或回滚语义变化时，需要同步更新本文件。
 *
 * 注意：fake-indexeddb 只证明事务逻辑；真实浏览器的刷新恢复、配额行为仍需手动验证。
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { IDBFactory, IDBObjectStore } from "fake-indexeddb"
import { createModule2DbProvider, MODULE2_STORES, openModule2DB } from "./indexeddb/connection"
import { Module2PersistenceError } from "./indexeddb/transaction"
import { Module2AssetRepository } from "./repositories/asset.repository"
import { Module2PortfolioRepository } from "./repositories/portfolio.repository"
import { addModule2ImageVersion } from "@/modules/module-2-ai-comic/domains/portfolio/image-versions"
import {
  createNewModule2Portfolio,
  type ImageVersion,
  type Module2PortfolioV1,
  type Module2StoredAsset,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { sha256Hex } from "@/modules/module-2-ai-comic/features/assets/sha256"

const NOW = "2026-10-25T10:00:00.000Z"

function setup() {
  const factory = new IDBFactory()
  const getDb = createModule2DbProvider(factory)
  return {
    factory,
    getDb,
    repo: new Module2PortfolioRepository(getDb),
    assets: new Module2AssetRepository(getDb),
  }
}

async function makeAsset(seed: number, length = 32): Promise<Module2StoredAsset> {
  const bytes = Uint8Array.from({ length }, (_, index) => (index + seed * 7) & 0xff)
  const sha256 = await sha256Hex(bytes)
  return { assetId: `sha256:${sha256}`, blob: new Blob([bytes], { type: "image/png" }), mime: "image/png", byteLength: length, width: 4, height: 4, sha256, createdAt: NOW }
}

function portfolioWithSource(name = "甲"): Module2PortfolioV1 {
  return {
    ...createNewModule2Portfolio({ clazz: "初一（1）班", studentName: name, classSeatCode: "0101" }, NOW),
    sourceSnapshot: {
      id: "src-1", origin: "manual", filename: null, sourceFileSha256: null, importedAt: NOW, studentConfirmedAt: NOW,
      sourceConfirmedAt: null, student: { clazz: "", studentName: "", classSeatCode: "" }, storyTitle: "题目",
      parts: { opening: "起", development: "承", turn: "转", ending: "合" }, isTeachingSample: false, importNote: "",
    },
  }
}

function withVersion(portfolio: Module2PortfolioV1, id: string, main: Module2StoredAsset, original = main): Module2PortfolioV1 {
  const version: ImageVersion = {
    id, slot: "other", sourceSnapshotId: "src-1", mainAssetId: main.assetId, originalAssetId: original.assetId,
    prompt: "", referenceAssetIds: [], createdAt: NOW, toolLabel: "", note: "",
  }
  return addModule2ImageVersion(portfolio, version).portfolio
}

async function countAssets(getDb: () => Promise<IDBDatabase>): Promise<number> {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(MODULE2_STORES.assets).objectStore(MODULE2_STORES.assets).count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("档案保存与活动指针", () => {
  it("保存后可读回活动档案，每次成功保存 revision 单调递增", async () => {
    const { repo } = setup()
    const p = createNewModule2Portfolio(undefined, NOW)
    expect(await repo.getActivePortfolio()).toBeNull()
    expect((await repo.savePortfolio(p)).revision).toBe(1)
    expect((await repo.savePortfolio(p)).revision).toBe(2)
    expect((await repo.savePortfolio({ ...p, revision: 0 })).revision).toBe(3)
    const loaded = await repo.getActivePortfolio()
    expect(loaded?.id).toBe(p.id)
    expect(loaded?.revision).toBe(3)
  })

  it("activate:false 不改变活动指针", async () => {
    const { repo } = setup()
    const student = createNewModule2Portfolio(undefined, NOW)
    await repo.savePortfolio(student)
    await repo.savePortfolio({ ...createNewModule2Portfolio(undefined, NOW), id: "dev-fixture" }, { activate: false })
    expect(await repo.getActivePortfolioId()).toBe(student.id)
    expect((await repo.getPortfolio("dev-fixture"))?.revision).toBe(1)
  })

  it("校验不通过的档案拒绝写入，库中保持原样", async () => {
    const { repo } = setup()
    const p = createNewModule2Portfolio(undefined, NOW)
    await repo.savePortfolio(p)
    const broken = { ...p, schemaVersion: 2 } as unknown as Module2PortfolioV1
    await expect(repo.savePortfolio(broken)).rejects.toMatchObject({ kind: "invalid" })
    expect((await repo.getActivePortfolio())?.revision).toBe(1)
  })

  it("库中记录损坏时读取报错而不是静默返回空档案", async () => {
    const { repo, getDb } = setup()
    const p = createNewModule2Portfolio(undefined, NOW)
    await repo.savePortfolio(p)
    const db = await getDb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(MODULE2_STORES.portfolios, "readwrite")
      tx.objectStore(MODULE2_STORES.portfolios).put({ ...p, moduleId: "module-1-ai-story" })
      tx.oncomplete = () => resolve()
    })
    await expect(repo.getActivePortfolio()).rejects.toBeInstanceOf(Module2PersistenceError)
  })
})

describe("saveImageVersion 跨 store 事务", () => {
  it("资产、版本与库存在同一事务提交；原图与主图相同只写一份", async () => {
    const { repo, assets, getDb } = setup()
    const base = portfolioWithSource()
    await repo.savePortfolio(base)
    const asset = await makeAsset(1)
    const next = withVersion(base, "v1", asset)
    const result = await repo.saveImageVersion(next, [asset, asset])
    expect(result).toMatchObject({ revision: 2, writtenAssetIds: [asset.assetId], reusedAssetIds: [] })
    expect(await countAssets(getDb)).toBe(1)
    const loaded = await repo.getActivePortfolio()
    expect(loaded?.imageVersions.map(v => v.id)).toEqual(["v1"])
    expect(loaded?.assetIds).toEqual([asset.assetId])
    const blob = await assets.getAssetBlob(asset.assetId)
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(new Uint8Array(await asset.blob.arrayBuffer()))
  })

  it("重复上传同一张图按哈希去重：不新增资产，只新增版本", async () => {
    const { repo, getDb } = setup()
    const asset = await makeAsset(2)
    let p = withVersion(portfolioWithSource(), "v1", asset)
    await repo.saveImageVersion(p, [asset])
    p = withVersion({ ...p, revision: 1 }, "v2", asset)
    const second = await repo.saveImageVersion(p, [asset])
    expect(second.writtenAssetIds).toEqual([])
    expect(second.reusedAssetIds).toEqual([asset.assetId])
    expect(await countAssets(getDb)).toBe(1)
    expect((await repo.getActivePortfolio())?.imageVersions).toHaveLength(2)
  })

  it("写档案时注入 abort：资产与版本都不落盘，旧档案 revision 不变", async () => {
    const { repo, assets } = setup()
    const base = portfolioWithSource()
    await repo.savePortfolio(base)
    const asset = await makeAsset(3)
    const original = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      const request = original.call(this, value, key)
      if (this.name === MODULE2_STORES.portfolios) this.transaction.abort()
      return request
    })
    await expect(repo.saveImageVersion(withVersion(base, "v1", asset), [asset])).rejects.toBeInstanceOf(Module2PersistenceError)
    vi.restoreAllMocks()
    expect(await assets.getAsset(asset.assetId)).toBeNull()
    const loaded = await repo.getActivePortfolio()
    expect(loaded?.revision).toBe(1)
    expect(loaded?.imageVersions).toEqual([])
  })

  it("待写入资产未登记在库存中时拒绝", async () => {
    const { repo } = setup()
    const asset = await makeAsset(4)
    await expect(repo.saveImageVersion(portfolioWithSource(), [asset])).rejects.toMatchObject({ kind: "invalid" })
  })
})

describe("原子替换（导入）", () => {
  it("assets、portfolio、activePortfolioId 同事务提交", async () => {
    const { repo, assets } = setup()
    await repo.savePortfolio(createNewModule2Portfolio(undefined, NOW))
    const asset = await makeAsset(5)
    const imported = withVersion(portfolioWithSource("乙"), "v1", asset)
    const result = await repo.replaceAtomically({ ...imported, revision: 7 }, [asset])
    expect(result.revision).toBe(8)
    expect(await repo.getActivePortfolioId()).toBe(imported.id)
    expect((await repo.getActivePortfolio())?.student.studentName).toBe("乙")
    expect(await assets.getAsset(asset.assetId)).not.toBeNull()
  })

  it("注入 QuotaExceeded：整体回滚，旧档案、活动指针不变，新资产不残留", async () => {
    const { repo, assets } = setup()
    const old = createNewModule2Portfolio(undefined, NOW)
    await repo.savePortfolio(old)
    const asset = await makeAsset(6)
    const imported = withVersion(portfolioWithSource("乙"), "v1", asset)
    const original = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      if (this.name === MODULE2_STORES.settings) throw new DOMException("模拟空间不足", "QuotaExceededError")
      return original.call(this, value, key)
    })
    await expect(repo.replaceAtomically(imported, [asset])).rejects.toMatchObject({ kind: "quota" })
    vi.restoreAllMocks()
    expect(await repo.getActivePortfolioId()).toBe(old.id)
    expect((await repo.getActivePortfolio())?.revision).toBe(1)
    expect(await repo.getPortfolio(imported.id)).toBeNull()
    expect(await assets.getAsset(asset.assetId)).toBeNull()
  })

  it("注入 abort：整体回滚，旧档案、活动指针不变，新资产不残留", async () => {
    const { repo, assets } = setup()
    const old = createNewModule2Portfolio(undefined, NOW)
    await repo.savePortfolio(old)
    const asset = await makeAsset(13)
    const imported = withVersion(portfolioWithSource("乙"), "v1", asset)
    const original = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      const request = original.call(this, value, key)
      if (this.name === MODULE2_STORES.settings) this.transaction.abort()
      return request
    })
    await expect(repo.replaceAtomically(imported, [asset])).rejects.toMatchObject({ kind: "aborted" })
    vi.restoreAllMocks()
    expect(await repo.getActivePortfolioId()).toBe(old.id)
    expect((await repo.getActivePortfolio())?.revision).toBe(1)
    expect(await repo.getPortfolio(imported.id)).toBeNull()
    expect(await assets.getAsset(asset.assetId)).toBeNull()
  })

  it("同一批次内同 ID 不同字节拒绝，什么都不写入", async () => {
    const { repo, getDb } = setup()
    const asset = await makeAsset(14)
    const tampered = new Uint8Array(await asset.blob.arrayBuffer())
    tampered[1] ^= 0xff
    const twin = { ...asset, blob: new Blob([tampered], { type: "image/png" }) }
    const imported = withVersion(portfolioWithSource(), "v1", asset)
    await expect(repo.replaceAtomically(imported, [asset, twin])).rejects.toMatchObject({ kind: "conflict" })
    expect(await countAssets(getDb)).toBe(0)
    expect(await repo.getActivePortfolioId()).toBeNull()
  })

  it("资产集合与库存不一致时拒绝", async () => {
    const { repo } = setup()
    const asset = await makeAsset(7)
    const imported = withVersion(portfolioWithSource(), "v1", asset)
    await expect(repo.replaceAtomically(imported, [])).rejects.toMatchObject({ kind: "invalid" })
    await expect(repo.replaceAtomically(portfolioWithSource(), [asset])).rejects.toMatchObject({ kind: "invalid" })
  })

  it("同 ID 同字节复用；同 ID 不同字节拒绝且不覆盖", async () => {
    const { repo, assets } = setup()
    const asset = await makeAsset(8)
    const first = withVersion(portfolioWithSource(), "v1", asset)
    await repo.saveImageVersion(first, [asset])

    const sameBytes = { ...asset, blob: new Blob([await asset.blob.arrayBuffer()], { type: "image/png" }) }
    await expect(repo.replaceAtomically(withVersion(portfolioWithSource("丙"), "v9", sameBytes), [sameBytes])).resolves.toMatchObject({ revision: 1 })

    const tamperedBytes = new Uint8Array(await asset.blob.arrayBuffer())
    tamperedBytes[0] ^= 0xff
    const forged = { ...asset, blob: new Blob([tamperedBytes], { type: "image/png" }) }
    const before = await repo.getActivePortfolioId()
    await expect(repo.replaceAtomically(withVersion(portfolioWithSource("丁"), "v10", forged), [forged])).rejects.toMatchObject({ kind: "conflict" })
    expect(await repo.getActivePortfolioId()).toBe(before)
    const stored = await assets.getAssetBlob(asset.assetId)
    expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(new Uint8Array(await asset.blob.arrayBuffer()))
  })

  it("资产 ID 与摘要或字节数不符时拒绝", async () => {
    const { repo } = setup()
    const asset = await makeAsset(9)
    const wrongSize = { ...asset, byteLength: asset.byteLength + 1 }
    await expect(repo.replaceAtomically(withVersion(portfolioWithSource(), "v1", wrongSize), [wrongSize])).rejects.toMatchObject({ kind: "invalid" })
  })
})

describe("一致快照", () => {
  it("同一只读事务拿到 revision、档案与库存全部 Blob", async () => {
    const { repo } = setup()
    const a = await makeAsset(10)
    const b = await makeAsset(11, 48)
    let p = withVersion(portfolioWithSource(), "v1", a, b)
    await repo.saveImageVersion(p, [a, b])
    p = withVersion({ ...p, revision: 1 }, "v2", a)
    await repo.saveImageVersion(p, [a])
    const snapshot = await repo.readExportSnapshot()
    expect(snapshot?.revision).toBe(2)
    expect(snapshot?.portfolio.revision).toBe(2)
    expect(snapshot?.portfolio.imageVersions.map(v => v.id)).toEqual(["v1", "v2"])
    expect(snapshot?.assets.map(asset => asset.assetId).sort()).toEqual([a.assetId, b.assetId].sort())
    expect(snapshot?.missingAssetIds).toEqual([])
  })

  it("与并发保存交错时，快照内 revision 与档案内容来自同一次提交", async () => {
    const { repo } = setup()
    const p = createNewModule2Portfolio(undefined, NOW)
    await repo.savePortfolio(p)
    const [, snapshot] = await Promise.all([
      repo.savePortfolio({ ...p, lesson1: { ...p.lesson1, sampleObservation: "并发编辑" } }),
      repo.readExportSnapshot(),
    ])
    const expectedObservation = snapshot!.revision === 2 ? "并发编辑" : ""
    expect(snapshot!.portfolio.lesson1.sampleObservation).toBe(expectedObservation)
  })

  it("库存资产缺失时列出缺失清单，且之后的保存被拒绝", async () => {
    const { repo, factory } = setup()
    const a = await makeAsset(12)
    const p = withVersion(portfolioWithSource(), "v1", a)
    await repo.saveImageVersion(p, [a])
    const raw = await openModule2DB(factory)
    await new Promise<void>((resolve) => {
      const tx = raw.transaction(MODULE2_STORES.assets, "readwrite")
      tx.objectStore(MODULE2_STORES.assets).delete(a.assetId)
      tx.oncomplete = () => resolve()
    })
    raw.close()
    const snapshot = await repo.readExportSnapshot()
    expect(snapshot?.missingAssetIds).toEqual([a.assetId])
    await expect(repo.savePortfolio({ ...p, revision: 1 })).rejects.toMatchObject({ kind: "missing" })
  })
})

describe("缩略图缓存", () => {
  it("按 assetId + presetVersion 读写，可重建、不影响持久资产", async () => {
    const { assets } = setup()
    const assetId = `sha256:${"d".repeat(64)}`
    expect(await assets.getThumbnail(assetId, 1)).toBeNull()
    await assets.putThumbnail({ assetId, presetVersion: 1, blob: new Blob([new Uint8Array([1, 2])]), width: 2, height: 1, createdAt: NOW })
    expect((await assets.getThumbnail(assetId, 1))?.width).toBe(2)
    expect(await assets.getThumbnail(assetId, 2)).toBeNull()
  })
})
