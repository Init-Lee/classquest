/**
 * 文件说明：模块 1 阶段快照入口规则。
 * 职责：按课时卡、身份卡、学生顶栏和教师顶栏给出阶段快照按钮可见与可点状态；不拼装 HTML。
 * 更新触发：课卡快照入口、身份卡入口、学生/教师顶栏策略或课时 3 起新增快照类型时，需要同步更新本文件。
 */

import type { Module1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  isModule1SnapshotReady,
  resolveModule1SnapshotKind,
  resolveModule1SnapshotKindFromLessonId,
  type Module1SnapshotKind,
} from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"

export interface Module1LessonCardSnapshotButton {
  visible: boolean
  enabled: boolean
  kind: Module1SnapshotKind | null
  hint: string
}

export interface Module1TeacherTopBarSnapshotState {
  visible: boolean
  enabled: boolean
  kind: Module1SnapshotKind | null
}

const HIDDEN_CARD_SNAPSHOT: Module1LessonCardSnapshotButton = {
  visible: false,
  enabled: false,
  kind: null,
  hint: "",
}

export function getModule1LessonCardSnapshotButton(
  lessonId: number,
  options: {
    available: boolean
    accessible: boolean
    completed: boolean
  },
): Module1LessonCardSnapshotButton {
  const kind = resolveModule1SnapshotKindFromLessonId(lessonId)
  if (!kind || !options.available || !options.accessible) return HIDDEN_CARD_SNAPSHOT
  if (!options.completed) {
    return {
      visible: true,
      enabled: false,
      kind,
      hint: "完成本课后可下载",
    }
  }
  return {
    visible: true,
    enabled: true,
    kind,
    hint: "",
  }
}

export function shouldShowModule1IdentityCardSnapshot(): boolean {
  return false
}

export function shouldShowModule1StudentTopBarSnapshot(): boolean {
  return false
}

export function getModule1TeacherTopBarSnapshotState(
  pathname: string,
  portfolio: Module1Portfolio | null,
): Module1TeacherTopBarSnapshotState {
  const kind = resolveModule1SnapshotKind(pathname)
  if (!kind || !portfolio) {
    return { visible: false, enabled: false, kind: kind ?? null }
  }
  return {
    visible: true,
    enabled: isModule1SnapshotReady(portfolio, kind),
    kind,
  }
}
