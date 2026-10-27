/**
 * 文件说明：模块 2 首页续学按钮回归测试。
 * 职责：锁定还没开始、课时 1 进行中、课时 1 已完成三种主按钮，并确认地址停在课时 1，不进入课时 2。伪造的完成标记不能当成已完成。
 * 更新触发：首页主按钮文案、续学关卡或课时 1 完成口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  confirmModule2SourceImportDraft,
  confirmModule2Storyboard,
  confirmModule2VisualDirection,
  markModule2SampleViewed,
  saveModule2SourceImportDraft,
  setModule2SampleObservation,
  setModule2SceneSentence,
  setModule2VisualReason,
  setModule2VisualWords,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  createNewModule2Portfolio,
  MODULE2_FOUR_PARTS,
  type Module2PortfolioV1,
  type SourceImportDraft,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { resolveModule2HomeContinue } from "@/modules/module-2-ai-comic/pages/module2-home-continue"

const NOW = "2026-10-25T10:00:00.000Z"
const STUDENT = { clazz: "初一（3）班", studentName: "李明", classSeatCode: "0312" }

function draft(): SourceImportDraft {
  return {
    origin: "classquest-html-v1",
    filename: "我的小说.html",
    sourceFileSha256: "a".repeat(64),
    importedAt: NOW,
    sourceConfirmedAt: null,
    student: { ...STUDENT },
    storyTitle: "楼道关灯",
    parts: { opening: "起段", development: "承段", turn: "转段", ending: "合段" },
    isTeachingSample: false,
    importNote: "",
  }
}

function unwrap(result: { ok: true; portfolio: Module2PortfolioV1 } | { ok: false; reason: string }): Module2PortfolioV1 {
  if (!result.ok) throw new Error(result.reason)
  return result.portfolio
}

function throughStoryboard(): Module2PortfolioV1 {
  const confirmed = confirmModule2SourceImportDraft(saveModule2SourceImportDraft(createNewModule2Portfolio(undefined, NOW), draft()), {
    snapshotId: "src-1",
    student: STUDENT,
    now: NOW,
  })
  let portfolio = unwrap(confirmed)
  portfolio = markModule2SampleViewed(portfolio, NOW)
  portfolio = setModule2SampleObservation(portfolio, "作者删掉了旁枝情节。", NOW)
  for (const part of MODULE2_FOUR_PARTS) portfolio = setModule2SceneSentence(portfolio, part, `${part}：主角在楼道里关灯`, NOW)
  return unwrap(confirmModule2Storyboard(portfolio, NOW))
}

describe("模块 2 首页续学", () => {
  it("没有档案或第 1 关还没开始时，主按钮是开始课时 1", () => {
    expect(resolveModule2HomeContinue(null)).toEqual({
      label: "开始课时 1",
      path: "/module/2/lesson/1/step/1",
      hint: null,
    })
    expect(resolveModule2HomeContinue(createNewModule2Portfolio(undefined, NOW)).label).toBe("开始课时 1")
  })

  it("只有候选草稿时继续学习，进入第 1 关", () => {
    const portfolio = saveModule2SourceImportDraft(createNewModule2Portfolio(undefined, NOW), draft())
    expect(resolveModule2HomeContinue(portfolio)).toEqual({
      label: "继续学习",
      path: "/module/2/lesson/1/step/1",
      hint: "当前在课时 1 第 1 关",
    })
  })

  it("第 3 关已确认、本课未完成时，继续学习进入第 4 关", () => {
    const entry = resolveModule2HomeContinue(throughStoryboard())
    expect(entry).toEqual({
      label: "继续学习",
      path: "/module/2/lesson/1/step/4",
      hint: "当前在课时 1 第 4 关",
    })
    expect(entry.path).not.toContain("/lesson/2")
  })

  it("课时 1 已完成时查看第 4 关，伪造的完成标记仍然是开始", () => {
    let portfolio = throughStoryboard()
    portfolio = setModule2VisualWords(portfolio, ["冷暖对比", "清晰线条"], NOW)
    portfolio = setModule2VisualReason(portfolio, "我想让读者看清灯光的变化。", NOW)
    portfolio = unwrap(confirmModule2VisualDirection(portfolio, NOW))
    expect(resolveModule2HomeContinue(portfolio)).toEqual({
      label: "查看课时 1",
      path: "/module/2/lesson/1/step/4",
      hint: null,
    })

    const forged = createNewModule2Portfolio(undefined, NOW)
    forged.lesson1 = { ...forged.lesson1, step: 4, completed: true, step4Completed: true, completedAt: NOW }
    expect(resolveModule2HomeContinue(forged).label).toBe("开始课时 1")
    expect(resolveModule2HomeContinue(forged).path).toBe("/module/2/lesson/1/step/1")
  })
})
