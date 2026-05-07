/**
 * 文件说明：模块 4 继续学习包序列化工具。
 * 职责：将 Module4Portfolio 导出为学生可携带的 JSON 文件，并解析导入文件恢复本地学习状态。
 * 更新触发：Module4Portfolio 结构、继续学习包版本或文件命名规则变化时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { normalizeModule4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export interface Module4ContinuePackage {
  packageType: "classquest-module4-continue-package"
  version: 1
  exportedAt: string
  portfolio: Module4Portfolio
}

function safeFilenamePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "未填写"
}

function progressFilenamePart(portfolio: Module4Portfolio): string {
  if (portfolio.lesson1.completed) return "课时1已完成"
  return `课时${portfolio.progress.lessonId}第${portfolio.progress.stepId}关`
}

export function buildModule4ContinuePackage(portfolio: Module4Portfolio): Module4ContinuePackage {
  return {
    packageType: "classquest-module4-continue-package",
    version: 1,
    exportedAt: new Date().toISOString(),
    portfolio: normalizeModule4Portfolio(portfolio),
  }
}

export function buildModule4ContinuePackageFilename(portfolio: Module4Portfolio): string {
  const date = new Date().toISOString().slice(0, 10)
  const name = safeFilenamePart(portfolio.student.studentName || "未登记")
  const progress = safeFilenamePart(progressFilenamePart(portfolio))
  return `模块4_${name}_${progress}_${date}.json`
}

export function downloadModule4ContinuePackage(portfolio: Module4Portfolio): void {
  const payload = buildModule4ContinuePackage(portfolio)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = buildModule4ContinuePackageFilename(portfolio)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function deserializeModule4ContinuePackage(file: File): Promise<Module4Portfolio> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("文件内容无法解析，请选择模块四继续学习包。")
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("文件内容为空，请重新选择继续学习包。")
  }

  const payload = raw as Partial<Module4ContinuePackage>
  if (payload.packageType !== "classquest-module4-continue-package" || !payload.portfolio) {
    throw new Error("文件类型不匹配，请选择模块四继续学习包。")
  }

  return normalizeModule4Portfolio(payload.portfolio)
}
