/**
 * 文件说明：模块 1 课时 6 外部 AI 提示词拼装器。
 * 职责：按内容包 P1—P5 模板做一次变量替换，只生成可复制文本，不调用模型；opening/development/turn 用课时 3/4/5 确认稿。
 * 更新触发：提示词模板、结局类型拼入方式、三段确认稿变量或待检查合段来源变化时，需要同步更新本文件。
 */

import {
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson6State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON6_CASES,
  MODULE1_LESSON6_PROMPTS,
  MODULE1_LESSON6_SHARED_CASE_CONTEXT,
  MODULE1_LESSON6_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson6-copy"

export type Module1Lesson6PromptKey = "P1" | "P2" | "P3" | "P4" | "P5"

export interface Module1Lesson6PromptResult {
  ok: boolean
  text: string
  error: string
}

function displayValue(value: string, empty: string = MODULE1_LESSON6_SHARED_COPY.notFilled): string {
  return value.trim() || empty
}

function fail(error: string): Module1Lesson6PromptResult {
  return { ok: false, text: "", error }
}

function succeed(text: string): Module1Lesson6PromptResult {
  return { ok: true, text, error: "" }
}

function replaceTemplateOnce(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function buildModule1Lesson6CaseTexts(): string {
  const cases = MODULE1_LESSON6_CASES
    .map(item => `【${item.title}】\n${item.text}`)
    .join("\n\n")
  return `${MODULE1_LESSON6_SHARED_CASE_CONTEXT}\n\n${cases}\n\n（以上均为课堂自编虚构示例，不是文学作品原文。）`
}

export function hasModule1Lesson6PromptContext(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
): boolean {
  return Boolean(
    lesson1.cityIssue.trim()
    && lesson1.audience.trim()
    && lesson2.writingPlan.trim()
    && lesson2.character.who.trim()
    && lesson2.character.want.trim()
    && lesson2.character.blocked.trim(),
  )
}

export function buildModule1Lesson6ConfirmedSetting(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
  lesson6?: Module1Lesson6State,
): string {
  const character = lesson2.character
  const lines = [
    `故事年份：${MODULE1_STORY_YEAR}（${MODULE1_LESSON6_SHARED_COPY.yearNote}）`,
    `SDG主题：${displayValue(lesson1.sdg)}`,
    `选择这一主题的理由：${displayValue(lesson1.sdgWhy, "未单独填写")}`,
    `城市问题：${displayValue(lesson1.cityIssue)}`,
    `写给谁：${displayValue(lesson1.audience)}`,
    `受众关切：${displayValue(lesson1.audienceConcern, "未单独填写")}`,
    `我是谁：${displayValue(character.who)}`,
    `我想要：${displayValue(character.want)}`,
    `我卡在：${displayValue(character.blocked)}`,
    `准备先尝试的行动：${displayValue(character.firstAction, "未单独填写")}（${MODULE1_LESSON6_SHARED_COPY.notFactNote}）`,
    `可能怎样改变：${displayValue(character.possibleChange, "未单独填写")}（${MODULE1_LESSON6_SHARED_COPY.notFactNote}）`,
  ]
  if (lesson6?.endingType) {
    lines.push(`本课已选结局类型：${lesson6.endingType}`)
    if (lesson6.endingType === "自定义" && lesson6.customEndingRequirement.trim()) {
      lines.push(`自定义结尾要求：${lesson6.customEndingRequirement.trim()}`)
    }
  }
  return lines.join("\n")
}

/** 把结局类型写进结尾安排变量，教学模板句子保持内容包原文。 */
export function buildModule1Lesson6PlotPlanForPrompt(lesson6: Module1Lesson6State): string {
  if (!lesson6.endingType) return lesson6.plotPlan
  const lines = [`结局类型：${lesson6.endingType}`]
  if (lesson6.endingType === "自定义") {
    lines.push(`自定义要求：${lesson6.customEndingRequirement.trim() || MODULE1_LESSON6_SHARED_COPY.notFilled}`)
  }
  lines.push(lesson6.plotPlan)
  return lines.join("\n")
}

export function resolveModule1Lesson6OpeningText(portfolio: Module1Portfolio): string {
  return portfolio.lesson3.finalText
}

export function resolveModule1Lesson6DevelopmentText(portfolio: Module1Portfolio): string {
  return portfolio.lesson4.finalText
}

export function resolveModule1Lesson6TurnText(portfolio: Module1Portfolio): string {
  return portfolio.lesson5.finalText
}

export function resolveModule1Lesson6InspectText(lesson6: Module1Lesson6State): string {
  return lesson6.finalText.trim() || lesson6.draftText
}

export function buildModule1Lesson6PreviewKey(portfolio: Module1Portfolio): string {
  return [
    portfolio.lesson3.storyTitle.trim(),
    resolveModule1Lesson6OpeningText(portfolio),
    resolveModule1Lesson6DevelopmentText(portfolio),
    resolveModule1Lesson6TurnText(portfolio),
    resolveModule1Lesson6InspectText(portfolio.lesson6),
  ].join("\n---\n")
}

export function buildModule1Lesson6Prompt(
  promptId: Module1Lesson6PromptKey,
  portfolio: Module1Portfolio,
): Module1Lesson6PromptResult {
  if (promptId === "P1") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON6_PROMPTS.P1, {
      caseTexts: buildModule1Lesson6CaseTexts(),
    }))
  }

  if (!hasModule1Lesson6PromptContext(portfolio.lesson1, portfolio.lesson2)) {
    return fail(MODULE1_LESSON6_SHARED_COPY.incompletePrompt)
  }

  const lesson6 = portfolio.lesson6
  const confirmedSetting = buildModule1Lesson6ConfirmedSetting(portfolio.lesson1, portfolio.lesson2, lesson6)
  const openingText = resolveModule1Lesson6OpeningText(portfolio)
  const developmentText = resolveModule1Lesson6DevelopmentText(portfolio)
  const turnText = resolveModule1Lesson6TurnText(portfolio)
  const writingPlan = portfolio.lesson2.writingPlan

  if (!openingText.trim()) return fail(MODULE1_LESSON6_SHARED_COPY.missingOpening)
  if (!developmentText.trim()) return fail(MODULE1_LESSON6_SHARED_COPY.missingDevelopment)
  if (!turnText.trim()) return fail(MODULE1_LESSON6_SHARED_COPY.missingTurn)

  if (promptId === "P2") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON6_PROMPTS.P2, {
      confirmedSetting,
      openingText,
      developmentText,
      turnText,
      writingPlan,
    }))
  }

  if (!lesson6.plotPlan.trim() || !lesson6.planReason.trim() || !lesson6.endingType) {
    return fail(MODULE1_LESSON6_SHARED_COPY.missingPlan)
  }
  if (lesson6.endingType === "自定义" && !lesson6.customEndingRequirement.trim()) {
    return fail(MODULE1_LESSON6_SHARED_COPY.missingEnding)
  }

  const plotPlan = buildModule1Lesson6PlotPlanForPrompt(lesson6)
  if (promptId === "P3") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON6_PROMPTS.P3, {
      confirmedSetting,
      openingText,
      developmentText,
      turnText,
      writingPlan,
      plotPlan,
      planReason: lesson6.planReason,
    }))
  }

  const inspectText = resolveModule1Lesson6InspectText(lesson6)
  if (!inspectText.trim()) return fail(MODULE1_LESSON6_SHARED_COPY.missingInspect)

  if (promptId === "P4") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON6_PROMPTS.P4, {
      confirmedSetting,
      openingText,
      developmentText,
      turnText,
      writingPlan,
      plotPlan,
      planReason: lesson6.planReason,
      currentText: inspectText,
    }))
  }

  if (!lesson6.revisionInstruction.trim()) {
    return fail(MODULE1_LESSON6_SHARED_COPY.missingRevision)
  }

  return succeed(replaceTemplateOnce(MODULE1_LESSON6_PROMPTS.P5, {
    confirmedSetting,
    revisionInstruction: lesson6.revisionInstruction,
    preserveText: lesson6.preserveText.trim() || MODULE1_LESSON6_SHARED_COPY.defaultPreserve,
    openingText,
    developmentText,
    turnText,
    writingPlan,
    plotPlan,
    planReason: lesson6.planReason,
    currentText: inspectText,
  }))
}

