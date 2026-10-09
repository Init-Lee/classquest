/**
 * 文件说明：模块 1 课时 6 写作设定汇总回归测试。
 * 职责：锁定空态占位、必须列出 SDG 主题与课时 3 题目，以及教师演示预填能被汇总读到。
 * 更新触发：汇总字段、占位文案、SDG 展示或演示档案主题字段变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson6WritingSummary,
  hasModule1Lesson6ConfirmedSummary,
} from "@/modules/module-1-ai-story/lessons/lesson-6/utils/build-lesson6-writing-summary"

describe("模块 1 课时 6 写作设定汇总", () => {
  it("空态保留 SDG 与课时 3/4/5 字段并显示待选择/待填写", () => {
    const portfolio = createNewModule1Portfolio()
    const summary = buildModule1Lesson6WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
      portfolio.lesson6,
    )
    expect(summary.sdg).toBe("待选择")
    expect(summary.storyTitle).toBe("待填写")
    expect(summary.developmentExcerpt).toBe("待填写")
    expect(summary.turnExcerpt).toBe("待填写")
    expect(summary.lesson6GroupTitle).toBe("课时 6 让故事有一个恰当的结尾")
    expect(hasModule1Lesson6ConfirmedSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
      portfolio.lesson6,
    )).toBe(false)
  })

  it("教师演示档案能汇总出课时 6 转折安排", () => {
    const portfolio = createModule1TeacherLecturePortfolio()
    const summary = buildModule1Lesson6WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
      portfolio.lesson6,
    )
    expect(summary.endingType).toBe("开放余味")
    expect(summary.plotPlan).toContain("物业")
    expect(summary.openingExcerpt).not.toBe("待填写")
    expect(summary.turnExcerpt).not.toBe("待填写")
    expect(hasModule1Lesson6ConfirmedSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
      portfolio.lesson5,
      portfolio.lesson6,
    )).toBe(true)
  })
})
