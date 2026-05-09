/**
 * 文件说明：模块 4 课时 2 素材图片压缩工具。
 * 职责：把新闻截图和图片素材压缩为可写入本地档案的 DataURL，并保留必要的尺寸、格式和上传次数元数据。
 * 更新触发：素材大小上限、压缩格式、画布处理策略或资产字段结构变化时，需要同步更新本文件。
 */

import type { Module4CompressedMaterialAsset } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

const TARGET_MAX_BYTES = 500 * 1024
const INITIAL_MAX_LONG_EDGE = 1800
const MIN_LONG_EDGE = 900
const INITIAL_QUALITY = 0.88
const MIN_QUALITY = 0.62
const QUALITY_STEP = 0.06
const RESIZE_STEP = 0.85

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("图片压缩结果读取失败，请重新上传。"))
    reader.readAsDataURL(blob)
  })
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = "async"
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: "image/webp" | "image/jpeg", quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(resolve, mimeType, quality)
  })
}

function drawScaledImage(image: HTMLImageElement, maxLongEdge: number): HTMLCanvasElement {
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("当前浏览器无法处理图片压缩，请更换浏览器或重新上传。")
  ctx.drawImage(image, 0, 0, width, height)
  return canvas
}

async function compressWithMimeType(
  image: HTMLImageElement,
  mimeType: "image/webp" | "image/jpeg",
): Promise<{ blob: Blob; width: number; height: number; mimeType: "image/webp" | "image/jpeg" } | null> {
  let maxLongEdge = INITIAL_MAX_LONG_EDGE
  let best: { blob: Blob; width: number; height: number; mimeType: "image/webp" | "image/jpeg" } | null = null

  while (maxLongEdge >= MIN_LONG_EDGE) {
    const canvas = drawScaledImage(image, maxLongEdge)
    for (let quality = INITIAL_QUALITY; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
      const blob = await canvasToBlob(canvas, mimeType, quality)
      if (!blob) return null
      if (blob.type && blob.type !== mimeType) return null
      const candidate = { blob, width: canvas.width, height: canvas.height, mimeType }
      if (!best || blob.size < best.blob.size) best = candidate
      if (blob.size <= TARGET_MAX_BYTES) return candidate
    }
    maxLongEdge = Math.floor(maxLongEdge * RESIZE_STEP)
  }

  return best
}

export async function compressModule4MaterialImage(
  file: File,
  previousUploadCount = 0,
): Promise<Module4CompressedMaterialAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请上传图片文件。")
  }

  const image = await loadImage(file)
  const webp = await compressWithMimeType(image, "image/webp")
  const result = webp?.blob.size
    ? webp
    : await compressWithMimeType(image, "image/jpeg")

  if (!result) {
    throw new Error("图片压缩失败，请换一张图片或重新截图。")
  }

  const dataUrl = await blobToDataUrl(result.blob)
  return {
    dataUrl,
    mimeType: result.mimeType,
    originalName: file.name || "素材图片",
    originalSizeBytes: file.size,
    compressedSizeBytes: result.blob.size,
    width: result.width,
    height: result.height,
    compressedAt: new Date().toISOString(),
    uploadCount: previousUploadCount + 1,
  }
}
