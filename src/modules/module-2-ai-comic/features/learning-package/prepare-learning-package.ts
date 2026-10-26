/**
 * 文件说明：模块 2 学习包导出准备。
 * 职责：先等本机保存完成，再读取同一份快照；缺图、超限或自检失败时不把字节交给下载。图片按已保存内容原样放入，不再次压缩画质。
 * 更新触发：导出顺序、缺图提示、体积预检或自检规则变化时，需要同步更新本文件。
 */

import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import type { Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { sha256Hex } from "@/modules/module-2-ai-comic/features/assets/sha256"
import type { Module2ExportSnapshot } from "@/modules/module-2-ai-comic/infra/persistence/repositories/portfolio.repository"
import {
  assessUncompressedSize,
  assetExtension,
  buildModule2PackageFilename,
  CQPACK_PACKAGE_TYPE,
  CQPACK_VERSION,
  CqpackError,
  LEARNING_PACKAGE_MESSAGES,
  type CqpackManifest,
} from "@/modules/module-2-ai-comic/features/learning-package/package-contract"
import { readCqpackArchive } from "@/modules/module-2-ai-comic/features/learning-package/package-read"
import { utf8Bytes, zipCqpack, type ZipFileInput } from "@/modules/module-2-ai-comic/features/learning-package/package-zip"

export interface PreparedLearningPackage {
  ok: true
  bytes: Uint8Array
  filename: string
  warning: string | null
  imageCount: number
  message: string
}

export interface RejectedLearningPackage {
  ok: false
  message: string
  diagnostic: string
}

export type PrepareLearningPackageResult = PreparedLearningPackage | RejectedLearningPackage

function rejected(message: string, diagnostic: string): RejectedLearningPackage {
  return { ok: false, message, diagnostic }
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const values = new Set(left)
  return values.size === left.length && right.every(id => values.has(id))
}

/**
 * 生成学习包字节。保存失败时不会读取快照。
 * zip 可换成 Worker 实现；默认在当前线程打包，方便测试。
 */
export async function prepareModule2LearningPackage(options: {
  flush: () => Promise<Module2PortfolioV1>
  readSnapshot: (portfolioId: string) => Promise<Module2ExportSnapshot | null>
  now?: Date
  zip?: (files: ZipFileInput[]) => Uint8Array | Promise<Uint8Array>
  /** 导出后用与导入相同的读入逻辑再查一遍。 */
  selfCheck?: (bytes: Uint8Array) => Promise<unknown>
}): Promise<PrepareLearningPackageResult> {
  const now = options.now ?? new Date()
  let flushed: Module2PortfolioV1
  try {
    flushed = await options.flush()
  } catch (error) {
    return rejected(LEARNING_PACKAGE_MESSAGES.saveFailed, error instanceof Error ? error.message : "保存没有完成")
  }

  const snapshot = await options.readSnapshot(flushed.id)
  if (!snapshot) return rejected(LEARNING_PACKAGE_MESSAGES.noRecord, "没有读到已保存的作品")
  if (snapshot.revision !== flushed.revision || snapshot.portfolio.revision !== flushed.revision) {
    return rejected(LEARNING_PACKAGE_MESSAGES.stale, "快照与刚保存的版本不一致")
  }

  const missing = new Set(snapshot.missingAssetIds)
  if (!sameIds(snapshot.assets.map(asset => asset.assetId), snapshot.portfolio.assetIds.filter(id => !missing.has(id)))) {
    for (const id of snapshot.portfolio.assetIds) {
      if (!snapshot.assets.some(asset => asset.assetId === id)) missing.add(id)
    }
  }
  const assetFiles: ZipFileInput[] = []
  const manifestAssets: CqpackManifest["assets"] = []
  for (const asset of snapshot.assets) {
    const bytes = new Uint8Array(await asset.blob.arrayBuffer())
    const digest = await sha256Hex(bytes)
    if (digest !== asset.sha256 || asset.assetId !== `sha256:${digest}` || bytes.byteLength !== asset.byteLength) {
      missing.add(asset.assetId)
      continue
    }
    const extension = assetExtension(asset.mime)
    const path = `assets/${digest}.${extension}`
    assetFiles.push({ path, bytes, store: true })
    manifestAssets.push({
      id: asset.assetId,
      path,
      mime: asset.mime,
      byteLength: bytes.byteLength,
      width: asset.width,
      height: asset.height,
      sha256: digest,
    })
  }
  if (missing.size > 0) {
    return rejected(LEARNING_PACKAGE_MESSAGES.missingImages(missing.size), `未能读取 ${missing.size} 张图片`)
  }

  const portfolioJson = JSON.stringify(snapshot.portfolio)
  const portfolioBytes = utf8Bytes(portfolioJson)
  const portfolioSha = await sha256Hex(portfolioBytes)
  const manifest: CqpackManifest = {
    packageType: CQPACK_PACKAGE_TYPE,
    version: CQPACK_VERSION,
    moduleId: snapshot.portfolio.moduleId,
    exportedAt: now.toISOString(),
    portfolioId: snapshot.portfolio.id,
    snapshotRevision: snapshot.revision,
    portfolio: { path: "portfolio.json", byteLength: portfolioBytes.byteLength, sha256: portfolioSha },
    assets: manifestAssets,
  }
  const manifestBytes = utf8Bytes(JSON.stringify(manifest))
  const files: ZipFileInput[] = [
    { path: "manifest.json", bytes: manifestBytes, store: false },
    { path: "portfolio.json", bytes: portfolioBytes, store: false },
    ...assetFiles.sort((left, right) => left.path.localeCompare(right.path)),
  ]
  const uncompressed = files.reduce((sum, file) => sum + file.bytes.byteLength, 0) + files.length * 512
  const assessment = assessUncompressedSize(uncompressed)
  if ("rejected" in assessment) return rejected(assessment.rejected, "未压缩体积超过安全上限")

  let packed: Uint8Array
  try {
    packed = await (options.zip ?? zipCqpack)(files)
  } catch (error) {
    const message = error instanceof CqpackError ? error.studentMessage : LEARNING_PACKAGE_MESSAGES.packFailed
    return rejected(message, error instanceof Error ? error.message : "打包没有完成")
  }
  if (packed.byteLength > RESOURCE_LIMITS.packageInputMaxBytes) {
    return rejected(LEARNING_PACKAGE_MESSAGES.tooBig, "打包结果超过可以再次导入的大小")
  }
  try {
    await (options.selfCheck ?? ((bytes: Uint8Array) => readCqpackArchive(bytes, now.toISOString())))(packed)
  } catch (error) {
    return rejected(
      error instanceof CqpackError ? error.studentMessage : LEARNING_PACKAGE_MESSAGES.incomplete,
      error instanceof Error ? error.message : "打包结果没有通过自检",
    )
  }

  const imageCount = manifestAssets.length
  const extra = imageCount === 0 ? LEARNING_PACKAGE_MESSAGES.textOnly : ""
  return {
    ok: true,
    bytes: packed,
    filename: buildModule2PackageFilename(snapshot.portfolio.student.studentName, now),
    warning: assessment.warning,
    imageCount,
    message: extra ? `${LEARNING_PACKAGE_MESSAGES.generated}。${extra}` : LEARNING_PACKAGE_MESSAGES.generated,
  }
}
