/**
 * 文件说明：格式化工具函数
 * 职责：提供日期、文件名等格式化能力，供全局使用
 * 更新触发：新增格式化需求时在此扩展
 */

/**
 * 格式化日期为 YYYYMMDD_HHmm 格式（用于文件命名）
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}`
  )
}

/**
 * 格式化日期为可读的中文格式
 */
export function formatDateReadable(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * 生成继续学习包文件名
 */
export function buildContinuePackageFilename(
  studentName: string,
  lessonId: number,
  stepId: number
): string {
  return `AI科学传播站_模块三_${studentName}_课时${lessonId}_步骤${stepId}_${formatDateForFilename()}.json`
}

/**
 * 生成组长文件名（供组员导入使用）
 */
export function buildLeaderFilename(
  groupName: string,
  version: number
): string {
  return `组长文件_${groupName}_v${version}_${formatDateForFilename()}.json`
}

/**
 * 生成阶段快照文件名
 */
export function buildSnapshotFilename(
  studentName: string,
  lessonId: number
): string {
  return `AI科学传播站_阶段快照_课时${lessonId}_${studentName}_${formatDateForFilename()}.html`
}
