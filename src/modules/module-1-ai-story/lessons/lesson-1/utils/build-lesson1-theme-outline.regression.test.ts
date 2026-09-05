/**
 * 文件说明：模块 1 课时 1 结构化主题大纲回归测试。
 * 职责：验证空态、部分输入、完整输入、结构化展示文本和 Step 4 复制 payload（主题核心）始终保留原型字段结构。
 * 更新触发：课时 1 大纲 selector、格式化模板、复制策略、占位文案或故事年份口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson1ThemeOutline,
  formatModule1Lesson1ThemeOutline,
  resolveModule1Lesson1CopyPayload,
} from "@/modules/module-1-ai-story/lessons/lesson-1/utils/build-lesson1-theme-outline"

function createLessonState() {
  return createNewModule1Portfolio().lesson1
}

describe("模块 1 课时 1 结构化主题大纲", () => {
  it("空态仍保留全部课堂结构和友好占位", () => {
    const outline = buildModule1Lesson1ThemeOutline(createLessonState())
    expect(outline).toMatchObject({
      sdgTheme: "待选择",
      selectionReason: "待填写",
      cityIssue: "待填写",
      audience: "待填写",
      audienceConcern: "待填写",
      complete: false,
    })
    expect(formatModule1Lesson1ThemeOutline(outline)).toContain("受众分析")
  })

  it("部分填写会实时进入对应结构而不隐藏未填字段", () => {
    const outline = buildModule1Lesson1ThemeOutline({
      ...createLessonState(),
      sdg: "5 性别平等",
      sdgWhy: "与校园生活有关",
      cityIssue: "校园活动分工存在刻板印象",
    })
    expect(outline.sdgTheme).toBe("5 性别平等")
    expect(outline.cityIssue).toBe("校园活动分工存在刻板印象")
    expect(outline.audience).toBe("待填写")
    expect(outline.themeCore).toContain("2035 年回信")
  })

  it("完整结构包含原型全部字段和最终主题核心", () => {
    const outline = buildModule1Lesson1ThemeOutline({
      ...createLessonState(),
      sdg: "11 可持续城市和社区",
      sdgWhy: "夜间照明与社区生活直接相关",
      cityIssue: "小区夜间照度过高影响睡眠",
      audience: "社区物业",
      audienceConcern: "安全、成本与居民睡眠",
    })
    expect(outline.complete).toBe(true)
    expect(outline.themeCore).toContain("向“社区物业”展示解决方案")
    expect(outline.themeCore).toContain("SDG“11 可持续城市和社区”")
  })

  it("页面结构文本仍保留全部字段且没有对象字符串", () => {
    const state = {
      ...createLessonState(),
      sdg: "11 可持续城市和社区",
      sdgWhy: "与社区有关",
      cityIssue: "夜间照明影响睡眠",
      audience: "社区物业",
      audienceConcern: "安全与成本",
    }
    const text = formatModule1Lesson1ThemeOutline(buildModule1Lesson1ThemeOutline(state))
    expect(text).toContain("【故事主题设定大纲】")
    expect(text).toContain("选择理由：与社区有关")
    expect(text).toContain("主题核心：")
    expect(text).not.toContain("[object Object]")
  })

  it("Step 4 主复制按钮只给出完整主题核心句子", () => {
    const incomplete = resolveModule1Lesson1CopyPayload(buildModule1Lesson1ThemeOutline(createLessonState()))
    expect(incomplete.enabled).toBe(false)
    expect(incomplete.text).toContain("2035 年回信")

    const complete = resolveModule1Lesson1CopyPayload(buildModule1Lesson1ThemeOutline({
      ...createLessonState(),
      sdg: "11 可持续城市和社区",
      sdgWhy: "与社区有关",
      cityIssue: "夜间照明影响睡眠",
      audience: "社区物业",
      audienceConcern: "安全与成本",
    }))
    expect(complete.enabled).toBe(true)
    expect(complete.text).toBe("围绕“夜间照明影响睡眠”这个具体问题，通过 2035 年回信的形式，向“社区物业”展示解决方案，体现所选 SDG“11 可持续城市和社区”的实践意义。")
    expect(complete.text).not.toContain("【故事主题设定大纲】")
    expect(complete.text).not.toContain("选择理由")
  })
})
