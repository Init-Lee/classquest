/**
 * 文件说明：模块 1 课时 2 外部 AI 提示词拼装器。
 * 职责：按内容包 P1/P2A/P2B/P3/P4 模板做一次变量替换，只生成可复制文本，不调用模型。
 * 更新触发：提示词模板、课时 1 上下文格式、参照字段或人物草案组装变化时，需要同步更新本文件。
 */

import {
  hasModule1Lesson1PromptContext,
  hasModule1Lesson2Reason,
  hasModule1Lesson2ReferenceFields,
  hasModule1Lesson2WritingPlan,
  MODULE1_STORY_YEAR,
  type Module1Lesson1State,
  type Module1Lesson2Character,
  type Module1Lesson2Reference,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_EMPTY_CHARACTER_DRAFT,
  MODULE1_LESSON2_MISSING_LESSON1_FIELD,
  MODULE1_LESSON2_PROMPTS,
  MODULE1_LESSON2_SHARED_COPY,
  MODULE1_LESSON2_UNFILLED_VERSION_NOTE,
} from "@/modules/module-1-ai-story/constants/lesson2-copy"
import {
  getModule1LiteraryCaseById,
  type Module1LiteraryCase,
} from "@/modules/module-1-ai-story/constants/literary-cases"
import { buildModule1ClassroomReferenceFromCase } from "@/modules/module-1-ai-story/constants/story-options"

export type Module1Lesson2PromptId = "P1" | "P2A" | "P2B" | "P3" | "P4"

export interface Module1Lesson2PromptResult {
  ok: boolean
  text: string
  error: string
}

function optionalLesson1Field(value: string): string {
  return value.trim() || MODULE1_LESSON2_MISSING_LESSON1_FIELD
}

export function buildModule1Lesson1Context(lesson1: Module1Lesson1State): string {
  return [
    `故事年份：${MODULE1_STORY_YEAR}`,
    `SDG主题：${lesson1.sdg.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `选择这一主题的理由：${optionalLesson1Field(lesson1.sdgWhy)}`,
    `城市问题：${lesson1.cityIssue.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `我写给谁：${lesson1.audience.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `对方关心的事：${optionalLesson1Field(lesson1.audienceConcern)}`,
    "作品形式：以第一人称讲述未来城市故事，并保留给上述对象写信的设定。",
  ].join("\n")
}

export function buildModule1CharacterDraft(character: Module1Lesson2Character): string {
  const lines = [
    `身份与关系：${character.who.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `愿望与原因：${character.want.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `阻碍与依据：${character.blocked.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `准备先尝试的行动：${character.firstAction.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
    `可能发生的变化：${character.possibleChange.trim() || MODULE1_LESSON2_SHARED_COPY.notFilled}`,
  ]
  const hasAny = [character.who, character.want, character.blocked, character.firstAction, character.possibleChange]
    .some(value => value.trim())
  return hasAny ? lines.join("\n") : MODULE1_LESSON2_EMPTY_CHARACTER_DRAFT
}

function referenceVersionNote(reference: Pick<Module1Lesson2Reference, "versionNote">): string {
  return reference.versionNote.trim() || MODULE1_LESSON2_UNFILLED_VERSION_NOTE
}

export function buildModule1ReferenceFromLiteraryCase(literaryCase: Module1LiteraryCase): Module1Lesson2Reference {
  return buildModule1ClassroomReferenceFromCase(literaryCase)
}

function replaceTemplateOnce(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

function fail(error: string): Module1Lesson2PromptResult {
  return { ok: false, text: "", error }
}

function succeed(text: string): Module1Lesson2PromptResult {
  return { ok: true, text, error: "" }
}

export function buildModule1Lesson2Prompt(
  promptId: Module1Lesson2PromptId,
  portfolio: Module1Portfolio,
  options: { selectedCaseId?: string } = {},
): Module1Lesson2PromptResult {
  const lesson2 = portfolio.lesson2

  if (promptId === "P1") {
    const caseId = options.selectedCaseId?.trim() || lesson2.study.caseId.trim()
    const literaryCase = getModule1LiteraryCaseById(caseId)
    if (!literaryCase) return fail(MODULE1_LESSON2_PAGES_STEP1_CASE)
    const reference = buildModule1ReferenceFromLiteraryCase(literaryCase)
    return succeed(replaceTemplateOnce(MODULE1_LESSON2_PROMPTS.P1, {
      "reference.workTitle": reference.workTitle,
      "reference.author": reference.author,
      "reference.versionNote": referenceVersionNote(reference),
      "reference.excerpt": reference.excerpt,
    }))
  }

  if (!hasModule1Lesson1PromptContext(portfolio.lesson1)) {
    return fail("城市问题或写给谁缺失，请返回课时1补全。")
  }

  const lesson1Context = buildModule1Lesson1Context(portfolio.lesson1)

  if (promptId === "P2A") {
    return succeed(replaceTemplateOnce(MODULE1_LESSON2_PROMPTS.P2A, { lesson1Context }))
  }

  if (promptId === "P2B") {
    if (!lesson2.reference.excerpt.trim()) {
      return fail(MODULE1_LESSON2_SHARED_COPY.excerptMissing)
    }
    if (!hasModule1Lesson2ReferenceFields(lesson2)) {
      return fail(MODULE1_LESSON2_SHARED_COPY.incompletePrompt)
    }
    return succeed(replaceTemplateOnce(MODULE1_LESSON2_PROMPTS.P2B, {
      lesson1Context,
      "reference.workTitle": lesson2.reference.workTitle,
      "reference.author": lesson2.reference.author,
      "reference.location": lesson2.reference.location,
      "reference.versionNote": referenceVersionNote(lesson2.reference),
      "reference.sourceNote": lesson2.reference.sourceNote,
      "reference.excerpt": lesson2.reference.excerpt,
    }))
  }

  if (promptId === "P3") {
    if (!hasModule1Lesson2WritingPlan(lesson2)) {
      return fail(MODULE1_LESSON2_SHARED_COPY.incompletePrompt)
    }
    return succeed(replaceTemplateOnce(MODULE1_LESSON2_PROMPTS.P3, {
      lesson1Context,
      "reference.workTitle": lesson2.reference.workTitle,
      "reference.author": lesson2.reference.author,
      writingPlan: lesson2.writingPlan,
    }))
  }

  if (!hasModule1Lesson2WritingPlan(lesson2) || !hasModule1Lesson2Reason(lesson2)) {
    return fail(MODULE1_LESSON2_SHARED_COPY.incompletePrompt)
  }
  return succeed(replaceTemplateOnce(MODULE1_LESSON2_PROMPTS.P4, {
    lesson1Context,
    writingPlan: lesson2.writingPlan,
    reason: lesson2.reason,
    characterDraft: buildModule1CharacterDraft(lesson2.character),
  }))
}

const MODULE1_LESSON2_PAGES_STEP1_CASE = "请先选择一个课堂片段。"

export function module1Lesson2PromptContainsUnresolvedVars(text: string): boolean {
  return /\{\{[a-zA-Z0-9.]+}}/.test(text)
}

export function canCopyModule1Lesson2Prompt(
  promptId: Module1Lesson2PromptId,
  portfolio: Module1Portfolio,
  options: { selectedCaseId?: string } = {},
): boolean {
  return buildModule1Lesson2Prompt(promptId, portfolio, options).ok
}
