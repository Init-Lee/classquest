/**
 * 文件说明：模块 1 课时 6 字段更新、初稿冻结与复核标记。
 * 职责：在写入情节安排、初稿或确认稿时保留另一版正文，并按内容包规则标记待复核；第 3 关完成后硬锁初稿（忽略 draftText 回写），第 4 关只改确认稿；确认稿变化时作废过期的 P4/P5 自定义提示词。
 * 更新触发：课时 6 复核范围、初稿硬锁时机、检查提示词刷新或上下游失效规则变化时，需要同步更新本文件。
 */

import {
  type Module1Lesson1State,
  type Module1Lesson2State,
  type Module1Lesson3State,
  type Module1Lesson4State,
  type Module1Lesson5State,
  type Module1Lesson6AiProcess,
  type Module1Lesson6ConfirmedEdition,
  type Module1Lesson6PromptId,
  type Module1Lesson6ReviewNeeded,
  type Module1Lesson6State,
  type Module1Portfolio,
  createEmptyModule1Lesson6AiProcess,
  hasModule1Lesson6AiReplyIfUsed,
  isModule1Lesson6EditionResolvable,
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

function lesson3StoryChanged(previous: Module1Lesson3State, next: Module1Lesson3State): boolean {
  return previous.finalText !== next.finalText || previous.storyTitle !== next.storyTitle
}

function lesson4DevelopmentChanged(previous: Module1Lesson4State, next: Module1Lesson4State): boolean {
  return previous.finalText !== next.finalText
}

function lesson5TurnChanged(previous: Module1Lesson5State, next: Module1Lesson5State): boolean {
  return previous.finalText !== next.finalText
}

function hasLesson6DownstreamWork(state: Module1Lesson6State): boolean {
  return hasText(state.plotPlan)
    || hasText(state.planReason)
    || hasText(state.draftText)
    || hasText(state.finalText)
}

export function recordModule1Lesson6AiCopy(
  process: Module1Lesson6AiProcess,
  generatedPrompt: string,
  copiedPrompt: string,
  contextKey = "",
  copiedAt = new Date().toISOString(),
): Module1Lesson6AiProcess {
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

export function hasModule1Lesson6CurrentRequiredAi(
  process: Module1Lesson6AiProcess,
  currentContextKey: string,
): boolean {
  return process.copySucceeded
    && Boolean(process.aiReply.trim())
    && Boolean(process.contextKey.trim())
    && process.contextKey === currentContextKey
}

export function patchModule1Lesson6AiProcess(
  state: Module1Lesson6State,
  promptId: Module1Lesson6PromptId,
  patch: Partial<Module1Lesson6AiProcess>,
): Module1Lesson6State {
  return {
    ...state,
    aiProcess: {
      ...state.aiProcess,
      [promptId]: {
        ...createEmptyModule1Lesson6AiProcess(),
        ...state.aiProcess[promptId],
        ...patch,
      },
    },
  }
}

export function freezeModule1Lesson6Draft(state: Module1Lesson6State): Module1Lesson6State {
  if (hasText(state.draftFrozenText) || !hasText(state.draftText)) return state
  return { ...state, draftFrozenText: state.draftText }
}

function resolveLesson6InspectText(state: Module1Lesson6State): string {
  return state.finalText.trim() || state.draftText
}

export function finalizeModule1Lesson6State(
  previous: Module1Lesson6State,
  draft: Module1Lesson6State,
): Module1Lesson6State {
  // 第 3 关完成后初稿硬锁：忽略任何 draftText 回写，避免回看时改稿带动确认稿。
  const lockedDraft = previous.step3Completed
    ? { ...draft, draftText: previous.draftText }
    : draft
  const reviewNeeded: Module1Lesson6ReviewNeeded = { ...lockedDraft.reviewNeeded }
  let next: Module1Lesson6State = { ...lockedDraft, reviewNeeded }
  const planChanged = previous.plotPlan !== lockedDraft.plotPlan
    || previous.planReason !== lockedDraft.planReason
    || previous.endingType !== lockedDraft.endingType
    || previous.customEndingRequirement !== lockedDraft.customEndingRequirement
  if (planChanged && (hasText(previous.plotPlan) || hasText(previous.planReason) || previous.endingType)) {
    if (hasText(lockedDraft.draftText)) reviewNeeded.draft = true
    if (hasText(lockedDraft.finalText)) reviewNeeded.final = true
  }
  // 进入 P4/P5 的正文或安排变了：作废已编辑的检查类提示词，必须重新复制。
  const inspectChanged = resolveLesson6InspectText(previous) !== resolveLesson6InspectText(next)
  if (
    (inspectChanged || planChanged)
    && (next.customPrompts.p4.trim() || next.customPrompts.p5.trim())
  ) {
    next = {
      ...next,
      customPrompts: { ...next.customPrompts, p4: "", p5: "" },
    }
  }
  if (inspectChanged) {
    next = { ...next, selfCheck: false, previewSeenKey: "" }
  }
  return { ...next, reviewNeeded }
}

export function applyModule1Lesson6UpstreamReview(
  previous: Module1Portfolio,
  next: Module1Portfolio,
): Module1Portfolio {
  const lesson6 = next.lesson6
  if (!hasLesson6DownstreamWork(lesson6)) return next
  const reviewNeeded = { ...lesson6.reviewNeeded }
  const upstreamChanged = lesson1ContextChanged(previous.lesson1, next.lesson1)
    || lesson2ContextChanged(previous.lesson2, next.lesson2)
    || lesson3StoryChanged(previous.lesson3, next.lesson3)
    || lesson4DevelopmentChanged(previous.lesson4, next.lesson4)
    || lesson5TurnChanged(previous.lesson5, next.lesson5)
  if (upstreamChanged) {
    if (hasText(lesson6.plotPlan) || hasText(lesson6.planReason) || lesson6.endingType) reviewNeeded.plan = true
    if (hasText(lesson6.draftText)) reviewNeeded.draft = true
    if (hasText(lesson6.finalText)) reviewNeeded.final = true
  }
  const storyTextChanged = lesson3StoryChanged(previous.lesson3, next.lesson3)
    || lesson4DevelopmentChanged(previous.lesson4, next.lesson4)
    || lesson5TurnChanged(previous.lesson5, next.lesson5)
  if (
    !upstreamChanged
    || (
      reviewNeeded.plan === lesson6.reviewNeeded.plan
      && reviewNeeded.draft === lesson6.reviewNeeded.draft
      && reviewNeeded.final === lesson6.reviewNeeded.final
      && !storyTextChanged
    )
  ) {
    return next
  }
  return {
    ...next,
    lesson6: {
      ...lesson6,
      reviewNeeded,
      selfCheck: storyTextChanged ? false : lesson6.selfCheck,
      previewSeenKey: storyTextChanged ? "" : lesson6.previewSeenKey,
    },
  }
}

export function buildModule1Lesson6ConfirmedEdition(
  portfolio: Module1Portfolio,
  confirmedAt: string,
): Module1Lesson6ConfirmedEdition {
  return {
    confirmedAt,
    storyTitle: portfolio.lesson3.storyTitle.trim(),
    openingText: portfolio.lesson3.finalText,
    developmentText: portfolio.lesson4.finalText,
    turnText: portfolio.lesson5.finalText,
    endingText: portfolio.lesson6.finalText,
  }
}

export function module1Lesson6EditionMatchesCurrent(portfolio: Module1Portfolio): boolean {
  const edition = portfolio.lesson6.confirmedEdition
  if (!isModule1Lesson6EditionResolvable(edition)) return false
  return edition.storyTitle === portfolio.lesson3.storyTitle.trim()
    && edition.openingText === portfolio.lesson3.finalText
    && edition.developmentText === portfolio.lesson4.finalText
    && edition.turnText === portfolio.lesson5.finalText
    && edition.endingText === portfolio.lesson6.finalText
}

export function clearModule1Lesson6Review(
  state: Module1Lesson6State,
  keys: Array<keyof Module1Lesson6ReviewNeeded>,
): Module1Lesson6State {
  const reviewNeeded = { ...state.reviewNeeded }
  for (const key of keys) reviewNeeded[key] = false
  return { ...state, reviewNeeded }
}

export function matchesModule1Lesson6CopiedContext(
  process: Module1Lesson6AiProcess,
  currentContextKey: string,
): boolean {
  if (!process.copySucceeded) return false
  if (!process.contextKey.trim() || !currentContextKey.trim()) return false
  return process.contextKey === currentContextKey
}

export function hasModule1Lesson6CurrentDraft(
  state: Module1Lesson6State,
  currentContextKey: string,
): boolean {
  return Boolean(state.draftText.trim())
    && hasModule1Lesson6CurrentRequiredAi(state.aiProcess.p3, currentContextKey)
}

export function hasModule1Lesson6CurrentFinal(
  state: Module1Lesson6State,
  currentContextKey: string,
  previewKey = "",
): boolean {
  return Boolean(state.finalText.trim() && state.decisionNote.trim())
    && state.selfCheck
    && Boolean(previewKey.trim())
    && state.previewSeenKey === previewKey
    && hasModule1Lesson6CurrentRequiredAi(state.aiProcess.p4, currentContextKey)
    && hasModule1Lesson6AiReplyIfUsed(state.aiProcess.p5)
}
