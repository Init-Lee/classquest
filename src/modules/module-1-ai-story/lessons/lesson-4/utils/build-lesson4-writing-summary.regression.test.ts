/**
 * 文件说明：模块 1 课时 4 写作设定汇总回归测试。
 * 职责：锁定空态占位、必须列出 SDG 主题与课时 3 题目，以及教师演示预填能被汇总读到。
 * 更新触发：汇总字段、占位文案、SDG 展示或演示档案主题字段变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson4WritingSummary,
  hasModule1Lesson4ConfirmedSummary,
} from "@/modules/module-1-ai-story/lessons/lesson-4/utils/build-lesson4-writing-summary"

describe("模块 1 课时 4 写作设定汇总", () => {
  it("空态保留 SDG 与课时 3/4 字段并显示待选择/待填写", () => {
    const portfolio = createNewModule1Portfolio()
    const summary = buildModule1Lesson4WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
    )
    expect(summary.lesson1GroupTitle).toBe("课时 1 主题设定")
    expect(summary.lesson2GroupTitle).toBe("课时 2 风格与人物")
    expect(summary.lesson3GroupTitle).toBe("课时 3 开头")
    expect(summary.lesson4GroupTitle).toBe("课时 4 情节安排")
    expect(summary.sdg).toBe("待选择")
    expect(summary.sdgWhy).toBe("待填写")
    expect(summary.storyTitle).toBe("待填写")
    expect(summary.plotPlan).toBe("待填写")
    expect(summary.draftExcerpt).toBe("待填写")
    expect(hasModule1Lesson4ConfirmedSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
    )).toBe(false)
  })

  it("已选 SDG 时展示编号和中文名", () => {
    const portfolio = createNewModule1Portfolio()
    portfolio.lesson1.sdg = "11 可持续城市和社区"
    portfolio.lesson1.sdgWhy = "和回家的路有关"
    const summary = buildModule1Lesson4WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
    )
    expect(summary.sdg).toBe("11 可持续城市和社区")
    expect(summary.sdgWhy).toBe("和回家的路有关")
    expect(hasModule1Lesson4ConfirmedSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
    )).toBe(true)
  })

  it("教师演示预填的题目和情节安排可被汇总读到", () => {
    const portfolio = createModule1TeacherLecturePortfolio()
    const summary = buildModule1Lesson4WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
      portfolio.lesson4,
    )
    expect(summary.sdg).toBe("11 可持续城市和社区")
    expect(summary.storyTitle).toBe("关灯这件事")
    expect(summary.plotPlan).toContain("物业")
  })
})
