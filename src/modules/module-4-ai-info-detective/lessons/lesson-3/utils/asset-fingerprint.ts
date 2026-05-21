/**
 * 文件说明：模块 4 课时 3 素材指纹工具。
 * 职责：为课时 2 压缩图片生成轻量 assetFingerprint，避免在课时 3 中比较整段 base64。
 * 更新触发：素材资产结构、浏览器端哈希策略或正式资产化方案变化时，需要同步更新本文件。
 */

import type { Module4CompressedMaterialAsset } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function buildLesson3AssetFingerprint(asset?: Module4CompressedMaterialAsset): string {
  if (!asset) return ""
  const head = asset.dataUrl.slice(0, 64)
  const tail = asset.dataUrl.slice(-64)
  return [
    asset.mimeType,
    asset.compressedSizeBytes,
    `${asset.width}x${asset.height}`,
    head,
    tail,
  ].join(":")
}
