/**
 * 文件说明：模块 1 课时 2 字段更新与复核标记。
 * 职责：在写入观察、参照、写法、理由或人物时同步旧字段，并按内容包规则标记待复核。
 * 更新触发：课时 2 复核范围、参照分槽、参照身份字段或上下游失效规则变化时，需要同步更新本文件。
 */

import {
  getModule1Lesson2ActiveReferenceSlot,
  hasModule1Lesson2ReferenceSlotContent,
  patchModule1Lesson2ActiveReference,
  projectModule1Lesson2Reference,
  syncModule1Lesson2DerivedReference,
  syncModule1Lesson2MappedFields,
  type Module1Lesson1State,
  type Module1Lesson2Reference,
  type Module1Lesson2ReferenceSlot,
  type Module1Lesson2ReviewNeeded,
  type Module1Lesson2State,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

const REFERENCE_SLOT_IDENTITY_KEYS: Array<keyof Module1Lesson2ReferenceSlot> = [
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

function hasActiveReferenceContent(reference: Module1Lesson2Reference): boolean {
  return hasModule1Lesson2ReferenceSlotContent(
    getModule1Lesson2ActiveReferenceSlot(projectModule1Lesson2Reference(reference)),
  )
}

function activeReferenceIdentityChanged(
  previous: Module1Lesson2Reference,
  next: Module1Lesson2Reference,
): boolean {
  if (previous.origin !== next.origin) return true
  const previousSlot = getModule1Lesson2ActiveReferenceSlot(projectModule1Lesson2Reference(previous))
  const nextSlot = getModule1Lesson2ActiveReferenceSlot(projectModule1Lesson2Reference(next))
  return REFERENCE_SLOT_IDENTITY_KEYS.some(key => previousSlot[key] !== nextSlot[key])
}

function hasCharacterContent(state: Module1Lesson2State): boolean {
  const character = state.character
  return [character.who, character.want, character.blocked, character.firstAction, character.possibleChange]
    .some(hasText)
}

export function finalizeModule1Lesson2State(
  previous: Module1Lesson2State,
  draft: Module1Lesson2State,
): Module1Lesson2State {
  const reviewNeeded: Module1Lesson2ReviewNeeded = { ...draft.reviewNeeded }
  let reference = projectModule1Lesson2Reference(draft.reference)

  if (hasText(previous.study.caseId) && previous.study.caseId !== draft.study.caseId && hasText(previous.study.response)) {
    reviewNeeded.study = true
  }

  if (hasActiveReferenceContent(previous.reference) && activeReferenceIdentityChanged(previous.reference, draft.reference)) {
    // 同一来源内改了作品身份才清该槽已阅读；切换来源只换当前槽，不清另一套。
    if (previous.reference.origin === draft.reference.origin) {
      reference = patchModule1Lesson2ActiveReference(reference, { sourceConfirmed: false })
    }
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

  return syncModule1Lesson2MappedFields(syncModule1Lesson2DerivedReference({
    ...draft,
    reference,
    reviewNeeded,
  }))
}

function lesson1ContextChanged(previous: Module1Lesson1State, next: Module1Lesson1State): boolean {
  return previous.sdg !== next.sdg
    || previous.sdgWhy !== next.sdgWhy
    || previous.cityIssue !== next.cityIssue
    || previous.audience !== next.audience
    || previous.audienceConcern !== next.audienceConcern
}

function hasLesson2DownstreamWork(state: Module1Lesson2State): boolean {
  const reference = projectModule1Lesson2Reference(state.reference)
  return hasModule1Lesson2ReferenceSlotContent(reference.classroomDraft)
    || hasModule1Lesson2ReferenceSlotContent(reference.foundDraft)
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
  if (hasActiveReferenceContent(next.lesson2.reference)) reviewNeeded.reference = true
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
