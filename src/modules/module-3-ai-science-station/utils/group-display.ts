/**
 * 文件说明：小组对外展示文案与组长姓名解析
 * 职责：统一「小组」在顶栏、首页、课时步骤与快照中的展示逻辑；优先使用组长真实姓名，
 *       组员侧从课时4已导入的骨架包 JSON 中读取 leaderName（兼容从 memberPackages 推断）。
 * 更新触发：骨架包结构增加字段、组长判定规则变化、或需在更多页面展示小组信息时
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

/**
 * 从课时4骨架包 JSON 字符串中解析组长姓名；失败或缺字段时返回 null
 * 兼容仅有 memberPackages、且其中 role 为 leader 的旧包
 */
export function tryParseSkeletonLeaderName(skeletonPackageJson: string | undefined | null): string | null {
  if (!skeletonPackageJson?.trim()) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = JSON.parse(skeletonPackageJson) as any
    if (typeof o.leaderName === "string" && o.leaderName.trim()) return o.leaderName.trim()
    const pkgs = Array.isArray(o.memberPackages) ? o.memberPackages : []
    const lead = pkgs.find((p: { role?: string; studentName?: string }) => p?.role === "leader")
    if (lead && typeof lead.studentName === "string" && lead.studentName.trim()) {
      return lead.studentName.trim()
    }
    return null
  } catch {
    return null
  }
}

/**
 * 用于顶栏、首页等：在「小组：」后展示的简短主文案（组长姓名；组员优先骨架包中的组长）
 * 若无骨架包（组员未完成课时4导入等），回退到档案中的 student.groupName
 */
export function getPortfolioGroupDisplayLabel(portfolio: ModulePortfolio): string {
  const { student, lesson4 } = portfolio
  if (student.role === "leader") {
    const n = student.studentName.trim()
    return n || student.groupName.trim() || "—"
  }
  const fromSkeleton = tryParseSkeletonLeaderName(lesson4?.skeletonPackageJson)
  if (fromSkeleton) return fromSkeleton
  return student.groupName.trim() || "—"
}
