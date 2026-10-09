/**
 * 文件说明：模块 1 课时 6 复核、初稿硬锁与 AI 过程回归测试。
 * 职责：锁定第 1/2 关无 AI 可过、第 3/4 关复制并贴回一次即可、改确认稿不清预览与通读、第 3 关完成后忽略 draft 回写、「恢复初稿」替换确认稿但不作废已完成的检查。
 * 更新触发：课时 6 完成判定、初稿硬锁、复核、contextKey 或 AI 过程口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson6State,
  createNewModule1Portfolio,
  hasMeaningfulModule1Lesson6Fields,
  hasModule1Lesson6Draft,
  hasModule1Lesson6Final,
  hasModule1Lesson6Observation,
  hasModule1Lesson6Plan,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON6_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson6-copy"
import {
  applyModule1Lesson6UpstreamReview,
  finalizeModule1Lesson6State,
  freezeModule1Lesson6Draft,
  hasModule1Lesson6CurrentDraft,
  hasModule1Lesson6CurrentFinal,
  hasModule1Lesson6CurrentRequiredAi,
  recordModule1Lesson6AiCopy,
} from "@/modules/module-1-ai-story/domains/portfolio/lesson6-update"
import { buildModule1Lesson6CheckContextKey } from "@/modules/module-1-ai-story/lessons/lesson-6/utils/build-lesson6-prompts"

function usedAiProcess(reply: string, contextKey = "ctx") {
  return {
    ...recordModule1Lesson6AiCopy(
      createEmptyModule1Lesson6State().aiProcess.p3,
      "原始提示词",
      "复制的提示词",
      contextKey,
    ),
    aiReply: reply,
  }
}

function filledLesson6() {
  const empty = createEmptyModule1Lesson6State()
  return {
    ...empty,
    observation: MODULE1_LESSON6_EXAMPLE.observation,
    endingType: MODULE1_LESSON6_EXAMPLE.endingType,
    plotPlan: MODULE1_LESSON6_EXAMPLE.plotPlan,
    planReason: MODULE1_LESSON6_EXAMPLE.planReason,
    draftText: MODULE1_LESSON6_EXAMPLE.draftText,
    draftFrozenText: MODULE1_LESSON6_EXAMPLE.draftText,
    finalText: MODULE1_LESSON6_EXAMPLE.finalText,
    decisionNote: MODULE1_LESSON6_EXAMPLE.decisionNote,
    selfCheck: true,
    previewSeenKey: "seen",
    aiProcess: {
      ...empty.aiProcess,
      p3: usedAiProcess("一版转段草稿"),
      p4: usedAiProcess("检查意见"),
    },
  }
}

describe("模块 1 课时 6 完成与防丢", () => {
  it("第 1/2 关无 AI 仍可过关", () => {
    const state = {
      ...createEmptyModule1Lesson6State(),
      observation: MODULE1_LESSON6_EXAMPLE.observation,
      endingType: MODULE1_LESSON6_EXAMPLE.endingType,
      plotPlan: MODULE1_LESSON6_EXAMPLE.plotPlan,
      planReason: MODULE1_LESSON6_EXAMPLE.planReason,
    }
    expect(hasModule1Lesson6Observation(state)).toBe(true)
    expect(hasModule1Lesson6Plan(state)).toBe(true)
  })

  it("第 1 关点过复制但未贴回回复不能过", () => {
    const empty = createEmptyModule1Lesson6State()
    const state = {
      ...empty,
      observation: MODULE1_LESSON6_EXAMPLE.observation,
      aiProcess: {
        ...empty.aiProcess,
        p1: recordModule1Lesson6AiCopy(empty.aiProcess.p1, "原始", "复制", "p1"),
      },
    }
    expect(hasModule1Lesson6Observation(state)).toBe(false)
  })

  it("第 3 关无 AI 过程不能过", () => {
    const noAi = {
      ...filledLesson6(),
      aiProcess: createEmptyModule1Lesson6State().aiProcess,
    }
    expect(hasModule1Lesson6Draft(noAi)).toBe(false)
    expect(hasMeaningfulModule1Lesson6Fields(noAi)).toBe(false)
  })

  it("第 3 关复制成功但未贴回回复不能过", () => {
    const empty = createEmptyModule1Lesson6State()
    const copiedOnly = {
      ...filledLesson6(),
      aiProcess: {
        ...empty.aiProcess,
        p3: recordModule1Lesson6AiCopy(empty.aiProcess.p3, "原始提示词", "编辑后的提示词", "ctx"),
        p4: usedAiProcess("检查意见"),
      },
    }
    expect(hasModule1Lesson6Draft(copiedOnly)).toBe(false)
    copiedOnly.aiProcess.p3.aiReply = "一版转段草稿"
    expect(hasModule1Lesson6Draft(copiedOnly)).toBe(true)
  })

  it("第 4 关未勾选连读确认或未走检查 AI 不能完成", () => {
    expect(hasModule1Lesson6Final({ ...filledLesson6(), selfCheck: false })).toBe(false)
    const empty = createEmptyModule1Lesson6State()
    const noP4 = {
      ...filledLesson6(),
      aiProcess: {
        ...empty.aiProcess,
        p3: usedAiProcess("一版转段草稿"),
      },
    }
    expect(hasModule1Lesson6Final(noP4)).toBe(false)
    expect(hasMeaningfulModule1Lesson6Fields(noP4)).toBe(false)
  })

  it("第 3/4 关复制并贴回后，观察、安排、初稿、确认稿和处理说明齐全即可完成", () => {
    expect(hasMeaningfulModule1Lesson6Fields(filledLesson6())).toBe(true)
  })

  it("contextKey 与当前正文不一致时，复制成功且回复非空仍算必用 AI", () => {
    const state = filledLesson6()
    state.aiProcess.p3.contextKey = "过期的起草上下文"
    state.endingType = "结果收束"
    state.draftText = "改过的初稿"
    expect(hasModule1Lesson6CurrentRequiredAi(state.aiProcess.p3)).toBe(true)
    expect(hasModule1Lesson6CurrentDraft(state)).toBe(true)
    expect(hasModule1Lesson6Draft(state)).toBe(true)
    state.aiProcess.p3.aiReply = ""
    expect(hasModule1Lesson6CurrentDraft(state)).toBe(false)
    state.aiProcess.p3.aiReply = "一版转段草稿"
    state.aiProcess.p3.copySucceeded = false
    expect(hasModule1Lesson6CurrentRequiredAi(state.aiProcess.p3)).toBe(false)
    expect(hasModule1Lesson6CurrentDraft(state)).toBe(false)
  })

  it("首次确认初稿写入冻结字段，之后改 draftText 不覆盖冻结稿和确认稿", () => {
    const first = freezeModule1Lesson6Draft({
      ...createEmptyModule1Lesson6State(),
      draftText: "第一版转段初稿",
    })
    expect(first.draftFrozenText).toBe("第一版转段初稿")
    const second = freezeModule1Lesson6Draft({
      ...first,
      draftText: "回改后的初稿",
      finalText: "已经确认的转段",
    })
    expect(second.draftFrozenText).toBe("第一版转段初稿")
    expect(second.finalText).toBe("已经确认的转段")
  })

  it("第 3 关完成后写入 draftText 被忽略，且不亮确认稿复核", () => {
    const previous = {
      ...filledLesson6(),
      step3Completed: true,
      draftText: "已锁定初稿",
      finalText: "已改过的确认稿",
      reviewNeeded: { plan: false, draft: false, final: false },
    }
    const next = finalizeModule1Lesson6State(previous, {
      ...previous,
      draftText: "试图回改的初稿",
    })
    expect(next.draftText).toBe("已锁定初稿")
    expect(next.finalText).toBe("已改过的确认稿")
    expect(next.reviewNeeded.final).toBe(false)
  })

  it("改确认稿后，已复制且有回复、已预览已勾选仍可完成；没复制或回复空不能完成", () => {
    const previous = filledLesson6()
    const edited = finalizeModule1Lesson6State(previous, {
      ...previous,
      finalText: "改过一字的确认稿",
      decisionNote: "处理说明也改了",
    })
    expect(edited.selfCheck).toBe(true)
    expect(edited.previewSeenKey).toBe("seen")
    expect(hasModule1Lesson6CurrentFinal(edited)).toBe(true)
    expect(hasModule1Lesson6Final(edited)).toBe(true)

    const noCopy = {
      ...edited,
      aiProcess: {
        ...edited.aiProcess,
        p4: createEmptyModule1Lesson6State().aiProcess.p4,
      },
    }
    expect(hasModule1Lesson6CurrentFinal(noCopy)).toBe(false)

    const emptyReply = {
      ...edited,
      aiProcess: {
        ...edited.aiProcess,
        p4: { ...edited.aiProcess.p4, aiReply: "" },
      },
    }
    expect(hasModule1Lesson6CurrentFinal(emptyReply)).toBe(false)

    expect(hasModule1Lesson6CurrentFinal({ ...edited, previewSeenKey: "" })).toBe(false)
    expect(hasModule1Lesson6CurrentFinal({ ...edited, selfCheck: false })).toBe(false)
    expect(hasModule1Lesson6CurrentFinal({ ...edited, finalText: "  " })).toBe(false)
    expect(hasModule1Lesson6CurrentFinal({ ...edited, decisionNote: "" })).toBe(false)

    const p5CopiedEmpty = {
      ...edited,
      aiProcess: {
        ...edited.aiProcess,
        p5: recordModule1Lesson6AiCopy(edited.aiProcess.p5, "局部修改", "局部修改", "p5"),
      },
    }
    expect(hasModule1Lesson6CurrentFinal(p5CopiedEmpty)).toBe(false)
    p5CopiedEmpty.aiProcess.p5.aiReply = "改好的合段"
    p5CopiedEmpty.finalText = "又改了一个字"
    expect(hasModule1Lesson6CurrentFinal(p5CopiedEmpty)).toBe(true)
  })

  it("恢复初稿把 finalText 设回 draftText，已复制且有回复、已预览已勾选仍可完成", () => {
    const portfolio = createNewModule1Portfolio()
    const draftText = "【夹具】转段初稿正文"
    const editedFinal = "【夹具】学生改过的确认稿"
    portfolio.lesson6 = {
      ...filledLesson6(),
      step3Completed: true,
      draftText,
      draftFrozenText: draftText,
      finalText: editedFinal,
    }
    const oldKey = buildModule1Lesson6CheckContextKey(portfolio)
    const withAi = {
      ...portfolio.lesson6,
      aiProcess: {
        ...portfolio.lesson6.aiProcess,
        p4: usedAiProcess("检查意见", oldKey),
      },
    }
    expect(hasModule1Lesson6CurrentFinal(withAi)).toBe(true)

    const restored = finalizeModule1Lesson6State(withAi, {
      ...withAi,
      previousFinalText: withAi.finalText,
      finalText: withAi.draftText,
    })
    expect(restored.finalText).toBe(draftText)
    expect(restored.previousFinalText).toBe(editedFinal)
    expect(restored.draftText).toBe(draftText)
    expect(restored.draftFrozenText).toBe(draftText)
    expect(restored.selfCheck).toBe(true)
    expect(restored.previewSeenKey).toBe("seen")

    const newKey = buildModule1Lesson6CheckContextKey({
      ...portfolio,
      lesson6: restored,
    })
    expect(newKey).not.toBe(oldKey)
    expect(restored.aiProcess.p4.contextKey).toBe(oldKey)
    expect(hasModule1Lesson6CurrentRequiredAi(restored.aiProcess.p4)).toBe(true)
    expect(hasModule1Lesson6CurrentFinal(restored)).toBe(true)
  })

  it("文案主按钮为恢复初稿，并含用初稿替换当前确认稿说明", async () => {
    const { MODULE1_LESSON6_PAGES, MODULE1_LESSON6_SHARED_COPY } = await import(
      "@/modules/module-1-ai-story/constants/lesson6-copy"
    )
    expect(MODULE1_LESSON6_PAGES.step4.buttons[2]).toBe("恢复初稿")
    expect(MODULE1_LESSON6_SHARED_COPY.keepDraft).toBe("恢复初稿")
    expect(MODULE1_LESSON6_SHARED_COPY.keepDraftHint).toContain("用初稿替换当前确认稿")
    expect(MODULE1_LESSON6_SHARED_COPY.keepDraftConfirmTitle).toContain("用初稿替换当前确认稿")
    expect(MODULE1_LESSON6_PAGES.step4.buttons[2]).not.toBe("保留初稿")
    expect(MODULE1_LESSON6_SHARED_COPY.recheckNote).toContain("不必重新复制")
    expect(MODULE1_LESSON6_SHARED_COPY).not.toHaveProperty("promptChanged")
  })

  it("上游开头变化时保留课时 6 正文并标记复核", () => {
    const previous = createNewModule1Portfolio()
    previous.lesson3.finalText = "旧开头"
    previous.lesson6 = filledLesson6()
    const next = {
      ...previous,
      lesson3: { ...previous.lesson3, finalText: "新开头" },
    }
    const reviewed = applyModule1Lesson6UpstreamReview(previous, next)
    expect(reviewed.lesson6.draftText).toBe(MODULE1_LESSON6_EXAMPLE.draftText)
    expect(reviewed.lesson6.finalText).toBe(MODULE1_LESSON6_EXAMPLE.finalText)
    expect(reviewed.lesson6.reviewNeeded.plan).toBe(true)
    expect(reviewed.lesson6.reviewNeeded.draft).toBe(true)
    expect(reviewed.lesson6.reviewNeeded.final).toBe(true)
    expect(reviewed.lesson6.selfCheck).toBe(true)
    expect(reviewed.lesson6.previewSeenKey).toBe("seen")
  })

  it("旧包只有空课时 6 时补齐新字段且不丢课时 1—3", () => {
    const portfolio = createNewModule1Portfolio({ studentName: "张三" })
    portfolio.lesson1.sdg = "11 可持续城市和社区"
    portfolio.lesson2.reason = "希望读者先感到现场"
    portfolio.lesson3.storyTitle = "关灯这件事"
    const normalized = normalizeModule1Portfolio({
      ...portfolio,
      lesson6: { step: 1, completed: false, completedAt: null },
    })
    expect(normalized.lesson1.sdg).toBe("11 可持续城市和社区")
    expect(normalized.lesson2.reason).toBe("希望读者先感到现场")
    expect(normalized.lesson3.storyTitle).toBe("关灯这件事")
    expect(normalized.lesson6).toMatchObject(createEmptyModule1Lesson6State())
    expect(normalized).not.toHaveProperty("fullStory")
    expect(normalized).not.toHaveProperty("lesson7")
  })

  it("字数和 2035 都不进入完成判定", () => {
    const short = {
      ...filledLesson6(),
      draftText: "很短的初稿。",
      finalText: "很短的确认稿。",
    }
    expect(hasModule1Lesson6Final(short)).toBe(true)
    expect(short.finalText.includes("2035")).toBe(false)
    expect(hasMeaningfulModule1Lesson6Fields(short)).toBe(true)
  })
})
