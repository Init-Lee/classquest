/**
 * 文件说明：模块 1 课时 4 写作设定汇总 selector。
 * 职责：按课时 1/2/3/4 顺序派生抽屉只读字段，必须包含 SDG 主题、课时 3 确认开头与本课情节安排；空项给出待填写/待选择，不落盘。
 * 更新触发：抽屉字段顺序、占位口径、课组标题、SDG/主题核心或课时 4 已填摘要规则变化时，需要同步更新本文件。
 */

import { formatModule1SdgTheme } from "@/modules/module-1-ai-story/constants/sdgs"
import { MODULE1_LESSON4_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson4-copy"
import {
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3State,
  type Module1Lesson4State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { buildModule1Lesson1ThemeOutline } from "@/modules/module-1-ai-story/lessons/lesson-1/utils/build-lesson1-theme-outline"
import { hasModule1Lesson3ConfirmedSummary } from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-writing-summary"

const DRAFT_EXCERPT_LIMIT = 80

export interface Module1Lesson4WritingSummary {
  title: string
  intro: string
  lesson1GroupTitle: string
  lesson2GroupTitle: string
  lesson3GroupTitle: string
  lesson4GroupTitle: string
  year: string
  sdg: string
  sdgWhy: string
  cityIssue: string
  audience: string
  audienceConcern: string
  themeCore: string
  writingPlan: string
  reason: string
  who: string
  want: string
  blocked: string
  firstAction: string
  possibleChange: string
  storyTitle: string
  openingExcerpt: string
  plotPlan: string
  planReason: string
  draftExcerpt: string
  finalExcerpt: string
  reviewNeeded: boolean
}

function displayFill(value: string): string {
  return value.trim() || MODULE1_LESSON4_SHARED_COPY.pendingFill
}

function displayExcerpt(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return MODULE1_LESSON4_SHARED_COPY.pendingFill
  return trimmed.length > DRAFT_EXCERPT_LIMIT
    ? `${trimmed.slice(0, DRAFT_EXCERPT_LIMIT)}…`
    : trimmed
}

export function buildModule1Lesson4WritingSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
  lesson3: Module1Lesson3State,
  lesson4: Module1Lesson4State,
): Module1Lesson4WritingSummary {
  const outline = buildModule1Lesson1ThemeOutline(lesson1)
  return {
    title: MODULE1_LESSON4_SHARED_COPY.summaryTitle,
    intro: MODULE1_LESSON4_SHARED_COPY.summaryIntro,
    lesson1GroupTitle: MODULE1_LESSON4_SHARED_COPY.summaryLesson1Group,
    lesson2GroupTitle: MODULE1_LESSON4_SHARED_COPY.summaryLesson2Group,
    lesson3GroupTitle: MODULE1_LESSON4_SHARED_COPY.summaryLesson3Group,
    lesson4GroupTitle: MODULE1_LESSON4_SHARED_COPY.summaryLesson4Group,
    year: MODULE1_STORY_YEAR || MODULE1_LESSON4_SHARED_COPY.pendingFill,
    sdg: formatModule1SdgTheme(lesson1.sdg, MODULE1_LESSON4_SHARED_COPY.pendingSelect),
    sdgWhy: displayFill(lesson1.sdgWhy),
    cityIssue: displayFill(lesson1.cityIssue),
    audience: displayFill(lesson1.audience),
    audienceConcern: displayFill(lesson1.audienceConcern),
    themeCore: outline.themeCore,
    writingPlan: displayFill(lesson2.writingPlan),
    reason: displayFill(lesson2.reason),
    who: displayFill(lesson2.character.who),
    want: displayFill(lesson2.character.want),
    blocked: displayFill(lesson2.character.blocked),
    firstAction: displayFill(lesson2.character.firstAction),
    possibleChange: displayFill(lesson2.character.possibleChange),
    storyTitle: displayFill(lesson3.storyTitle),
    openingExcerpt: displayExcerpt(lesson3.finalText),
    plotPlan: displayFill(lesson4.plotPlan),
    planReason: displayFill(lesson4.planReason),
    draftExcerpt: displayExcerpt(lesson4.draftText),
    finalExcerpt: displayExcerpt(lesson4.finalText),
    reviewNeeded: Object.values(lesson4.reviewNeeded).some(Boolean),
  }
}

export function hasModule1Lesson4ConfirmedSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
  lesson3: Module1Lesson3State,
  lesson4: Module1Lesson4State,
): boolean {
  return hasModule1Lesson3ConfirmedSummary(lesson1, lesson2, lesson3)
    || Boolean(
      lesson4.plotPlan.trim()
      || lesson4.planReason.trim()
      || lesson4.draftText.trim()
      || lesson4.finalText.trim(),
    )
}
