/**
 * 文件说明：模块 1 课时 3 提示词拼装回归测试。
 * 职责：锁定 P1 只带课堂示例、P2—P5 不残留花括号，以及 P5 缺修改理由时拒绝复制。
 * 更新触发：课时 3 提示词模板、白名单或变量替换规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { MODULE1_LESSON3_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import {
  buildModule1Lesson3Prompt,
  module1Lesson3PromptContainsUnresolvedVars,
} from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-prompts"

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
    openingPlan: MODULE1_LESSON3_EXAMPLE.openingPlan,
    focusTechnique: MODULE1_LESSON3_EXAMPLE.focusTechnique,
    draftText: MODULE1_LESSON3_EXAMPLE.draftText,
    finalText: MODULE1_LESSON3_EXAMPLE.finalText,
    revisionInstruction: "删去结尾总结道理的话",
  }
  return portfolio
}

describe("模块 1 课时 3 提示词", () => {
  it("P1 只带三则课堂示例且不含学生设定", () => {
    const result = buildModule1Lesson3Prompt("P1", createNewModule1Portfolio())
    expect(result.ok).toBe(true)
    expect(result.text).toContain("背景介绍稿")
    expect(result.text).toContain("从生活细节进入")
    expect(result.text).toContain("从人物对话进入")
    expect(result.text).not.toContain(MODULE1_LESSON2_EXAMPLE.cityIssue)
    expect(module1Lesson3PromptContainsUnresolvedVars(result.text)).toBe(false)
  })

  it("P2—P5 替换全部变量且不出现花括号", () => {
    const portfolio = createReadyPortfolio()
    for (const id of ["P2", "P3", "P4", "P5"] as const) {
      const result = buildModule1Lesson3Prompt(id, portfolio)
      expect(result.ok).toBe(true)
      expect(module1Lesson3PromptContainsUnresolvedVars(result.text)).toBe(false)
      expect(result.text).toContain(MODULE1_LESSON2_EXAMPLE.cityIssue)
    }
  })

  it("P4 优先带确认稿全文，不偷偷改回旧初稿", () => {
    const portfolio = createReadyPortfolio()
    const result = buildModule1Lesson3Prompt("P4", portfolio)
    expect(result.text).toContain(MODULE1_LESSON3_EXAMPLE.finalText)
    expect(result.text).not.toContain("科技应该服务于每一个人")
  })

  it("P5 未写修改理由时拒绝复制", () => {
    const portfolio = createReadyPortfolio()
    portfolio.lesson3.revisionInstruction = ""
    const result = buildModule1Lesson3Prompt("P5", portfolio)
    expect(result.ok).toBe(false)
    expect(result.error).toContain("修改")
  })
})
