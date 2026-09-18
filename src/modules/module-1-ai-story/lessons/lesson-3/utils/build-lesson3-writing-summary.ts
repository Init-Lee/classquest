/**
 * 文件说明：模块 1 课时 3 右侧写作设定汇总 selector。
 * 职责：按内容包顺序整理城市问题、受众、写法、人物、开场和本段写法，不落盘。
 * 更新触发：右栏字段顺序、占位口径或开场/写法展示规则变化时，需要同步更新本文件。
 */

import {
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"

export interface Module1Lesson3WritingSummary {
  title: string
  intro: string
  year: string
  cityIssue: string
  audience: string
  audienceConcern: string
  writingPlan: string
  reason: string
  who: string
  want: string
  blocked: string
  firstAction: string
  possibleChange: string
  openingPlan: string
  focusTechnique: string
  reviewNeeded: boolean
}

function displayValue(value: string): string {
  return value.trim() || MODULE1_LESSON3_SHARED_COPY.notFilled
}

export function buildModule1Lesson3WritingSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
  lesson3: Module1Lesson3State,
): Module1Lesson3WritingSummary {
  return {
    title: MODULE1_LESSON3_SHARED_COPY.summaryTitle,
    intro: MODULE1_LESSON3_SHARED_COPY.summaryIntro,
    year: MODULE1_STORY_YEAR,
    cityIssue: displayValue(lesson1.cityIssue),
    audience: displayValue(lesson1.audience),
    audienceConcern: displayValue(lesson1.audienceConcern),
    writingPlan: displayValue(lesson2.writingPlan),
    reason: displayValue(lesson2.reason),
    who: displayValue(lesson2.character.who),
    want: displayValue(lesson2.character.want),
    blocked: displayValue(lesson2.character.blocked),
    firstAction: displayValue(lesson2.character.firstAction),
    possibleChange: displayValue(lesson2.character.possibleChange),
    openingPlan: displayValue(lesson3.openingPlan),
    focusTechnique: displayValue(lesson3.focusTechnique),
    reviewNeeded: Object.values(lesson3.reviewNeeded).some(Boolean),
  }
}
