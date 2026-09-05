/**
 * 文件说明：模块 1 继续学习包序列化器。
 * 职责：构建、命名、下载和严格解析 version 1 学习包；所有校验完成前不写入当前档案。
 * 更新触发：学习包类型、版本、体积限制、校验规则、阶段快照拒绝或文件命名口径变化时，需要同步更新本文件。
 */

import {
  MODULE1_ID,
  normalizeModule1Portfolio,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { resolveModule1PortfolioPointer } from "@/modules/module-1-ai-story/app/lesson-registry"
import { validateModule1ClassSeatCode } from "@/modules/module-1-ai-story/constants/class-options"

export const MODULE1_CONTINUE_PACKAGE_TYPE = "classquest-module1-continue-package"
export const MODULE1_CONTINUE_PACKAGE_VERSION = 1
export const MODULE1_CONTINUE_PACKAGE_MAX_BYTES = 2 * 1024 * 1024

export interface Module1ContinuePackage {
  packageType: typeof MODULE1_CONTINUE_PACKAGE_TYPE
  version: typeof MODULE1_CONTINUE_PACKAGE_VERSION
  exportedAt: string
  portfolio: Module1Portfolio
}

export interface ParsedModule1ContinuePackage {
  portfolio: Module1Portfolio
  exportedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeFilenamePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "未填写"
}

function normalizeAndRepair(portfolio: unknown): Module1Portfolio {
  const normalized = normalizeModule1Portfolio(portfolio)
  return { ...normalized, progress: resolveModule1PortfolioPointer(normalized) }
}

export function buildModule1ContinuePackage(portfolio: Module1Portfolio): Module1ContinuePackage {
  return {
    packageType: MODULE1_CONTINUE_PACKAGE_TYPE,
    version: MODULE1_CONTINUE_PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    portfolio: normalizeAndRepair(portfolio),
  }
}

export function buildModule1ContinuePackageFilename(portfolio: Module1Portfolio): string {
  const pointer = resolveModule1PortfolioPointer(portfolio)
  return `模块1_${safeFilenamePart(portfolio.student.studentName)}_课时${pointer.lessonId}第${pointer.stepId}关_${new Date().toISOString().slice(0, 10)}.json`
}

export function downloadModule1ContinuePackage(portfolio: Module1Portfolio): void {
  const blob = new Blob(
    [JSON.stringify(buildModule1ContinuePackage(portfolio), null, 2)],
    { type: "application/json;charset=utf-8" },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = buildModule1ContinuePackageFilename(portfolio)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function looksLikeModule1Snapshot(text: string, fileName = ""): boolean {
  const name = fileName.toLowerCase()
  if (name.endsWith(".html") || name.endsWith(".htm")) return true
  const head = text.trimStart().slice(0, 240).toLowerCase()
  return head.startsWith("<!doctype html") || head.startsWith("<html")
}

export function deserializeModule1ContinuePackageText(
  text: string,
  fileName = "",
): ParsedModule1ContinuePackage {
  if (looksLikeModule1Snapshot(text, fileName)) {
    throw new Error("阶段快照不能恢复进度，请选择继续学习包")
  }
  if (new Blob([text]).size > MODULE1_CONTINUE_PACKAGE_MAX_BYTES) {
    throw new Error("学习包超过 2 MB，请选择模块一导出的文本学习包。")
  }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("文件内容无法解析，请选择模块一继续学习包。")
  }

  if (!isRecord(raw)) throw new Error("文件内容为空，请重新选择学习包。")
  if (!("packageType" in raw) && ("sdg" in raw || "cityIssue" in raw || "openingOut" in raw)) {
    throw new Error("检测到旧版扁平进度文件；当前阶段暂不支持，请保留文件并等待旧档转换功能开放。")
  }
  if (raw.packageType !== MODULE1_CONTINUE_PACKAGE_TYPE) {
    throw new Error("文件类型不匹配，请选择模块一继续学习包。")
  }
  if (typeof raw.version !== "number") throw new Error("学习包缺少有效版本号。")
  if (raw.version > MODULE1_CONTINUE_PACKAGE_VERSION) {
    throw new Error("学习包来自更高版本，请升级 ClassQuest 后再导入。")
  }
  if (raw.version !== MODULE1_CONTINUE_PACKAGE_VERSION) {
    throw new Error("当前阶段仅支持 version 1 模块一学习包。")
  }
  if (!isRecord(raw.portfolio)) throw new Error("学习包缺少学习档案。")
  if (raw.portfolio.moduleId !== MODULE1_ID) throw new Error("学习包属于其他模块，当前档案未发生变化。")

  const portfolio = normalizeAndRepair(raw.portfolio)
  if (
    !portfolio.student.studentName.trim()
    || validateModule1ClassSeatCode(portfolio.student.clazz, portfolio.student.classSeatCode)
  ) {
    throw new Error("学习包中的学生身份不完整，不能覆盖当前档案。")
  }
  return {
    portfolio,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : "",
  }
}

export async function deserializeModule1ContinuePackage(file: File): Promise<ParsedModule1ContinuePackage> {
  if (file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm") || file.type === "text/html") {
    throw new Error("阶段快照不能恢复进度，请选择继续学习包")
  }
  if (file.size > MODULE1_CONTINUE_PACKAGE_MAX_BYTES) {
    throw new Error("学习包超过 2 MB，请选择模块一导出的文本学习包。")
  }
  return deserializeModule1ContinuePackageText(await file.text(), file.name)
}
