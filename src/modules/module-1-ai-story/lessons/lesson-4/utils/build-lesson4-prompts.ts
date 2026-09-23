/**
 * 文件说明：模块 1 课时 4 外部 AI 提示词拼装器。
 * 职责：按内容包 P1—P5 模板做一次变量替换，只生成可复制文本，不调用模型；openingText 只用课时 3 确认稿。
 * 更新触发：提示词模板、confirmedSetting 白名单、开头/情节变量或待检查稿来源变化时，需要同步更新本文件。
 */

import {
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson4State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON4_CASES,
  MODULE1_LESSON4_PROMPTS,
  MODULE1_LESSON4_SHARED_CASE_CONTEXT,
  MODULE1_LESSON4_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson4-copy"

export type Module1Lesson4PromptKey = "P1" | "P2" | "P3" | "P4" | "P5"

export interface Module1Lesson4PromptResult {
  ok: boolean
  text: string
  error: string
}

function displayValue(value: string, empty: string = MODULE1_LESSON4_SHARED_COPY.notFilled): string {
  return value.trim() || empty
}

function fail(error: string): Module1Lesson4PromptResult {
  return { ok: false, text: "", error }
}

function succeed(text: string): Module1Lesson4PromptResult {
  return { ok: true, text, error: "" }
}

function replaceTemplateOnce(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function buildModule1Lesson4CaseTexts(): string {
  const cases = MODULE1_LESSON4_CASES
    .map(item => `【${item.title}】\n${item.text}`)
    .join("\n\n")
  return `${MODULE1_LESSON4_SHARED_CASE_CONTEXT}\n\n${cases}\n\n（以上均为课堂自编虚构示例，不是文学作品原文。）`
}

export function hasModule1Lesson4PromptContext(
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

export function buildModule1Lesson4ConfirmedSetting(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
): string {
  const character = lesson2.character
  return [
    `故事年份：${MODULE1_STORY_YEAR}（${MODULE1_LESSON4_SHARED_COPY.yearNote}）`,
    `SDG主题：${displayValue(lesson1.sdg)}`,
    `选择这一主题的理由：${displayValue(lesson1.sdgWhy, "未单独填写")}`,
    `城市问题：${displayValue(lesson1.cityIssue)}`,
    `写给谁：${displayValue(lesson1.audience)}`,
    `受众关切：${displayValue(lesson1.audienceConcern, "未单独填写")}`,
    `我是谁：${displayValue(character.who)}`,
    `我想要：${displayValue(character.want)}`,
    `我卡在：${displayValue(character.blocked)}`,
    `准备先尝试的行动：${displayValue(character.firstAction, "未单独填写")}（${MODULE1_LESSON4_SHARED_COPY.notFactNote}）`,
    `可能怎样改变：${displayValue(character.possibleChange, "未单独填写")}（${MODULE1_LESSON4_SHARED_COPY.notFactNote}）`,
  ].join("\n")
}

export function resolveModule1Lesson4OpeningText(portfolio: Module1Portfolio): string {
  return portfolio.lesson3.finalText
}

export function resolveModule1Lesson4InspectText(lesson4: Module1Lesson4State): string {
  return lesson4.finalText.trim() || lesson4.draftText
}

export function buildModule1Lesson4Prompt(
  promptId: Module1Lesson4PromptKey,
  portfolio: Module1Portfolio,
): Module1Lesson4PromptResult {
  if (promptId === "P1") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON4_PROMPTS.P1, {
      caseTexts: buildModule1Lesson4CaseTexts(),
    }))
  }

  if (!hasModule1Lesson4PromptContext(portfolio.lesson1, portfolio.lesson2)) {
    return fail(MODULE1_LESSON4_SHARED_COPY.incompletePrompt)
  }

  const confirmedSetting = buildModule1Lesson4ConfirmedSetting(portfolio.lesson1, portfolio.lesson2)
  const openingText = resolveModule1Lesson4OpeningText(portfolio)
  const writingPlan = portfolio.lesson2.writingPlan
  const lesson4 = portfolio.lesson4

  if (!openingText.trim()) {
    return fail(MODULE1_LESSON4_SHARED_COPY.missingOpening)
  }

  if (promptId === "P2") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON4_PROMPTS.P2, {
      confirmedSetting,
      openingText,
      writingPlan,
    }))
  }

  if (!lesson4.plotPlan.trim() || !lesson4.planReason.trim()) {
    return fail(MODULE1_LESSON4_SHARED_COPY.missingPlan)
  }

  if (promptId === "P3") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON4_PROMPTS.P3, {
      confirmedSetting,
      openingText,
      writingPlan,
      plotPlan: lesson4.plotPlan,
      planReason: lesson4.planReason,
    }))
  }

  const inspectText = resolveModule1Lesson4InspectText(lesson4)
  if (!inspectText.trim()) {
    return fail(MODULE1_LESSON4_SHARED_COPY.missingInspect)
  }

  if (promptId === "P4") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON4_PROMPTS.P4, {
      confirmedSetting,
      openingText,
      writingPlan,
      plotPlan: lesson4.plotPlan,
      planReason: lesson4.planReason,
      currentText: inspectText,
    }))
  }

  if (!lesson4.revisionInstruction.trim()) {
    return fail(MODULE1_LESSON4_SHARED_COPY.missingRevision)
  }

  return succeed(replaceTemplateOnce(MODULE1_LESSON4_PROMPTS.P5, {
    confirmedSetting,
    revisionInstruction: lesson4.revisionInstruction,
    preserveText: lesson4.preserveText.trim() || MODULE1_LESSON4_SHARED_COPY.defaultPreserve,
    openingText,
    writingPlan,
    plotPlan: lesson4.plotPlan,
    currentText: inspectText,
  }))
}

export function module1Lesson4PromptContainsUnresolvedVars(text: string): boolean {
  return /\{\{[a-zA-Z0-9.]+}}/.test(text)
}

/** 第 3 关起草依赖：设定、开头确认稿、写法、情节安排。不含初稿编辑。 */
export function buildModule1Lesson4DraftContextKey(portfolio: Module1Portfolio): string {
  return [
    buildModule1Lesson4ConfirmedSetting(portfolio.lesson1, portfolio.lesson2),
    resolveModule1Lesson4OpeningText(portfolio),
    portfolio.lesson2.writingPlan,
    portfolio.lesson4.plotPlan,
    portfolio.lesson4.planReason,
  ].join("\n---\n")
}

/** 第 4 关检查依赖：与起草相同，不含屏幕当前稿，避免每改一字就失效。 */
export function buildModule1Lesson4CheckContextKey(portfolio: Module1Portfolio): string {
  return buildModule1Lesson4DraftContextKey(portfolio)
}
