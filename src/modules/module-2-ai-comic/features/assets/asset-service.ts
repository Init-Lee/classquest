/**
 * 文件说明：模块 2 图片资产服务。
 * 职责：把一张外部图片按“验证 → 解码与像素检查 → 生成主图 / 缩略图 → 原图与主图资产 + 版本 + 库存同一事务写入 → 事务完成后才算已保存”的顺序处理；按真实字节 SHA-256 去重；
 *       从本机库读取 Blob 重建预览地址，缩略图写入可重建的缓存，缺失时从主图重建。
 * 更新触发：图片处理流程、去重规则、版本写入方式、缩略图缓存策略或提示文案变化时，需要同步更新本文件。
 *
 * 所有解码、编码与哈希都在数据库事务之外完成；图片处理按 RESOURCE_LIMITS.imageProcessingConcurrency 串行排队。
 */

import { IMAGE_PRESETS, RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import { addModule2ImageVersion } from "@/modules/module-2-ai-comic/domains/portfolio/image-versions"
import {
  createModule2Id,
  type AssetId,
  type ImageSlot,
  type ImageVersion,
  type Module2ImageMime,
  type Module2PortfolioV1,
  type Module2StoredAsset,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { decodeImageBitmap, hasTransparentPixels, renderBitmap } from "@/modules/module-2-ai-comic/features/assets/image-canvas"
import { planMainImage, planThumbnail } from "@/modules/module-2-ai-comic/features/assets/image-plan"
import { checkImageLimits, readImageHeader, sniffImageMime } from "@/modules/module-2-ai-comic/features/assets/image-sniff"
import { createLimitedRunner } from "@/modules/module-2-ai-comic/features/assets/serial-queue"
import { sha256Hex } from "@/modules/module-2-ai-comic/features/assets/sha256"
import type { Module2AssetRepository } from "@/modules/module-2-ai-comic/infra/persistence/repositories/asset.repository"
import type { Module2PortfolioRepository } from "@/modules/module-2-ai-comic/infra/persistence/repositories/portfolio.repository"

/** 图片处理中可直接展示给学生的错误（不含技术词）。 */
export class Module2ImageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "Module2ImageError"
  }
}

export interface PreparedImage {
  original: Module2StoredAsset
  main: Module2StoredAsset
  /** 主图直接沿用原图字节（未缩小），两者只存一份。 */
  mainIsOriginal: boolean
  thumbnail: { blob: Blob; width: number; height: number }
}

const runImageTask = createLimitedRunner(RESOURCE_LIMITS.imageProcessingConcurrency)

async function toStoredAsset(
  bytes: Uint8Array,
  mime: Module2ImageMime,
  width: number,
  height: number,
  now: string,
): Promise<Module2StoredAsset> {
  const sha256 = await sha256Hex(bytes)
  return {
    assetId: `sha256:${sha256}`,
    blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }),
    mime,
    byteLength: bytes.byteLength,
    width,
    height,
    sha256,
    createdAt: now,
  }
}

/** 在任何数据库事务之外准备好原图、主图与缩略图；失败时抛出 Module2ImageError，不写入任何内容。 */
export async function prepareModule2Image(file: Blob, now: string = new Date().toISOString()): Promise<PreparedImage> {
  if (file.size > RESOURCE_LIMITS.imageMaxBytes) {
    throw new Module2ImageError(checkImageLimits(file.size, 1, 1) ?? "图片文件太大。")
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sniff = sniffImageMime(bytes)
  if (!sniff.ok) throw new Module2ImageError(sniff.message)
  // 解码前先按文件头尺寸检查限额，避免巨像素小文件撑爆内存
  const header = readImageHeader(bytes, sniff.mime)
  if (!header) throw new Module2ImageError("读不出这张图片的尺寸，文件可能已损坏，请重新导出后再选择。")
  const headerLimit = checkImageLimits(bytes.byteLength, header.width, header.height)
  if (headerLimit) throw new Module2ImageError(headerLimit)

  return runImageTask(async () => {
    let bitmap: ImageBitmap
    try {
      bitmap = await decodeImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: sniff.mime }))
    } catch (cause) {
      throw new Module2ImageError("浏览器无法打开这张图片，文件可能已损坏。", { cause })
    }
    try {
      const { width, height } = bitmap
      const decodedLimit = checkImageLimits(bytes.byteLength, width, height)
      if (decodedLimit) throw new Module2ImageError(decodedLimit)
      const hasAlpha = sniff.mime !== "image/jpeg" && header.mayHaveAlpha && hasTransparentPixels(bitmap)

      const original = await toStoredAsset(bytes, sniff.mime, width, height, now)
      const mainPlan = planMainImage(width, height, hasAlpha)
      let main = original
      if (!mainPlan.keepOriginal) {
        const mainBlob = await renderBitmap(bitmap, mainPlan)
        const mainBytes = new Uint8Array(await mainBlob.arrayBuffer())
        main = await toStoredAsset(mainBytes, mainPlan.mime, mainPlan.width, mainPlan.height, now)
      }
      const thumbPlan = planThumbnail(width, height, hasAlpha)
      const thumbnailBlob = await renderBitmap(bitmap, thumbPlan)
      return {
        original,
        main,
        mainIsOriginal: main.assetId === original.assetId,
        thumbnail: { blob: thumbnailBlob, width: thumbPlan.width, height: thumbPlan.height },
      }
    } finally {
      bitmap.close()
    }
  })
}

