/**
 * 文件说明：模块 2 课时一修改语义与 gate 重算纯函数。
 * 职责：按 data-contract 第 3 节实现候选草稿保存 / 替换 / 取消、确认来源（换来源与同来源）、改写四句、改动视觉方向、记录样例观察时的确认失效规则；
 *       并只按真实字段与确认状态重算四关与本课完成态，绝不相信档案里的 completed:true。
 * 更新触发：课时一字段、确认 / 失效规则、四关 gate 条件、教学样例规则或身份校验口径变化时，需要同步更新本文件与 lesson1-update 回归测试。
 */

import { validateModule2ClassSeatCode } from "@/modules/module-2-ai-comic/constants/class-options"
import {
  MODULE2_FOUR_PARTS,
  type FourPart,
  type Module2Lesson1StepId,
  type Module2PortfolioV1,
  type SourceImportDraft,
  type SourceSnapshot,
  type StudentIdentity,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

export interface Module2Lesson1Gates {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
  completed: boolean
}

export type Module2Lesson1UpdateResult =
  | { ok: true; portfolio: Module2PortfolioV1 }
  | { ok: false; reason: string }

export type Module2ConfirmSourceResult =
  | { ok: true; outcome: "confirmed" | "switched" | "same-source"; portfolio: Module2PortfolioV1 }
  | { ok: false; reason: string }

/* ---------------- gate 重算 ---------------- */

export function isModule2IdentityComplete(student: StudentIdentity): boolean {
  return student.clazz.trim() !== ""
    && student.studentName.trim() !== ""
    && validateModule2ClassSeatCode(student.clazz, student.classSeatCode) === null
}

function isSourceContentComplete(source: Pick<SourceImportDraft, "storyTitle" | "parts">): boolean {
  return source.storyTitle.trim() !== "" && MODULE2_FOUR_PARTS.every(part => source.parts[part].trim() !== "")
}

/** 视觉词只做去空白与去重，不限定预设词。 */
export function normalizeModule2VisualWords(words: string[]): string[] {
  const result: string[] = []
  for (const word of words) {
    const trimmed = word.trim()
    if (trimmed && !result.includes(trimmed)) result.push(trimmed)
  }
  return result
}

/**
 * 四关 gate 只看真实字段：
 * - 第 1 关：已确认来源、非教学样例、题目与四段完整、当前档案身份齐全且班学号合法。
 * - 第 2 关：看过样例并写了一条非空观察。
 * - 第 3 关：四句去空白后非空、选景来源等于当前来源、已确认且无待核对标记。
 * - 第 4 关：2—3 个去重后非空的视觉词、理由非空、已确认且无待核对标记。
 * 每关都以前一关为前提；本课完成 = 第 4 关。
 */
export function computeModule2Lesson1Gates(portfolio: Module2PortfolioV1 | null): Module2Lesson1Gates {
  if (!portfolio) return { step1: false, step2: false, step3: false, step4: false, completed: false }
  const { sourceSnapshot: source, lesson1, storyboard, visualDirection } = portfolio

  const step1 = Boolean(
    source
    && !source.isTeachingSample
    && isSourceContentComplete(source)
    && isModule2IdentityComplete(portfolio.student),
  )
  const step2 = step1 && lesson1.sampleViewed && lesson1.sampleObservation.trim() !== ""
  const step3 = step2
    && MODULE2_FOUR_PARTS.every(part => storyboard.frames[part].sceneSentence.trim() !== "")
    && storyboard.sourceSnapshotId !== null
    && storyboard.sourceSnapshotId === source?.id
    && storyboard.confirmedAt !== null
    && !lesson1.reviewNeeded.storyboard
  const words = normalizeModule2VisualWords(visualDirection.words)
  const step4 = step3
    && words.length >= 2
    && words.length <= 3
    && visualDirection.reason.trim() !== ""
    && visualDirection.confirmedAt !== null
    && !lesson1.reviewNeeded.visualDirection

  return { step1, step2, step3, step4, completed: step4 }
}

/** 学生可进入的最远一关：第 1 关始终可进，之后按前一关 gate 放行。 */
export function getModule2Lesson1FurthestStep(portfolio: Module2PortfolioV1 | null): Module2Lesson1StepId {
  const gates = computeModule2Lesson1Gates(portfolio)
  if (gates.step3) return 4
  if (gates.step2) return 3
  if (gates.step1) return 2
  return 1
}

/** 把派生完成标记写回档案（只是缓存，读取时仍以 gate 为准）；完成时间只在首次完成时写入，失效即清空。 */
export function syncModule2Lesson1Flags(portfolio: Module2PortfolioV1, now: string): Module2PortfolioV1 {
  const gates = computeModule2Lesson1Gates(portfolio)
  const furthest = getModule2Lesson1FurthestStep(portfolio)
  const lesson1 = portfolio.lesson1
  return {
    ...portfolio,
    lesson1: {
      ...lesson1,
      step: lesson1.step > furthest ? furthest : lesson1.step,
      step1Completed: gates.step1,
      step2Completed: gates.step2,
      step3Completed: gates.step3,
      step4Completed: gates.step4,
      completed: gates.completed,
      completedAt: gates.completed ? lesson1.completedAt ?? now : null,
    },
  }
}

/* ---------------- 第 1 关：候选与确认 ---------------- */

/** 保存或替换候选草稿；不触碰已确认来源、档案身份与完成态。是否提示“替换候选”由界面负责。 */
export function saveModule2SourceImportDraft(portfolio: Module2PortfolioV1, draft: SourceImportDraft): Module2PortfolioV1 {
  return {
    ...portfolio,
    sourceImportDraft: { ...draft, student: { ...draft.student }, parts: { ...draft.parts } },
  }
}

/** 取消候选：只清空 sourceImportDraft，已确认原作与学习记录不变。 */
export function cancelModule2SourceImportDraft(portfolio: Module2PortfolioV1): Module2PortfolioV1 {
  if (portfolio.sourceImportDraft === null) return portfolio
  return { ...portfolio, sourceImportDraft: null }
}

/** 同一来源：文件 sha256 相同，或题目加四段完全相同。 */
export function isSameModule2Source(
  current: Pick<SourceSnapshot, "sourceFileSha256" | "storyTitle" | "parts">,
  candidate: Pick<SourceImportDraft, "sourceFileSha256" | "storyTitle" | "parts">,
): boolean {
  if (current.sourceFileSha256 && candidate.sourceFileSha256 && current.sourceFileSha256 === candidate.sourceFileSha256) {
    return true
  }
  return current.storyTitle === candidate.storyTitle
    && MODULE2_FOUR_PARTS.every(part => current.parts[part] === candidate.parts[part])
}

/**
 * 确认候选：一次性写入新快照、旧来源进历史、清空草稿，并把核对后的身份写入 portfolio.student。
 * - 同一来源重复确认：不重复写历史、不使任何确认失效，只清空草稿。
 * - 换来源：保留四句与风格，但 reviewNeeded 两项置 true，清除选景与视觉确认时间，第 3、4 关与本课完成态失效。
 * - 观察记录不因换小说删除。
 */
export function confirmModule2SourceImportDraft(
  portfolio: Module2PortfolioV1,
  options: { snapshotId: string; student: StudentIdentity; now: string },
): Module2ConfirmSourceResult {
  const draft = portfolio.sourceImportDraft
  if (!draft) return { ok: false, reason: "还没有待确认的小说。" }
  if (!isSourceContentComplete(draft)) return { ok: false, reason: "题目和起、承、转、合四段都需要填写后才能确认。" }

  const current = portfolio.sourceSnapshot
  const student = { ...options.student }

  if (current && isSameModule2Source(current, draft)) {
    const next = { ...portfolio, student, sourceImportDraft: null }
    return { ok: true, outcome: "same-source", portfolio: syncModule2Lesson1Flags(next, options.now) }
  }

  const snapshot: SourceSnapshot = {
    ...draft,
    student: { ...draft.student },
    parts: { ...draft.parts },
    id: options.snapshotId,
    studentConfirmedAt: options.now,
  }
  let next: Module2PortfolioV1 = {
    ...portfolio,
    student,
    sourceSnapshot: snapshot,
    sourceImportDraft: null,
    sourceHistory: current ? [...portfolio.sourceHistory, current] : portfolio.sourceHistory,
  }
  if (current) {
    next = {
      ...next,
      lesson1: { ...next.lesson1, reviewNeeded: { storyboard: true, visualDirection: true } },
      storyboard: { ...next.storyboard, confirmedAt: null },
      visualDirection: { ...next.visualDirection, confirmedAt: null },
    }
  }
  return { ok: true, outcome: current ? "switched" : "confirmed", portfolio: syncModule2Lesson1Flags(next, options.now) }
}

/* ---------------- 第 2 关：样例观察 ---------------- */

export function markModule2SampleViewed(portfolio: Module2PortfolioV1, now: string): Module2PortfolioV1 {
  if (portfolio.lesson1.sampleViewed) return portfolio
  return syncModule2Lesson1Flags({ ...portfolio, lesson1: { ...portfolio.lesson1, sampleViewed: true } }, now)
}

export function setModule2SampleObservation(portfolio: Module2PortfolioV1, observation: string, now: string): Module2PortfolioV1 {
  if (portfolio.lesson1.sampleObservation === observation) return portfolio
  return syncModule2Lesson1Flags({ ...portfolio, lesson1: { ...portfolio.lesson1, sampleObservation: observation } }, now)
}

/* ---------------- 第 3 关：四句画面 ---------------- */

/** 任意改写或清空一句：清除选景确认；视觉方向保留文本但标为待核对并清除其确认时间。 */
export function setModule2SceneSentence(
  portfolio: Module2PortfolioV1,
  part: FourPart,
  sentence: string,
  now: string,
): Module2PortfolioV1 {
  if (portfolio.storyboard.frames[part].sceneSentence === sentence) return portfolio
  return syncModule2Lesson1Flags({
    ...portfolio,
    lesson1: { ...portfolio.lesson1, reviewNeeded: { ...portfolio.lesson1.reviewNeeded, visualDirection: true } },
    storyboard: {
      ...portfolio.storyboard,
      frames: { ...portfolio.storyboard.frames, [part]: { sceneSentence: sentence } },
      confirmedAt: null,
    },
    visualDirection: { ...portfolio.visualDirection, confirmedAt: null },
  }, now)
}

export function confirmModule2Storyboard(portfolio: Module2PortfolioV1, now: string): Module2Lesson1UpdateResult {
  const gates = computeModule2Lesson1Gates(portfolio)
  if (!gates.step2 || !portfolio.sourceSnapshot) return { ok: false, reason: "请先完成前两关。" }
  if (!MODULE2_FOUR_PARTS.every(part => portfolio.storyboard.frames[part].sceneSentence.trim() !== "")) {
    return { ok: false, reason: "起、承、转、合四个画面都需要写一句话。" }
  }
  return {
    ok: true,
    portfolio: syncModule2Lesson1Flags({
      ...portfolio,
      lesson1: { ...portfolio.lesson1, reviewNeeded: { ...portfolio.lesson1.reviewNeeded, storyboard: false } },
      storyboard: { ...portfolio.storyboard, sourceSnapshotId: portfolio.sourceSnapshot.id, confirmedAt: now },
    }, now),
  }
}

/* ---------------- 第 4 关：视觉方向 ---------------- */

function invalidateVisualDirection(
  portfolio: Module2PortfolioV1,
  patch: Partial<Module2PortfolioV1["visualDirection"]>,
  now: string,
): Module2PortfolioV1 {
  return syncModule2Lesson1Flags({
    ...portfolio,
    visualDirection: { ...portfolio.visualDirection, ...patch, confirmedAt: null },
  }, now)
}

/** 任意增删改视觉词都清除视觉确认，不只在变为空时失效。 */
export function setModule2VisualWords(portfolio: Module2PortfolioV1, words: string[], now: string): Module2PortfolioV1 {
  const current = portfolio.visualDirection.words
  if (current.length === words.length && current.every((word, index) => word === words[index])) return portfolio
  return invalidateVisualDirection(portfolio, { words: [...words] }, now)
}

export function setModule2VisualReason(portfolio: Module2PortfolioV1, reason: string, now: string): Module2PortfolioV1 {
  if (portfolio.visualDirection.reason === reason) return portfolio
  return invalidateVisualDirection(portfolio, { reason }, now)
}

/** 参考风格属于学生确认的视觉方向，改动同样需要重新确认。 */
export function setModule2ReferenceStyle(portfolio: Module2PortfolioV1, styleId: string | null, now: string): Module2PortfolioV1 {
  if (portfolio.visualDirection.referenceStyleId === styleId) return portfolio
  return invalidateVisualDirection(portfolio, { referenceStyleId: styleId }, now)
}

export function confirmModule2VisualDirection(portfolio: Module2PortfolioV1, now: string): Module2Lesson1UpdateResult {
  if (!computeModule2Lesson1Gates(portfolio).step3) return { ok: false, reason: "请先确认四个画面。" }
  const words = normalizeModule2VisualWords(portfolio.visualDirection.words)
  if (words.length < 2 || words.length > 3) return { ok: false, reason: "请选择 2—3 个不同的视觉词。" }
  if (portfolio.visualDirection.reason.trim() === "") return { ok: false, reason: "请写一句选择理由。" }
  return {
    ok: true,
    portfolio: syncModule2Lesson1Flags({
      ...portfolio,
      lesson1: { ...portfolio.lesson1, reviewNeeded: { ...portfolio.lesson1.reviewNeeded, visualDirection: false } },
      visualDirection: { ...portfolio.visualDirection, words, confirmedAt: now },
    }, now),
  }
}
