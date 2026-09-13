/**
 * 文件说明：模块 1 课时 2 第 2 关关内分页门禁回归测试。
 * 职责：锁定课堂/自己的案例都在第一步完成、第二步不再承担选用、左右翻页门禁、第二轮无右箭头须整关校验才能进第 3 关，以及旧包缺字段视为 false。
 * 更新触发：第 2 关两步信息架构、第一步选定口径、第二轮下一关、参照分槽或直连第二步回跳规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import {
  canCompleteModule1Lesson2Step2Round1,
  createEmptyModule1Lesson2FoundDraft,
  createEmptyModule1Lesson2Reference,
  createEmptyModule1Lesson2State,
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  patchModule1Lesson2ActiveReference,
  patchModule1Lesson2FoundDraft,
  projectModule1Lesson2Reference,
  type Module1Lesson2FoundDraft,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_LESSON2_STEP3_PATH,
  canAdvanceModule1Lesson2Step2Round1,
  canCompleteModule1Lesson2Step2Gate,
  canEnterModule1Lesson2Step2Round,
  getModule1Lesson2Step2GateBlockReason,
  getModule1Lesson2Step2PrevRound,
  parseModule1Lesson2Step2Round,
  shouldShowModule1Lesson2Step2NextArrow,
  shouldShowModule1Lesson2Step2NextGateButton,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"
import { canEnterModule1Lesson2Step, getModule1Lesson2Step2RoundRedirect } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"

function withClassroomSelected(confirmed = true) {
  const classroom = buildModule1ClassroomReference("shexi")
  if (!classroom) throw new Error("课堂案例 shexi 必须存在")
  const state = createEmptyModule1Lesson2State()
  state.reference = patchModule1Lesson2ActiveReference(classroom, { sourceConfirmed: confirmed })
  return state
}

const COMPLETE_WRITING_PLAN = "1. 用细节写现场。\n2. 按行动安排观察。"

function withClassroomGateReady() {
  const state = withClassroomSelected(true)
  state.writingPlan = COMPLETE_WRITING_PLAN
  return state
}

function withExternalReference(overrides: Partial<Module1Lesson2FoundDraft> = {}) {
  const state = createEmptyModule1Lesson2State()
  state.reference = projectModule1Lesson2Reference({
    ...createEmptyModule1Lesson2Reference(),
    origin: "external",
    foundDraft: {
      ...createEmptyModule1Lesson2FoundDraft(),
      workTitle: "社戏",
      author: "鲁迅",
      location: "夜航",
      versionNote: "",
      excerpt: "两岸的豆麦和河底的水草",
      sourceNote: "课本第 3 页",
      sourceConfirmed: false,
      ...overrides,
    },
  })
  return state
}

describe("模块 1 课时 2 第 2 关关内分页", () => {
  it("左箭头只在本关两步间返回，第一步没有上一页", () => {
    expect(getModule1Lesson2Step2PrevRound(1)).toBeNull()
    expect(getModule1Lesson2Step2PrevRound(2)).toBe(1)
  })

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
    state.reference = patchModule1Lesson2FoundDraft(state.reference, {
      round1PromptCopied: true,
      recommendationReply: "",
    })
    expect(canAdvanceModule1Lesson2Step2Round1(state)).toBe(false)
    expect(canEnterModule1Lesson2Step2Round(state, 2)).toBe(false)
    expect(getModule1Lesson2Step2RoundRedirect(state, 2)).toBe("/module/1/lesson/2/step/2?round=1")
  })

  it("点第一轮复制并贴回结果后可以进入第二步", () => {
    const state = withExternalReference()
    state.reference = patchModule1Lesson2FoundDraft(state.reference, {
      round1PromptCopied: true,
      recommendationReply: "候选一：社戏夜航",
    })
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

  it("第二步不渲染右箭头，右下角才出现下一关；第一步相反", () => {
    expect(shouldShowModule1Lesson2Step2NextArrow(1)).toBe(true)
    expect(shouldShowModule1Lesson2Step2NextArrow(2)).toBe(false)
    expect(shouldShowModule1Lesson2Step2NextGateButton(1)).toBe(false)
    expect(shouldShowModule1Lesson2Step2NextGateButton(2)).toBe(true)
    expect(MODULE1_LESSON2_SHARED_COPY.nextGate).toBe("下一关")
    expect(MODULE1_LESSON2_STEP3_PATH).toBe("/module/1/lesson/2/step/3")
  })

  it("第 2 关未填完（缺写法 / 缺已阅读 / 当前槽不完整）不能进入第 3 关", () => {
    const missingPlan = withClassroomSelected(true)
    expect(canCompleteModule1Lesson2Step2Gate(missingPlan)).toBe(false)
    expect(getModule1Lesson2Step2GateBlockReason(missingPlan)).toContain(MODULE1_LESSON2_SHARED_COPY.step2NeedWritingPlan)
    expect(canEnterModule1Lesson2Step(missingPlan, 3)).toBe(false)

    const unread = withClassroomGateReady()
    unread.reference = patchModule1Lesson2ActiveReference(unread.reference, { sourceConfirmed: false })
    expect(canCompleteModule1Lesson2Step2Gate(unread)).toBe(false)
    expect(getModule1Lesson2Step2GateBlockReason(unread)).toContain(MODULE1_LESSON2_SHARED_COPY.step2NeedSourceConfirmed)
    expect(canEnterModule1Lesson2Step({ ...unread, step2Completed: true }, 3)).toBe(false)

    const incompleteSlot = withExternalReference({ excerpt: "" })
    incompleteSlot.writingPlan = COMPLETE_WRITING_PLAN
    expect(canCompleteModule1Lesson2Step2Gate(incompleteSlot)).toBe(false)
    expect(getModule1Lesson2Step2GateBlockReason(incompleteSlot)).toContain(MODULE1_LESSON2_SHARED_COPY.step2NeedReference)
    expect(canEnterModule1Lesson2Step({ ...incompleteSlot, step2Completed: true }, 3)).toBe(false)

    const copiedRound2 = withClassroomGateReady()
    copiedRound2.round2PromptCopied = true
    copiedRound2.analysisReply = ""
    expect(canCompleteModule1Lesson2Step2Gate(copiedRound2)).toBe(false)
    expect(getModule1Lesson2Step2GateBlockReason(copiedRound2)).toContain(MODULE1_LESSON2_SHARED_COPY.round2ReplyRequired)
    expect(canEnterModule1Lesson2Step({ ...copiedRound2, step2Completed: true }, 3)).toBe(false)

    const copiedRound1 = withExternalReference({
      sourceConfirmed: true,
      round1PromptCopied: true,
      recommendationReply: "",
    })
    copiedRound1.writingPlan = COMPLETE_WRITING_PLAN
    expect(canCompleteModule1Lesson2Step2Gate(copiedRound1)).toBe(false)
    expect(getModule1Lesson2Step2GateBlockReason(copiedRound1)).toContain(MODULE1_LESSON2_SHARED_COPY.round1ReplyRequired)
    expect(canEnterModule1Lesson2Step({ ...copiedRound1, step2Completed: true }, 3)).toBe(false)
  })

  it("第 2 关填完可以进入课时 2 第 3 关", () => {
    const filled = withClassroomGateReady()
    expect(canCompleteModule1Lesson2Step2Gate(filled)).toBe(true)
    expect(getModule1Lesson2Step2GateBlockReason(filled)).toBeNull()
    expect(canEnterModule1Lesson2Step(filled, 3)).toBe(false)

    const completed = { ...filled, step2Completed: true, step2Round1Passed: true }
    expect(canEnterModule1Lesson2Step(completed, 3)).toBe(true)
    expect(MODULE1_LESSON2_STEP3_PATH).not.toContain("/lesson/3")
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
