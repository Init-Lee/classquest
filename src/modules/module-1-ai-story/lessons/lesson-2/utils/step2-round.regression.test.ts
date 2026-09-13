/**
 * 文件说明：模块 1 课时 2 第 2 关关内分页门禁回归测试。
 * 职责：锁定课堂/自己的案例都在第一步完成、第二步不再承担选用、左右翻页门禁，以及旧包缺字段视为 false。
 * 更新触发：第 2 关两步信息架构、第一步选定口径或直连第二步回跳规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"
import {
  canCompleteModule1Lesson2Step2Round1,
  createEmptyModule1Lesson2State,
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  type Module1Lesson2Reference,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  canAdvanceModule1Lesson2Step2Round1,
  canEnterModule1Lesson2Step2Round,
  parseModule1Lesson2Step2Round,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"
import { getModule1Lesson2Step2RoundRedirect } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"

function withClassroomSelected(confirmed = true) {
  const classroom = buildModule1ClassroomReference("shexi")
  if (!classroom) throw new Error("课堂案例 shexi 必须存在")
  const state = createEmptyModule1Lesson2State()
  state.reference = { ...classroom, sourceConfirmed: confirmed }
  return state
}

function withExternalReference(overrides: Partial<Module1Lesson2Reference> = {}) {
  const state = createEmptyModule1Lesson2State()
  state.reference = {
    origin: "external",
    caseId: "",
    workTitle: "社戏",
    author: "鲁迅",
    location: "夜航",
    versionNote: "",
    excerpt: "两岸的豆麦和河底的水草",
    sourceNote: "课本第 3 页",
    sourceConfirmed: false,
    ...overrides,
  }
  return state
}

describe("模块 1 课时 2 第 2 关关内分页", () => {
  it("未选定参照不能进第二步", () => {
    const state = createEmptyModule1Lesson2State()
    expect(canCompleteModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("仅有旧的跳过标记不能进第二步", () => {
    const skipped = { ...createEmptyModule1Lesson2State(), step2Round1Passed: true }
    expect(canAdvanceModule1Lesson2Step2Round1(skipped)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(skipped, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(skipped, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("课堂路径在第一步选用并确认已阅读后可以进第二步", () => {
    const state = withClassroomSelected(true)
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(true)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBeNull()
  })

  it("课堂路径未确认已阅读不能进第二步", () => {
    const state = withClassroomSelected(false)
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("自己的案例在第一步填好作品、实际片段和出处后可以进第二步", () => {
    const state = withExternalReference()
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(true)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBeNull()
  })

  it("自己的案例缺少实际片段不能进第二步", () => {
    const state = withExternalReference({ excerpt: "" })
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("点第一轮复制后空回复不能进第二步", () => {
    const state = withExternalReference()
    state.round1PromptCopied = true
    state.recommendationReply = ""
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("点第一轮复制并贴回结果后可以进入第二步", () => {
    const state = withExternalReference()
    state.round1PromptCopied = true
    state.recommendationReply = "候选一：社戏夜航"
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(true)
  })

  it("教师模式即使未选定参照也可以进入两步", () => {
    const state = createEmptyModule1Lesson2State()
    expect(canEnterModule1Lesson2Step2Round(state, 1, true)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(state, 2, true)).toBe(true)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2, true)).toBeNull()
  })

  it("教师演示预填可以进入两步", () => {
    const demo = createModule1TeacherLecturePortfolio().lesson2
    expect(canAdvanceModule1Lesson2Step2Round1(demo)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(demo, 1)).toBe(true)
    expect(canEnterModule1Lesson2Step2Round(demo, 2)).toBe(true)
    expect(getModule1Lesson2Step2RoundRedirect(demo, 2)).toBeNull()
  })

  it("整关完成后可以回看第二步", () => {
    const state = withClassroomSelected(true)
    state.step2Completed = true
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(true)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBeNull()
  })

  it("旧包缺少新布尔字段视为未复制、未通过第一步", () => {
    const normalized = normalizeModule1Portfolio({
      ...createNewModule1Portfolio(),
      lesson2: {
        recommendationReply: "",
      },
    }).lesson2
    expect(normalized.round1PromptCopied).toBe(false)
    expect(normalized.round2PromptCopied).toBe(false)
    expect(normalized.step2Round1Passed).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(normalized, 2)).toBe(false)
    expect(parseModule1Lesson2Step2Round(undefined)).toBe(1)
    expect(parseModule1Lesson2Step2Round("2")).toBe(2)
  })
})