export interface SaveImageVersionInput {
  slot: ImageSlot
  sourceSnapshotId: string
  prompt?: string
  toolLabel?: string
  note?: string
  referenceAssetIds?: AssetId[]
}

export interface SaveImageVersionResult {
  portfolio: Module2PortfolioV1
  version: ImageVersion
  /** 本次写入前本机已存在、因哈希相同而复用的资产。 */
  reusedAssetIds: AssetId[]
  writtenAssetIds: AssetId[]
}

/**
 * 保存一个图片版本：原图、主图、版本记录与库存在同一事务提交；Promise resolve 即代表事务完成、已保存到本机。
 * 失败时数据库不新增半个版本，传入的 portfolio 对象也不被修改。
 */
export async function saveModule2ImageVersion(
  repository: Module2PortfolioRepository,
  portfolio: Module2PortfolioV1,
  prepared: PreparedImage,
  input: SaveImageVersionInput,
  options: { activate?: boolean; now?: string } = {},
): Promise<SaveImageVersionResult> {
  const now = options.now ?? new Date().toISOString()
  const version: ImageVersion = {
    id: createModule2Id("m2v"),
    slot: input.slot,
    sourceSnapshotId: input.sourceSnapshotId,
    mainAssetId: prepared.main.assetId,
    originalAssetId: prepared.original.assetId,
    prompt: input.prompt ?? "",
    referenceAssetIds: input.referenceAssetIds ?? [],
    createdAt: now,
    toolLabel: input.toolLabel ?? "",
    note: input.note ?? "",
  }
  const next = { ...addModule2ImageVersion(portfolio, version).portfolio, updatedAt: now }
  const assets = prepared.mainIsOriginal ? [prepared.original] : [prepared.original, prepared.main]
  const saved = await repository.saveImageVersion(next, assets, { activate: options.activate })
  return {
    portfolio: { ...next, revision: saved.revision },
    version,
    reusedAssetIds: saved.reusedAssetIds,
    writtenAssetIds: saved.writtenAssetIds,
  }
}

/** 缩略图写入缓存；缓存失败不影响作品，只记录到控制台。 */
export async function cacheModule2Thumbnail(
  repository: Module2AssetRepository,
  assetId: AssetId,
  thumbnail: PreparedImage["thumbnail"],
): Promise<void> {
  try {
    await repository.putThumbnail({
      assetId,
      presetVersion: IMAGE_PRESETS.thumbnailPresetVersion,
      ...thumbnail,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn("[module2 assets] 缩略图缓存写入失败，稍后会重建", error)
  }
}

/** 读取缩略图预览地址：缓存缺失或损坏时从主图重建并回写缓存。 */
export async function getModule2ThumbnailUrl(repository: Module2AssetRepository, assetId: AssetId): Promise<string | null> {
  const cached = await repository.getThumbnail(assetId, IMAGE_PRESETS.thumbnailPresetVersion)
  if (cached && cached.blob.size > 0) return URL.createObjectURL(cached.blob)
  const asset = await repository.getAsset(assetId)
  if (!asset) return null
  const rebuilt = await runImageTask(async () => {
    const bitmap = await decodeImageBitmap(asset.blob)
    try {
      const hasAlpha = asset.mime !== "image/jpeg" && hasTransparentPixels(bitmap)
      const plan = planThumbnail(bitmap.width, bitmap.height, hasAlpha)
      return { blob: await renderBitmap(bitmap, plan), width: plan.width, height: plan.height }
    } finally {
      bitmap.close()
    }
  })
  await cacheModule2Thumbnail(repository, assetId, rebuilt)
  return URL.createObjectURL(rebuilt.blob)
}
