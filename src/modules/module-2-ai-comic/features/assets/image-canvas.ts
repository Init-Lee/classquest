/**
 * 文件说明：模块 2 浏览器端图片解码、透明检测与重新编码。
 * 职责：用 createImageBitmap（imageOrientation: from-image，先处理照片方向）解码，按规划尺寸在画布上重采样并编码为 JPEG/PNG；依赖浏览器画布能力，只能在浏览器中运行与手动验证。
 * 更新触发：解码方式、重采样质量、透明检测或编码方式变化时，需要同步更新本文件。
 */

import type { RenderPlan } from "@/modules/module-2-ai-comic/features/assets/image-plan"

type DrawingCanvas = OffscreenCanvas | HTMLCanvasElement
type Drawing2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D

/** 透明检测时的采样画布长边；缩小采样足以判断是否存在透明像素。 */
const ALPHA_PROBE_LONG_EDGE = 512

export async function decodeImageBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" })
  } catch (error) {
    // 个别旧浏览器不认识选项对象，退回默认解码（默认同样按 EXIF 方向）
    if (error instanceof TypeError) return createImageBitmap(blob)
    throw error
  }
}

function createCanvas(width: number, height: number): { canvas: DrawingCanvas; context: Drawing2D } {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext("2d")
    if (context) return { canvas, context }
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("浏览器无法创建图片画布")
  return { canvas, context }
}

function canvasToBlob(canvas: DrawingCanvas, mime: string, quality: number | undefined): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: mime, quality })
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error("图片编码失败"))), mime, quality)
  })
}

/** 在缩小的采样画布上检查是否有不透明度小于 255 的像素。 */
export function hasTransparentPixels(bitmap: ImageBitmap): boolean {
  const ratio = Math.min(1, ALPHA_PROBE_LONG_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * ratio))
  const height = Math.max(1, Math.round(bitmap.height * ratio))
  const { context } = createCanvas(width, height)
  context.clearRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) return true
  }
  return false
}

export async function renderBitmap(bitmap: ImageBitmap, plan: RenderPlan): Promise<Blob> {
  const { canvas, context } = createCanvas(plan.width, plan.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  if (plan.mime === "image/jpeg") {
    // JPEG 无透明通道，先铺白底，避免透明区域变黑
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, plan.width, plan.height)
  }
  context.drawImage(bitmap, 0, 0, plan.width, plan.height)
  return canvasToBlob(canvas, plan.mime, plan.quality)
}
