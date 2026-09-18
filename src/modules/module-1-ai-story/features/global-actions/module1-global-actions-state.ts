/**
 * 文件说明：模块 1 顶栏全局操作可用性纯函数。
 * 职责：根据档案、忙碌态、教师模式和当前课时快照就绪态，给出保存、导入、重置与教师顶栏阶段快照按钮规则。学生顶栏不提供快照。
 * 更新触发：顶栏按钮策略、教师模式禁用规则或教师顶栏阶段快照可见条件变化时，需要同步更新本文件。
 */

import type { Module1SnapshotKind } from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"

export interface Module1GlobalActionAvailability {
  canSave: boolean
  canImport: boolean
  canReset: boolean
  canSnapshot: boolean
}

export interface Module1GlobalActionOptions {
  isTeacherMode?: boolean
  snapshotReady?: boolean
  showSnapshot?: boolean
}

export function getModule1GlobalActionAvailability(
  hasPortfolio: boolean,
  busy: boolean,
  options: Module1GlobalActionOptions = {},
): Module1GlobalActionAvailability {
  const canSnapshot = Boolean(options.isTeacherMode)
    && hasPortfolio
    && Boolean(options.snapshotReady)
    && Boolean(options.showSnapshot)
    && !busy
  if (options.isTeacherMode) {
    return {
      canSave: false,
      canImport: false,
      canReset: false,
      canSnapshot,
    }
  }
  return {
    canSave: hasPortfolio && !busy,
    canImport: !busy,
    canReset: hasPortfolio && !busy,
    canSnapshot,
  }
}

export function getModule1SnapshotDisabledReason(
  hasPortfolio: boolean,
  snapshotReady: boolean,
  kind: Module1SnapshotKind | null = "lesson1",
): string {
  if (!hasPortfolio) return "需要先有学习档案，完成当前课时后才能下载阶段快照。"
  if (!snapshotReady) {
    if (kind === "lesson3") {
      return "完成课时 3 后即可下载阶段快照。阶段快照不能恢复进度，请用「保存进度」下载学习包。"
    }
    return kind === "lesson2"
      ? "完成课时 2 后即可下载阶段快照。阶段快照不能恢复进度，请用「保存进度」下载学习包。"
      : "完成课时 1 后即可下载阶段快照。阶段快照不能恢复进度，请用「保存进度」下载学习包。"
  }
  return ""
}
