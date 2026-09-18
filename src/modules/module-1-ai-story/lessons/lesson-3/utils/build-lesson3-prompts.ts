/**
 * 文件说明：模块 1 课时 3 外部 AI 提示词拼装器。
 * 职责：按内容包 P1—P5 模板做一次变量替换，只生成可复制文本，不调用模型。
 * 更新触发：提示词模板、confirmedSetting 白名单、开场/写法变量或待检查稿来源变化时，需要同步更新本文件。
 */

import {
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON3_CASES,
  MODULE1_LESSON3_PROMPTS,
  MODULE1_LESSON3_SHARED_COPY,
} from "@/modules/module-1-ai-story/constants/lesson3-copy"

export type Module1Lesson3PromptKey = "P1" | "P2" | "P3" | "P4" | "P5"

export interface Module1Lesson3PromptResult {
  ok: boolean
  text: string
  error: string
}

function displayValue(value: string, empty: string = MODULE1_LESSON3_SHARED_COPY.notFilled): string {
  return value.trim() || empty
}

function fail(error: string): Module1Lesson3PromptResult {
  return { ok: false, text: "", error }
}

function succeed(text: string): Module1Lesson3PromptResult {
  return { ok: true, text, error: "" }
}

function replaceTemplateOnce(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function buildModule1Lesson3CaseTexts(): string {
  return MODULE1_LESSON3_CASES
    .map(item => `【${item.title}】\n${item.text}`)
    .join("\n\n")
    + `\n\n（以上均为课堂自编虚构示例，不是文学作品原文。）`
}

export function hasModule1Lesson3PromptContext(
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

export function buildModule1Lesson3ConfirmedSetting(
  lesson1: Module1Lesson1State,
  lesson2: Module1Lesson2State,
): string {
  const character = lesson2.character
  return [
    `故事年份：${MODULE1_STORY_YEAR}（${MODULE1_LESSON3_SHARED_COPY.yearNote}）`,
    `SDG主题：${displayValue(lesson1.sdg)}`,
    `选择这一主题的理由：${displayValue(lesson1.sdgWhy, "未单独填写")}`,
    `城市问题：${displayValue(lesson1.cityIssue)}`,
    `写给谁：${displayValue(lesson1.audience)}`,
    `受众关切：${displayValue(lesson1.audienceConcern, "未单独填写")}`,
    `课时2已确认写法：\n${displayValue(lesson2.writingPlan)}`,
    `选择理由：${displayValue(lesson2.reason, "未单独填写")}`,
    `我是谁：${displayValue(character.who)}`,
    `我想要：${displayValue(character.want)}`,
    `我卡在：${displayValue(character.blocked)}`,
    `准备先尝试的行动：${displayValue(character.firstAction, "未单独填写")}（${MODULE1_LESSON3_SHARED_COPY.notFactNote}）`,
    `可能怎样改变：${displayValue(character.possibleChange, "未单独填写")}（${MODULE1_LESSON3_SHARED_COPY.notFactNote}）`,
  ].join("\n")
}

export function resolveModule1Lesson3InspectText(lesson3: Module1Lesson3State): string {
  return lesson3.finalText.trim() || lesson3.draftText
}

export function buildModule1Lesson3Prompt(
  promptId: Module1Lesson3PromptKey,
  portfolio: Module1Portfolio,
): Module1Lesson3PromptResult {
  if (promptId === "P1") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON3_PROMPTS.P1, {
      caseTexts: buildModule1Lesson3CaseTexts(),
    }))
  }

  if (!hasModule1Lesson3PromptContext(portfolio.lesson1, portfolio.lesson2)) {
    return fail(MODULE1_LESSON3_SHARED_COPY.incompletePrompt)
  }

  const confirmedSetting = buildModule1Lesson3ConfirmedSetting(portfolio.lesson1, portfolio.lesson2)
  const lesson3 = portfolio.lesson3

  if (promptId === "P2") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON3_PROMPTS.P2, { confirmedSetting }))
  }

  if (!lesson3.openingPlan.trim() || !lesson3.focusTechnique.trim()) {
    return fail(MODULE1_LESSON3_SHARED_COPY.missingOpening)
  }

  if (promptId === "P3") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON3_PROMPTS.P3, {
      confirmedSetting,
      openingPlan: lesson3.openingPlan,
      focusTechnique: lesson3.focusTechnique,
    }))
  }

  const inspectText = resolveModule1Lesson3InspectText(lesson3)
  if (!inspectText.trim()) {
    return fail("请先写下或粘贴一版开头，再生成检查提示词。")
  }

  if (promptId === "P4") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON3_PROMPTS.P4, {
      confirmedSetting,
      openingPlan: lesson3.openingPlan,
      focusTechnique: lesson3.focusTechnique,
      draftText: inspectText,
    }))
  }

  if (!lesson3.revisionInstruction.trim()) {
    return fail(MODULE1_LESSON3_SHARED_COPY.missingRevision)
  }

  return succeed(replaceTemplateOnce(MODULE1_LESSON3_PROMPTS.P5, {
    confirmedSetting,
    revisionInstruction: lesson3.revisionInstruction,
    preserveText: lesson3.preserveText.trim() || MODULE1_LESSON3_SHARED_COPY.defaultPreserve,
    focusTechnique: lesson3.focusTechnique,
    draftText: inspectText,
  }))
}

export function module1Lesson3PromptContainsUnresolvedVars(text: string): boolean {
  return /\{\{[a-zA-Z0-9.]+}}/.test(text)
}
