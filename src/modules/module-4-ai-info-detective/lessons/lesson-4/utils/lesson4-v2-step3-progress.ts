/**
 * 文件说明：模块 4 课时 4 Step3 双卡确认进度工具。
 * 职责：根据 news/image 确认标记推导待确认题卡种类与 Step3 是否可进入第 4 关，供页面与单测共用。
 * 更新触发：Step3 双卡确认完成语义、进入 Step4 条件或题卡顺序策略变化时，需要同步更新本文件。
 */

import type { Module4Lesson4V2State, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

/** 返回下一张尚未确认的题卡种类；两卡均已确认时返回 null。 */
export function getPendingLesson4V2CardKind(
  newsConfirmed: boolean,
  imageConfirmed: boolean,
): Module4MaterialKind | null {
  if (!newsConfirmed) return "news"
  if (!imageConfirmed) return "image"
  return null
}

/** 两张 V2 题卡均已确认，可标记 step3Completed 并进入第 4 关。 */
export function isLesson4V2Step3Complete(v2: Pick<Module4Lesson4V2State, "newsConfirmed" | "imageConfirmed">): boolean {
  return v2.newsConfirmed && v2.imageConfirmed
}
