/**
 * 文件说明：模块 2 本机资产记录读回校验。
 * 职责：把从 assets store 读回的未知值校验为 Module2StoredAsset（Blob、MIME、字节数、宽高、摘要、时间），损坏记录返回 null，由调用方决定报错。
 * 更新触发：assets store 记录字段、支持的图片 MIME 或摘要格式变化时，需要同步更新本文件。
 */

import {
  MODULE2_SUPPORTED_IMAGE_MIMES,
  type Module2ImageMime,
  type Module2StoredAsset,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

const SHA256_HEX = /^[0-9a-f]{64}$/

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
}

export function parseModule2StoredAsset(value: unknown): Module2StoredAsset | null {
  if (typeof value !== "object" || value === null) return null
  const record = value as Record<string, unknown>
  const { assetId, blob, mime, byteLength, width, height, sha256, createdAt } = record
  if (typeof sha256 !== "string" || !SHA256_HEX.test(sha256)) return null
  if (assetId !== `sha256:${sha256}`) return null
  if (!(blob instanceof Blob)) return null
  if (typeof mime !== "string" || !(MODULE2_SUPPORTED_IMAGE_MIMES as readonly string[]).includes(mime)) return null
  if (!isPositiveInt(byteLength) || byteLength !== blob.size) return null
  if (!isPositiveInt(width) || !isPositiveInt(height)) return null
  if (typeof createdAt !== "string") return null
  return { assetId, blob, mime: mime as Module2ImageMime, byteLength, width, height, sha256, createdAt }
}
