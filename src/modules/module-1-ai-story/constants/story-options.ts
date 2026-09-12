/**
 * 文件说明：模块 1 课时 2 参照填入辅助。
 * 职责：把课堂文学案例转成可写入档案的参照字段；旧 8 张风格卡不再进入主流程。
 * 更新触发：课堂案例自动填入字段、来源口径或案例清单变化时，需要同步更新本文件。
 */

import type { Module1Lesson2Reference } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1ClassroomSourceNote,
  buildModule1ClassroomVersionNote,
  getModule1LiteraryCaseById,
  MODULE1_LITERARY_CASES,
  type Module1LiteraryCase,
} from "@/modules/module-1-ai-story/constants/literary-cases"

export { MODULE1_LITERARY_CASES, getModule1LiteraryCaseById }

export function buildModule1ClassroomReference(caseId: string): Module1Lesson2Reference | null {
  const literaryCase = getModule1LiteraryCaseById(caseId)
  if (!literaryCase) return null
  return buildModule1ClassroomReferenceFromCase(literaryCase)
}

export function buildModule1ClassroomReferenceFromCase(
  literaryCase: Module1LiteraryCase,
): Module1Lesson2Reference {
  return {
    origin: "classroom",
    caseId: literaryCase.id,
    workTitle: literaryCase.workTitle,
    author: literaryCase.author,
    location: literaryCase.classroomLocation,
    versionNote: buildModule1ClassroomVersionNote(literaryCase),
    excerpt: literaryCase.excerpt,
    sourceNote: buildModule1ClassroomSourceNote(literaryCase),
    sourceConfirmed: false,
  }
}

export function hasExistingModule1Reference(reference: Module1Lesson2Reference): boolean {
  return Boolean(
    reference.workTitle.trim()
    || reference.author.trim()
    || reference.excerpt.trim()
    || reference.sourceNote.trim()
    || reference.location.trim(),
  )
}

export function isSameModule1ReferenceIdentity(
  left: Module1Lesson2Reference,
  right: Module1Lesson2Reference,
): boolean {
  return left.origin === right.origin
    && left.caseId === right.caseId
    && left.workTitle === right.workTitle
    && left.author === right.author
    && left.location === right.location
    && left.versionNote === right.versionNote
    && left.excerpt === right.excerpt
    && left.sourceNote === right.sourceNote
}
