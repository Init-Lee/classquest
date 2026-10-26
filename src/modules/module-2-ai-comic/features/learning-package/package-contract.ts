/**
 * 文件说明：模块 2 学习包的路径、文件名、清单类型和学生可见文案。
 * 职责：规定 .cqpack 只允许清单、档案和按摘要命名的图片；清洗下载文件名；把失败原因收成课堂用语。诊断细节可以更具体，但不作为按钮上的主文案。
 * 更新触发：学习包路径规则、文件名格式、体积提醒线或学生可见提示变化时，需要同步更新本文件。
 */

import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import { computeModule2Lesson1Gates } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  MODULE2_MODULE_ID,
  type Module2ImageMime,
  type Module2PortfolioV1,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

export const CQPACK_PACKAGE_TYPE = "classquest-module2-learning-package"
export const CQPACK_VERSION = 1
export const MODULE1_CONTINUE_PACKAGE_TYPE = "classquest-module1-continue-package"

const ASSET_PATH = /^assets\/[0-9a-f]{64}\.(png|jpg|webp)$/
const SHA256_HEX = /^[0-9a-f]{64}$/

export const LEARNING_PACKAGE_MESSAGES = {
  generated: "学习包已生成，请确认下载完成",
  textOnly: "已保存文字学习记录；后续图片会一起保存到学习包",
  missingImages: (count: number) => `还有 ${count} 张图片未能读取，请先修复后再保存完整学习包`,
  incomplete: "学习包内容不完整，请换用上次保存的文件；当前作品未改变",
  quota: "本机空间不足，导入未完成，当前作品保留；请先保存当前学习包，再处理空间",
  tooBig: "这份学习包超出本机可以安全处理的大小，没有继续。当前作品未改变",
  warnSize: (mb: string) => `这份学习包大约 ${mb} MB，可能需要更多时间`,
  module1: "这是模块一的学习进度文件。请回到模块一使用「导入进度」恢复，再从「我的小说」下载 HTML。当前作品未改变",
  notPack: "请选择本模块保存的学习包。当前作品未改变",
  future: "这份学习包来自更新的版本，当前课堂版本还不能读取。当前作品未改变",
  wrongModule: "这不是模块二的学习包。当前作品未改变",
  saveFailed: "刚才没能保存到本机，输入还在。请先重试保存，再保存学习包",
  stale: "保存尚未完成，请重试。不能把较早的记录当成最新学习包",
  teacherImport: "讲解模式不能导入，避免覆盖学生作品",
  teacherSave: "讲解模式不能保存学习包，避免和学生作品混在一起",
  preparing: "正在准备素材…",
  packing: "正在打包…",
  downloading: "正在准备下载…",
  replaceHint: "导入后，会用学习包里的作品替换这台电脑上正在使用的作品。",
  kept: "已取消，当前作品未改变",
  restored: "已恢复学习包里的作品",
  noRecord: "还没有可保存的学习记录。请先进入课时 1。",
  importFailed: "导入未完成，当前作品保留",
  packFailed: "学习包没有生成，本机作品还在。请再试一次。",
} as const

export class CqpackError extends Error {
  readonly code: string
  readonly studentMessage: string

  constructor(code: string, studentMessage: string, diagnostic: string) {
    super(diagnostic)
    this.name = "CqpackError"
    this.code = code
    this.studentMessage = studentMessage
  }
}

export interface CqpackManifestAsset {
  id: string
  path: string
  mime: Module2ImageMime
  byteLength: number
  width: number
  height: number
  sha256: string
}

export interface CqpackManifest {
  packageType: typeof CQPACK_PACKAGE_TYPE
  version: typeof CQPACK_VERSION
  moduleId: typeof MODULE2_MODULE_ID
  exportedAt: string
  portfolioId: string
  snapshotRevision: number
  portfolio: { path: "portfolio.json"; byteLength: number; sha256: string }
  assets: CqpackManifestAsset[]
}

