/**
 * 文件说明：模块 1 课时 2 第 2 关关内分页门禁回归测试。
 * 职责：锁定未完成第一页不能进第二页、跳过可进第二页、点第一轮复制后空回复不能进第二页，以及旧包缺字段视为 false。
 * 更新触发：第 2 关子页门禁、跳过短路径或两轮复制必填口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson2State,
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  canAdvanceModule1Lesson2Step2Round1,
  canEnterModule1Lesson2Step2Round,
  canSkipModule1Lesson2Step2Round1,
  parseModule1Lesson2Step2Round,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"
import { getModule1Lesson2Step2RoundRedirect } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"

describe("模块 1 课时 2 第 2 关关内分页", () => {
  it("未完成第一页不能进第二页", () => {
    const state = createEmptyModule1Lesson2State()
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("跳过第一页直接课堂片段可以进第二页", () => {
    const state = createEmptyModule1Lesson2State()
    expect(canSkipModule1Lesson2Step2Round1()).toBe(true)
    const skipped = { ...state, step2Round1Passed: true }
    expect(canEnterModule1Lesson2Step2Round(skipped, 2)).toBe(true)
    expect(getModule1Lesson2Step2RoundRedirect(skipped, 2)).toBeNull()
  })

  it("点第一轮复制后空回复不能进第二页", () => {
    const state = createEmptyModule1Lesson2State()
    state.round1PromptCopied = true
    state.recommendationReply = ""
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("未点复制时空回复也可以保存并继续进入第二页", () => {
    const state = createEmptyModule1Lesson2State()
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(true)
    const passed = { ...state, step2Round1Passed: true }
    expect(canEnterModule1Lesson2Step2Round(passed, 2)).toBe(true)
  })

  it("点第一轮复制并贴回结果后可以进入第二页", () => {
    const state = createEmptyModule1Lesson2State()
    state.round1PromptCopied = true
    state.recommendationReply = "候选一：社戏夜航"
    state.step2Round1Passed = true
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(true)
  })

  it("旧包缺少新布尔字段视为未复制、未通过第一页", () => {
    const normalized = normalizeModule1Portfolio({
      ...createNewModule1Portfolio(),
      lesson2: {
        recommendationReply: "",
      },
    }).lesson2
    expect(normalized.round1PromptCopied).toBe(false)
    expect(normalized.round2PromptCopied).toBe(false)
    expect(normalized.step2Round1Passed).toBe(false)
    expect(parseModule1Lesson2Step2Round(undefined)).toBe(1)
    expect(parseModule1Lesson2Step2Round("2")).toBe(2)
  })
})
