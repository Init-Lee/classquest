/**
 * 文件说明：模块 2 对小说 HTML 的字符串解析。
 * 职责：读取新版数据块并与可见正文比对；没有数据块时按旧版身份、标题和四段结构提取。元数据损坏、版本不符、正文矛盾或重复数据块时直接失败，不降级成旧 HTML。
 * 更新触发：模块一 HTML 数据块字段、旧版小说排版、阶段快照识别或失败口径变化时，需要同步更新本文件。
 */

import {
  MODULE2_FOUR_PARTS,
  type FourPart,
  type StudentIdentity,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { hasHtmlAttr, htmlFragmentToPlain, readHtmlAttr } from "@/modules/module-2-ai-comic/features/source-import/html-plain"
import { buildNovelDraft, emptyNovelStudent, novelTextLimitError } from "@/modules/module-2-ai-comic/features/source-import/novel-draft"
import type { NovelFileMeta, NovelParseResult, NovelRejectCode } from "@/modules/module-2-ai-comic/features/source-import/novel-types"
import { partFromLabel } from "@/modules/module-2-ai-comic/features/source-import/part-label"

const DATA_SCRIPT_ID = "classquest-story-data"
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/

const PART_FIELDS = {
  opening: "openingText",
  development: "developmentText",
  turn: "turnText",
  ending: "endingText",
} as const

function rejected(code: NovelRejectCode, message: string): NovelParseResult {
  return { kind: "rejected", code, message }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function own(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined
}

function sameNovelText(left: string, right: string): boolean {
  const norm = (value: string) => value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return norm(left) === norm(right)
}

interface DataScript {
  attrs: string
  body: string
}

function findDataScripts(html: string): DataScript[] {
  const found: DataScript[] = []
  const opener = /<script\b([^>]*)>/gi
  let match: RegExpExecArray | null
  while ((match = opener.exec(html))) {
    const attrs = match[1] ?? ""
    if (readHtmlAttr(attrs, "id") !== DATA_SCRIPT_ID) continue
    const bodyStart = match.index + match[0].length
    const close = html.toLowerCase().indexOf("</script>", bodyStart)
    found.push({ attrs, body: close === -1 ? html.slice(bodyStart) : html.slice(bodyStart, close) })
    if (close !== -1) opener.lastIndex = close + "</script>".length
  }
  return found
}

function paragraphByClass(inner: string, className: string): string | null {
  const blocks: string[] = []
  const re = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(inner))) {
    const classValue = readHtmlAttr(match[1] ?? "", "class")
    if (!classValue?.split(/\s+/).includes(className)) continue
    blocks.push(htmlFragmentToPlain(match[2] ?? ""))
  }
  if (blocks.length !== 1) return null
  return blocks[0]
}

function readVisibleIdentity(html: string): StudentIdentity | null {
  const blocks: string[] = []
  const re = /<div\b([^>]*)>([\s\S]*?)<\/div>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const classValue = readHtmlAttr(match[1] ?? "", "class")
    if (!classValue?.split(/\s+/).includes("identity")) continue
    blocks.push(match[2] ?? "")
  }
  if (blocks.length !== 1) return null
  const student = emptyNovelStudent()
  const labels = { 班级: "clazz", 姓名: "studentName", 班学号: "classSeatCode" } as const
  const seen = new Set<string>()
  for (const item of blocks[0].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const line = htmlFragmentToPlain(item[1] ?? "").trim()
    const parsed = /^(班级|姓名|班学号)\s*[:：]\s*(.*)$/.exec(line)
    if (!parsed) continue
    const key = labels[parsed[1] as keyof typeof labels]
    if (seen.has(key)) return null
    seen.add(key)
    student[key] = parsed[2] ?? ""
  }
  return student
}

function readSingleH1(html: string, requireMarker: boolean): string | null | undefined {
  const titles: string[] = []
  const re = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const attrs = match[1] ?? ""
    if (requireMarker && !hasHtmlAttr(attrs, "data-cq-story-title")) continue
    titles.push(htmlFragmentToPlain(match[2] ?? ""))
  }
  if (titles.length !== 1) return undefined
  return titles[0]
}

function finishExtracted(
  meta: NovelFileMeta,
  input: Parameters<typeof buildNovelDraft>[1],
  message: string,
): NovelParseResult {
  const limit = novelTextLimitError(input.student, input.storyTitle, input.parts)
  if (limit) return rejected("too-large", limit)
  return {
    kind: "candidate",
    review: "extracted",
    message,
    draft: buildNovelDraft(meta, input),
  }
}

