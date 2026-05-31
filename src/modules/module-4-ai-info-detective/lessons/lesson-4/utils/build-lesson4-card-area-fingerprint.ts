/**
 * 文件说明：模块 4 课时 4 题卡区域指纹工具。
 * 职责：为 V2 修改台按素材、任务、解析、来源区域生成稳定字符串，辅助判断重改反馈是否已有实际修改。
 * 更新触发：V2 可编辑区域、反馈 area 映射或重改解决判定变化时，需要同步更新本文件。
 */

import type {
  Lesson4ReviewArea,
  Module4Lesson4V2CardDraft,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function buildLesson4CardAreaFingerprint(card: Module4Lesson4V2CardDraft, area: Lesson4ReviewArea | "overall"): string {
  if (area === "material") {
    return JSON.stringify({
      titleOrName: card.material.titleOrName.trim(),
      displayNote: card.material.displayNote.trim(),
      assetFingerprint: card.material.assetFingerprint,
    })
  }
  if (area === "task") {
    return JSON.stringify({
      prompt: card.task.prompt.trim(),
      options: card.task.options.map(option => ({
        key: option.key,
        label: option.label.trim(),
        rationale: (option.rationale ?? "").trim(),
      })),
      correctOptionKey: card.task.correctOptionKey,
    })
  }
  if (area === "explanation") return card.explanation.text.trim()
  if (area === "source") {
    return JSON.stringify({
      sourceType: card.source.sourceType,
      sourceRecord: card.source.sourceRecord.trim(),
      verificationNote: card.source.verificationNote.trim(),
    })
  }
  return JSON.stringify(card)
}

