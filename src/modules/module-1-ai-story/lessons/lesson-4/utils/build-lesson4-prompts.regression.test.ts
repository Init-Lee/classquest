/**
 * 文件说明：模块 1 课时 4 提示词拼装回归测试。
 * 职责：锁定 P1 只带课堂短例、P2—P5 不残留花括号、P3 不含当前初稿，以及 P5 缺修改理由时拒绝复制。
 * 更新触发：课时 4 提示词模板、白名单、开头来源或变量替换规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { MODULE1_LESSON3_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { MODULE1_LESSON4_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson4-copy"
import {
  buildModule1Lesson4CheckContextKey,
  buildModule1Lesson4DraftContextKey,
  buildModule1Lesson4Prompt,
  module1Lesson4PromptContainsUnresolvedVars,
} from "@/modules/module-1-ai-story/lessons/lesson-4/utils/build-lesson4-prompts"

function createReadyPortfolio() {
  const portfolio = createNewModule1Portfolio()
  portfolio.lesson1 = {
    ...portfolio.lesson1,
    sdg: MODULE1_LESSON2_EXAMPLE.sdg,
    sdgWhy: "和回家的路有关",
    cityIssue: MODULE1_LESSON2_EXAMPLE.cityIssue,
    audience: MODULE1_LESSON2_EXAMPLE.audience,
    audienceConcern: MODULE1_LESSON2_EXAMPLE.audienceConcern,
  }
  portfolio.lesson2 = {
    ...portfolio.lesson2,
    writingPlan: MODULE1_LESSON2_EXAMPLE.writingPlan,
    reason: MODULE1_LESSON2_EXAMPLE.reason,
    character: {
      who: MODULE1_LESSON2_EXAMPLE.who,
      want: MODULE1_LESSON2_EXAMPLE.want,
      blocked: MODULE1_LESSON2_EXAMPLE.blocked,
      firstAction: MODULE1_LESSON2_EXAMPLE.firstAction,
      possibleChange: MODULE1_LESSON2_EXAMPLE.possibleChange,
    },
  }
  portfolio.lesson3 = {
    ...portfolio.lesson3,
    storyTitle: MODULE1_LESSON3_EXAMPLE.storyTitle,
    finalText: MODULE1_LESSON3_EXAMPLE.finalText,
  }
  portfolio.lesson4 = {
    ...portfolio.lesson4,
    plotPlan: MODULE1_LESSON4_EXAMPLE.plotPlan,
    planReason: MODULE1_LESSON4_EXAMPLE.planReason,
    draftText: MODULE1_LESSON4_EXAMPLE.draftText,
    finalText: MODULE1_LESSON4_EXAMPLE.finalText,
    revisionInstruction: MODULE1_LESSON4_EXAMPLE.revisionInstruction,
  }
  return portfolio
}

describe("模块 1 课时 4 提示词", () => {
  it("P1 只带两则课堂短例且不含学生设定", () => {
    const result = buildModule1Lesson4Prompt("P1", createNewModule1Portfolio())
    expect(result.ok).toBe(true)
    expect(result.text).toContain("继续交代处境")
    expect(result.text).toContain("行动带来回应")
    expect(result.text).not.toContain(MODULE1_LESSON2_EXAMPLE.cityIssue)
    expect(module1Lesson4PromptContainsUnresolvedVars(result.text)).toBe(false)
  })

  it("P2—P5 替换全部变量且不出现花括号", () => {
    const portfolio = createReadyPortfolio()
    for (const id of ["P2", "P3", "P4", "P5"] as const) {
      const result = buildModule1Lesson4Prompt(id, portfolio)
      expect(result.ok).toBe(true)
      expect(module1Lesson4PromptContainsUnresolvedVars(result.text)).toBe(false)
      expect(result.text).toContain(MODULE1_LESSON2_EXAMPLE.cityIssue)
      expect(result.text).toContain(MODULE1_LESSON3_EXAMPLE.finalText)
    }
  })

  it("P3 只带情节安排，不把当前初稿写进提示词", () => {
    const portfolio = createReadyPortfolio()
    const result = buildModule1Lesson4Prompt("P3", portfolio)
    expect(result.text).toContain(MODULE1_LESSON4_EXAMPLE.plotPlan)
    expect(result.text).not.toContain(MODULE1_LESSON4_EXAMPLE.draftText)
  })

  it("P4 优先带确认稿全文，改确认稿不改变检查上下文键", () => {
    const portfolio = createReadyPortfolio()
    const before = buildModule1Lesson4CheckContextKey(portfolio)
    const result = buildModule1Lesson4Prompt("P4", portfolio)
    expect(result.text).toContain(MODULE1_LESSON4_EXAMPLE.finalText)
    portfolio.lesson4.finalText = "改过一字的确认稿"
    expect(buildModule1Lesson4CheckContextKey(portfolio)).toBe(before)
    expect(buildModule1Lesson4DraftContextKey(portfolio)).toBe(before)
  })

  it("P5 未写修改理由时拒绝复制", () => {
    const portfolio = createReadyPortfolio()
    portfolio.lesson4.revisionInstruction = ""
    const result = buildModule1Lesson4Prompt("P5", portfolio)
    expect(result.ok).toBe(false)
    expect(result.text).toBe("")
  })
})
