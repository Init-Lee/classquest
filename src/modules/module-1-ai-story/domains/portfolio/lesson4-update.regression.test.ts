/**
 * 文件说明：模块 1 课时 4 复核、初稿冻结与 AI 过程回归测试。
 * 职责：锁定第 1/2 关无 AI 可过、第 3/4 关必须复制并贴回、上下文键失效、改初稿不冲确认稿。
 * 更新触发：课时 4 完成判定、冻结字段、复核、contextKey 或 AI 过程口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson4State,
  createNewModule1Portfolio,
  hasMeaningfulModule1Lesson4Fields,
  hasModule1Lesson4Draft,
  hasModule1Lesson4Final,
  hasModule1Lesson4Observation,
  hasModule1Lesson4Plan,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON4_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson4-copy"
import {
  applyModule1Lesson4UpstreamReview,
  finalizeModule1Lesson4State,
  freezeModule1Lesson4Draft,
  hasModule1Lesson4CurrentDraft,
  hasModule1Lesson4CurrentRequiredAi,
  recordModule1Lesson4AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson4-update"

function usedAiProcess(reply: string, contextKey = "ctx") {
  return {
    ...recordModule1Lesson4AiCopy(
      createEmptyModule1Lesson4State().aiProcess.p3,
      "原始提示词",
      "复制的提示词",
      contextKey,
    ),
    aiReply: reply,
  }
}

function filledLesson4() {
  const empty = createEmptyModule1Lesson4State()
  return {
    ...empty,
    observation: MODULE1_LESSON4_EXAMPLE.observation,
    plotPlan: MODULE1_LESSON4_EXAMPLE.plotPlan,
    planReason: MODULE1_LESSON4_EXAMPLE.planReason,
    draftText: MODULE1_LESSON4_EXAMPLE.draftText,
    draftFrozenText: MODULE1_LESSON4_EXAMPLE.draftText,
    finalText: MODULE1_LESSON4_EXAMPLE.finalText,
    decisionNote: MODULE1_LESSON4_EXAMPLE.decisionNote,
    selfCheck: true,
    aiProcess: {
      ...empty.aiProcess,
      p3: usedAiProcess("一版承段草稿"),
      p4: usedAiProcess("检查意见"),
    },
  }
}

describe("模块 1 课时 4 完成与防丢", () => {
  it("第 1/2 关无 AI 仍可过关", () => {
    const state = {
      ...createEmptyModule1Lesson4State(),
      observation: MODULE1_LESSON4_EXAMPLE.observation,
      plotPlan: MODULE1_LESSON4_EXAMPLE.plotPlan,
      planReason: MODULE1_LESSON4_EXAMPLE.planReason,
    }
    expect(hasModule1Lesson4Observation(state)).toBe(true)
    expect(hasModule1Lesson4Plan(state)).toBe(true)
  })

  it("第 1 关点过复制但未贴回回复不能过", () => {
    const empty = createEmptyModule1Lesson4State()
    const state = {
      ...empty,
      observation: MODULE1_LESSON4_EXAMPLE.observation,
      aiProcess: {
        ...empty.aiProcess,
        p1: recordModule1Lesson4AiCopy(empty.aiProcess.p1, "原始", "复制", "p1"),
      },
    }
    expect(hasModule1Lesson4Observation(state)).toBe(false)
  })

  it("第 3 关无 AI 过程不能过", () => {
    const noAi = {
      ...filledLesson4(),
      aiProcess: createEmptyModule1Lesson4State().aiProcess,
    }
    expect(hasModule1Lesson4Draft(noAi)).toBe(false)
    expect(hasMeaningfulModule1Lesson4Fields(noAi)).toBe(false)
  })

  it("第 3 关复制成功但未贴回回复不能过", () => {
    const empty = createEmptyModule1Lesson4State()
    const copiedOnly = {
      ...filledLesson4(),
      aiProcess: {
        ...empty.aiProcess,
        p3: recordModule1Lesson4AiCopy(empty.aiProcess.p3, "原始提示词", "编辑后的提示词", "ctx"),
        p4: usedAiProcess("检查意见"),
      },
    }
    expect(hasModule1Lesson4Draft(copiedOnly)).toBe(false)
    copiedOnly.aiProcess.p3.aiReply = "一版承段草稿"
    expect(hasModule1Lesson4Draft(copiedOnly)).toBe(true)
  })

  it("第 4 关未勾选连读确认或未走检查 AI 不能完成", () => {
    expect(hasModule1Lesson4Final({ ...filledLesson4(), selfCheck: false })).toBe(false)
    const empty = createEmptyModule1Lesson4State()
    const noP4 = {
      ...filledLesson4(),
      aiProcess: {
        ...empty.aiProcess,
        p3: usedAiProcess("一版承段草稿"),
      },
    }
    expect(hasModule1Lesson4Final(noP4)).toBe(false)
    expect(hasMeaningfulModule1Lesson4Fields(noP4)).toBe(false)
  })

  it("第 3/4 关复制并贴回后，观察、安排、初稿、确认稿和处理说明齐全即可完成", () => {
    expect(hasMeaningfulModule1Lesson4Fields(filledLesson4())).toBe(true)
  })

  it("旧轮次 contextKey 不匹配时不能当作本轮必用 AI", () => {
    const state = filledLesson4()
    expect(hasModule1Lesson4CurrentRequiredAi(state.aiProcess.p3, "ctx")).toBe(true)
    expect(hasModule1Lesson4CurrentRequiredAi(state.aiProcess.p3, "new-ctx")).toBe(false)
    expect(hasModule1Lesson4CurrentDraft(state, "new-ctx")).toBe(false)
    expect(hasModule1Lesson4Draft(state)).toBe(true)
  })

  it("首次确认初稿写入冻结字段，之后改 draftText 不覆盖冻结稿和确认稿", () => {
    const first = freezeModule1Lesson4Draft({
      ...createEmptyModule1Lesson4State(),
      draftText: "第一版承段初稿",
    })
    expect(first.draftFrozenText).toBe("第一版承段初稿")
    const second = freezeModule1Lesson4Draft({
      ...first,
      draftText: "回改后的初稿",
      finalText: "已经确认的承段",
    })
    expect(second.draftFrozenText).toBe("第一版承段初稿")
    expect(second.finalText).toBe("已经确认的承段")
  })

  it("改初稿会提示核对确认稿，但不改 finalText", () => {
    const previous = { ...filledLesson4(), draftText: "旧初稿" }
    const next = finalizeModule1Lesson4State(previous, {
      ...previous,
      draftText: "新初稿",
    })
    expect(next.finalText).toBe(MODULE1_LESSON4_EXAMPLE.finalText)
    expect(next.reviewNeeded.final).toBe(true)
  })

  it("上游开头变化时保留课时 4 正文并标记复核", () => {
    const previous = createNewModule1Portfolio()
    previous.lesson3.finalText = "旧开头"
    previous.lesson4 = filledLesson4()
    const next = {
      ...previous,
      lesson3: { ...previous.lesson3, finalText: "新开头" },
    }
    const reviewed = applyModule1Lesson4UpstreamReview(previous, next)
    expect(reviewed.lesson4.draftText).toBe(MODULE1_LESSON4_EXAMPLE.draftText)
    expect(reviewed.lesson4.finalText).toBe(MODULE1_LESSON4_EXAMPLE.finalText)
    expect(reviewed.lesson4.reviewNeeded.plan).toBe(true)
    expect(reviewed.lesson4.reviewNeeded.draft).toBe(true)
    expect(reviewed.lesson4.reviewNeeded.final).toBe(true)
  })

  it("旧包只有空课时 4 时补齐新字段且不丢课时 1—3", () => {
    const portfolio = createNewModule1Portfolio({ studentName: "张三" })
    portfolio.lesson1.sdg = "11 可持续城市和社区"
    portfolio.lesson2.reason = "希望读者先感到现场"
    portfolio.lesson3.storyTitle = "关灯这件事"
    const normalized = normalizeModule1Portfolio({
      ...portfolio,
      lesson4: { step: 1, completed: false, completedAt: null },
    })
    expect(normalized.lesson1.sdg).toBe("11 可持续城市和社区")
    expect(normalized.lesson2.reason).toBe("希望读者先感到现场")
    expect(normalized.lesson3.storyTitle).toBe("关灯这件事")
    expect(normalized.lesson4).toMatchObject(createEmptyModule1Lesson4State())
    expect(normalized).not.toHaveProperty("fullStory")
    expect(normalized).not.toHaveProperty("lesson7")
  })

  it("字数和 2035 都不进入完成判定", () => {
    const short = {
      ...filledLesson4(),
      draftText: "很短的初稿。",
      finalText: "很短的确认稿。",
    }
    expect(hasModule1Lesson4Final(short)).toBe(true)
    expect(short.finalText.includes("2035")).toBe(false)
    expect(hasMeaningfulModule1Lesson4Fields(short)).toBe(true)
  })
})
