/**
 * 文件说明：模块 1「我的小说」解锁与派生回归测试。
 * 职责：锁定未完成不可读、确认版本与当前稿分离、复制全文不含过程字段，且不落盘 fullStory。
 * 更新触发：作品解锁条件、确认版本字段或复制范围变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import {
  createEmptyModule1Lesson6State,
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  buildModule1ConfirmedStoryCopyText,
  module1StoryNeedsReview,
  resolveModule1StoryAccess,
} from "@/modules/module-1-ai-story/features/story/module1-story-access"

describe("模块 1 我的小说", () => {
  it("未完成课时 6 时锁定，演示完成档案可读且不含 fullStory", () => {
    const fresh = createNewModule1Portfolio()
    expect(resolveModule1StoryAccess(fresh)).toBe("locked")
    const demo = createModule1TeacherLecturePortfolio()
    expect(resolveModule1StoryAccess(demo)).toBe("readable")
    expect(module1StoryNeedsReview(demo)).toBe(false)
    expect(demo).not.toHaveProperty("fullStory")
    const copied = buildModule1ConfirmedStoryCopyText(demo.lesson6.confirmedEdition!)
    expect(copied).toContain(demo.lesson3.storyTitle)
    expect(copied).toContain(demo.lesson6.finalText)
    expect(copied).not.toContain(demo.student.classSeatCode)
    expect(copied).not.toContain("提示词")
  })

  it("改合段但不重新确认时仍读旧确认稿，并标待复核", () => {
    const demo = createModule1TeacherLecturePortfolio()
    demo.lesson6.finalText = "这是还没再次确认的新合段。"
    expect(resolveModule1StoryAccess(demo)).toBe("readable")
    expect(module1StoryNeedsReview(demo)).toBe(true)
    expect(demo.lesson6.confirmedEdition?.endingText).not.toContain("还没再次确认")
  })

  it("完成标记为真但没有可解析确认版本时不放行", () => {
    const portfolio = createNewModule1Portfolio()
    portfolio.lesson6 = {
      ...createEmptyModule1Lesson6State(),
      completed: true,
      completedAt: "2026-10-09T00:00:00.000Z",
      step4Completed: true,
    }
    const normalized = normalizeModule1Portfolio(portfolio)
    expect(normalized.lesson6.completed).toBe(false)
    expect(resolveModule1StoryAccess(normalized)).toBe("locked")
  })
})
