/**
 * 文件说明：继续学习包序列化/反序列化
 * 职责：将 ModulePortfolio 序列化为可携带的 JSON 文件（继续学习包）
 *       以及将导入的 JSON 文件解析还原为 ModulePortfolio
 * 更新触发：ModulePortfolio 结构发生变化时；需要新增格式校验时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"
import { buildContinuePackageFilename, buildLeaderFilename } from "@/shared/utils/format"

/** 导出继续学习包为 Blob（JSON 格式） */
export function serializeContinuePackage(portfolio: ModulePortfolio): Blob {
  const json = JSON.stringify(portfolio, null, 2)
  return new Blob([json], { type: "application/json" })
}

/**
 * 数据迁移：将旧格式的档案升级到当前数据结构
 * - evidenceRows.owner (string) → owners (string[])
 * - assignments.owner (string) → owners (string[])
 * - lesson1.groupMembers 缺失时补空数组
 * - R1Record.sourceRows 缺失时补空数组
 * 保持向后兼容，旧文件导入后可正常使用
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migratePortfolioData(raw: unknown): ModulePortfolio {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any

  // 迁移 evidenceRows.owner (string) → owners (string[])
  if (Array.isArray(data?.lesson1?.evidenceRows)) {
    data.lesson1.evidenceRows = data.lesson1.evidenceRows.map((row: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      if (!Array.isArray(r.owners)) {
        r.owners = r.owner ? [r.owner] : []
      }
      return r
    })
  }

  // 补充 groupMembers 字段
  if (data?.lesson1 && !Array.isArray(data.lesson1.groupMembers)) {
    data.lesson1.groupMembers = []
  }

  // 迁移 R1Record.sourceRows 缺失
  if (Array.isArray(data?.lesson1?.r1ByMember)) {
    data.lesson1.r1ByMember = data.lesson1.r1ByMember.map((r: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = r as any
      if (!Array.isArray(rec.sourceRows)) {
        rec.sourceRows = []
      }
      return rec
    })
  }

  // 迁移 assignments.owner (string) → owners (string[])
  if (Array.isArray(data?.lesson2?.assignments)) {
    data.lesson2.assignments = data.lesson2.assignments.map((a: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asg = a as any
      if (!Array.isArray(asg.owners)) {
        asg.owners = asg.owner ? [asg.owner] : []
      }
      return asg
    })
  }

  return data as ModulePortfolio
}

/** 从文件读取并解析继续学习包，返回 ModulePortfolio */
export async function deserializeContinuePackage(file: File): Promise<ModulePortfolio> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const raw = JSON.parse(text) as unknown

        // 基本结构校验
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = raw as any
        if (!obj?.id || !obj?.moduleId || !obj?.student || !obj?.lesson1) {
          reject(new Error("文件格式不正确，请选择有效的继续学习包文件"))
          return
        }

        if (obj.moduleId !== "G7_M3") {
          reject(new Error("文件不属于本模块，无法导入"))
          return
        }

        // 执行迁移，确保新旧格式均可使用
        resolve(migratePortfolioData(raw))
      } catch {
        reject(new Error("文件解析失败，请确认文件未被损坏"))
      }
    }

    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsText(file)
  })
}

/**
 * 触发浏览器下载组长文件（供组员在课时2导入分工使用）
 * 内容与继续学习包相同，区别仅在文件名，方便区分
 */
export function downloadLeaderFile(portfolio: ModulePortfolio): void {
  const blob = serializeContinuePackage(portfolio)
  const url = URL.createObjectURL(blob)
  const filename = buildLeaderFilename(portfolio.student.groupName, portfolio.groupPlanVersion)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
