/**
 * 文件说明：模块 1 课时 3 字段更新、初稿冻结与复核标记。
 * 职责：在写入开场、初稿或确认稿时保留另一版正文，并按内容包规则标记待复核；导出前由保存协调器 flush。
 * 更新触发：课时 3 复核范围、初稿冻结时机或上下游失效规则变化时，需要同步更新本文件。
 */

import {
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3AiProcess,
  type Module1Lesson3PromptId,
  type Module1Lesson3ReviewNeeded,
  type Module1Lesson3State,
  type Module1Portfolio,
  createEmptyModule1Lesson3AiProcess,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function lesson1ContextChanged(previous: Module1Lesson1State, next: Module1Lesson1State): boolean {
  return previous.sdg !== next.sdg
    || previous.sdgWhy !== next.sdgWhy
    || previous.cityIssue !== next.cityIssue
    || previous.audience !== next.audience
    || previous.audienceConcern !== next.audienceConcern
}

function lesson2ContextChanged(previous: Module1Lesson2State, next: Module1Lesson2State): boolean {
  const prevChar = previous.character
  const nextChar = next.character
  return previous.writingPlan !== next.writingPlan
    || previous.reason !== next.reason
    || prevChar.who !== nextChar.who
    || prevChar.want !== nextChar.want
    || prevChar.blocked !== nextChar.blocked
    || prevChar.firstAction !== nextChar.firstAction
    || prevChar.possibleChange !== nextChar.possibleChange
}

function hasLesson3DownstreamWork(state: Module1Lesson3State): boolean {
  return hasText(state.openingPlan)
    || hasText(state.focusTechnique)
    || hasText(state.draftText)
    || hasText(state.finalText)
}

export function recordModule1Lesson3AiCopy(
  process: Module1Lesson3AiProcess,
  generatedPrompt: string,
  copiedPrompt: string,
  copiedAt = new Date().toISOString(),
): Module1Lesson3AiProcess {
  return {
    generatedPromptSnapshot: generatedPrompt,
    copiedPrompt,
    aiReply: process.aiReply,
    promptEdited: generatedPrompt.trim() !== copiedPrompt.trim(),
    copySucceeded: true,
    copiedAt,
    copyCount: process.copyCount + 1,
  }
}

export function patchModule1Lesson3AiProcess(
  state: Module1Lesson3State,
  promptId: Module1Lesson3PromptId,
  patch: Partial<Module1Lesson3AiProcess>,
): Module1Lesson3State {
  return {
    ...state,
    aiProcess: {
      ...state.aiProcess,
      [promptId]: {
        ...createEmptyModule1Lesson3AiProcess(),
        ...state.aiProcess[promptId],
        ...patch,
      },
    },
  }
}

export function freezeModule1Lesson3Draft(state: Module1Lesson3State): Module1Lesson3State {
  if (hasText(state.draftFrozenText) || !hasText(state.draftText)) return state
  return { ...state, draftFrozenText: state.draftText }
}

export function finalizeModule1Lesson3State(
  previous: Module1Lesson3State,
  draft: Module1Lesson3State,
): Module1Lesson3State {
  const reviewNeeded: Module1Lesson3ReviewNeeded = { ...draft.reviewNeeded }
  const openingChanged = previous.openingPlan !== draft.openingPlan || previous.focusTechnique !== draft.focusTechnique
  if (openingChanged && (hasText(previous.openingPlan) || hasText(previous.focusTechnique))) {
    if (hasText(draft.draftText)) reviewNeeded.draft = true
    if (hasText(draft.finalText)) reviewNeeded.final = true
  }
  if (previous.draftText !== draft.draftText && hasText(previous.draftText) && hasText(draft.finalText)) {
    reviewNeeded.final = true
  }
  return { ...draft, reviewNeeded }
}

export function applyModule1Lesson3UpstreamReview(
  previous: Module1Portfolio,
  next: Module1Portfolio,
): Module1Portfolio {
  const lesson3 = next.lesson3
  if (!hasLesson3DownstreamWork(lesson3)) return next
  const reviewNeeded = { ...lesson3.reviewNeeded }
  const upstreamChanged = lesson1ContextChanged(previous.lesson1, next.lesson1)
    || lesson2ContextChanged(previous.lesson2, next.lesson2)
  if (upstreamChanged) {
    if (hasText(lesson3.openingPlan) || hasText(lesson3.focusTechnique)) reviewNeeded.opening = true
    if (hasText(lesson3.draftText)) reviewNeeded.draft = true
    if (hasText(lesson3.finalText)) reviewNeeded.final = true
  }
  if (
    reviewNeeded.opening === lesson3.reviewNeeded.opening
    && reviewNeeded.draft === lesson3.reviewNeeded.draft
    && reviewNeeded.final === lesson3.reviewNeeded.final
  ) {
    return next
  }
  return {
    ...next,
    lesson3: { ...lesson3, reviewNeeded },
  }
}

export function clearModule1Lesson3Review(
  state: Module1Lesson3State,
  keys: Array<keyof Module1Lesson3ReviewNeeded>,
): Module1Lesson3State {
  const reviewNeeded = { ...state.reviewNeeded }
  for (const key of keys) reviewNeeded[key] = false
  return { ...state, reviewNeeded }
}
