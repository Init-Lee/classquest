/**
 * 文件说明：模块 1 课时 2 外部 AI 提示词回归测试。
 * 职责：锁定五条提示词一次替换、不残留模板变量、不带入学生身份，且不暗示站内调模型。
 * 更新触发：提示词模板、课时 1 上下文或前置校验变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule1Portfolio, patchModule1Lesson2ActiveReference } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"
import {
  buildModule1Lesson2Prompt,
  module1Lesson2PromptContainsUnresolvedVars,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-prompts"

function createReadyPortfolio() {
  const portfolio = createNewModule1Portfolio({
    studentName: "张三",
    clazz: "初一（1）班",
    classSeatCode: "0101",
  })
  portfolio.lesson1 = {
    ...portfolio.lesson1,
    sdg: MODULE1_LESSON2_EXAMPLE.sdg,
    sdgWhy: "和回家的路有关",
    cityIssue: MODULE1_LESSON2_EXAMPLE.cityIssue,
    audience: MODULE1_LESSON2_EXAMPLE.audience,
    audienceConcern: MODULE1_LESSON2_EXAMPLE.audienceConcern,
  }
  const reference = buildModule1ClassroomReference("shexi")
  if (reference) {
    portfolio.lesson2.reference = patchModule1Lesson2ActiveReference(reference, { sourceConfirmed: true })
  }
  portfolio.lesson2.writingPlan = MODULE1_LESSON2_EXAMPLE.writingPlan
  portfolio.lesson2.reason = MODULE1_LESSON2_EXAMPLE.reason
  return portfolio
}

describe("模块 1 课时 2 外部 AI 提示词", () => {
  it("P1 只带入当前课堂片段且不含学生身份", () => {
    const portfolio = createReadyPortfolio()
    const result = buildModule1Lesson2Prompt("P1", portfolio, { selectedCaseId: "shexi" })
    expect(result.ok).toBe(true)
    expect(result.text).toContain("社戏")
    expect(result.text).toContain("沈静")
    expect(result.text).not.toContain("张三")
    expect(result.text).not.toContain("0101")
    expect(module1Lesson2PromptContainsUnresolvedVars(result.text)).toBe(false)
    expect(result.text).not.toMatch(/API|接口|模型调用/)
  })

  it("没有实际片段时不能生成第二轮提示词", () => {
    const portfolio = createReadyPortfolio()
    portfolio.lesson2.reference.excerpt = ""
    const result = buildModule1Lesson2Prompt("P2B", portfolio)
    expect(result.ok).toBe(false)
    expect(result.error).toContain("实际阅读的片段")
  })

  it("学生输入中的花括号不会再次被解析", () => {
    const portfolio = createReadyPortfolio()
    portfolio.lesson2.writingPlan = "1. 用 {{fake}} 写法\n2. 再写一条"
    const result = buildModule1Lesson2Prompt("P3", portfolio)
    expect(result.ok).toBe(true)
    expect(result.text).toContain("{{fake}}")
    expect(module1Lesson2PromptContainsUnresolvedVars(result.text)).toBe(true)
  })
})
