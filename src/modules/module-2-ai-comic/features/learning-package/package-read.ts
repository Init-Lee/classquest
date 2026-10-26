/**
 * 文件说明：模块 2 学习包读入后的校验。
 * 职责：核对清单、档案、图片摘要、格式、尺寸和引用；按真实字段重算课时门禁。缩略图不在包内，不因此拒绝。主图或原图缺失则拒绝。
 * 更新触发：清单字段、图片校验、门禁重算或“不能导入”的提示变化时，需要同步更新本文件。
 */

import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import { syncModule2Lesson1Flags } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  MODULE2_MODULE_ID,
  MODULE2_SUPPORTED_IMAGE_MIMES,
  type Module2ImageMime,
  type Module2PortfolioV1,
  type Module2StoredAsset,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { validateModule2Portfolio } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import { sha256Hex } from "@/modules/module-2-ai-comic/features/assets/sha256"
import { checkImageLimits, readImageHeader, sniffImageMime } from "@/modules/module-2-ai-comic/features/assets/image-sniff"
import { decodeImageBitmap } from "@/modules/module-2-ai-comic/features/assets/image-canvas"
import {
  CQPACK_PACKAGE_TYPE,
  CQPACK_VERSION,
  CqpackError,
  describeLearningPackage,
  isSha256Hex,
  LEARNING_PACKAGE_MESSAGES,
  mimeForAssetExtension,
  MODULE1_CONTINUE_PACKAGE_TYPE,
  type CqpackManifest,
  type CqpackManifestAsset,
  type LearningPackagePreview,
} from "@/modules/module-2-ai-comic/features/learning-package/package-contract"
import { unzipCqpack, type UnzipLimits } from "@/modules/module-2-ai-comic/features/learning-package/package-zip"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/

export interface ReadLearningPackage {
  portfolio: Module2PortfolioV1
  assets: Module2StoredAsset[]
  preview: LearningPackagePreview
  exportedAt: string
}

function fail(code: string, studentMessage: string, diagnostic: string): never {
  throw new CqpackError(code, studentMessage, diagnostic)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function own(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined
}

function textOf(bytes: Uint8Array, label: string, maxBytes: number): string {
  if (bytes.byteLength > maxBytes) fail("too-large", LEARNING_PACKAGE_MESSAGES.tooBig, `${label}超过可以读取的大小`)
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, `${label}无法读取`)
  }
}

