/**
 * 文件说明：模块 1 课时 2 字段更新与复核标记。
 * 职责：在写入观察、参照、写法、理由或人物时同步旧字段，并按内容包规则标记待复核。
 * 更新触发：课时 2 复核范围、参照身份字段或上下游失效规则变化时，需要同步更新本文件。
 */

import {
  syncModule1Lesson2MappedFields,
  type Module1Lesson1State,
  type Module1Lesson2Reference,
  type Module1Lesson2ReviewNeeded,
  type Module1Lesson2State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

const REFERENCE_IDENTITY_KEYS: Array<keyof Module1Lesson2Reference> = [
  "origin",
  "caseId",
  "workTitle",
  "author",
  "location",
  "versionNote",
  "excerpt",
  "sourceNote",
]

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function hasReferenceContent(reference: Module1Lesson2Reference): boolean {
  return REFERENCE_IDENTITY_KEYS.some(key => {
    const value = reference[key]
    return typeof value === "string" ? hasText(value) : false
  })
}

function hasCharacterContent(state: Module1Lesson2State): boolean {
  const character = state.character
  return [character.who, character.want, character.blocked, character.firstAction, character.possibleChange]
    .some(hasText)
}

function referenceIdentityChanged(
  previous: Module1Lesson2Reference,
  next: Module1Lesson2Reference,
): boolean {
  return REFERENCE_IDENTITY_KEYS.some(key => previous[key] !== next[key])
}

export function finalizeModule1Lesson2State(
  previous: Module1Lesson2State,
  draft: Module1Lesson2State,
): Module1Lesson2State {
  const reviewNeeded: Module1Lesson2ReviewNeeded = { ...draft.reviewNeeded }
  let reference = { ...draft.reference }

  if (hasText(previous.study.caseId) && previous.study.caseId !== draft.study.caseId && hasText(previous.study.response)) {
    reviewNeeded.study = true
  }

  if (hasReferenceContent(previous.reference) && referenceIdentityChanged(previous.reference, draft.reference)) {
    reference = { ...reference, sourceConfirmed: false }
    if (hasText(draft.writingPlan)) reviewNeeded.writingPlan = true
    if (hasText(draft.reason)) reviewNeeded.reason = true
    if (hasCharacterContent(draft)) reviewNeeded.character = true
  }

  if (previous.writingPlan !== draft.writingPlan && hasText(previous.writingPlan)) {
    if (hasText(draft.reason)) reviewNeeded.reason = true
    if (hasCharacterContent(draft)) reviewNeeded.character = true
  }

  if (previous.reason !== draft.reason && hasText(previous.reason) && hasCharacterContent(draft)) {
    reviewNeeded.character = true
  }

  return syncModule1Lesson2MappedFields({
    ...draft,
    reference,
    reviewNeeded,
  })
}

function lesson1ContextChanged(previous: Module1Lesson1State, next: Module1Lesson1State): boolean {
  return previous.sdg !== next.sdg
    || previous.sdgWhy !== next.sdgWhy
    || previous.cityIssue !== next.cityIssue
    || previous.audience !== next.audience
    || previous.audienceConcern !== next.audienceConcern
}

function hasLesson2DownstreamWork(state: Module1Lesson2State): boolean {
  return hasReferenceContent(state.reference)
    || hasText(state.writingPlan)
    || hasText(state.reason)
    || hasCharacterContent(state)
}

export function applyModule1Lesson1UpstreamReview(
  previous: Module1Portfolio,
  next: Module1Portfolio,
): Module1Portfolio {
  if (!lesson1ContextChanged(previous.lesson1, next.lesson1) || !hasLesson2DownstreamWork(next.lesson2)) {
    return next
  }
  const reviewNeeded = { ...next.lesson2.reviewNeeded }
  if (hasReferenceContent(next.lesson2.reference)) reviewNeeded.reference = true
  if (hasText(next.lesson2.writingPlan)) reviewNeeded.writingPlan = true
  if (hasText(next.lesson2.reason)) reviewNeeded.reason = true
  if (hasCharacterContent(next.lesson2)) reviewNeeded.character = true
  return {
    ...next,
    lesson2: {
      ...next.lesson2,
      reviewNeeded,
    },
  }
}

export function clearModule1Lesson2Review(
  state: Module1Lesson2State,
  keys: Array<keyof Module1Lesson2ReviewNeeded>,
): Module1Lesson2State {
  const reviewNeeded = { ...state.reviewNeeded }
  for (const key of keys) reviewNeeded[key] = false
  return { ...state, reviewNeeded }
}
