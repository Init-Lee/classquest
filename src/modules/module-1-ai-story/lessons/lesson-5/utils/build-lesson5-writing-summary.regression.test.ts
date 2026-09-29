/**
 * 文件说明：模块 1 课时 5 写作设定汇总回归测试。
 * 职责：锁定空态占位、必须列出 SDG 主题与课时 3 题目，以及教师演示预填能被汇总读到。
 * 更新触发：汇总字段、占位文案、SDG 展示或演示档案主题字段变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson5WritingSummary,
  hasModule1Lesson5ConfirmedSummary,
} from "@/modules/module-1-ai-story/lessons/lesson-5/utils/build-lesson5-writing-summary"

describe("模块 1 课时 5 写作设定汇总", () => {
  it("空态保留 SDG 与课时 3/4/5 字段并显示待选择/待填写", () => {
    const portfolio = createNewModule1Portfolio()
    const summary = buildModule1Lesson5WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
    )
    expect(summary.sdg).toBe("待选择")
    expect(summary.storyTitle).toBe("待填写")
    expect(summary.developmentExcerpt).toBe("待填写")
    expect(summary.lesson5GroupTitle).toBe("课时 5 写出故事的关键变化")
    expect(hasModule1Lesson5ConfirmedSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
    )).toBe(false)
  })

  it("教师演示档案能汇总出课时 5 转折安排", () => {
    const portfolio = createModule1TeacherLecturePortfolio()
    const summary = buildModule1Lesson5WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
    )
    expect(summary.plotPlan).toContain("查看台阶")
    expect(summary.openingExcerpt).not.toBe("待填写")
    expect(summary.developmentExcerpt).not.toBe("待填写")
    expect(hasModule1Lesson5ConfirmedSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
    )).toBe(true)
  })
})