function parseManifest(bytes: Uint8Array): CqpackManifest {
  const text = textOf(bytes, "清单", RESOURCE_LIMITS.manifestMaxBytes)
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "清单无法读取")
  }
  if (!isRecord(raw)) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "清单无法读取")
  const packageType = own(raw, "packageType")
  if (packageType === MODULE1_CONTINUE_PACKAGE_TYPE) {
    fail("module1", LEARNING_PACKAGE_MESSAGES.module1, "这是模块一的进度文件")
  }
  if (packageType !== CQPACK_PACKAGE_TYPE) fail("wrong-module", LEARNING_PACKAGE_MESSAGES.wrongModule, "包裹类型不匹配")
  const version = own(raw, "version")
  if (version !== CQPACK_VERSION) {
    if (typeof version === "number" && version > CQPACK_VERSION) {
      fail("future", LEARNING_PACKAGE_MESSAGES.future, `版本 ${version} 高于当前支持的版本`)
    }
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "版本号无法识别")
  }
  if (own(raw, "moduleId") !== MODULE2_MODULE_ID) fail("wrong-module", LEARNING_PACKAGE_MESSAGES.wrongModule, "模块标识不匹配")
  const exportedAt = own(raw, "exportedAt")
  const portfolioId = own(raw, "portfolioId")
  const snapshotRevision = own(raw, "snapshotRevision")
  if (typeof exportedAt !== "string" || !ISO_DATE.test(exportedAt)) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "导出时间无法识别")
  if (typeof portfolioId !== "string" || portfolioId.trim() === "") fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "作品编号缺失")
  if (typeof snapshotRevision !== "number" || !Number.isInteger(snapshotRevision) || snapshotRevision < 0) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "保存次数无法识别")
  }
  const portfolio = own(raw, "portfolio")
  if (!isRecord(portfolio) || own(portfolio, "path") !== "portfolio.json") {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "档案位置不正确")
  }
  const portfolioLength = own(portfolio, "byteLength")
  const portfolioSha = own(portfolio, "sha256")
  if (typeof portfolioLength !== "number" || portfolioLength < 0 || typeof portfolioSha !== "string" || !isSha256Hex(portfolioSha)) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "档案记录不完整")
  }
  const assetsRaw = own(raw, "assets")
  if (!Array.isArray(assetsRaw)) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片清单缺失")
  const assets: CqpackManifestAsset[] = []
  for (const item of assetsRaw) {
    if (!isRecord(item)) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片记录无法读取")
    const id = own(item, "id")
    const path = own(item, "path")
    const mime = own(item, "mime")
    const byteLength = own(item, "byteLength")
    const width = own(item, "width")
    const height = own(item, "height")
    const sha256 = own(item, "sha256")
    if (typeof id !== "string" || typeof path !== "string" || typeof mime !== "string" || typeof sha256 !== "string") {
      fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片记录缺字段")
    }
    if (typeof byteLength !== "number" || typeof width !== "number" || typeof height !== "number") {
      fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片尺寸记录无法读取")
    }
    if (!MODULE2_SUPPORTED_IMAGE_MIMES.includes(mime as Module2ImageMime)) {
      fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片格式不在支持范围内")
    }
    assets.push({
      id,
      path,
      mime: mime as Module2ImageMime,
      byteLength,
      width,
      height,
      sha256,
    })
  }
  return {
    packageType: CQPACK_PACKAGE_TYPE,
    version: CQPACK_VERSION,
    moduleId: MODULE2_MODULE_ID,
    exportedAt,
    portfolioId,
    snapshotRevision,
    portfolio: { path: "portfolio.json", byteLength: portfolioLength, sha256: portfolioSha },
    assets,
  }
}

async function verifyImage(asset: CqpackManifestAsset, bytes: Uint8Array): Promise<void> {
  if (bytes.byteLength !== asset.byteLength) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片大小和记录不一致")
  const digest = await sha256Hex(bytes)
  if (digest !== asset.sha256 || asset.id !== `sha256:${digest}`) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片内容和记录对不上")
  }
  const extension = asset.path.slice(asset.path.lastIndexOf(".") + 1)
  if (asset.path !== `assets/${digest}.${extension}` || mimeForAssetExtension(extension) !== asset.mime) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片文件名和内容对不上")
  }
  const sniffed = sniffImageMime(bytes)
  if (!sniffed.ok || sniffed.mime !== asset.mime) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片格式和内容对不上")
  const header = readImageHeader(bytes, sniffed.mime)
  if (!header) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片无法打开")
  if (header.width !== asset.width || header.height !== asset.height) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片尺寸和记录不一致")
  }
  const limit = checkImageLimits(bytes.byteLength, header.width, header.height)
  if (limit) fail("too-large", LEARNING_PACKAGE_MESSAGES.tooBig, limit)
  if (typeof createImageBitmap !== "function") return
  try {
    const bitmap = await decodeImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: sniffed.mime }))
    try {
      const same = bitmap.width === header.width && bitmap.height === header.height
      const swapped = bitmap.width === header.height && bitmap.height === header.width
      if (!same && !swapped) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片打开后的尺寸对不上")
    } finally {
      bitmap.close()
    }
  } catch (error) {
    if (error instanceof CqpackError) throw error
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片无法打开")
  }
}

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const values = new Set(left)
  return right.every(item => values.has(item)) && values.size === left.length
}

/**
 * 校验已经解压出的文件。调用前应已完成路径和体积限制。
 * 返回的档案会按字段重算门禁，不沿用包里的完成标记。
 */
