/**
 * 文件说明：模块 1 写作设定课组标题。
 * 职责：集中课时 2/3/4 汇总共用的课组正式课名，供分组壳与 selector 读取，不落盘。
 * 更新触发：课组标题与正式课名对齐变化时，需要同步更新本文件。
 */

import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { MODULE1_LESSON4_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson4-copy"

export const MODULE1_WRITING_SUMMARY_GROUP_TITLES = {
  lesson1: MODULE1_LESSON3_SHARED_COPY.summaryLesson1Group,
  lesson2: MODULE1_LESSON3_SHARED_COPY.summaryLesson2Group,
  lesson3: MODULE1_LESSON3_SHARED_COPY.summaryLesson3Group,
  lesson4: MODULE1_LESSON4_SHARED_COPY.summaryLesson4Group,
} as const

export type Module1WritingSummaryLessonKey = keyof typeof MODULE1_WRITING_SUMMARY_GROUP_TITLES
