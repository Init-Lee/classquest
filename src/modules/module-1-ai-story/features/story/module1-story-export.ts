/**
 * 文件说明：模块 1 小说页整篇作品导出。
 * 职责：用上次确认的题目和四段，加上档案里已有的身份，生成 TXT、Markdown 和先转义再排版的独立 HTML；文件名用小说标题。HTML 另含唯一的小说数据块和稳定选择器，供模块二把整篇作品当小说素材读取。这不是课卡阶段快照，也不能恢复模块一学习进度。
 * 更新触发：导出格式、身份抬头、课时分段、HTML 转义、数据块字段、isTeachingSample 参数、文件名清洗或页脚说明变化时，需要同步更新本文件。
 */

import { MODULE1_LESSON6_NOVEL_UI } from "@/modules/module-1-ai-story/constants/lesson6-copy"
import type {
  Module1Lesson6ConfirmedEdition,
  Module1StudentProfile,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1ConfirmedStoryParts,
} from "@/modules/module-1-ai-story/features/story/module1-story-access"
import type { Module1StoryReadingPart } from "@/modules/module-1-ai-story/features/story/Module1StoryReading"

/** TXT 与 Markdown 页脚。这两种文件不能恢复进度，也不作为模块二的主入口。 */
export const MODULE1_STORY_EXPORT_NOTE = "此文件不能用来恢复学习进度。换设备请用「下载 JSON 存档」。"

/** HTML 页脚：可以交给模块二当小说素材，但不能恢复模块一进度。按钮名称保持「下载JSON存档」。 */
export const MODULE1_STORY_HTML_EXPORT_NOTE = "此文件可作为模块二小说素材导入，不能恢复模块一学习进度。恢复学习进度请继续使用「下载JSON存档」。"

export const MODULE1_NOVEL_DOCUMENT_TYPE = "classquest-novel"
export const MODULE1_NOVEL_DOCUMENT_VERSION = 1
export const MODULE1_NOVEL_SOURCE_MODULE_ID = "module-1-ai-story"
export const MODULE1_NOVEL_DATA_SCRIPT_ID = "classquest-story-data"

export interface Module1StoryHtmlOptions {
  /** 教师讲解模式导出为 true；学生导出必须显式传 false。不能靠姓名是否含「演示」推断。 */
  isTeachingSample: boolean
}

export type Module1StoryExportFormat = "txt" | "markdown" | "html"

const IDENTITY_FIELDS = [
  ["班级", "clazz"],
  ["姓名", "studentName"],
  ["班学号", "classSeatCode"],
] as const

export function sanitizeModule1StoryFilenamePart(value: string, emptyLabel: string): string {
  const cleaned = value.trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "")
  return cleaned || emptyLabel
}

export function buildModule1StoryExportFilename(
  studentName: string,
  storyTitle: string,
  extension: "txt" | "md" | "html",
  now = new Date(),
): string {
  const name = sanitizeModule1StoryFilenamePart(studentName, "未填写")
  const title = sanitizeModule1StoryFilenamePart(storyTitle, "未命名")
  const date = now.toISOString().slice(0, 10)
  return `模块1_${name}_${title}_${date}.${extension}`
}

export function buildModule1StoryIdentityLines(student: Module1StudentProfile): string[] {
  return IDENTITY_FIELDS.flatMap(([label, key]) => {
    const value = student[key].trim()
    return value ? [`${label}：${value}`] : []
  })
}

function storyHeading(title: string): string {
  return title.trim() || MODULE1_LESSON6_NOVEL_UI.noTitle
}

function storyParts(edition: Module1Lesson6ConfirmedEdition): Module1StoryReadingPart[] {
  return buildModule1ConfirmedStoryParts(edition)
}

export function buildModule1StoryTxt(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
): string {
  const identity = buildModule1StoryIdentityLines(student).join("\n")
  const sections = storyParts(edition).map(part => `${part.label}\n${part.text}`).join("\n\n")
  return [identity, storyHeading(edition.storyTitle), sections, MODULE1_STORY_EXPORT_NOTE]
    .filter(Boolean)
    .join("\n\n")
}