function parseNewHtml(html: string, scripts: DataScript[], meta: NovelFileMeta): NovelParseResult {
  if (scripts.length !== 1) {
    return rejected("duplicate-data-block", "这份 HTML 里有多段小说记录，无法确定用哪一份。请重新从模块一「我的小说」下载。")
  }
  const script = scripts[0]
  const type = readHtmlAttr(script.attrs, "type")
  if (type !== "application/json") {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  let raw: unknown
  try {
    raw = JSON.parse(script.body)
  } catch {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  if (!isRecord(raw)) {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  if (own(raw, "documentType") !== "classquest-novel" || own(raw, "sourceModuleId") !== "module-1-ai-story") {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  const version = own(raw, "version")
  if (version !== 1) {
    if (typeof version === "number" && version > 1) {
      return rejected("version-unsupported", "这份小说文件来自更新的导出格式，当前课堂版本还不能读取。请用现在的模块一重新下载 HTML。")
    }
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  const studentRaw = own(raw, "student")
  const editionRaw = own(raw, "confirmedEdition")
  const teachingFlag = own(raw, "isTeachingSample")
  if (!isRecord(studentRaw) || !isRecord(editionRaw) || typeof teachingFlag !== "boolean") {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  const student = emptyNovelStudent()
  for (const key of ["clazz", "studentName", "classSeatCode"] as const) {
    const value = own(studentRaw, key)
    if (typeof value !== "string") {
      return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
    }
    student[key] = value
  }
  const confirmedAt = own(editionRaw, "confirmedAt")
  const storyTitle = own(editionRaw, "storyTitle")
  if (typeof confirmedAt !== "string" || !ISO_DATE.test(confirmedAt) || Number.isNaN(Date.parse(confirmedAt))) {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  if (typeof storyTitle !== "string") {
    return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  const parts = {} as Record<FourPart, string>
  for (const part of MODULE2_FOUR_PARTS) {
    const value = own(editionRaw, PART_FIELDS[part])
    if (typeof value !== "string") {
      return rejected("metadata-invalid", "小说记录的格式已损坏。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
    }
    parts[part] = value
  }

  const visibleTitle = readSingleH1(html, true)
  const visibleIdentity = readVisibleIdentity(html)
  const visibleParts = {} as Record<FourPart, string>
  const seen = new Set<FourPart>()
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi
  let section: RegExpExecArray | null
  let sectionOk = true
  while ((section = re.exec(html))) {
    const partName = readHtmlAttr(section[1] ?? "", "data-cq-part")
    if (!partName) continue
    if (!MODULE2_FOUR_PARTS.includes(partName as FourPart) || seen.has(partName as FourPart)) {
      sectionOk = false
      break
    }
    const text = paragraphByClass(section[2] ?? "", "text")
    if (text === null) {
      sectionOk = false
      break
    }
    seen.add(partName as FourPart)
    visibleParts[partName as FourPart] = text
  }
  const identityMatches = visibleIdentity
    && (["clazz", "studentName", "classSeatCode"] as const).every(key => visibleIdentity[key] === student[key].trim())
  const textMatches = typeof visibleTitle === "string"
    && sameNovelText(visibleTitle, storyTitle)
    && sectionOk
    && seen.size === MODULE2_FOUR_PARTS.length
    && MODULE2_FOUR_PARTS.every(part => sameNovelText(visibleParts[part], parts[part]))
  if (!identityMatches || !textMatches) {
    return rejected("visible-mismatch", "文件里的隐藏记录和页面上的小说正文不一致。请回到模块一「我的小说」重新下载 HTML，不要手工修改这个文件。")
  }
  return finishExtracted(meta, {
    origin: "classquest-html-v1",
    sourceConfirmedAt: confirmedAt,
    student,
    storyTitle,
    parts,
    explicitTeachingSample: teachingFlag,
  }, "已读出小说，请核对后再确认。还没有替换已确认的小说。")
}

function parseLegacyHtml(html: string, meta: NovelFileMeta): NovelParseResult {
  const student = readVisibleIdentity(html)
  const title = readSingleH1(html, false)
  const parts = {} as Record<FourPart, string>
  const seen = new Set<FourPart>()
  let sections = 0
  let shapeOk = Boolean(student) && title !== undefined
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi
  let section: RegExpExecArray | null
  while (shapeOk && (section = re.exec(html))) {
    sections += 1
    const label = paragraphByClass(section[2] ?? "", "label")
    const text = paragraphByClass(section[2] ?? "", "text")
    const part = label === null ? null : partFromLabel(label)
    if (!part || text === null || seen.has(part)) {
      shapeOk = false
      break
    }
    seen.add(part)
    parts[part] = text.trim()
  }
  if (!shapeOk || sections !== 4 || seen.size !== 4 || typeof title !== "string" || !student) {
    if (html.includes("阶段快照")) {
      return rejected("stage-snapshot", "这是模块一的阶段快照，不是整篇小说。请到模块一「我的小说」下载 HTML，再导入到这里。")
    }
    return rejected("unsupported", "这个文件还不能当作小说读入。请使用模块一「我的小说」下载的 HTML 或 Markdown。")
  }
  return finishExtracted(meta, {
    origin: "classquest-html-legacy",
    sourceConfirmedAt: null,
    student,
    storyTitle: title.trim(),
    parts,
  }, "已读出小说，请核对后再确认。还没有替换已确认的小说。")
}

/** 解析整篇 HTML。找不到小说结构时返回拒绝，不猜测四段。 */
export function parseNovelHtml(html: string, meta: NovelFileMeta): NovelParseResult {
  const scripts = findDataScripts(html)
  if (scripts.length > 0) return parseNewHtml(html, scripts, meta)
  return parseLegacyHtml(html, meta)
}
