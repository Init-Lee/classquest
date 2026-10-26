/**
 * 文件说明：模块 2 小说文件入口。
 * 职责：按体积预检后识别新 HTML、旧 HTML、旧 Markdown、人工纯文本、阶段快照和模块一学习进度文件；只产出候选草稿，不改档案。
 * 更新触发：可接受的小说格式、拒绝指引或文件大小上限变化时，需要同步更新本文件。
 */

import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import { sha256Hex } from "@/modules/module-2-ai-comic/features/assets/sha256"
import { parseNovelHtml } from "@/modules/module-2-ai-comic/features/source-import/parse-novel-html"
import { parseNovelMarkdown } from "@/modules/module-2-ai-comic/features/source-import/parse-novel-markdown"
import type { NovelFileMeta, NovelParseResult, NovelRejectCode } from "@/modules/module-2-ai-comic/features/source-import/novel-types"

function rejected(code: NovelRejectCode, message: string): NovelParseResult {
  return { kind: "rejected", code, message }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function own(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined
}

export function safeNovelFilename(filename: string | null): string | null {
  if (!filename) return null
  const base = filename.split(/[/\\]/).pop()?.replace(/\0/g, "").trim() ?? ""
  if (!base || base === "." || base === "..") return null
  return base.slice(0, 255)
}

function looksLikeHtml(text: string): boolean {
  const head = text.trimStart().slice(0, 800).toLowerCase()
  return head.startsWith("<!doctype")
    || head.startsWith("<html")
    || head.startsWith("<body")
    || /<(div|section|h1|p|script)\b/i.test(head)
}

/** 模块一进度文件和裸记录给出操作指引，不当成小说正文。解析失败返回 null，交给后面的文本解析。 */
function guideFromJson(text: string): NovelParseResult | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (!isRecord(raw)) {
    return rejected("unsupported", "这个文件还不能当作小说读入。请使用模块一「我的小说」下载的 HTML 或 Markdown。")
  }
  const packageType = own(raw, "packageType")
  if (packageType === "classquest-module1-continue-package") {
    return rejected("module1-package", "这是模块一的学习进度文件。请回到模块一使用「导入进度」恢复，再从「我的小说」下载 HTML。当前作品不会被改掉。")
  }
  if (packageType === "classquest-module2-learning-package") {
    return rejected("module2-package", "这是模块二的学习包，不是小说文件。请使用右上角「导入学习包」。当前作品不会被改掉。")
  }
  if (own(raw, "documentType") === "classquest-novel") {
    return rejected("unsupported", "请使用模块一「我的小说」下载的 HTML 文件，不要只保存其中的记录。")
  }
  return rejected("unsupported", "这个文件还不能当作小说读入。请使用模块一「我的小说」下载的 HTML 或 Markdown。")
}

/**
 * 读取小说字节。结果只是候选；要写入档案请再调用 stageNovelCandidate。
 * 不执行文件里的脚本，也不因为图片或链接发出请求。
 */
export async function parseNovelSource(input: {
  bytes: Uint8Array
  filename: string | null
  importedAt: string
}): Promise<NovelParseResult> {
  if (input.bytes.byteLength > RESOURCE_LIMITS.novelFileMaxBytes) {
    return rejected("too-large", "这个文件太大，无法读入。请使用模块一「我的小说」下载的 HTML 或 Markdown。")
  }
  let text: string
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes)
  } catch {
    return rejected("undecodable", "文件编码无法读取。请使用模块一「我的小说」下载的 HTML 或 Markdown。")
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const meta: NovelFileMeta = {
    filename: safeNovelFilename(input.filename),
    importedAt: input.importedAt,
    sourceFileSha256: await sha256Hex(input.bytes),
  }
  const trimmed = text.trim()
  if (trimmed.startsWith("{")) {
    const guided = guideFromJson(trimmed)
    if (guided) return guided
  }
  if (text.includes("classquest-story-data") || looksLikeHtml(text)) return parseNovelHtml(text, meta)
  return parseNovelMarkdown(text, meta)
}
