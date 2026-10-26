/**
 * 文件说明：模块 2 学习包回归测试。
 * 职责：核对路径与清单拒绝、文件名清洗、空图片包往返、门禁重算，以及坏包不会改写 fake-indexeddb 里的旧档案。
 * 更新触发：学习包路径规则、导出顺序、导入校验或回滚语义变化时，需要同步更新本文件。
 */

import { Zip, ZipPassThrough, strToU8, zipSync } from "fflate"
import { IDBFactory } from "fake-indexeddb"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createModule2DbProvider } from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/connection"
import { Module2PortfolioRepository } from "@/modules/module-2-ai-comic/infra/persistence/repositories/portfolio.repository"
import { createNewModule2Portfolio, type Module2PortfolioV1, type Module2StoredAsset } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { sha256Hex } from "@/modules/module-2-ai-comic/features/assets/sha256"
import { createManualNovelDraft } from "@/modules/module-2-ai-comic/features/source-import/novel-draft"
import {
  assessUncompressedSize,
  buildModule2PackageFilename,
  CqpackError,
  LEARNING_PACKAGE_MESSAGES,
  sanitizeModule2PackageNamePart,
} from "@/modules/module-2-ai-comic/features/learning-package/package-contract"
import { explainNonZipLearningPackage, readCqpackArchive } from "@/modules/module-2-ai-comic/features/learning-package/package-read"
import { prepareModule2LearningPackage } from "@/modules/module-2-ai-comic/features/learning-package/prepare-learning-package"
import { unzipCqpack, zipLocalCompressionMethods } from "@/modules/module-2-ai-comic/features/learning-package/package-zip"
import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"

const NOW = "2026-10-26T05:00:00.000Z"
const ONE_PIXEL_PNG = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
), char => char.charCodeAt(0))

