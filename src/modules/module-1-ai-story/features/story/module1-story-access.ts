/**
 * 文件说明：模块 1「我的小说」解锁与正文派生。
 * 职责：用同一套判定决定档案按钮、路由和作品页读哪一版四段；不落盘 fullStory。
 * 更新触发：解锁条件、确认版本与当前稿是否一致、或复制全文范围变化时，需要同步更新本文件。
 */

import {
  isModule1Lesson6EditionResolvable,
  type Module1Lesson6ConfirmedEdition,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { module1Lesson6EditionMatchesCurrent } from "@/modules/module-1-ai-story/domains/portfolio/lesson6-update"
import {
  MODULE1_LESSON6_NOVEL_UI,
} from "@/modules/module-1-ai-story/constants/lesson6-copy"
import {
  type Module1StoryReadingPart,
} from "@/modules/module-1-ai-story/features/story/Module1StoryReading"

export function buildModule1StoryCopyText(
  title: string,
  untitledLabel: string,
  parts: Module1StoryReadingPart[],
): string {
  const body = parts.map(part => part.text.trim()).filter(Boolean).join("\n\n")
  const heading = title.trim() || untitledLabel
  return body ? `${heading}\n\n${body}` : heading
}

export type Module1StoryAccess = "locked" | "integrity" | "readable"

export function resolveModule1StoryAccess(portfolio: Module1Portfolio | null): Module1StoryAccess {
  if (!portfolio?.lesson6.completed) return "locked"
  if (!isModule1Lesson6EditionResolvable(portfolio.lesson6.confirmedEdition)) return "integrity"
  return "readable"
}

export function module1StoryNeedsReview(portfolio: Module1Portfolio): boolean {
  if (resolveModule1StoryAccess(portfolio) !== "readable") return false
  if (!module1Lesson6EditionMatchesCurrent(portfolio)) return true
  return portfolio.lesson6.reviewNeeded.plan
    || portfolio.lesson6.reviewNeeded.draft
    || portfolio.lesson6.reviewNeeded.final
}

export function buildModule1ConfirmedStoryParts(
  edition: Module1Lesson6ConfirmedEdition,
): Module1StoryReadingPart[] {
  return [
    { id: "opening", label: MODULE1_LESSON6_NOVEL_UI.partOpening, text: edition.openingText },
    { id: "development", label: MODULE1_LESSON6_NOVEL_UI.partDevelopment, text: edition.developmentText },
    { id: "turn", label: MODULE1_LESSON6_NOVEL_UI.partTurn, text: edition.turnText },
    { id: "ending", label: MODULE1_LESSON6_NOVEL_UI.partEnding, text: edition.endingText },
  ]
}

export function buildModule1ConfirmedStoryCopyText(edition: Module1Lesson6ConfirmedEdition): string {
  return buildModule1StoryCopyText(
    edition.storyTitle,
    MODULE1_LESSON6_NOVEL_UI.noTitle,
    buildModule1ConfirmedStoryParts(edition),
  )
}
