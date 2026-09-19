/**
 * 文件说明：模块 1 课时 2 写作设定汇总回归测试。
 * 职责：锁定未填占位、字段汇总格式，以及不自动拼接成功或社会责任结论。
 * 更新触发：汇总模板、占位文案或复制稿待复核提示变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createEmptyModule1Lesson2State, createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson2WritingSummary,
  formatModule1Lesson2WritingSummary,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-writing-summary"

describe("模块 1 课时 2 写作设定汇总", () => {
  it("未填写时保留结构并显示尚未填写", () => {
    const portfolio = createNewModule1Portfolio()
    const summary = buildModule1Lesson2WritingSummary(portfolio.lesson1, createEmptyModule1Lesson2State())
    expect(summary.lesson1GroupTitle).toBe("课时 1 主题设定")
    expect(summary.lesson2GroupTitle).toBe("课时 2 风格与人物")
    expect(summary.workTitle).toBe("尚未填写")
    expect(summary.who).toBe("尚未填写")
    expect(summary.complete).toBe(false)
    const text = formatModule1Lesson2WritingSummary(summary)
    expect(text).toContain("尚未填写")
    expect(text).toContain("尚有内容待补充或复核")
    expect(text).not.toContain("体现个人成长与社会责任")
  })
})