export interface LearningPackagePreview {
  studentName: string
  clazz: string
  classSeatCode: string
  storyTitle: string
  storyState: "已确认" | "待核对" | "还没有小说"
  progressLabel: string
  imageCount: number
  updatedAt: string
}

export function isZipSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false
  const local = bytes[2] === 0x03 && bytes[3] === 0x04
  const empty = bytes[2] === 0x05 && bytes[3] === 0x06
  return local || empty
}

/** 只接受三件套路径。穿越、反斜杠、绝对路径和大小写偏差都拒绝。 */
export function assertCqpackPath(path: string): void {
  if (path.includes("\\") || path.includes("\0")) {
    throw new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "路径含有反斜杠或空字符")
  }
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) {
    throw new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "路径是绝对路径")
  }
  if (path.split("/").some(part => part === "" || part === "." || part === "..")) {
    throw new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "路径含有空段或上级目录")
  }
  if (path !== "manifest.json" && path !== "portfolio.json" && !ASSET_PATH.test(path)) {
    throw new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "含有不允许的文件")
  }
}

export function assetExtension(mime: Module2ImageMime): "png" | "jpg" | "webp" {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "png"
}

export function mimeForAssetExtension(extension: string): Module2ImageMime | null {
  if (extension === "png") return "image/png"
  if (extension === "jpg") return "image/jpeg"
  if (extension === "webp") return "image/webp"
  return null
}

export function isSha256Hex(value: string): boolean {
  return SHA256_HEX.test(value)
}

export function sanitizeModule2PackageNamePart(value: string): string {
  let printable = ""
  for (const char of value.trim()) {
    const code = char.charCodeAt(0)
    printable += code < 32 || code === 127 ? "-" : char
  }
  const cleaned = printable
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80)
  return cleaned || "未填写"
}

/** 本地时间戳，方便学生按自己的时钟找到刚下载的文件。 */
export function buildModule2PackageFilename(studentName: string, now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
  return `模块2_${sanitizeModule2PackageNamePart(studentName)}_学习包_${stamp}.cqpack`
}

/** 未压缩体积预检。超过提醒线只警告；超过安全上限则拒绝。 */
export function assessUncompressedSize(totalBytes: number): { warning: string | null } | { rejected: string } {
  const hard = Math.min(RESOURCE_LIMITS.packageInputMaxBytes, RESOURCE_LIMITS.packageExtractedMaxBytes)
  if (totalBytes > hard) return { rejected: LEARNING_PACKAGE_MESSAGES.tooBig }
  if (totalBytes > RESOURCE_LIMITS.packageWarnBytes) {
    return { warning: LEARNING_PACKAGE_MESSAGES.warnSize((totalBytes / (1024 * 1024)).toFixed(1)) }
  }
  return { warning: null }
}

export function describeLearningPackage(portfolio: Module2PortfolioV1): LearningPackagePreview {
  const gates = computeModule2Lesson1Gates(portfolio)
  const storyTitle = portfolio.sourceSnapshot?.storyTitle.trim()
    || portfolio.sourceImportDraft?.storyTitle.trim()
    || ""
  const storyState = portfolio.sourceSnapshot ? "已确认" : portfolio.sourceImportDraft ? "待核对" : "还没有小说"
  let progressLabel = "课时 1 尚未完成"
  if (gates.completed) progressLabel = "课时 1 已完成"
  else if (gates.step3) progressLabel = "课时 1 进行到第 4 关"
  else if (gates.step2) progressLabel = "课时 1 进行到第 3 关"
  else if (gates.step1) progressLabel = "课时 1 进行到第 2 关"
  return {
    studentName: portfolio.student.studentName,
    clazz: portfolio.student.clazz,
    classSeatCode: portfolio.student.classSeatCode,
    storyTitle,
    storyState,
    progressLabel,
    imageCount: portfolio.assetIds.length,
    updatedAt: portfolio.updatedAt,
  }
}
