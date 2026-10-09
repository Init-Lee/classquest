/**
 * 文件说明：模块 1 课时 6 提示词拼装回归测试。
 * 职责：锁定 P1 只带课堂短例、P2—P5 不残留花括号、P3 不含当前初稿，以及改第 3 关稿后 P4 与检查上下文键刷新。
 * 更新触发：课时 6 提示词模板、白名单、开头来源、检查上下文键或变量替换规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { MODULE1_LESSON3_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { MODULE1_LESSON4_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson4-copy"
import { MODULE1_LESSON5_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson5-copy"
import { MODULE1_LESSON6_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson6-copy"
import {
  buildModule1Lesson6CheckContextKey,
  buildModule1Lesson6DraftContextKey,
  buildModule1Lesson6Prompt,
  module1Lesson6PromptContainsUnresolvedVars,
} from "@/modules/module-1-ai-story/lessons/lesson-6/utils/build-lesson6-prompts"

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
    finalText: MODULE1_LESSON4_EXAMPLE.finalText,
  }
  portfolio.lesson5 = {
    ...portfolio.lesson5,
    finalText: MODULE1_LESSON5_EXAMPLE.finalText,
  }
  portfolio.lesson6 = {
    ...portfolio.lesson6,
    endingType: MODULE1_LESSON6_EXAMPLE.endingType,
    plotPlan: MODULE1_LESSON6_EXAMPLE.plotPlan,
    planReason: MODULE1_LESSON6_EXAMPLE.planReason,
    draftText: MODULE1_LESSON6_EXAMPLE.draftText,
    finalText: MODULE1_LESSON6_EXAMPLE.finalText,
    revisionInstruction: MODULE1_LESSON6_EXAMPLE.revisionInstruction,
  }
  return portfolio
}

describe("模块 1 课时 6 提示词", () => {
  it("P1 只带两则课堂短例且不含学生设定", () => {
    const result = buildModule1Lesson6Prompt("P1", createNewModule1Portfolio())
    expect(result.ok).toBe(true)
    expect(result.text).toContain("交代结果，再说感受")
    expect(result.text).toContain("交代结果，停在一个场景")
    expect(result.text).not.toContain(MODULE1_LESSON2_EXAMPLE.cityIssue)
    expect(module1Lesson6PromptContainsUnresolvedVars(result.text)).toBe(false)
  })

  it("P2—P5 替换全部变量且不出现花括号", () => {
    const portfolio = createReadyPortfolio()
    for (const id of ["P2", "P3", "P4", "P5"] as const) {
      const result = buildModule1Lesson6Prompt(id, portfolio)
      expect(result.ok).toBe(true)
      expect(module1Lesson6PromptContainsUnresolvedVars(result.text)).toBe(false)
      expect(result.text).toContain(MODULE1_LESSON2_EXAMPLE.cityIssue)
      expect(result.text).toContain(MODULE1_LESSON3_EXAMPLE.finalText)
      expect(result.text).toContain(MODULE1_LESSON4_EXAMPLE.finalText)
      expect(result.text).toContain(MODULE1_LESSON5_EXAMPLE.finalText)
    }
  })

  it("P3 只带转折安排，不把当前初稿写进提示词", () => {
    const portfolio = createReadyPortfolio()
    const result = buildModule1Lesson6Prompt("P3", portfolio)
    expect(result.text).toContain("结局类型：开放余味")
    expect(result.text).toContain(MODULE1_LESSON6_EXAMPLE.plotPlan)
    expect(result.text).not.toContain(MODULE1_LESSON6_EXAMPLE.draftText)
  })

  it("P4 优先带确认稿全文，改确认稿会改变检查上下文键", () => {
    const portfolio = createReadyPortfolio()
    const before = buildModule1Lesson6CheckContextKey(portfolio)
    const draftKeyBefore = buildModule1Lesson6DraftContextKey(portfolio)
    const result = buildModule1Lesson6Prompt("P4", portfolio)
    expect(result.text).toContain(MODULE1_LESSON6_EXAMPLE.finalText)
    portfolio.lesson6.finalText = "改过一字的确认稿"
    expect(buildModule1Lesson6CheckContextKey(portfolio)).not.toBe(before)
    expect(buildModule1Lesson6DraftContextKey(portfolio)).toBe(draftKeyBefore)
  })

  it("确认稿从 A 改成 B 后，第 4 关 P4 含 B 不含仅属于 A 的句子", () => {
    const draftA = "【夹具A】路灯忽然灭了，林禾停在旧桥口。"
    const draftB = "【夹具B】小川把开关拨回，走廊重新亮起来。"
    const portfolio = createReadyPortfolio()
    portfolio.lesson6.draftText = draftA
    portfolio.lesson6.finalText = draftA
    const beforeKey = buildModule1Lesson6CheckContextKey(portfolio)
    const promptA = buildModule1Lesson6Prompt("P4", portfolio)
    expect(promptA.ok).toBe(true)
    expect(promptA.text).toContain(draftA)
    expect(promptA.text).not.toContain(draftB)

    portfolio.lesson6.draftText = draftB
    portfolio.lesson6.finalText = draftB
    const promptB = buildModule1Lesson6Prompt("P4", portfolio)
    expect(promptB.ok).toBe(true)
    expect(promptB.text).toContain(draftB)
    expect(promptB.text).not.toContain("【夹具A】")
    expect(buildModule1Lesson6CheckContextKey(portfolio)).not.toBe(beforeKey)
  })

  it("P5 未写修改理由时拒绝复制", () => {
    const portfolio = createReadyPortfolio()
    portfolio.lesson6.revisionInstruction = ""
    const result = buildModule1Lesson6Prompt("P5", portfolio)
    expect(result.ok).toBe(false)
    expect(result.text).toBe("")
  })
})
