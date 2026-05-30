/**
 * 文件说明：模块 4 课时 4 送审快照构建工具。
 * 职责：从课时 3 新闻题卡和图片题卡 V1 构建冻结的 Lesson4ReviewRequestJson，作为同伴互审 API 的 requestJson。
 * 更新触发：课时 3 题卡结构、课时 4 requestJson 契约或 V1/V2 版本边界变化时，需要同步更新本文件。
 */

import type { Module4Lesson3State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/api/types"

export function buildLesson4ReviewRequestJson(lesson3: Module4Lesson3State): Lesson4ReviewRequestJson {
  return {
    cards: {
      news: lesson3.newsCard,
      image: lesson3.imageCard,
    },
    snapshotMeta: {
      version: "v1",
      snapshotCreatedAt: new Date().toISOString(),
    },
  }
}