export async function interpretCqpack(
  entries: { path: string; bytes: Uint8Array }[],
  restoredAt: string,
): Promise<ReadLearningPackage> {
  const byPath = new Map<string, Uint8Array>()
  for (const entry of entries) {
    if (byPath.has(entry.path)) fail("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "有重复的文件")
    byPath.set(entry.path, entry.bytes)
  }
  const manifestBytes = byPath.get("manifest.json")
  const portfolioBytes = byPath.get("portfolio.json")
  if (!manifestBytes || !portfolioBytes) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "缺少必要内容")
  const manifest = parseManifest(manifestBytes)
  if (portfolioBytes.byteLength !== manifest.portfolio.byteLength) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "档案大小和记录不一致")
  }
  if (await sha256Hex(portfolioBytes) !== manifest.portfolio.sha256) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "档案内容和记录对不上")
  }
  let portfolioRaw: unknown
  try {
    portfolioRaw = JSON.parse(textOf(portfolioBytes, "档案", RESOURCE_LIMITS.portfolioMaxBytes))
  } catch (error) {
    if (error instanceof CqpackError) throw error
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "档案无法读取")
  }
  const validated = validateModule2Portfolio(portfolioRaw)
  if (!validated.ok) {
    const future = validated.reason === "future-version"
    fail(future ? "future" : "corrupt", future ? LEARNING_PACKAGE_MESSAGES.future : LEARNING_PACKAGE_MESSAGES.incomplete, validated.message)
  }
  const portfolio = validated.value
  if (portfolio.id !== manifest.portfolioId || portfolio.revision !== manifest.snapshotRevision) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "清单和档案对不上")
  }
  if (manifest.assets.length !== portfolio.assetIds.length || !sameSet(manifest.assets.map(asset => asset.id), portfolio.assetIds)) {
    fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片清单和作品记录不一致")
  }
  const declaredPaths = new Set(["manifest.json", "portfolio.json", ...manifest.assets.map(asset => asset.path)])
  for (const path of byPath.keys()) {
    if (!declaredPaths.has(path)) fail("undeclared", LEARNING_PACKAGE_MESSAGES.incomplete, "含有未声明的文件")
  }
  const seenIds = new Set<string>()
  const assets: Module2StoredAsset[] = []
  for (const asset of manifest.assets) {
    if (seenIds.has(asset.id)) fail("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "图片清单有重复项")
    seenIds.add(asset.id)
    const bytes = byPath.get(asset.path)
    if (!bytes) fail("missing", LEARNING_PACKAGE_MESSAGES.incomplete, "有图片缺失，不能恢复")
    await verifyImage(asset, bytes)
    assets.push({
      assetId: asset.id,
      blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: asset.mime }),
      mime: asset.mime,
      byteLength: bytes.byteLength,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
      createdAt: restoredAt,
    })
  }
  const repaired = syncModule2Lesson1Flags(portfolio, portfolio.updatedAt)
  return {
    portfolio: repaired,
    assets,
    preview: describeLearningPackage(repaired),
    exportedAt: manifest.exportedAt,
  }
}

/** 解压并校验。测试和导出后的自检使用这一条路径。 */
export async function readCqpackArchive(bytes: Uint8Array, restoredAt: string, limits?: UnzipLimits): Promise<ReadLearningPackage> {
  return interpretCqpack(unzipCqpack(bytes, limits), restoredAt)
}

/** 不是压缩包时，识别模块一进度文件并给出入口；其他文件只说明当前作品不变。 */
export function explainNonZipLearningPackage(bytes: Uint8Array): { message: string; diagnostic: string } {
  let text = ""
  try {
    text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.byteLength, 1024 * 1024)))
  } catch {
    return { message: LEARNING_PACKAGE_MESSAGES.notPack, diagnostic: "无法查看文件内容" }
  }
  const trimmed = text.trim()
  if (trimmed.startsWith("{")) {
    try {
      const raw = JSON.parse(trimmed) as { packageType?: unknown }
      if (raw && typeof raw === "object" && raw.packageType === MODULE1_CONTINUE_PACKAGE_TYPE) {
        return { message: LEARNING_PACKAGE_MESSAGES.module1, diagnostic: "这是模块一的进度文件" }
      }
    } catch {
      /* 不是完整记录，按普通无效文件处理 */
    }
  }
  return { message: LEARNING_PACKAGE_MESSAGES.notPack, diagnostic: "不是本模块的学习包" }
}
