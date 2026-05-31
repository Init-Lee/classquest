/**
 * 文件说明：模块 4 课时 4 V2 修改台分区配置与锁定规则工具。
 * 职责：定义左侧 wizard 四段顺序，映射反馈 area 到编辑分区，并判断必改项是否已解决以解锁下一项。
 * 更新触发：Step3 编辑分区、反馈 area 映射、必改解锁规则或 wizard 顺序变化时，需要同步更新本文件。
 */

import type {
  Lesson4FeedbackDecision,
  Lesson4ReviewArea,
  Module4Lesson4V2CardDraft,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export type V2RevisionSectionId = "material" | "task" | "explanation" | "source"

/** Step3 wizard 分段 Tab 三态：通过 / 待改 / 已修改。 */
export type V2RevisionSectionStatus = "pass" | "pending" | "modified"

export const V2_REVISION_SECTIONS: Array<{ id: V2RevisionSectionId; label: string; shortLabel: string }> = [
  { id: "material", label: "素材展示", shortLabel: "素材" },
  { id: "task", label: "判断任务", shortLabel: "任务" },
  { id: "explanation", label: "核心解析", shortLabel: "解析" },
  { id: "source", label: "来源核验", shortLabel: "来源" },
]

export function mapDecisionAreaToSection(area: Lesson4ReviewArea | "overall"): V2RevisionSectionId | null {
  if (area === "overall") return null
  if (area === "safety") return "material"
  return area
}

export function getSectionDecisions(
  decisions: Lesson4FeedbackDecision[],
  cardKind: Module4MaterialKind,
  sectionId: V2RevisionSectionId,
): Lesson4FeedbackDecision[] {
  return decisions.filter(decision =>
    decision.cardKind === cardKind
    && mapDecisionAreaToSection(decision.area) === sectionId,
  )
}

export function getMustReviseDecisionsForSection(
  decisions: Lesson4FeedbackDecision[],
  cardKind: Module4MaterialKind,
  sectionId: V2RevisionSectionId,
): Lesson4FeedbackDecision[] {
  return getSectionDecisions(decisions, cardKind, sectionId).filter(decision => decision.action === "must_revise")
}

export function isDecisionResolved(decision: Lesson4FeedbackDecision, card: Module4Lesson4V2CardDraft): boolean {
  return decision.resolved || card.revision.decisionIdsResolved.includes(decision.id)
}

/** Step2 采纳/部分采纳或必改项：Step3 须跟进，Tab 不得标「通过」。 */
export function isSectionRevisionDecision(decision: Lesson4FeedbackDecision): boolean {
  return decision.action === "must_revise"
    || decision.action === "accept"
    || decision.action === "partial_accept"
}

export function getSectionRevisionDecisions(
  decisions: Lesson4FeedbackDecision[],
  cardKind: Module4MaterialKind,
  sectionId: V2RevisionSectionId,
): Lesson4FeedbackDecision[] {
  return getSectionDecisions(decisions, cardKind, sectionId).filter(isSectionRevisionDecision)
}

export function getSectionStatus(
  decisions: Lesson4FeedbackDecision[],
  card: Module4Lesson4V2CardDraft,
  cardKind: Module4MaterialKind,
  sectionId: V2RevisionSectionId,
): V2RevisionSectionStatus {
  const revisionDecisions = getSectionRevisionDecisions(decisions, cardKind, sectionId)
  if (revisionDecisions.length === 0) return "pass"
  if (revisionDecisions.every(decision => isDecisionResolved(decision, card))) return "modified"
  return "pending"
}

export function getSectionStatusLabel(status: V2RevisionSectionStatus): string {
  if (status === "pass") return "通过"
  if (status === "modified") return "已修改"
  return "待改"
}

export function isSectionBlockingUnresolved(
  decisions: Lesson4FeedbackDecision[],
  card: Module4Lesson4V2CardDraft,
  cardKind: Module4MaterialKind,
  sectionId: V2RevisionSectionId,
): boolean {
  return getMustReviseDecisionsForSection(decisions, cardKind, sectionId)
    .some(decision => !isDecisionResolved(decision, card))
}

/** 返回当前可访问的最远分区索引；首个仍有未解决必改项的分区即为上限。 */
export function computeMaxAccessibleSectionIndex(
  decisions: Lesson4FeedbackDecision[],
  card: Module4Lesson4V2CardDraft,
  cardKind: Module4MaterialKind,
): number {
  for (let index = 0; index < V2_REVISION_SECTIONS.length; index += 1) {
    if (isSectionBlockingUnresolved(decisions, card, cardKind, V2_REVISION_SECTIONS[index].id)) {
      return index
    }
  }
  return V2_REVISION_SECTIONS.length - 1
}

export function getSectionIndex(sectionId: V2RevisionSectionId): number {
  return V2_REVISION_SECTIONS.findIndex(section => section.id === sectionId)
}

/** 当前题卡四段 wizard 均为「通过」时，Step3 不要求填写整体修改反馈。 */
export function areAllCardSectionsPass(
  decisions: Lesson4FeedbackDecision[],
  card: Module4Lesson4V2CardDraft,
  cardKind: Module4MaterialKind,
): boolean {
  return V2_REVISION_SECTIONS.every(
    section => getSectionStatus(decisions, card, cardKind, section.id) === "pass",
  )
}
