/**
 * 文件说明：模块 2 对旧版小说 Markdown / 纯文本的逐行解析。
 * 职责：识别身份行、唯一一级标题和四个二级分段；标签允许空格差异。出现多余、重复或说不清的标题时整篇转人工，不用一个正则把正文切错。
 * 更新触发：旧版 Markdown 身份行、分段标签或人工核对口径变化时，需要同步更新本文件。
 */

import {
  MODULE2_FOUR_PARTS,
  type FourPart,
  type StudentIdentity,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { buildNovelDraft, createManualNovelDraft, emptyNovelParts, emptyNovelStudent, novelTextLimitError } from "@/modules/module-2-ai-comic/features/source-import/novel-draft"
import type { NovelFileMeta, NovelParseResult } from "@/modules/module-2-ai-comic/features/source-import/novel-types"
import { partFromLabel } from "@/modules/module-2-ai-comic/features/source-import/part-label"

const IDENTITY_LABELS = { 班级: "clazz", 姓名: "studentName", 班学号: "classSeatCode" } as const

interface HeadingLine {
  index: number
  level: number
  text: string
}

function rejected(code: "too-large" | "unsupported", message: string): NovelParseResult {
  return { kind: "rejected", code, message }
}

function manualCandidate(
  meta: NovelFileMeta,
  student: StudentIdentity,
  storyTitle: string,
  importNote: string,
): NovelParseResult {
  const limit = novelTextLimitError(student, storyTitle, emptyNovelParts())
  if (limit) return rejected("too-large", limit)
  return {
    kind: "candidate",
    review: "manual",
    message: "这份文件的分段不够明确，需要手工填写起、承、转、合。还没有替换已确认的小说。",
    draft: createManualNovelDraft(meta, { student, storyTitle, importNote }),
  }
}

function stripExportNote(text: string): string {
  const trimmed = text.trim()
  const blocks = trimmed.split(/\n{2,}/)
  const last = blocks[blocks.length - 1]?.trim() ?? ""
  if (/^此文件(不能用来恢复学习进度|可作为模块二)/.test(last)) {
    blocks.pop()
    return blocks.join("\n\n").trim()
  }
  return trimmed
}

function readIdentity(lines: string[]): { student: StudentIdentity; clean: boolean } {
  const student = emptyNovelStudent()
  const seen = new Set<string>()
  let clean = true
  for (const line of lines) {
    if (line.trim() === "") continue
    const parsed = /^(班级|姓名|班学号)\s*[:：]\s*(.*)$/.exec(line.trim())
    if (!parsed) {
      clean = false
      continue
    }
    const key = IDENTITY_LABELS[parsed[1] as keyof typeof IDENTITY_LABELS]
    if (seen.has(key)) clean = false
    seen.add(key)
    student[key] = parsed[2] ?? ""
  }
  return { student: clean ? student : emptyNovelStudent(), clean }
}

/** 逐行扫描。结构不唯一时返回人工草稿，四段留空，不猜测正文边界。 */
export function parseNovelMarkdown(text: string, meta: NovelFileMeta): NovelParseResult {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  if (normalized.trim() === "") {
    return rejected("unsupported", "文件是空的。请使用模块一「我的小说」下载的 HTML 或 Markdown。")
  }
  const lines = normalized.split("\n")
  const headings: HeadingLine[] = []
  lines.forEach((line, index) => {
    const match = /^(#{1,6})\s*(.*?)\s*$/.exec(line)
    if (!match) return
    headings.push({ index, level: match[1].length, text: match[2] ?? "" })
  })

  const firstHeading = headings[0]?.index ?? lines.length
  const identity = readIdentity(lines.slice(0, firstHeading))
  const h1s = headings.filter(item => item.level === 1 && item.text !== "")
  const title = h1s.length === 1 ? h1s[0].text : ""
  const unclear = "分段标签重复或边界不清楚，需要人工核对接入。"

  const failManual = () => manualCandidate(meta, identity.student, title, `${unclear}${meta.filename ? `原文件：${meta.filename}` : ""}`)

  if (headings.length === 0) {
    return manualCandidate(meta, identity.student, "", "这是纯文本，不能自动分成四段，需要人工填写。")
  }
  if (!identity.clean || h1s.length !== 1 || headings.some(item => item.level !== 1 && item.level !== 2)) {
    return failManual()
  }

  const h2s = headings.filter(item => item.level === 2)
  const partOf = h2s.map(item => partFromLabel(item.text))
  if (h2s.length !== 4 || partOf.some(part => part === null)) return failManual()
  const seen = new Set<FourPart>()
  for (const part of partOf) {
    if (!part || seen.has(part)) return failManual()
    seen.add(part)
  }
  if (seen.size !== MODULE2_FOUR_PARTS.length) return failManual()

  const parts = emptyNovelParts()
  h2s.forEach((heading, position) => {
    const part = partOf[position]
    if (!part) return
    const next = headings.find(item => item.index > heading.index)
    const bodyLines = lines.slice(heading.index + 1, next ? next.index : lines.length)
    parts[part] = stripExportNote(bodyLines.join("\n"))
  })

  const limit = novelTextLimitError(identity.student, title, parts)
  if (limit) return rejected("too-large", limit)
  return {
    kind: "candidate",
    review: "extracted",
    message: "已读出小说，请核对后再确认。还没有替换已确认的小说。",
    draft: buildNovelDraft(meta, {
      origin: "classquest-md-legacy",
      sourceConfirmedAt: null,
      student: identity.student,
      storyTitle: title,
      parts,
    }),
  }
}
