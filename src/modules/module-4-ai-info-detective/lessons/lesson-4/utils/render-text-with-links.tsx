/**
 * 文件说明：课时 4 互审文案中的 URL 渲染工具。
 * 职责：将纯文本中的 http(s) 链接渲染为可点击超链接，避免在题卡解析区整段展示长 URL。
 * 更新触发：链接识别规则、锚文案策略或互审预览/反馈面板展示方式变化时，需要同步更新本文件。
 */

import type { ReactNode } from "react"

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi

function linkLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return host || "打开链接"
  } catch {
    return "打开链接"
  }
}

/** 将一段文本中的 URL 转为 `<a>`，其余保持原文。 */
export function renderTextWithLinks(text: string): ReactNode {
  if (!text.trim()) return text

  const parts: ReactNode[] = []
  let lastIndex = 0
  const matches = text.matchAll(URL_PATTERN)

  for (const match of matches) {
    const url = match[0]
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    parts.push(
      <a
        key={`${index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2"
      >
        {linkLabel(url)}
      </a>,
    )
    lastIndex = index + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}
