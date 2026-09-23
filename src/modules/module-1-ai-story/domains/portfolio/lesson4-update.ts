/**
 * 文件说明：模块 1 课时 4 字段更新、初稿冻结与复核标记。
 * 职责：在写入情节安排、初稿或确认稿时保留另一版正文，并按内容包规则标记待复核；导出前由保存协调器 flush。
 * 更新触发：课时 4 复核范围、初稿冻结时机或上下游失效规则变化时，需要同步更新本文件。
 */

import {
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3State,
  type Module1Lesson4AiProcess,
  type Module1Lesson4PromptId,
  type Module1Lesson4ReviewNeeded,
  type Module1Lesson4State,
  type Module1Portfolio,
  createEmptyModule1Lesson4AiProcess,
  hasModule1Lesson4AiReplyIfUsed,
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

function lesson3OpeningChanged(previous: Module1Lesson3State, next: Module1Lesson3State): boolean {
  return previous.finalText !== next.finalText
}

function hasLesson4DownstreamWork(state: Module1Lesson4State): boolean {
  return hasText(state.plotPlan)
    || hasText(state.planReason)
    || hasText(state.draftText)
    || hasText(state.finalText)
}

export function recordModule1Lesson4AiCopy(
  process: Module1Lesson4AiProcess,
  generatedPrompt: string,
  copiedPrompt: string,
  contextKey = "",
  copiedAt = new Date().toISOString(),
): Module1Lesson4AiProcess {
  return {
    generatedPromptSnapshot: generatedPrompt,
    copiedPrompt,
    aiReply: process.aiReply,
    promptEdited: generatedPrompt.trim() !== copiedPrompt.trim(),
    copySucceeded: true,
    copiedAt,
    copyCount: process.copyCount + 1,
    contextKey,
  }
}

export function hasModule1Lesson4CurrentRequiredAi(
  process: Module1Lesson4AiProcess,
  currentContextKey: string,
): boolean {
  return process.copySucceeded
    && Boolean(process.aiReply.trim())
    && Boolean(process.contextKey.trim())
    && process.contextKey === currentContextKey
}

export function patchModule1Lesson4AiProcess(
  state: Module1Lesson4State,
  promptId: Module1Lesson4PromptId,
  patch: Partial<Module1Lesson4AiProcess>,
): Module1Lesson4State {
  return {
    ...state,
    aiProcess: {
      ...state.aiProcess,
      [promptId]: {
        ...createEmptyModule1Lesson4AiProcess(),
        ...state.aiProcess[promptId],
        ...patch,
      },
    },
  }
}

export function freezeModule1Lesson4Draft(state: Module1Lesson4State): Module1Lesson4State {
  if (hasText(state.draftFrozenText) || !hasText(state.draftText)) return state
  return { ...state, draftFrozenText: state.draftText }
}

export function finalizeModule1Lesson4State(
  previous: Module1Lesson4State,
  draft: Module1Lesson4State,
): Module1Lesson4State {
  const reviewNeeded: Module1Lesson4ReviewNeeded = { ...draft.reviewNeeded }
  const planChanged = previous.plotPlan !== draft.plotPlan || previous.planReason !== draft.planReason
  if (planChanged && (hasText(previous.plotPlan) || hasText(previous.planReason))) {
    if (hasText(draft.draftText)) reviewNeeded.draft = true
    if (hasText(draft.finalText)) reviewNeeded.final = true
  }
  if (previous.draftText !== draft.draftText && hasText(previous.draftText) && hasText(draft.finalText)) {
    reviewNeeded.final = true
  }
  return { ...draft, reviewNeeded }
}

export function applyModule1Lesson4UpstreamReview(
  previous: Module1Portfolio,
  next: Module1Portfolio,
): Module1Portfolio {
  const lesson4 = next.lesson4
  if (!hasLesson4DownstreamWork(lesson4)) return next
  const reviewNeeded = { ...lesson4.reviewNeeded }
  const upstreamChanged = lesson1ContextChanged(previous.lesson1, next.lesson1)
    || lesson2ContextChanged(previous.lesson2, next.lesson2)
    || lesson3OpeningChanged(previous.lesson3, next.lesson3)
  if (upstreamChanged) {
    if (hasText(lesson4.plotPlan) || hasText(lesson4.planReason)) reviewNeeded.plan = true
    if (hasText(lesson4.draftText)) reviewNeeded.draft = true
    if (hasText(lesson4.finalText)) reviewNeeded.final = true
  }
  if (
    reviewNeeded.plan === lesson4.reviewNeeded.plan
    && reviewNeeded.draft === lesson4.reviewNeeded.draft
    && reviewNeeded.final === lesson4.reviewNeeded.final
  ) {
    return next
  }
  return {
    ...next,
    lesson4: { ...lesson4, reviewNeeded },
  }
}

export function clearModule1Lesson4Review(
  state: Module1Lesson4State,
  keys: Array<keyof Module1Lesson4ReviewNeeded>,
): Module1Lesson4State {
  const reviewNeeded = { ...state.reviewNeeded }
  for (const key of keys) reviewNeeded[key] = false
  return { ...state, reviewNeeded }
}

export function matchesModule1Lesson4CopiedContext(
  process: Module1Lesson4AiProcess,
  currentContextKey: string,
): boolean {
  if (!process.copySucceeded) return false
  if (!process.contextKey.trim() || !currentContextKey.trim()) return false
  return process.contextKey === currentContextKey
}

export function hasModule1Lesson4CurrentDraft(
  state: Module1Lesson4State,
  currentContextKey: string,
): boolean {
  return Boolean(state.draftText.trim())
    && hasModule1Lesson4CurrentRequiredAi(state.aiProcess.p3, currentContextKey)
}

export function hasModule1Lesson4CurrentFinal(
  state: Module1Lesson4State,
  currentContextKey: string,
): boolean {
  return Boolean(state.finalText.trim() && state.decisionNote.trim())
    && state.selfCheck
    && hasModule1Lesson4CurrentRequiredAi(state.aiProcess.p4, currentContextKey)
    && hasModule1Lesson4AiReplyIfUsed(state.aiProcess.p5)
}
