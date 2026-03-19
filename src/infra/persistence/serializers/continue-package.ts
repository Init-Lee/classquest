/**
 * 文件说明：继续学习包序列化/反序列化
 * 职责：将 ModulePortfolio 序列化为可携带的 JSON 文件（继续学习包）
 *       以及将导入的 JSON 文件解析还原为 ModulePortfolio
 * 更新触发：ModulePortfolio 结构发生变化时；需要新增格式校验时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"
import { buildContinuePackageFilename } from "@/shared/utils/format"

/** 导出继续学习包为 Blob（JSON 格式） */
export function serializeContinuePackage(portfolio: ModulePortfolio): Blob {
  const json = JSON.stringify(portfolio, null, 2)
  return new Blob([json], { type: "application/json" })
}

/** 从文件读取并解析继续学习包，返回 ModulePortfolio */
export async function deserializeContinuePackage(file: File): Promise<ModulePortfolio> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text) as ModulePortfolio

        // 基本结构校验
        if (!data.id || !data.moduleId || !data.student || !data.lesson1) {
          reject(new Error("文件格式不正确，请选择有效的继续学习包文件"))
          return
        }

        if (data.moduleId !== "G7_M3") {
          reject(new Error("文件不属于本模块，无法导入"))
          return
        }

        resolve(data)
      } catch {
        reject(new Error("文件解析失败，请确认文件未被损坏"))
      }
    }

    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsText(file)
  })
}

/** 触发浏览器下载继续学习包 */
export function downloadContinuePackage(portfolio: ModulePortfolio): void {
  const blob = serializeContinuePackage(portfolio)
  const url = URL.createObjectURL(blob)
  const filename = buildContinuePackageFilename(
    portfolio.student.studentName,
    portfolio.pointer.lessonId,
    portfolio.pointer.stepId
  )

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
