/**
 * 文件说明：模块 1 课时 3 写作设定汇总 selector。
 * 职责：按课时 1/2/3 顺序派生抽屉只读字段，必须包含 SDG 主题（编号+名称）与主题核心；空项给出待填写/待选择，不落盘。
 * 更新触发：抽屉字段顺序、占位口径、SDG/主题核心或课时 3 已填摘要规则变化时，需要同步更新本文件。
 */

import { formatModule1SdgTheme } from "@/modules/module-1-ai-story/constants/sdgs"
import { MODULE1_LESSON3_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import {
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { buildModule1Lesson1ThemeOutline } from "@/modules/module-1-ai-story/lessons/lesson-1/utils/build-lesson1-theme-outline"
import { hasModule1Lesson2ConfirmedSummary } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"

const DRAFT_EXCERPT_LIMIT = 80

export interface Module1Lesson3WritingSummary {
  title: string
  intro: string
  year: string
  sdg: string
  sdgWhy: string
  cityIssue: string
  audience: string
  audienceConcern: string
  themeCore: string
  workTitle: string
  author: string
  location: string
  versionNote: string
  sourceNote: string
  writingPlan: string
  reason: string
  who: string
  want: string
  blocked: string
  firstAction: string
  possibleChange: string
  storyTitle: string
  openingPlan: string
  focusTechnique: string
  draftExcerpt: string
  finalExcerpt: string
  reviewNeeded: boolean
}

function displayFill(value: string): string {
  return value.trim() || MODULE1_LESSON3_SHARED_COPY.pendingFill
}

function displaySelect(value: string): string {
  return value.trim() || MODULE1_LESSON3_SHARED_COPY.pendingSelect
}

function displayExcerpt(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return MODULE1_LESSON3_SHARED_COPY.pendingFill
  return trimmed.length > DRAFT_EXCERPT_LIMIT
    ? `${trimmed.slice(0, DRAFT_EXCERPT_LIMIT)}…`
    : trimmed
}

export function buildModule1Lesson3WritingSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
  lesson3: Module1Lesson3State,
): Module1Lesson3WritingSummary {
  const outline = buildModule1Lesson1ThemeOutline(lesson1)
  return {
    title: MODULE1_LESSON3_SHARED_COPY.summaryTitle,
    intro: MODULE1_LESSON3_SHARED_COPY.summaryIntro,
    year: MODULE1_STORY_YEAR || MODULE1_LESSON3_SHARED_COPY.pendingFill,
    sdg: formatModule1SdgTheme(lesson1.sdg, MODULE1_LESSON3_SHARED_COPY.pendingSelect),
    sdgWhy: displayFill(lesson1.sdgWhy),
    cityIssue: displayFill(lesson1.cityIssue),
    audience: displayFill(lesson1.audience),
    audienceConcern: displayFill(lesson1.audienceConcern),
    themeCore: outline.themeCore,
    workTitle: displayFill(lesson2.reference.workTitle),
    author: displayFill(lesson2.reference.author),
    location: displayFill(lesson2.reference.location),
    versionNote: displayFill(lesson2.reference.versionNote),
    sourceNote: displayFill(lesson2.reference.sourceNote),
    writingPlan: displayFill(lesson2.writingPlan),
    reason: displayFill(lesson2.reason),
    who: displayFill(lesson2.character.who),
    want: displayFill(lesson2.character.want),
    blocked: displayFill(lesson2.character.blocked),
    firstAction: displayFill(lesson2.character.firstAction),
    possibleChange: displayFill(lesson2.character.possibleChange),
    storyTitle: displayFill(lesson3.storyTitle),
    openingPlan: displaySelect(lesson3.openingPlan),
    focusTechnique: displayFill(lesson3.focusTechnique),
    draftExcerpt: displayExcerpt(lesson3.draftText),
    finalExcerpt: displayExcerpt(lesson3.finalText),
    reviewNeeded: Object.values(lesson3.reviewNeeded).some(Boolean),
  }
}

export function hasModule1Lesson3ConfirmedSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
  lesson3: Module1Lesson3State,
): boolean {
  return hasModule1Lesson2ConfirmedSummary(lesson1, lesson2)
    || Boolean(
      lesson3.storyTitle.trim()
      || lesson3.openingPlan.trim()
      || lesson3.focusTechnique.trim()
      || lesson3.draftText.trim()
      || lesson3.finalText.trim(),
    )
}
