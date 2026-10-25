/**
 * 文件说明：模块 2 图片格式与尺寸的文件头识别（纯函数）。
 * 职责：只按文件内容魔数识别 PNG/JPEG/WebP（不看后缀与浏览器给的类型），对常见不支持格式给出明确提示；在解码前从文件头读取宽高与是否可能含透明，并检查统一资源限额。
 * 更新触发：支持的图片格式、限额检查规则或提示文案变化时，需要同步更新本文件与回归测试。
 */

import type { Module2ImageMime } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"

export type ImageSniffResult =
  | { ok: true; mime: Module2ImageMime }
  | { ok: false; message: string }

export interface ImageHeaderInfo {
  width: number
  height: number
  /** 文件头声明可能含透明通道；JPEG 恒为 false。 */
  mayHaveAlpha: boolean
}

const SUPPORTED_HINT = "目前只支持 PNG、JPEG、WebP 图片"

function ascii(bytes: Uint8Array, start: number, length: number): string {
  if (bytes.length < start + length) return ""
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value)
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

export function sniffImageMime(bytes: Uint8Array): ImageSniffResult {
  if (startsWith(bytes, PNG_SIGNATURE)) return { ok: true, mime: "image/png" }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { ok: true, mime: "image/jpeg" }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { ok: true, mime: "image/webp" }

  let detected: string | null = null
  const brand = ascii(bytes, 4, 8)
  if (ascii(bytes, 0, 4) === "GIF8") detected = "GIF 动图"
  else if (ascii(bytes, 0, 2) === "BM") detected = "BMP"
  else if (brand === "ftypavif" || brand === "ftypavis") detected = "AVIF"
  else if (brand.startsWith("ftyp") && ["heic", "heix", "hevc", "mif1", "msf1"].includes(brand.slice(4))) detected = "HEIC（苹果照片）"
  else if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) detected = "TIFF"
  else if (ascii(bytes, 0, 4) === "%PDF") detected = "PDF 文档"
  else if (/<svg[\s>]/i.test(ascii(bytes, 0, Math.min(bytes.length, 512)))) detected = "SVG 矢量图"

  if (detected) {
    return { ok: false, message: `这个文件是 ${detected} 格式，${SUPPORTED_HINT}。请在原工具中另存为 PNG 或 JPEG 后再选择。` }
  }
  return { ok: false, message: `这个文件不是可识别的图片（只看文件内容，不看后缀名）。${SUPPORTED_HINT}。` }
}

function u16be(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function u32be(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]
}

function u24le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function readPngHeader(bytes: Uint8Array): ImageHeaderInfo | null {
  if (bytes.length < 33 || ascii(bytes, 12, 4) !== "IHDR") return null
  const width = u32be(bytes, 16)
  const height = u32be(bytes, 20)
  const colorType = bytes[25]
  let mayHaveAlpha = colorType === 4 || colorType === 6
  // 调色板/灰度/真彩色图可能带 tRNS 透明块，须出现在 IDAT 之前
  let offset = 8
  while (!mayHaveAlpha && offset + 8 <= bytes.length) {
    const length = u32be(bytes, offset)
    const type = ascii(bytes, offset + 4, 4)
    if (type === "tRNS") mayHaveAlpha = true
    if (type === "IDAT" || type === "IEND") break
    offset += 12 + length
  }
  return { width, height, mayHaveAlpha }
}

const JPEG_SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

function readJpegHeader(bytes: Uint8Array): ImageHeaderInfo | null {
  let offset = 2
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    if (marker === 0xff) {
      offset += 1
      continue
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    if (marker === 0xd9 || marker === 0xda) return null
    const length = u16be(bytes, offset + 2)
    if (JPEG_SOF_MARKERS.has(marker)) {
      if (offset + 9 > bytes.length) return null
      return { height: u16be(bytes, offset + 5), width: u16be(bytes, offset + 7), mayHaveAlpha: false }
    }
    offset += 2 + length
  }
  return null
}

function readWebpHeader(bytes: Uint8Array): ImageHeaderInfo | null {
  const chunk = ascii(bytes, 12, 4)
  if (chunk === "VP8X" && bytes.length >= 30) {
    return { width: 1 + u24le(bytes, 24), height: 1 + u24le(bytes, 27), mayHaveAlpha: (bytes[20] & 0x10) !== 0 }
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const b1 = bytes[21], b2 = bytes[22], b3 = bytes[23], b4 = bytes[24]
    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
      mayHaveAlpha: (b4 & 0x10) !== 0,
    }
  }
  if (chunk === "VP8 " && bytes.length >= 30) {
    return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff, mayHaveAlpha: false }
  }
  return null
}

/** 从文件头读取宽高；读不出时返回 null（文件可能损坏）。 */
export function readImageHeader(bytes: Uint8Array, mime: Module2ImageMime): ImageHeaderInfo | null {
  const info = mime === "image/png" ? readPngHeader(bytes) : mime === "image/jpeg" ? readJpegHeader(bytes) : readWebpHeader(bytes)
  if (!info || info.width <= 0 || info.height <= 0) return null
  return info
}

/** 检查字节数与像素限额；返回学生可读的提示，未超限返回 null。 */
export function checkImageLimits(byteLength: number, width: number, height: number): string | null {
  if (byteLength > RESOURCE_LIMITS.imageMaxBytes) {
    return `图片文件太大（${(byteLength / 1024 / 1024).toFixed(1)} MB），单张不能超过 ${RESOURCE_LIMITS.imageMaxBytes / 1024 / 1024} MB。`
  }
  if (width > RESOURCE_LIMITS.imageMaxSide || height > RESOURCE_LIMITS.imageMaxSide) {
    return `图片尺寸太大（${width}×${height}），宽和高都不能超过 ${RESOURCE_LIMITS.imageMaxSide} 像素。`
  }
  if (width * height > RESOURCE_LIMITS.imageMaxPixels) {
    return `图片像素太多（${width}×${height}），请先缩小后再选择。`
  }
  return null
}
