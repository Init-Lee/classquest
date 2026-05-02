/**
 * 文件说明：模块四通用格式化工具。
 * 职责：提供日期可读格式化等纯函数，避免模块四依赖模块三工具文件。
 * 更新触发：首页或导出界面新增时间展示格式需求时，需要同步更新本文件。
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
