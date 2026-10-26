/**
 * 文件说明：模块 2 课时一修改语义与 gate 重算回归测试。
 * 职责：逐条锁定 data-contract 第 3 节的失效语义（候选保存 / 替换 / 取消、确认来源、同来源、换来源、改四句、改视觉词与理由、观察保留），以及 gate 只按真实字段计算、不信 completed:true、教学样例不能完成第 1 关。
 * 更新触发：lesson1-update.ts 的修改语义、gate 条件或身份校验口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  cancelModule2SourceImportDraft,
  computeModule2Lesson1Gates,
  confirmModule2SourceImportDraft,
  confirmModule2Storyboard,
  confirmModule2VisualDirection,
  getModule2Lesson1FurthestStep,
  markModule2SampleViewed,
  rememberModule2Lesson1Step,
  saveModule2SourceImportDraft,
  setModule2ReferenceStyle,
  setModule2SampleObservation,
  setModule2SceneSentence,
  setModule2VisualReason,
  setModule2VisualWords,
  syncModule2Lesson1Flags,
} from "./lesson1-update"
import {
  createNewModule2Portfolio,
  MODULE2_FOUR_PARTS,
  type Module2PortfolioV1,
  type SourceImportDraft,
} from "./types"
import { MODULE2_LESSON_REGISTRY } from "@/modules/module-2-ai-comic/app/lesson-registry"

const NOW = "2026-10-25T10:00:00.000Z"
const LATER = "2026-10-25T11:00:00.000Z"
const STUDENT = { clazz: "初一（3）班", studentName: "李明", classSeatCode: "0312" }

function draft(overrides: Partial<SourceImportDraft> = {}): SourceImportDraft {
  return {
    origin: "classquest-html-v1",
    filename: "我的小说.html",
    sourceFileSha256: "a".repeat(64),
    importedAt: NOW,
    sourceConfirmedAt: null,
    student: { ...STUDENT },
    storyTitle: "关灯这件事",
    parts: { opening: "起段", development: "承段", turn: "转段", ending: "合段" },
    isTeachingSample: false,
    importNote: "",
    ...overrides,
  }
}

function confirmDraft(portfolio: Module2PortfolioV1, candidate: SourceImportDraft, snapshotId: string) {
  const result = confirmModule2SourceImportDraft(saveModule2SourceImportDraft(portfolio, candidate), {
    snapshotId,
    student: STUDENT,
    now: NOW,
  })
  if (!result.ok) throw new Error(result.reason)
  return result
}

function unwrap(result: { ok: true; portfolio: Module2PortfolioV1 } | { ok: false; reason: string }): Module2PortfolioV1 {
  if (!result.ok) throw new Error(result.reason)
  return result.portfolio
}

function completedPortfolio(): Module2PortfolioV1 {
  let p = confirmDraft(createNewModule2Portfolio(undefined, NOW), draft(), "src-1").portfolio
  p = markModule2SampleViewed(p, NOW)
  p = setModule2SampleObservation(p, "作者删掉了旁枝情节，让读者看清主角的变化。", NOW)
  for (const part of MODULE2_FOUR_PARTS) p = setModule2SceneSentence(p, part, `${part}：主角在楼道里关灯`, NOW)
  p = unwrap(confirmModule2Storyboard(p, NOW))
  p = setModule2VisualWords(p, ["冷暖对比", "清晰线条"], NOW)
  p = setModule2VisualReason(p, "我选择冷暖对比，因为想让读者看清灯光的变化。", NOW)
  return unwrap(confirmModule2VisualDirection(p, NOW))
}

describe("gate 重算", () => {
  it("空草稿四关都未完成，只能进入第 1 关", () => {
    const gates = computeModule2Lesson1Gates(createNewModule2Portfolio())
    expect(gates).toEqual({ step1: false, step2: false, step3: false, step4: false, completed: false })
    expect(getModule2Lesson1FurthestStep(createNewModule2Portfolio())).toBe(1)
    expect(computeModule2Lesson1Gates(null).completed).toBe(false)
  })

  it("真实填写并逐关确认后全部完成，派生标记与完成时间同步", () => {
    const p = completedPortfolio()
    expect(computeModule2Lesson1Gates(p)).toEqual({ step1: true, step2: true, step3: true, step4: true, completed: true })
    expect(p.lesson1).toMatchObject({ step1Completed: true, step4Completed: true, completed: true, completedAt: NOW })
    expect(MODULE2_LESSON_REGISTRY[0].isComplete(p)).toBe(true)
  })

  it("不相信伪造的 completed:true", () => {
    const forged = createNewModule2Portfolio()
    forged.lesson1 = { ...forged.lesson1, step: 4, step1Completed: true, step2Completed: true, step3Completed: true, step4Completed: true, completed: true, completedAt: NOW }
    expect(computeModule2Lesson1Gates(forged).completed).toBe(false)
    expect(getModule2Lesson1FurthestStep(forged)).toBe(1)
    expect(MODULE2_LESSON_REGISTRY[0].isComplete(forged)).toBe(false)
    const synced = syncModule2Lesson1Flags(forged, NOW)
    expect(synced.lesson1).toMatchObject({ step: 1, completed: false, completedAt: null, step1Completed: false })
  })

  it("教学样例来源不能完成第 1 关", () => {
    const p = confirmDraft(createNewModule2Portfolio(), draft({ isTeachingSample: true }), "src-sample").portfolio
    expect(p.sourceSnapshot?.isTeachingSample).toBe(true)
    expect(computeModule2Lesson1Gates(p).step1).toBe(false)
  })

  it("当前身份不齐或班学号不合规时第 1 关不通过", () => {
    const p = confirmDraft(createNewModule2Portfolio(), draft(), "src-1").portfolio
    expect(computeModule2Lesson1Gates(p).step1).toBe(true)
    expect(computeModule2Lesson1Gates({ ...p, student: { ...STUDENT, studentName: " " } }).step1).toBe(false)
    expect(computeModule2Lesson1Gates({ ...p, student: { ...STUDENT, classSeatCode: "0412" } }).step1).toBe(false)
  })

  it("只有候选草稿不能解锁第 1 关", () => {
    const p = saveModule2SourceImportDraft(createNewModule2Portfolio(), draft())
    expect(computeModule2Lesson1Gates(p).step1).toBe(false)
  })

  it("第 2 关需要看过样例且观察非空", () => {
    let p = confirmDraft(createNewModule2Portfolio(), draft(), "src-1").portfolio
    p = setModule2SampleObservation(p, "  ", NOW)
    expect(computeModule2Lesson1Gates(markModule2SampleViewed(p, NOW)).step2).toBe(false)
    p = setModule2SampleObservation(p, "作者选了关灯的瞬间", NOW)
    expect(computeModule2Lesson1Gates(p).step2).toBe(false)
    expect(computeModule2Lesson1Gates(markModule2SampleViewed(p, NOW)).step2).toBe(true)
  })

  it("第 3 关要求选景来源等于当前来源", () => {
    const p = completedPortfolio()
    const tampered = { ...p, storyboard: { ...p.storyboard, sourceSnapshotId: "src-other" } }
    expect(computeModule2Lesson1Gates(tampered).step3).toBe(false)
    const blank = { ...p, storyboard: { ...p.storyboard, frames: { ...p.storyboard.frames, turn: { sceneSentence: "   " } } } }
    expect(computeModule2Lesson1Gates(blank).step3).toBe(false)
  })

  it("第 4 关要求 2—3 个去重后非空的视觉词与非空理由", () => {
    const p = completedPortfolio()
    const withWords = (words: string[]) => ({ ...p, visualDirection: { ...p.visualDirection, words } })
    expect(computeModule2Lesson1Gates(withWords(["冷暖"])).step4).toBe(false)
    expect(computeModule2Lesson1Gates(withWords(["冷暖", " 冷暖 ", ""])).step4).toBe(false)
    expect(computeModule2Lesson1Gates(withWords(["a", "b", "c", "d"])).step4).toBe(false)
    expect(computeModule2Lesson1Gates(withWords(["a", "b", "c"])).step4).toBe(true)
    expect(computeModule2Lesson1Gates({ ...p, visualDirection: { ...p.visualDirection, reason: "  " } }).step4).toBe(false)
  })
})

describe("第 1 关：候选与确认", () => {
  it("保存 / 替换候选不改动已确认来源、身份与完成态", () => {
    const p = completedPortfolio()
    const replaced = saveModule2SourceImportDraft(saveModule2SourceImportDraft(p, draft({ storyTitle: "候选一" })), draft({ storyTitle: "候选二" }))
    expect(replaced.sourceImportDraft?.storyTitle).toBe("候选二")
    expect(replaced.sourceSnapshot).toEqual(p.sourceSnapshot)
    expect(replaced.student).toEqual(p.student)
    expect(computeModule2Lesson1Gates(replaced).completed).toBe(true)
  })

  it("取消只清空候选，不影响已确认原作", () => {
    const p = completedPortfolio()
    const cancelled = cancelModule2SourceImportDraft(saveModule2SourceImportDraft(p, draft({ storyTitle: "另一篇" })))
    expect(cancelled.sourceImportDraft).toBeNull()
    expect(cancelled.sourceSnapshot).toEqual(p.sourceSnapshot)
    expect(computeModule2Lesson1Gates(cancelled).completed).toBe(true)
  })

  it("未填完的候选不能确认", () => {
    const p = saveModule2SourceImportDraft(createNewModule2Portfolio(), draft({ parts: { opening: "起", development: "", turn: "转", ending: "合" } }))
    const result = confirmModule2SourceImportDraft(p, { snapshotId: "src-x", student: STUDENT, now: NOW })
    expect(result.ok).toBe(false)
  })

  it("首次确认一次性写入快照、清空草稿、写入核对后的身份，原身份副本保留", () => {
    const fileIdentity = { clazz: "初一（3）班", studentName: "", classSeatCode: "" }
    const p = saveModule2SourceImportDraft(createNewModule2Portfolio(), draft({ student: fileIdentity }))
    const result = confirmModule2SourceImportDraft(p, { snapshotId: "src-1", student: STUDENT, now: NOW })
    expect(result.ok && result.outcome).toBe("confirmed")
    if (!result.ok) return
    expect(result.portfolio.sourceImportDraft).toBeNull()
    expect(result.portfolio.sourceHistory).toEqual([])
    expect(result.portfolio.sourceSnapshot).toMatchObject({ id: "src-1", studentConfirmedAt: NOW, student: fileIdentity })
    expect(result.portfolio.student).toEqual(STUDENT)
  })

  it("同一来源（文件摘要相同）重复确认不写历史、不使确认失效", () => {
    const p = completedPortfolio()
    const result = confirmDraft(p, draft({ storyTitle: "题目改了但文件相同" }), "src-2")
    expect(result.outcome).toBe("same-source")
    expect(result.portfolio.sourceHistory).toHaveLength(0)
    expect(result.portfolio.sourceSnapshot?.id).toBe("src-1")
    expect(computeModule2Lesson1Gates(result.portfolio).completed).toBe(true)
  })

  it("同一来源（题目与四段完全相同、无文件摘要）也不重复写历史", () => {
    const p = completedPortfolio()
    const result = confirmDraft(p, draft({ sourceFileSha256: null, origin: "manual" }), "src-2")
    expect(result.outcome).toBe("same-source")
    expect(result.portfolio.sourceHistory).toHaveLength(0)
  })

  it("换来源：旧来源进历史，两项待核对置位，第 3、4 关与本课失效，四句、风格与观察保留", () => {
    const p = completedPortfolio()
    const result = confirmDraft(p, draft({ sourceFileSha256: "b".repeat(64), storyTitle: "新小说" }), "src-2")
    const next = result.portfolio
    expect(result.outcome).toBe("switched")
    expect(next.sourceHistory.map(item => item.id)).toEqual(["src-1"])
    expect(next.sourceSnapshot?.id).toBe("src-2")
    expect(next.sourceImportDraft).toBeNull()
    expect(next.lesson1.reviewNeeded).toEqual({ storyboard: true, visualDirection: true })
    expect(next.storyboard.frames).toEqual(p.storyboard.frames)
    expect(next.visualDirection.words).toEqual(p.visualDirection.words)
    expect(next.visualDirection.reason).toBe(p.visualDirection.reason)
    expect(next.lesson1.sampleObservation).toBe(p.lesson1.sampleObservation)
    expect(computeModule2Lesson1Gates(next)).toMatchObject({ step1: true, step2: true, step3: false, step4: false, completed: false })
    expect(next.lesson1).toMatchObject({ step3Completed: false, step4Completed: false, completed: false, completedAt: null })
  })

  it("换来源后重新确认选景仍需重新确认视觉方向", () => {
    const switched = confirmDraft(completedPortfolio(), draft({ sourceFileSha256: "b".repeat(64), storyTitle: "新小说" }), "src-2").portfolio
    const storyboardOk = unwrap(confirmModule2Storyboard(switched, LATER))
    expect(storyboardOk.storyboard.sourceSnapshotId).toBe("src-2")
    expect(computeModule2Lesson1Gates(storyboardOk)).toMatchObject({ step3: true, step4: false })
    const done = unwrap(confirmModule2VisualDirection(storyboardOk, LATER))
    expect(done.lesson1.completedAt).toBe(LATER)
  })
})

describe("第 3 关：改写四句", () => {
  it("改写一句：清除选景与视觉确认，视觉方向标待核对，第 3、4 关失效，风格文本保留", () => {
    const p = completedPortfolio()
    const next = setModule2SceneSentence(p, "turn", "主角发现灯没关", LATER)
    expect(next.storyboard.confirmedAt).toBeNull()
    expect(next.visualDirection.confirmedAt).toBeNull()
    expect(next.lesson1.reviewNeeded.visualDirection).toBe(true)
    expect(next.visualDirection.words).toEqual(p.visualDirection.words)
    expect(computeModule2Lesson1Gates(next)).toMatchObject({ step2: true, step3: false, step4: false, completed: false })
  })

  it("清空一句同样失效；相同内容是 no-op", () => {
    const p = completedPortfolio()
    expect(computeModule2Lesson1Gates(setModule2SceneSentence(p, "ending", "", LATER)).step3).toBe(false)
    expect(setModule2SceneSentence(p, "ending", p.storyboard.frames.ending.sceneSentence, LATER)).toBe(p)
  })

  it("四句未齐不能确认选景", () => {
    let p = confirmDraft(createNewModule2Portfolio(), draft(), "src-1").portfolio
    p = setModule2SampleObservation(markModule2SampleViewed(p, NOW), "观察", NOW)
    p = setModule2SceneSentence(p, "opening", "起", NOW)
    expect(confirmModule2Storyboard(p, NOW).ok).toBe(false)
  })
})

describe("第 4 关：视觉方向", () => {
  it("增、删、改视觉词都清除视觉确认，第 4 关与本课失效，第 3 关保留", () => {
    const p = completedPortfolio()
    const cases = [
      ["冷暖对比", "清晰线条", "强明暗"],
      ["冷暖对比"],
      ["冷暖对比", "柔和水彩"],
    ]
    for (const words of cases) {
      const next = setModule2VisualWords(p, words, LATER)
      expect(next.visualDirection.confirmedAt).toBeNull()
      expect(computeModule2Lesson1Gates(next)).toMatchObject({ step3: true, step4: false, completed: false })
      expect(next.lesson1.completedAt).toBeNull()
    }
  })

  it("改写或清空理由、改参考风格都清除视觉确认", () => {
    const p = completedPortfolio()
    expect(setModule2VisualReason(p, "换一个理由", LATER).visualDirection.confirmedAt).toBeNull()
    expect(computeModule2Lesson1Gates(setModule2VisualReason(p, "", LATER)).step4).toBe(false)
    expect(setModule2ReferenceStyle(p, "watercolor", LATER).visualDirection.confirmedAt).toBeNull()
  })

  it("确认时去空白去重；词数不符或理由为空拒绝确认", () => {
    let p = completedPortfolio()
    p = setModule2VisualWords(p, [" 冷暖 ", "冷暖", "线条 "], LATER)
    const ok = unwrap(confirmModule2VisualDirection(p, LATER))
    expect(ok.visualDirection.words).toEqual(["冷暖", "线条"])
    expect(confirmModule2VisualDirection(setModule2VisualWords(ok, ["只有一个"], LATER), LATER).ok).toBe(false)
    expect(confirmModule2VisualDirection(setModule2VisualReason(ok, " ", LATER), LATER).ok).toBe(false)
  })
})

describe("L08—L11 完成重算与最近一关", () => {
  it("L08 不含特定字词的四句可以确认；清空或改写后确认失效，重新确认才通过", () => {
    const done = completedPortfolio()
    const rewritten = setModule2SceneSentence(done, "turn", "灯", LATER)
    expect(rewritten.storyboard.frames.turn.sceneSentence).toBe("灯")
    expect(rewritten.storyboard.confirmedAt).toBeNull()
    expect(computeModule2Lesson1Gates(rewritten)).toMatchObject({ step3: false, step4: false, completed: false })
    expect(rewritten.lesson1.completed).toBe(false)
    const again = unwrap(confirmModule2Storyboard(rewritten, LATER))
    expect(computeModule2Lesson1Gates(again).step3).toBe(true)
    const cleared = setModule2SceneSentence(again, "opening", "   ", LATER)
    expect(confirmModule2Storyboard(cleared, LATER).ok).toBe(false)
    expect(cleared.storyboard.frames.opening.sceneSentence).toBe("   ")
  })

  it("L09 自定义两个视觉词加理由可以通过，不要求预设风格", () => {
    const done = completedPortfolio()
    const custom = setModule2VisualReason(setModule2VisualWords(done, ["雾", "纸纹"], LATER), "想让夜晚显得安静。", LATER)
    expect(custom.visualDirection.referenceStyleId).toBeNull()
    const confirmed = unwrap(confirmModule2VisualDirection(custom, LATER))
    expect(computeModule2Lesson1Gates(confirmed).completed).toBe(true)
    expect(confirmed.visualDirection.words).toEqual(["雾", "纸纹"])
  })

  it("L10 词少于 2、多于 3 或理由为空时拒绝确认，已填内容保留", () => {
    const done = completedPortfolio()
    const tooFew = setModule2VisualWords(done, ["只有一个"], LATER)
    const tooMany = setModule2VisualWords(done, ["甲", "乙", "丙", "丁"], LATER)
    const blank = setModule2VisualReason(done, "  ", LATER)
    expect(confirmModule2VisualDirection(tooFew, LATER).ok).toBe(false)
    expect(confirmModule2VisualDirection(tooMany, LATER).ok).toBe(false)
    expect(confirmModule2VisualDirection(blank, LATER).ok).toBe(false)
    expect(tooFew.visualDirection.words).toEqual(["只有一个"])
    expect(tooMany.visualDirection.words).toEqual(["甲", "乙", "丙", "丁"])
    expect(blank.visualDirection.reason).toBe("  ")
  })

  it("L11 字段变空后不相信旧的 completed:true", () => {
    const done = completedPortfolio()
    const forged = {
      ...done,
      lesson1: { ...done.lesson1, completed: true, step4Completed: true, completedAt: NOW },
    }
    const broken = setModule2VisualReason(forged, "", LATER)
    expect(computeModule2Lesson1Gates(broken).completed).toBe(false)
    expect(broken.lesson1.completed).toBe(false)
    expect(broken.lesson1.completedAt).toBeNull()
  })

  it("最近停下的关会被记住，但不能越过当前可进入的关", () => {
    let p = confirmDraft(createNewModule2Portfolio(undefined, NOW), draft(), "src-1").portfolio
    p = rememberModule2Lesson1Step(p, 2, LATER)
    expect(p.lesson1.step).toBe(2)
    expect(rememberModule2Lesson1Step(p, 4, LATER).lesson1.step).toBe(2)
    expect(rememberModule2Lesson1Step(p, 2, LATER)).toBe(p)
    expect(rememberModule2Lesson1Step(createNewModule2Portfolio(undefined, NOW), 3, NOW).lesson1.step).toBe(1)
  })
})
