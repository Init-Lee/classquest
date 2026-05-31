/**
 * 文件说明：模块 4 课时 4 V2 草稿构建工具。
 * 职责：从课时 3 的 V1 题卡复制出课时 4 本地 V2 草稿，保证不修改原始 V1 数据。
 * 更新触发：V2 草稿字段、V1 到 V2 的复制边界或版本标记规则变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson3QuestionCardDraft,
  Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function buildLesson4V2DraftFromLesson3Card(
  v1Card: Module4Lesson3QuestionCardDraft,
): Module4Lesson4V2CardDraft {
  const now = new Date().toISOString()
  return {
    id: `lesson4-${v1Card.kind}-v2`,
    kind: v1Card.kind,
    version: "v2",
    status: "draft",
    baseV1CardId: v1Card.id,
    baseV1UpdatedAt: v1Card.updatedAt,
    material: { ...v1Card.material },
    task: {
      ...v1Card.task,
      options: v1Card.task.options.map(option => ({ ...option })),
    },
    explanation: { ...v1Card.explanation },
    source: { ...v1Card.source },
    revision: {
      summary: "",
      decisionIdsResolved: [],
      confirmedAt: "",
    },
    createdAt: now,
    updatedAt: now,
  }
}