export function module1Lesson6PromptContainsUnresolvedVars(text: string): boolean {
  return /\{\{[a-zA-Z0-9.]+}}/.test(text)
}

/** 第 3 关起草依赖：设定、三段确认稿、写法、结局类型与结尾安排。不含初稿。 */
export function buildModule1Lesson6DraftContextKey(portfolio: Module1Portfolio): string {
  const lesson6 = portfolio.lesson6
  return [
    buildModule1Lesson6ConfirmedSetting(portfolio.lesson1, portfolio.lesson2, lesson6),
    resolveModule1Lesson6OpeningText(portfolio),
    resolveModule1Lesson6DevelopmentText(portfolio),
    resolveModule1Lesson6TurnText(portfolio),
    portfolio.lesson2.writingPlan,
    lesson6.endingType,
    lesson6.customEndingRequirement,
    lesson6.plotPlan,
    lesson6.planReason,
  ].join("\n---\n")
}

/**
 * 第 4 关检查依赖：起草上下文 + 当前待检查合段。
 * 确认稿一变，contextKey 必须变化，旧复制不能继续算完成。
 */
export function buildModule1Lesson6CheckContextKey(portfolio: Module1Portfolio): string {
  return [
    buildModule1Lesson6DraftContextKey(portfolio),
    resolveModule1Lesson6InspectText(portfolio.lesson6),
  ].join("\n---\n")
}
