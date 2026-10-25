/**
 * 文件说明：模块 2 主图与缩略图输出规划（纯函数）。
 * 职责：根据真实解码宽高与是否透明，计算主图是否需要缩小（长边 1536、不放大小图）、输出格式（不透明 JPEG 0.88、透明 PNG）与缩略图尺寸（长边 384）。
 * 更新触发：主图/缩略图尺寸、输出格式或质量参数的规划规则变化时，需要同步更新本文件与回归测试。
 */

import { IMAGE_PRESETS } from "@/modules/module-2-ai-comic/constants/resource-limits"

export type OutputMime = "image/png" | "image/jpeg"

export interface ScaledSize {
  width: number
  height: number
  scaled: boolean
}

/** 按长边缩小到 maxLongEdge 以内；已在范围内时原样返回，绝不放大。 */
export function computeScaledSize(width: number, height: number, maxLongEdge: number): ScaledSize {
  const longEdge = Math.max(width, height)
  if (longEdge <= maxLongEdge) return { width, height, scaled: false }
  const ratio = maxLongEdge / longEdge
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    scaled: true,
  }
}

export interface RenderPlan {
  width: number
  height: number
  mime: OutputMime
  quality: number | undefined
}

export type MainImagePlan =
  | { keepOriginal: true; width: number; height: number }
  | ({ keepOriginal: false } & RenderPlan)

function outputFor(hasAlpha: boolean): Pick<RenderPlan, "mime" | "quality"> {
  return hasAlpha
    ? { mime: "image/png", quality: undefined }
    : { mime: "image/jpeg", quality: IMAGE_PRESETS.jpegQuality }
}

/** 主图：长边不超过 1536 时直接沿用原图字节（主图与原图共用一份）；否则按透明与否重新编码。 */
export function planMainImage(width: number, height: number, hasAlpha: boolean): MainImagePlan {
  const size = computeScaledSize(width, height, IMAGE_PRESETS.mainLongEdge)
  if (!size.scaled) return { keepOriginal: true, width, height }
  return { keepOriginal: false, width: size.width, height: size.height, ...outputFor(hasAlpha) }
}

/** 缩略图：长边 384，透明图保留 PNG。 */
export function planThumbnail(width: number, height: number, hasAlpha: boolean): RenderPlan {
  const size = computeScaledSize(width, height, IMAGE_PRESETS.thumbnailLongEdge)
  return { width: size.width, height: size.height, ...outputFor(hasAlpha) }
}
