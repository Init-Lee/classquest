/**
 * 文件说明：模块 1 课时 5 复核、初稿冻结与 AI 过程回归测试。
 * 职责：锁定第 1/2 关无 AI 可过、第 3/4 关必须复制并贴回、检查上下文键失效、镜像确认稿随第 3 关改稿同步。
 * 更新触发：课时 5 完成判定、冻结字段、复核、contextKey 或 AI 过程口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson5State,
  createNewModule1Portfolio,
  hasMeaningfulModule1Lesson5Fields,
  hasModule1Lesson5Draft,
  hasModule1Lesson5Final,
  hasModule1Lesson5Observation,
  hasModule1Lesson5Plan,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON5_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson5-copy"
import {
  applyModule1Lesson5UpstreamReview,
  finalizeModule1Lesson5State,
  freezeModule1Lesson5Draft,
  hasModule1Lesson5CurrentDraft,
  hasModule1Lesson5CurrentFinal,
  hasModule1Lesson5CurrentRequiredAi,
  recordModule1Lesson5AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson5-update"
import { buildModule1Lesson5CheckContextKey } from "@/modules/module-1-ai-story/lessons/lesson-5/utils/build-lesson5-prompts"

function usedAiProcess(reply: string, contextKey = "ctx") {
  return {
    ...recordModule1Lesson5AiCopy(
      createEmptyModule1Lesson5State().aiProcess.p3,
      "原始提示词",
      "复制的提示词",
      contextKey,
    ),
    aiReply: reply,
  }
}

function filledLesson5() {
  const empty = createEmptyModule1Lesson5State()
  return {
    ...empty,
    observation: MODULE1_LESSON5_EXAMPLE.observation,
    plotPlan: MODULE1_LESSON5_EXAMPLE.plotPlan,
    planReason: MODULE1_LESSON5_EXAMPLE.planReason,
    draftText: MODULE1_LESSON5_EXAMPLE.draftText,
    draftFrozenText: MODULE1_LESSON5_EXAMPLE.draftText,
    finalText: MODULE1_LESSON5_EXAMPLE.finalText,
    decisionNote: MODULE1_LESSON5_EXAMPLE.decisionNote,
    selfCheck: true,
    aiProcess: {
      ...empty.aiProcess,
      p3: usedAiProcess("一版转段草稿"),
      p4: usedAiProcess("检查意见"),
    },
  }
}

describe("模块 1 课时 5 完成与防丢", () => {
  it("第 1/2 关无 AI 仍可过关", () => {
    const state = {
      ...createEmptyModule1Lesson5State(),
      observation: MODULE1_LESSON5_EXAMPLE.observation,
      plotPlan: MODULE1_LESSON5_EXAMPLE.plotPlan,
      planReason: MODULE1_LESSON5_EXAMPLE.planReason,
    }
    expect(hasModule1Lesson5Observation(state)).toBe(true)
    expect(hasModule1Lesson5Plan(state)).toBe(true)
  })

  it("第 1 关点过复制但未贴回回复不能过", () => {
    const empty = createEmptyModule1Lesson5State()
    const state = {
      ...empty,
      observation: MODULE1_LESSON5_EXAMPLE.observation,
      aiProcess: {
        ...empty.aiProcess,
        p1: recordModule1Lesson5AiCopy(empty.aiProcess.p1, "原始", "复制", "p1"),
      },
    }
    expect(hasModule1Lesson5Observation(state)).toBe(false)
  })

  it("第 3 关无 AI 过程不能过", () => {
    const noAi = {
      ...filledLesson5(),
      aiProcess: createEmptyModule1Lesson5State().aiProcess,
    }
    expect(hasModule1Lesson5Draft(noAi)).toBe(false)
    expect(hasMeaningfulModule1Lesson5Fields(noAi)).toBe(false)
  })

  it("第 3 关复制成功但未贴回回复不能过", () => {
    const empty = createEmptyModule1Lesson5State()
    const copiedOnly = {
      ...filledLesson5(),
      aiProcess: {
        ...empty.aiProcess,
        p3: recordModule1Lesson5AiCopy(empty.aiProcess.p3, "原始提示词", "编辑后的提示词", "ctx"),
        p4: usedAiProcess("检查意见"),
      },
    }
    expect(hasModule1Lesson5Draft(copiedOnly)).toBe(false)
    copiedOnly.aiProcess.p3.aiReply = "一版转段草稿"
    expect(hasModule1Lesson5Draft(copiedOnly)).toBe(true)
  })

  it("第 4 关未勾选连读确认或未走检查 AI 不能完成", () => {
    expect(hasModule1Lesson5Final({ ...filledLesson5(), selfCheck: false })).toBe(false)
    const empty = createEmptyModule1Lesson5State()
    const noP4 = {
      ...filledLesson5(),
      aiProcess: {
        ...empty.aiProcess,
        p3: usedAiProcess("一版转段草稿"),
      },
    }
    expect(hasModule1Lesson5Final(noP4)).toBe(false)
    expect(hasMeaningfulModule1Lesson5Fields(noP4)).toBe(false)
  })

  it("第 3/4 关复制并贴回后，观察、安排、初稿、确认稿和处理说明齐全即可完成", () => {
    expect(hasMeaningfulModule1Lesson5Fields(filledLesson5())).toBe(true)
  })

  it("旧轮次 contextKey 不匹配时不能当作本轮必用 AI", () => {
    const state = filledLesson5()
    expect(hasModule1Lesson5CurrentRequiredAi(state.aiProcess.p3, "ctx")).toBe(true)
    expect(hasModule1Lesson5CurrentRequiredAi(state.aiProcess.p3, "new-ctx")).toBe(false)
    expect(hasModule1Lesson5CurrentDraft(state, "new-ctx")).toBe(false)
    expect(hasModule1Lesson5Draft(state)).toBe(true)
  })

  it("首次确认初稿写入冻结字段，之后改 draftText 不覆盖冻结稿和确认稿", () => {
    const first = freezeModule1Lesson5Draft({
      ...createEmptyModule1Lesson5State(),
      draftText: "第一版转段初稿",
    })
    expect(first.draftFrozenText).toBe("第一版转段初稿")
    const second = freezeModule1Lesson5Draft({
      ...first,
      draftText: "回改后的初稿",
      finalText: "已经确认的转段",
    })
    expect(second.draftFrozenText).toBe("第一版转段初稿")
    expect(second.finalText).toBe("已经确认的转段")
  })

  it("改初稿会提示核对确认稿，但不改 finalText", () => {
    const previous = { ...filledLesson5(), draftText: "旧初稿" }
    const next = finalizeModule1Lesson5State(previous, {
      ...previous,
      draftText: "新初稿",
    })
    expect(next.finalText).toBe(MODULE1_LESSON5_EXAMPLE.finalText)
    expect(next.reviewNeeded.final).toBe(true)
  })

  it("确认稿仍是旧初稿镜像时，改第 3 关稿会同步确认稿并作废自定义检查提示词", () => {
    const previous = {
      ...filledLesson5(),
      draftText: "旧初稿镜像A",
      finalText: "旧初稿镜像A",
      customPrompts: {
        ...createEmptyModule1Lesson5State().customPrompts,
        p4: "学生改过的旧检查提示词，含旧初稿镜像A",
        p5: "学生改过的旧局部修改提示词",
      },
    }
    const next = finalizeModule1Lesson5State(previous, {
      ...previous,
      draftText: "新初稿镜像B",
    })
    expect(next.finalText).toBe("新初稿镜像B")
    expect(next.reviewNeeded.final).toBe(false)
    expect(next.customPrompts.p4).toBe("")
    expect(next.customPrompts.p5).toBe("")
  })

  it("context 变化后，旧的 copied+reply 不能再算第 4 关已完成", () => {
    const portfolio = createNewModule1Portfolio()
    portfolio.lesson5 = {
      ...filledLesson5(),
      draftText: "【夹具A】转段旧稿",
      finalText: "【夹具A】转段旧稿",
    }
    const oldKey = buildModule1Lesson5CheckContextKey(portfolio)
    const withAi = {
      ...portfolio.lesson5,
      aiProcess: {
        ...portfolio.lesson5.aiProcess,
        p4: usedAiProcess("检查意见", oldKey),
      },
    }
    expect(hasModule1Lesson5CurrentFinal(withAi, oldKey)).toBe(true)

    const revised = finalizeModule1Lesson5State(withAi, {
      ...withAi,
      draftText: "【夹具B】转段新稿",
    })
    const newKey = buildModule1Lesson5CheckContextKey({
      ...portfolio,
      lesson5: revised,
    })
    expect(newKey).not.toBe(oldKey)
    expect(hasModule1Lesson5CurrentRequiredAi(revised.aiProcess.p4, newKey)).toBe(false)
    expect(hasModule1Lesson5CurrentFinal(revised, newKey)).toBe(false)
  })

  it("上游开头变化时保留课时 5 正文并标记复核", () => {
    const previous = createNewModule1Portfolio()
    previous.lesson3.finalText = "旧开头"
    previous.lesson5 = filledLesson5()
    const next = {
      ...previous,
      lesson3: { ...previous.lesson3, finalText: "新开头" },
    }
    const reviewed = applyModule1Lesson5UpstreamReview(previous, next)
    expect(reviewed.lesson5.draftText).toBe(MODULE1_LESSON5_EXAMPLE.draftText)
    expect(reviewed.lesson5.finalText).toBe(MODULE1_LESSON5_EXAMPLE.finalText)
    expect(reviewed.lesson5.reviewNeeded.plan).toBe(true)
    expect(reviewed.lesson5.reviewNeeded.draft).toBe(true)
    expect(reviewed.lesson5.reviewNeeded.final).toBe(true)
  })

  it("旧包只有空课时 5 时补齐新字段且不丢课时 1—3", () => {
    const portfolio = createNewModule1Portfolio({ studentName: "张三" })
    portfolio.lesson1.sdg = "11 可持续城市和社区"
    portfolio.lesson2.reason = "希望读者先感到现场"
    portfolio.lesson3.storyTitle = "关灯这件事"
    const normalized = normalizeModule1Portfolio({
      ...portfolio,
      lesson5: { step: 1, completed: false, completedAt: null },
    })
    expect(normalized.lesson1.sdg).toBe("11 可持续城市和社区")
    expect(normalized.lesson2.reason).toBe("希望读者先感到现场")
    expect(normalized.lesson3.storyTitle).toBe("关灯这件事")
    expect(normalized.lesson5).toMatchObject(createEmptyModule1Lesson5State())
    expect(normalized).not.toHaveProperty("fullStory")
    expect(normalized).not.toHaveProperty("lesson7")
  })

  it("字数和 2035 都不进入完成判定", () => {
    const short = {
      ...filledLesson5(),
      draftText: "很短的初稿。",
      finalText: "很短的确认稿。",
    }
    expect(hasModule1Lesson5Final(short)).toBe(true)
    expect(short.finalText.includes("2035")).toBe(false)
    expect(hasMeaningfulModule1Lesson5Fields(short)).toBe(true)
  })
})
