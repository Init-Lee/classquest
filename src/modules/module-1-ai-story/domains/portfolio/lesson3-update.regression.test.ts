/**
 * 文件说明：模块 1 课时 3 复核、初稿冻结与 AI 过程回归测试。
 * 职责：锁定题目必填、无 AI 可完成、复制成功后须贴回、改初稿不冲确认稿、保留初稿可恢复。
 * 更新触发：课时 3 完成判定、冻结字段、复核或 AI 过程口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson3State,
  createNewModule1Portfolio,
  hasMeaningfulModule1Lesson3Fields,
  hasModule1Lesson3Draft,
  hasModule1Lesson3Final,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON3_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import {
  applyModule1Lesson3UpstreamReview,
  finalizeModule1Lesson3State,
  freezeModule1Lesson3Draft,
  recordModule1Lesson3AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson3-update"

function filledLesson3() {
  return {
    ...createEmptyModule1Lesson3State(),
    observation: MODULE1_LESSON3_EXAMPLE.observation,
    openingPlan: MODULE1_LESSON3_EXAMPLE.openingPlan,
    focusTechnique: MODULE1_LESSON3_EXAMPLE.focusTechnique,
    storyTitle: MODULE1_LESSON3_EXAMPLE.storyTitle,
    draftText: MODULE1_LESSON3_EXAMPLE.draftText,
    draftFrozenText: MODULE1_LESSON3_EXAMPLE.draftText,
    finalText: MODULE1_LESSON3_EXAMPLE.finalText,
    decisionNote: MODULE1_LESSON3_EXAMPLE.decisionNote,
  }
}

describe("模块 1 课时 3 完成与防丢", () => {
  it("无 AI 时题目、初稿、确认稿和处理说明齐全即可完成", () => {
    expect(hasMeaningfulModule1Lesson3Fields(filledLesson3())).toBe(true)
  })

  it("缺题目不能完成第 3 关", () => {
    const state = { ...filledLesson3(), storyTitle: "" }
    expect(hasModule1Lesson3Draft(state)).toBe(false)
    expect(hasMeaningfulModule1Lesson3Fields(state)).toBe(false)
  })

  it("复制成功但未贴回回复不能完成对应关", () => {
    const state = {
      ...filledLesson3(),
      aiProcess: {
        ...createEmptyModule1Lesson3State().aiProcess,
        p3: recordModule1Lesson3AiCopy(
          createEmptyModule1Lesson3State().aiProcess.p3,
          "原始提示词",
          "编辑后的提示词",
        ),
      },
    }
    expect(hasModule1Lesson3Draft(state)).toBe(false)
    state.aiProcess.p3.aiReply = "一版草稿"
    expect(hasModule1Lesson3Draft(state)).toBe(true)
  })

  it("首次确认初稿写入冻结字段，之后改 draftText 不覆盖冻结稿和确认稿", () => {
    const first = freezeModule1Lesson3Draft({
      ...createEmptyModule1Lesson3State(),
      draftText: "第一版初稿",
    })
    expect(first.draftFrozenText).toBe("第一版初稿")
    const second = freezeModule1Lesson3Draft({
      ...first,
      draftText: "回改后的初稿",
      finalText: "已经确认的开头",
    })
    expect(second.draftFrozenText).toBe("第一版初稿")
    expect(second.finalText).toBe("已经确认的开头")
  })

  it("改初稿会提示核对确认稿，但不改 finalText", () => {
    const previous = { ...filledLesson3(), draftText: "旧初稿" }
    const next = finalizeModule1Lesson3State(previous, {
      ...previous,
      draftText: "新初稿",
    })
    expect(next.finalText).toBe(MODULE1_LESSON3_EXAMPLE.finalText)
    expect(next.reviewNeeded.final).toBe(true)
  })

  it("上游写法变化时保留课时 3 正文并标记复核", () => {
    const previous = createNewModule1Portfolio()
    previous.lesson2.writingPlan = "旧写法"
    previous.lesson3 = filledLesson3()
    const next = {
      ...previous,
      lesson2: { ...previous.lesson2, writingPlan: "新写法" },
    }
    const reviewed = applyModule1Lesson3UpstreamReview(previous, next)
    expect(reviewed.lesson3.draftText).toBe(MODULE1_LESSON3_EXAMPLE.draftText)
    expect(reviewed.lesson3.finalText).toBe(MODULE1_LESSON3_EXAMPLE.finalText)
    expect(reviewed.lesson3.reviewNeeded.opening).toBe(true)
    expect(reviewed.lesson3.reviewNeeded.draft).toBe(true)
    expect(reviewed.lesson3.reviewNeeded.final).toBe(true)
  })

  it("旧包只有空课时 3 时补齐新字段且不丢课时 1/2", () => {
    const portfolio = createNewModule1Portfolio({ studentName: "张三" })
    portfolio.lesson1.sdg = "11 可持续城市和社区"
    portfolio.lesson2.reason = "希望读者先感到现场"
    const normalized = normalizeModule1Portfolio({
      ...portfolio,
      lesson3: { step: 1, completed: false, completedAt: null },
    })
    expect(normalized.lesson1.sdg).toBe("11 可持续城市和社区")
    expect(normalized.lesson2.reason).toBe("希望读者先感到现场")
    expect(normalized.lesson3).toMatchObject(createEmptyModule1Lesson3State())
    expect(normalized).not.toHaveProperty("fullStory")
    expect(normalized).not.toHaveProperty("lesson7")
  })

  it("字数和 2035 都不进入完成判定", () => {
    const short = {
      ...filledLesson3(),
      draftText: "很短的初稿。",
      finalText: "很短的确认稿。",
    }
    expect(hasModule1Lesson3Final(short)).toBe(true)
    expect(short.finalText.includes("2035")).toBe(false)
    expect(hasMeaningfulModule1Lesson3Fields(short)).toBe(true)
  })
})
