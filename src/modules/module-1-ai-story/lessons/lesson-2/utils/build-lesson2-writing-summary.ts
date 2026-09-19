/**
 * 文件说明：模块 1 课时 2 已确认写作设定汇总 selector。
 * 职责：按内容包第 7 节格式整理主题、参照、写法、理由和人物五项，不落盘、不自动添加因果结论。
 * 更新触发：汇总字段、课组标题、占位口径、复制稿待复核提示或课时 1 上下文格式变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson2Fields,
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_DRAFT_COPY_NOTE,
  MODULE1_LESSON2_MISSING_LESSON1_FIELD,
  MODULE1_LESSON2_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"

export interface Module1Lesson2WritingSummary {
  title: string
  intro: string
  lesson1GroupTitle: string
  lesson2GroupTitle: string
  year: string
  sdg: string
  sdgWhy: string
  cityIssue: string
  audience: string
  audienceConcern: string
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
  reviewNeeded: boolean
  complete: boolean
}

function displayValue(value: string): string {
  return value.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled
}

function lesson1Optional(value: string): string {
  return value.trim() || MODULE1_LESSON2_MISSING_LESSON1_FIELD
}

export function buildModule1Lesson2WritingSummary(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
): Module1Lesson2WritingSummary {
  return {
    title: MODULE1_LESSON2_SHARED_COPY.summaryTitle,
    intro: MODULE1_LESSON2_SHARED_COPY.summaryIntro,
    lesson1GroupTitle: MODULE1_LESSON2_SHARED_COPY.summaryLesson1Group,
    lesson2GroupTitle: MODULE1_LESSON2_SHARED_COPY.summaryLesson2Group,
    year: MODULE1_STORY_YEAR,
    sdg: displayValue(lesson1.sdg),
    sdgWhy: lesson1Optional(lesson1.sdgWhy),
    cityIssue: displayValue(lesson1.cityIssue),
    audience: displayValue(lesson1.audience),
    audienceConcern: lesson1Optional(lesson1.audienceConcern),
    workTitle: displayValue(lesson2.reference.workTitle),
    author: displayValue(lesson2.reference.author),
    location: displayValue(lesson2.reference.location),
    versionNote: displayValue(lesson2.reference.versionNote),
    sourceNote: displayValue(lesson2.reference.sourceNote),
    writingPlan: displayValue(lesson2.writingPlan),
    reason: displayValue(lesson2.reason),
    who: displayValue(lesson2.character.who),
    want: displayValue(lesson2.character.want),
    blocked: displayValue(lesson2.character.blocked),
    firstAction: displayValue(lesson2.character.firstAction),
    possibleChange: displayValue(lesson2.character.possibleChange),
    reviewNeeded: Object.values(lesson2.reviewNeeded).some(Boolean),
    complete: hasMeaningfulModule1Lesson2Fields(lesson2),
  }
}

export function formatModule1Lesson2WritingSummary(summary: Module1Lesson2WritingSummary): string {
  const draftNote = summary.complete && !summary.reviewNeeded ? "" : `\n${MODULE1_LESSON2_DRAFT_COPY_NOTE}\n`
  return `${draftNote}【未来来信·课时2已确认写作设定】
一、故事主题
故事年份：${summary.year}
SDG主题：${summary.sdg}
选择理由：${summary.sdgWhy}
城市问题：${summary.cityIssue}
我写给谁：${summary.audience}
对方关心的事：${summary.audienceConcern}

二、文学参照
作品：${summary.workTitle}
作者：${summary.author}
片段位置：${summary.location}
版本说明：${summary.versionNote}
阅读出处：${summary.sourceNote}

三、我准备采用的写法
${summary.writingPlan}

四、我的选择理由
${summary.reason}

五、人物四格
我是谁：${summary.who}
我想要：${summary.want}
我卡在：${summary.blocked}
我可能怎样改变：
准备先尝试的行动：${summary.firstAction}
可能发生的变化：${summary.possibleChange}

人物变化是目前的设想，后续写作时可以调整。`.trim()
}

export function resolveModule1Lesson2CopyPayload(summary: Module1Lesson2WritingSummary): {
  enabled: boolean
  text: string
} {
  return {
    enabled: true,
    text: formatModule1Lesson2WritingSummary(summary),
  }
}

export function buildModule1Lesson2WritingSummaryFromPortfolio(
  portfolio: Module1Portfolio,
): Module1Lesson2WritingSummary {
  return buildModule1Lesson2WritingSummary(portfolio.lesson1, portfolio.lesson2)
}
