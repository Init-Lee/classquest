/**
 * 文件说明：模块 1 课时 3 写作设定汇总回归测试。
 * 职责：锁定空态占位、必须列出 SDG 主题（编号+名称）与选择理由，以及教师演示预填能被汇总读到。
 * 更新触发：汇总字段、占位文案、SDG 展示或演示档案主题字段变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1Lesson3WritingSummary,
  hasModule1Lesson3ConfirmedSummary,
} from "@/modules/module-1-ai-story/lessons/lesson-3/utils/build-lesson3-writing-summary"

describe("模块 1 课时 3 写作设定汇总", () => {
  it("空态保留 SDG 与主题字段并显示待选择/待填写", () => {
    const portfolio = createNewModule1Portfolio()
    const summary = buildModule1Lesson3WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
    )
    expect(summary.lesson1GroupTitle).toBe("课时 1 主题设定")
    expect(summary.lesson2GroupTitle).toBe("课时 2 风格与人物")
    expect(summary.lesson3GroupTitle).toBe("课时 3 开头")
    expect(summary.sdg).toBe("待选择")
    expect(summary.sdgWhy).toBe("待填写")
    expect(summary.cityIssue).toBe("待填写")
    expect(summary.workTitle).toBe("待填写")
    expect(summary.storyTitle).toBe("待填写")
    expect(summary.openingPlan).toBe("待选择")
    expect(summary.draftExcerpt).toBe("待填写")
    expect(summary.finalExcerpt).toBe("待填写")
    expect(summary.themeCore).toContain("待选择")
    expect(hasModule1Lesson3ConfirmedSummary(portfolio.lesson1, portfolio.lesson2, portfolio.lesson3)).toBe(false)
  })

  it("已选 SDG 时展示编号和中文名，并带上选择理由", () => {
    const portfolio = createNewModule1Portfolio()
    portfolio.lesson1.sdg = "11 可持续城市和社区"
    portfolio.lesson1.sdgWhy = "和回家的路有关"
    const summary = buildModule1Lesson3WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
    )
    expect(summary.sdg).toBe("11 可持续城市和社区")
    expect(summary.sdgWhy).toBe("和回家的路有关")
    expect(summary.themeCore).toContain("11 可持续城市和社区")
    expect(hasModule1Lesson3ConfirmedSummary(portfolio.lesson1, portfolio.lesson2, portfolio.lesson3)).toBe(true)
  })

  it("教师演示预填的 SDG 会规范成编号加中文名", () => {
    const portfolio = createModule1TeacherLecturePortfolio()
    const summary = buildModule1Lesson3WritingSummary(
      portfolio.lesson1,
      portfolio.lesson2,
      portfolio.lesson3,
    )
    expect(summary.sdg).toBe("11 可持续城市和社区")
    expect(summary.sdgWhy).toContain("夜间照明")
  })
})