function setup() {
  const factory = new IDBFactory()
  const getDb = createModule2DbProvider(factory)
  return { repo: new Module2PortfolioRepository(getDb) }
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function snapshotOf(portfolio: Module2PortfolioV1, assets: Module2StoredAsset[] = [], missingAssetIds: string[] = []) {
  return {
    revision: portfolio.revision,
    portfolio,
    assets,
    missingAssetIds,
  }
}

async function pngAsset(): Promise<Module2StoredAsset> {
  const sha256 = await sha256Hex(ONE_PIXEL_PNG)
  return {
    assetId: `sha256:${sha256}`,
    blob: new Blob([ONE_PIXEL_PNG], { type: "image/png" }),
    mime: "image/png",
    byteLength: ONE_PIXEL_PNG.byteLength,
    width: 1,
    height: 1,
    sha256,
    createdAt: NOW,
  }
}

describe("学习包文件名与体积", () => {
  it("清洗非法字符，并使用本地时间", () => {
    const now = new Date(2026, 9, 26, 13, 5)
    expect(buildModule2PackageFilename("李/四:五*六?", now)).toBe("模块2_李-四-五-六_学习包_20261026-1305.cqpack")
    expect(buildModule2PackageFilename("   ", now)).toBe("模块2_未填写_学习包_20261026-1305.cqpack")
    expect(sanitizeModule2PackageNamePart("a<b>c|d")).toBe("a-b-c-d")
  })

  it("超过提醒线只警告，超过安全上限则拒绝", () => {
    expect(assessUncompressedSize(RESOURCE_LIMITS.packageWarnBytes + 1)).toEqual({
      warning: expect.stringContaining("可能需要更多时间"),
    })
    expect(assessUncompressedSize(RESOURCE_LIMITS.packageExtractedMaxBytes + 1)).toEqual({
      rejected: LEARNING_PACKAGE_MESSAGES.tooBig,
    })
  })
})

describe("学习包打包与校验", () => {
  it("空图片、未填身份、未确认候选可以往返，并重算完成标记", async () => {
    const base = createNewModule2Portfolio(undefined, NOW)
    const portfolio: Module2PortfolioV1 = {
      ...base,
      revision: 1,
      sourceImportDraft: createManualNovelDraft({
        filename: "手写.txt",
        importedAt: NOW,
        sourceFileSha256: null,
      }, { storyTitle: "还没确认", parts: { opening: "只有起" } }),
      lesson1: { ...base.lesson1, completed: true, step1Completed: true, completedAt: NOW },
    }
    const prepared = await prepareModule2LearningPackage({
      flush: async () => portfolio,
      readSnapshot: async () => snapshotOf(portfolio),
      now: new Date("2026-10-26T05:30:00.000Z"),
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.filename).toContain("未填写")
    expect(prepared.message).toContain("请确认下载完成")
    expect(prepared.message).toContain("文字学习记录")
    const methods = zipLocalCompressionMethods(prepared.bytes)
    expect(methods.find(item => item.name === "portfolio.json")?.method).toBe(8)
    expect(methods.find(item => item.name === "manifest.json")?.method).toBe(8)
    const read = await readCqpackArchive(prepared.bytes, NOW)
    expect(read.portfolio.student).toEqual({ clazz: "", studentName: "", classSeatCode: "" })
    expect(read.portfolio.assetIds).toEqual([])
    expect(read.assets).toEqual([])
    expect(read.portfolio.sourceSnapshot).toBeNull()
    expect(read.portfolio.sourceImportDraft?.storyTitle).toBe("还没确认")
    expect(read.portfolio.lesson1.completed).toBe(false)
    expect(read.portfolio.lesson1.step1Completed).toBe(false)
    expect(read.preview.storyState).toBe("待核对")
  })

  it("图片原样打包且只存一份，JSON 与图片压缩方式不同", async () => {
    const asset = await pngAsset()
    const base = createNewModule2Portfolio({ clazz: "初一（1）班", studentName: "王芳", classSeatCode: "0101" }, NOW)
    const unique: Module2PortfolioV1 = { ...base, revision: 3, assetIds: [asset.assetId] }
    const packed = await prepareModule2LearningPackage({
      flush: async () => unique,
      readSnapshot: async () => snapshotOf(unique, [asset]),
      now: new Date("2026-10-26T05:30:00.000Z"),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    const read = await readCqpackArchive(packed.bytes, NOW)
    expect(read.assets).toHaveLength(1)
    expect(new Uint8Array(await read.assets[0].blob.arrayBuffer())).toEqual(ONE_PIXEL_PNG)
    const methods = zipLocalCompressionMethods(packed.bytes)
    expect(methods.find(item => item.name.endsWith(".png"))?.method).toBe(0)
    expect(methods.filter(item => item.name.endsWith(".png"))).toHaveLength(1)
  })

  it("保存失败时不读取快照；缺图时不打包", async () => {
    const readSnapshot = vi.fn()
    const failed = await prepareModule2LearningPackage({
      flush: async () => { throw new Error("保存失败") },
      readSnapshot,
    })
    expect(failed.ok).toBe(false)
    if (failed.ok) return
    expect(failed.message).toContain("请先重试保存")
    expect(readSnapshot).not.toHaveBeenCalled()

    const zip = vi.fn()
    const id = `sha256:${"ab".repeat(32)}`
    const portfolio = { ...createNewModule2Portfolio(undefined, NOW), revision: 1, assetIds: [id] }
    const missing = await prepareModule2LearningPackage({
      flush: async () => portfolio,
      readSnapshot: async () => snapshotOf(portfolio, [], [id]),
      zip,
    })
    expect(missing.ok).toBe(false)
    if (missing.ok) return
    expect(missing.message).toContain("还有 1 张图片")
    expect(zip).not.toHaveBeenCalled()
  })

  it("拒绝穿越、反斜杠、多余文件、未来版本、错误模块和膨胀输出", async () => {
    const expectReject = async (bytes: Uint8Array) => {
      await expect(readCqpackArchive(bytes, NOW)).rejects.toBeInstanceOf(CqpackError)
    }
    await expectReject(zipSync({ "../evil.json": strToU8("x") }))
    await expectReject(zipSync({ "/tmp/evil.json": strToU8("x") }))
    await expectReject(zipSync({ "notes.txt": strToU8("x") }))
    await expectReject(zipSync({ "assets\\abcd.png": strToU8("x") }))
    await expectReject(zipSync({
      "manifest.json": strToU8(JSON.stringify({
        packageType: "classquest-module2-learning-package",
        version: 99,
        moduleId: "module-2-ai-comic",
      })),
    }))
    await expectReject(zipSync({
      "manifest.json": strToU8(JSON.stringify({
        packageType: "classquest-module2-learning-package",
        version: 1,
        moduleId: "module-1-ai-story",
        exportedAt: NOW,
        portfolioId: "x",
        snapshotRevision: 1,
        portfolio: { path: "portfolio.json", byteLength: 1, sha256: "ab".repeat(32) },
        assets: [],
      })),
    }))

    const chunks: Uint8Array[] = []
    const zip = new Zip((error, data) => {
      if (!error && data.length) chunks.push(data)
    })
    const first = new ZipPassThrough("manifest.json")
    const second = new ZipPassThrough("manifest.json")
    zip.add(first)
    first.push(strToU8("{}"), true)
    zip.add(second)
    second.push(strToU8("{}"), true)
    zip.end()
    const duplicate = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      duplicate.set(chunk, offset)
      offset += chunk.length
    }
    await expectReject(duplicate)

    const empty = await prepareModule2LearningPackage({
      flush: async () => ({ ...createNewModule2Portfolio(undefined, NOW), revision: 1 }),
      readSnapshot: async () => snapshotOf({ ...createNewModule2Portfolio(undefined, NOW), revision: 1 }),
    })
    expect(empty.ok).toBe(true)
    if (!empty.ok) return
    expect(() => unzipCqpack(empty.bytes, {
      packageInputMaxBytes: RESOURCE_LIMITS.packageInputMaxBytes,
      packageExtractedMaxBytes: 8,
      packageMaxEntries: 10,
    })).toThrow(expect.objectContaining({ code: "too-large" }))
  })

  it("模块一进度文件给出入口说明", () => {
    const explained = explainNonZipLearningPackage(utf8(JSON.stringify({
      packageType: "classquest-module1-continue-package",
      version: 1,
    })))
    expect(explained.message).toContain("导入进度")
    expect(explained.message).toContain("当前作品未改变")
  })

  it("巨像素小文件在校验阶段被拒绝", async () => {
    const bytes = new Uint8Array(40)
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const view = new DataView(bytes.buffer)
    view.setUint32(8, 13)
    bytes.set([0x49, 0x48, 0x44, 0x52], 12)
    view.setUint32(16, 10000)
    view.setUint32(20, 10000)
    bytes[24] = 8
    bytes[25] = 2
    const sha256 = await sha256Hex(bytes)
    const asset: Module2StoredAsset = {
      assetId: `sha256:${sha256}`,
      blob: new Blob([bytes], { type: "image/png" }),
      mime: "image/png",
      byteLength: bytes.byteLength,
      width: 10000,
      height: 10000,
      sha256,
      createdAt: NOW,
    }
    const portfolio = { ...createNewModule2Portfolio(undefined, NOW), revision: 1, assetIds: [asset.assetId] }
    const prepared = await prepareModule2LearningPackage({
      flush: async () => portfolio,
      readSnapshot: async () => snapshotOf(portfolio, [asset]),
    })
    expect(prepared.ok).toBe(false)
    if (prepared.ok) return
    expect(prepared.message).toContain("当前作品未改变")
  })
})

describe("坏包不改旧档案", () => {
  it("非法包被拒绝后，活动档案与 revision 保持原样", async () => {
    const { repo } = setup()
    const original = createNewModule2Portfolio({ clazz: "初一（1）班", studentName: "王芳", classSeatCode: "0101" }, NOW)
    await repo.savePortfolio(original)
    const before = await repo.getActivePortfolio()
    expect(before?.student.studentName).toBe("王芳")
    const replace = vi.spyOn(repo, "replaceAtomically")
    await expect(readCqpackArchive(zipSync({ "../evil.json": strToU8("nope") }), NOW)).rejects.toBeInstanceOf(CqpackError)
    expect(replace).not.toHaveBeenCalled()
    const after = await repo.getActivePortfolio()
    expect(after?.id).toBe(before?.id)
    expect(after?.revision).toBe(before?.revision)
    expect(after?.student.studentName).toBe("王芳")

    const prepared = await prepareModule2LearningPackage({
      flush: async () => after!,
      readSnapshot: id => repo.readExportSnapshot(id),
      now: new Date("2026-10-26T06:00:00.000Z"),
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    const read = await readCqpackArchive(prepared.bytes, NOW)
    await repo.replaceAtomically(read.portfolio, read.assets)
    const restored = await repo.getActivePortfolio()
    expect(restored?.student.studentName).toBe("王芳")
    expect(restored?.assetIds).toEqual([])
    expect(restored?.lesson1.completed).toBe(false)
  })
})

describe("Worker 入口", () => {
  it("页面通过 Vite 模块 Worker 打包和解压", () => {
    const sources = import.meta.glob("./pack-client.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>
    const code = Object.values(sources)[0]
    expect(code).toContain('new Worker(new URL("./pack.worker.ts", import.meta.url), { type: "module" })')
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
