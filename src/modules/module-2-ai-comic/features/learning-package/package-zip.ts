/**
 * 文件说明：模块 2 学习包的 ZIP 打包与流式解压。
 * 职责：用 fflate 把清单和档案做 DEFLATE、图片做 STORE；解压时累计实际输出字节并在超限时停止。不信任目录里声明的大小。
 * 更新触发：压缩方式、路径校验、解压限额或 fflate 的调用方式变化时，需要同步更新本文件。打包和解压的浏览器入口在 pack.worker.ts。
 */

import { strToU8, Unzip, UnzipInflate, UnzipPassThrough, zipSync } from "fflate"
import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import {
  assertCqpackPath,
  CqpackError,
  isZipSignature,
  LEARNING_PACKAGE_MESSAGES,
} from "@/modules/module-2-ai-comic/features/learning-package/package-contract"

export interface ZipFileInput {
  path: string
  bytes: Uint8Array
  /** 图片为 true（不再压缩）；清单和档案为 false。 */
  store: boolean
}

export interface UnzipLimits {
  packageInputMaxBytes: number
  packageExtractedMaxBytes: number
  packageMaxEntries: number
}

export function defaultUnzipLimits(): UnzipLimits {
  return {
    packageInputMaxBytes: RESOURCE_LIMITS.packageInputMaxBytes,
    packageExtractedMaxBytes: RESOURCE_LIMITS.packageExtractedMaxBytes,
    packageMaxEntries: RESOURCE_LIMITS.packageMaxEntries,
  }
}

export function zipCqpack(files: ZipFileInput[]): Uint8Array {
  const input: Record<string, [Uint8Array, { level: 0 | 6 }]> = {}
  for (const file of files) {
    assertCqpackPath(file.path)
    if (Object.prototype.hasOwnProperty.call(input, file.path)) {
      throw new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "准备打包时发现重复路径")
    }
    input[file.path] = [file.bytes, { level: file.store ? 0 : 6 }]
  }
  return zipSync(input)
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/**
 * 流式解压。每收到一块就计入实际字节；超限、坏路径或重复路径立即停止，不保留半份内容。
 */
export function unzipCqpack(bytes: Uint8Array, limits: UnzipLimits = defaultUnzipLimits()): { path: string; bytes: Uint8Array }[] {
  if (!isZipSignature(bytes)) {
    throw new CqpackError("not-zip", LEARNING_PACKAGE_MESSAGES.notPack, "文件开头不是压缩包签名")
  }
  if (bytes.byteLength > limits.packageInputMaxBytes) {
    throw new CqpackError("too-large", LEARNING_PACKAGE_MESSAGES.tooBig, "压缩包本身超过可以读入的大小")
  }

  let failed: CqpackError | null = null
  let extracted = 0
  let entries = 0
  const pending = new Map<string, { chunks: Uint8Array[]; done: boolean }>()
  const unzipper = new Unzip()
  unzipper.register(UnzipInflate)
  unzipper.register(UnzipPassThrough)

  unzipper.onfile = (file) => {
    if (failed) {
      try { file.terminate() } catch { /* 已经停了 */ }
      return
    }
    entries += 1
    const fail = (error: CqpackError) => {
      failed = error
      try { file.terminate() } catch { /* 已经停了 */ }
    }
    if (entries > limits.packageMaxEntries) {
      fail(new CqpackError("too-large", LEARNING_PACKAGE_MESSAGES.tooBig, "文件个数超过可以处理的上限"))
      return
    }
    try {
      assertCqpackPath(file.name)
    } catch (error) {
      fail(error instanceof CqpackError
        ? error
        : new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "路径不被允许"))
      return
    }
    if (pending.has(file.name)) {
      fail(new CqpackError("bad-path", LEARNING_PACKAGE_MESSAGES.incomplete, "有重复的文件"))
      return
    }
    const record = { chunks: [] as Uint8Array[], done: false }
    pending.set(file.name, record)
    file.ondata = (error, data, final) => {
      if (failed) return
      if (error) {
        fail(new CqpackError("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, error.message))
        return
      }
      extracted += data.length
      if (extracted > limits.packageExtractedMaxBytes) {
        fail(new CqpackError("too-large", LEARNING_PACKAGE_MESSAGES.tooBig, "解压后的内容超过可以安全处理的大小"))
        return
      }
      if (data.length) record.chunks.push(data.slice())
      if (final) record.done = true
    }
    try {
      file.start()
    } catch (error) {
      fail(new CqpackError("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, error instanceof Error ? error.message : "无法读取压缩内容"))
    }
  }

  try {
    unzipper.push(bytes, true)
  } catch (error) {
    if (!failed) {
      failed = new CqpackError("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, error instanceof Error ? error.message : "无法读取学习包")
    }
  }
  if (failed) throw failed

  const files: { path: string; bytes: Uint8Array }[] = []
  for (const [path, record] of pending) {
    if (!record.done) {
      throw new CqpackError("corrupt", LEARNING_PACKAGE_MESSAGES.incomplete, "有文件没有读完")
    }
    files.push({ path, bytes: concatChunks(record.chunks) })
  }
  return files
}

/** 供测试确认 JSON 与图片使用了不同的压缩方式。 */
export function zipLocalCompressionMethods(bytes: Uint8Array): { name: string; method: number }[] {
  const methods: { name: string; method: number }[] = []
  let offset = 0
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  while (offset + 30 <= bytes.byteLength) {
    if (view.getUint32(offset) !== 0x504b0304) break
    const method = view.getUint16(offset + 8, true)
    const compressed = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLength))
    methods.push({ name, method })
    offset += 30 + nameLength + extraLength + compressed
  }
  return methods
}

export function utf8Bytes(value: string): Uint8Array {
  return strToU8(value)
}
