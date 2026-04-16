/**
 * 文件说明：课时6「海报路演讲解路径单」导出
 * 职责：生成纯文本与 JSON 结构，供第2关复制/下载；与预案第九章格式一致
 * 更新触发：Lesson6State 字段、导出文件名规则或 JSON 结构变更时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"
import { getPortfolioGroupDisplayLabel } from "@/shared/utils/group-display"

/** 主题包展示：优先当前学生 R1，否则首条成员 R1 */
export function getThemePackLabel(portfolio: ModulePortfolio): string {
  const members = portfolio.lesson1.r1ByMember ?? []
  const name = portfolio.student.studentName.trim()
  const mine = name ? members.find(r => r.author.trim() === name) : undefined
  return mine?.themePack ?? members[0]?.themePack ?? "—"
}

/** 构建纯文本（复制到剪贴板） */
export function buildLesson6PathText(portfolio: ModulePortfolio): string {
  const { student, lesson6 } = portfolio
  const groupLine = getPortfolioGroupDisplayLabel(portfolio)
  const theme = getThemePackLabel(portfolio)

  const lines: string[] = [
    "海报路演讲解路径单",
    `班级：${student.clazz || "—"}`,
    `小组：${groupLine}`,
    `主题包：${theme}`,
    "",
  ]

  for (const row of lesson6.roadshowSteps) {
    lines.push(`【第${row.step}步 ${row.name}】`)
    lines.push(`海报位置：${row.posterArea.trim() || "—"}`)
    lines.push(`必说句：${row.mustSay.trim() || "—"}`)
    lines.push(`可展开点：${row.expand.trim() || "—"}`)
    lines.push("")
  }

  lines.push("最容易被追问的问题：" + (lesson6.challengeQuestion.trim() || "—"))
  lines.push("我们回到哪条证据：" + (lesson6.evidenceBack.trim() || "—"))
  lines.push("最后一句收束话：" + (lesson6.closingSentence.trim() || "—"))

  return lines.join("\n")
}

/** JSON 导出对象（与预案 9.2 一致） */
export function buildLesson6PathJsonPayload(portfolio: ModulePortfolio): Record<string, unknown> {
  const { student, lesson6 } = portfolio
  return {
    packageType: "poster-roadshow-path-v1",
    basic: {
      clazz: student.clazz ?? "",
      groupName: getPortfolioGroupDisplayLabel(portfolio),
      themePack: getThemePackLabel(portfolio),
    },
    steps: lesson6.roadshowSteps.map(r => ({
      step: r.step,
      name: r.name,
      posterArea: r.posterArea,
      mustSay: r.mustSay,
      expand: r.expand,
    })),
    challenge: {
      question: lesson6.challengeQuestion,
      evidenceBack: lesson6.evidenceBack,
      closing: lesson6.closingSentence,
    },
    exportedAt: new Date().toISOString(),
  }
}

/** 触发下载 JSON 文件 */
export function downloadLesson6PathJson(portfolio: ModulePortfolio): void {
  const payload = buildLesson6PathJsonPayload(portfolio)
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const clazz = (portfolio.student.clazz ?? "").replace(/[/\\?%*:|"<>]/g, "_")
  const group = getPortfolioGroupDisplayLabel(portfolio).replace(/[/\\?%*:|"<>]/g, "_")
  const filename = `${clazz}_${group}_海报路演讲解路径单_v1.json`
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
