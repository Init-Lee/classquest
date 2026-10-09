/**
 * 文件说明：模块 1 小说页整篇作品导出。
 * 职责：用上次确认的题目和四段，加上档案里已有的身份，生成 TXT、Markdown 和先转义再排版的独立 HTML；文件名用小说标题。这是整篇作品，不是课卡阶段快照，也不能导入恢复进度。
 * 更新触发：导出格式、身份抬头、课时分段、HTML 转义、文件名清洗或「不能导入」说明变化时，需要同步更新本文件。
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

export const MODULE1_STORY_EXPORT_NOTE = "此文件不能用来恢复学习进度。换设备请用「下载 JSON 存档」。"

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

export function buildModule1StoryHtml(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
): string {
  const heading = storyHeading(edition.storyTitle)
  const identity = buildModule1StoryIdentityLines(student)
    .map(line => `<p>${textToHtml(line)}</p>`)
    .join("\n")
  const sections = storyParts(edition).map(part => `<section>
      <p class="label">${textToHtml(part.label)}</p>
      <p class="text">${textToHtml(part.text)}</p>
    </section>`).join("\n")
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
  <h1>${textToHtml(heading)}</h1>
  ${sections}
  <footer>${textToHtml(MODULE1_STORY_EXPORT_NOTE)}</footer>
</body>
</html>`
}

export function buildModule1StoryExport(
  student: Module1StudentProfile,
  edition: Module1Lesson6ConfirmedEdition,
  format: Module1StoryExportFormat,
  now = new Date(),
): { filename: string; content: string; mime: string } {
  const extension = format === "markdown" ? "md" : format
  const content = format === "txt"
    ? buildModule1StoryTxt(student, edition)
    : format === "markdown"
      ? buildModule1StoryMarkdown(student, edition)
      : buildModule1StoryHtml(student, edition)
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
