/**
 * 文件说明：模块 4 课时 5 clientId 工具。
 * 职责：为学生本地档案生成稳定的 lesson5ClientId，便于提交时追踪同一浏览器/档案来源。
 * 更新触发：课时 5 提交追踪 ID 前缀、随机数策略或本地档案绑定规则变化时，需要同步更新本文件。
 */

export function createLesson5ClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `l5c_${crypto.randomUUID()}`
  }
  return `l5c_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function ensureLesson5ClientId(current: string | undefined): string {
  return current && current.trim() ? current : createLesson5ClientId()
}