export function buildModule1StoryMarkdown(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
): string {
  const identity = buildModule1StoryIdentityLines(student).join("\n")
  const sections = storyParts(edition).map(part => `## ${part.label}\n\n${part.text}`).join("\n\n")
  return [identity, `# ${storyHeading(edition.storyTitle)}`, sections, MODULE1_STORY_EXPORT_NOTE]
    .filter(Boolean)
    .join("\n\n")
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function textToHtml(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>\n")
}

/** 嵌进 script 时把 `<` 写成 JSON unicode 转义，避免正文里的 `</script>` 截断数据块。 */
export function embedModule1NovelJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

function novelPayload(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
  isTeachingSample: boolean,
) {
  return {
    documentType: MODULE1_NOVEL_DOCUMENT_TYPE,
    version: MODULE1_NOVEL_DOCUMENT_VERSION,
    sourceModuleId: MODULE1_NOVEL_SOURCE_MODULE_ID,
    student: {
      clazz: student.clazz.trim(),
      studentName: student.studentName.trim(),
      classSeatCode: student.classSeatCode.trim(),
    },
    confirmedEdition: {
      confirmedAt: edition.confirmedAt,
      storyTitle: edition.storyTitle,
      openingText: edition.openingText,
      developmentText: edition.developmentText,
      turnText: edition.turnText,
      endingText: edition.endingText,
    },
    isTeachingSample,
  }
}

export function buildModule1StoryHtml(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
  options: Module1StoryHtmlOptions,
): string {
  const heading = storyHeading(edition.storyTitle)
  const identity = buildModule1StoryIdentityLines(student)
    .map(line => `<p>${textToHtml(line)}</p>`)
    .join("\n")
  const sections = storyParts(edition).map(part => `<section data-cq-part="${part.id}">
      <p class="label">${textToHtml(part.label)}</p>
      <p class="text">${textToHtml(part.text)}</p>
    </section>`).join("\n")
  const data = embedModule1NovelJson(novelPayload(student, edition, options.isTeachingSample))
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${textToHtml(heading)}</title>
  <style>
    body { margin: 0 auto; max-width: 720px; padding: 32px 20px 48px; font-family: "Noto Sans SC", "PingFang SC", sans-serif; line-height: 1.8; color: #172033; }
    h1 { text-align: center; font-size: 28px; }
    .identity { color: #475467; }
    section { margin: 24px 0; border-left: 3px solid #0f766e; padding-left: 12px; }
    .label { margin: 0 0 4px; font-size: 12px; color: #667085; }
    .text { margin: 0; }
    footer { margin-top: 32px; font-size: 13px; color: #667085; }
  </style>
</head>
<body>
  <div class="identity">
    ${identity}
  </div>
  <h1 data-cq-story-title>${textToHtml(edition.storyTitle)}</h1>
  ${sections}
  <footer>${textToHtml(MODULE1_STORY_HTML_EXPORT_NOTE)}</footer>
  <script id="${MODULE1_NOVEL_DATA_SCRIPT_ID}" type="application/json">${data}</script>
</body>
</html>`
}

export function buildModule1StoryExport(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
  format: Module1StoryExportFormat,
  now = new Date(),
  options: Module1StoryHtmlOptions = { isTeachingSample: false },
): { filename: string; content: string; mime: string } {
  const extension = format === "markdown" ? "md" : format
  const content = format === "txt"
    ? buildModule1StoryTxt(student, edition)
    : format === "markdown"
      ? buildModule1StoryMarkdown(student, edition)
      : buildModule1StoryHtml(student, edition, options)
  const mime = format === "html"
    ? "text/html;charset=utf-8"
    : format === "markdown"
      ? "text/markdown;charset=utf-8"
      : "text/plain;charset=utf-8"
  return {
    filename: buildModule1StoryExportFilename(student.studentName, edition.storyTitle, extension, now),
    content,
    mime,
  }
}

export function downloadModule1StoryExport(file: { filename: string; content: string; mime: string }): void {
  const blob = new Blob([file.content], { type: file.mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = file.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
