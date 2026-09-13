/**
 * 文件说明：模块 1 课时 2 复核与旧档映射回归测试。
 * 职责：锁定参照变更取消已读确认、旧风格卡归档、第 1/3 关观察或理由与 AI 辅助完成判定，以及不把旧行动复制进两个新字段。
 * 更新触发：复核规则、旧档迁移、参照分槽、第 1/3 关 AI 辅助必填口径或完成态重算变化时，需要同步更新本文件。
 * 被测实现位于 domains/portfolio/lesson2-update.ts 与 domains/portfolio/types.ts。
 */

import { describe, expect, it } from "vitest"
import {
  canCompleteModule1Lesson2Step2Round1,
  createEmptyModule1Lesson2FoundDraft,
  createEmptyModule1Lesson2Reference,
  createEmptyModule1Lesson2State,
  createNewModule1Portfolio,
  hasModule1Lesson2Reason,
  hasModule1Lesson2StudyFields,
  normalizeModule1Portfolio,
  patchModule1Lesson2ActiveReference,
  projectModule1Lesson2Reference,
  withModule1Lesson2ReferenceOrigin,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"
import {
  applyModule1ClassroomReference,
  buildModule1ClassroomReference,
} from "@/modules/module-1-ai-story/constants/story-options"

describe("模块 1 课时 2 复核与旧档", () => {
  it("更换课堂观察片段时保留原观察并标记复核", () => {
    const previous = createEmptyModule1Lesson2State()
    previous.study = { caseId: "shexi", response: "山向船尾跑", aiReply: "候选一", aiAssistUsed: true }
    const next = finalizeModule1Lesson2State(previous, {
      ...previous,
      study: { ...previous.study, caseId: "chameleon" },
    })
    expect(next.study.response).toBe("山向船尾跑")
    expect(next.study.aiReply).toBe("候选一")
    expect(next.study.aiAssistUsed).toBe(true)
    expect(next.reviewNeeded.study).toBe(true)
  })

  it("只改片段位置时取消已阅读确认并提示复核后续答案", () => {
    const previous = createEmptyModule1Lesson2State()
    const classroom = buildModule1ClassroomReference("shexi")
    if (!classroom) throw new Error("课堂案例 shexi 必须存在")
    previous.reference = patchModule1Lesson2ActiveReference({
      ...classroom,
      classroomDraft: {
        ...classroom.classroomDraft,
        location: "夜航",
        versionNote: "中文原作",
        excerpt: "两岸的豆麦",
        sourceNote: "课堂材料：shexi",
      },
    }, { sourceConfirmed: true })
    previous.writingPlan = "1. 细节\n2. 顺序"
    previous.reason = "希望读者先感到现场"
    previous.character.who = "林禾"
    const next = finalizeModule1Lesson2State(previous, {
      ...previous,
      reference: patchModule1Lesson2ActiveReference(previous.reference, { location: "夜航片段" }),
    })
    expect(next.reference.sourceConfirmed).toBe(false)
    expect(next.reviewNeeded.writingPlan).toBe(true)
    expect(next.reviewNeeded.reason).toBe(true)
    expect(next.reviewNeeded.character).toBe(true)
    expect(next.writingPlan).toBe("1. 细节\n2. 顺序")
  })

  it("旧风格卡学习包归档且不能凭旧完成标记过关", () => {
    const portfolio = createNewModule1Portfolio({
      clazz: "初一（1）班",
      studentName: "旧学生",
      classSeatCode: "0101",
    })
    const normalized = normalizeModule1Portfolio({
      ...portfolio,
      lesson1: {
        ...portfolio.lesson1,
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        step4Completed: true,
        completed: true,
        sdg: "11 可持续城市和社区",
        sdgWhy: "相关",
        cityIssue: "路灯",
        audience: "小川",
        audienceConcern: "走路",
      },
      lesson2: {
        step: 4,
        completed: true,
        completedAt: "2026-09-05T00:00:00.000Z",
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        step4Completed: true,
        styleId: "纪实",
        styleName: "都市纪实时",
        styleWhy: "给物业看证据",
        styleHint: "冷静口吻",
        styleExamples: ["开头一", "开头二"],
        protagonistIdentity: "值日生",
        goal: "西门可通行",
        obstacle: "单车占道",
        changeAction: "连续计数并贴图",
      },
    })
    expect(normalized.lesson1.completed).toBe(true)
    expect(normalized.lesson2.legacyLesson2).toMatchObject({ styleId: "纪实", changeAction: "连续计数并贴图" })
    expect(normalized.lesson2.reason).toBe("给物业看证据")
    expect(normalized.lesson2.character.who).toBe("值日生")
    expect(normalized.lesson2.character.firstAction).toBe("")
    expect(normalized.lesson2.character.possibleChange).toBe("")
    expect(normalized.lesson2.completed).toBe(false)
    expect(normalized.lesson2.reviewNeeded.reason).toBe(true)
    expect(normalized.lesson2.reviewNeeded.character).toBe(true)
  })

  it("反复归一化不会嵌套同一份旧档", () => {
    const once = normalizeModule1Portfolio({
      lesson2: {
        styleId: "纪实",
        styleName: "都市纪实时",
        styleWhy: "理由",
        protagonistIdentity: "值日生",
      },
    })
    const twice = normalizeModule1Portfolio(once)
    expect(twice.lesson2.legacyLesson2).toEqual(once.lesson2.legacyLesson2)
    expect(twice.lesson2.legacyLesson2).not.toHaveProperty("legacyLesson2")
  })
})

describe("模块 1 课时 2 第 1 关观察与外部 AI 辅助", () => {
  it("未点复制只填观察可通过第 1 关", () => {
    const state = createEmptyModule1Lesson2State()
    state.study = { caseId: "shexi", response: "山向船尾跑", aiReply: "", aiAssistUsed: false }
    state.step1Completed = true
    expect(hasModule1Lesson2StudyFields(state)).toBe(true)
    const normalized = normalizeModule1Portfolio({ lesson2: state }).lesson2
    expect(normalized.study.aiAssistUsed).toBe(false)
    expect(normalized.step1Completed).toBe(true)
  })

  it("旧包缺少 aiAssistUsed 视为未选用辅助", () => {
    const normalized = normalizeModule1Portfolio({
      lesson2: {
        step1Completed: true,
        study: { caseId: "shexi", response: "山向船尾跑", aiReply: "" },
      },
    }).lesson2
    expect(normalized.study.aiAssistUsed).toBe(false)
    expect(normalized.step1Completed).toBe(true)
  })

  it("点了复制但 AI 框空则不能完成第 1 关", () => {
    const state = createEmptyModule1Lesson2State()
    state.study = { caseId: "shexi", response: "山向船尾跑", aiReply: "", aiAssistUsed: true }
    state.step1Completed = true
    state.completed = true
    expect(hasModule1Lesson2StudyFields(state)).toBe(false)
    const normalized = normalizeModule1Portfolio({ lesson2: state }).lesson2
    expect(normalized.step1Completed).toBe(false)
    expect(normalized.completed).toBe(false)
  })

  it("旧包缺少第 2 关两轮复制标记视为未选用", () => {
    const normalized = normalizeModule1Portfolio({
      lesson2: {
        recommendationReply: "候选一",
        analysisReply: "拆解一",
      },
    }).lesson2
    expect(normalized.round1PromptCopied).toBe(false)
    expect(normalized.round2PromptCopied).toBe(false)
    expect(normalized.step2Round1Passed).toBe(false)
  })

  it("点了复制且观察与 AI 回复都填可通过第 1 关", () => {
    const state = createEmptyModule1Lesson2State()
    state.study = {
      caseId: "shexi",
      response: "山向船尾跑",
      aiReply: "片段写山向船尾跑，让我感到急着赶到赵庄。",
      aiAssistUsed: true,
    }
    state.step1Completed = true
    expect(hasModule1Lesson2StudyFields(state)).toBe(true)
    const normalized = normalizeModule1Portfolio({ lesson2: state }).lesson2
    expect(normalized.study.aiAssistUsed).toBe(true)
    expect(normalized.step1Completed).toBe(true)
  })
})

describe("模块 1 课时 2 第 2 关课堂与自选作品分槽", () => {
  function applyClassroom(state: ReturnType<typeof createEmptyModule1Lesson2State>, caseId: string, confirmed = true) {
    const nextReference = applyModule1ClassroomReference(state.reference, caseId)
    if (!nextReference) throw new Error(`课堂案例 ${caseId} 必须存在`)
    return finalizeModule1Lesson2State(state, {
      ...state,
      reference: patchModule1Lesson2ActiveReference(nextReference, { sourceConfirmed: confirmed }),
    })
  }

  function selectOrigin(
    state: ReturnType<typeof createEmptyModule1Lesson2State>,
    origin: "classroom" | "external",
  ) {
    return finalizeModule1Lesson2State(state, {
      ...state,
      reference: withModule1Lesson2ReferenceOrigin(state.reference, origin),
    })
  }

  function fillFound(
    state: ReturnType<typeof createEmptyModule1Lesson2State>,
    found: Partial<ReturnType<typeof createEmptyModule1Lesson2FoundDraft>>,
  ) {
    return finalizeModule1Lesson2State(state, {
      ...state,
      reference: projectModule1Lesson2Reference({
        ...state.reference,
        origin: "external",
        foundDraft: {
          ...createEmptyModule1Lesson2FoundDraft(),
          ...state.reference.foundDraft,
          ...found,
        },
      }),
    })
  }

  it("选课堂填入后切到从未填过的自选作品，表单为空且不残留课堂内容", () => {
    let state = applyClassroom(createEmptyModule1Lesson2State(), "shexi", true)
    expect(state.reference.workTitle).toBe("社戏")
    state = selectOrigin(state, "external")
    expect(state.reference.origin).toBe("external")
    expect(state.reference.workTitle).toBe("")
    expect(state.reference.author).toBe("")
    expect(state.reference.excerpt).toBe("")
    expect(state.reference.foundDraft.workTitle).toBe("")
    expect(state.reference.classroomDraft.workTitle).toBe("社戏")
    expect(state.recommendationReply).toBe("")
  })

  it("在自选作品填写后切回课堂，仍是课堂那一套", () => {
    let state = applyClassroom(createEmptyModule1Lesson2State(), "shexi", true)
    state = selectOrigin(state, "external")
    state = fillFound(state, {
      workTitle: "我找的小说",
      author: "自己",
      location: "开头",
      excerpt: "自选片段B",
      sourceNote: "图书馆",
    })
    expect(state.reference.workTitle).toBe("我找的小说")
    state = selectOrigin(state, "classroom")
    expect(state.reference.workTitle).toBe("社戏")
    expect(state.reference.excerpt).toContain("两岸的豆麦")
    expect(state.reference.classroomDraft.caseId).toBe("shexi")
    expect(state.reference.foundDraft.workTitle).toBe("我找的小说")
  })

  it("再切回自选作品仍是自己填的那一套", () => {
    let state = applyClassroom(createEmptyModule1Lesson2State(), "shexi", true)
    state = selectOrigin(state, "external")
    state = fillFound(state, {
      workTitle: "我找的小说",
      excerpt: "自选片段B",
      sourceNote: "图书馆",
    })
    state = selectOrigin(state, "classroom")
    state = selectOrigin(state, "external")
    expect(state.reference.workTitle).toBe("我找的小说")
    expect(state.reference.excerpt).toBe("自选片段B")
    expect(state.reference.sourceNote).toBe("图书馆")
    expect(state.reference.classroomDraft.workTitle).toBe("社戏")
  })

  it("课堂三则之间切换仍替换自动填入，且不改自选槽", () => {
    let state = fillFound(selectOrigin(createEmptyModule1Lesson2State(), "external"), {
      workTitle: "自选保留",
      excerpt: "不要被课堂覆盖",
    })
    state = applyClassroom(state, "shexi", true)
    expect(state.reference.workTitle).toBe("社戏")
    state = applyClassroom(state, "chameleon", true)
    expect(state.reference.workTitle).toBe("变色龙")
    expect(state.reference.classroomDraft.caseId).toBe("chameleon")
    expect(state.reference.foundDraft.workTitle).toBe("自选保留")
    expect(state.reference.foundDraft.excerpt).toBe("不要被课堂覆盖")
  })

  it("完成判定只看当前 origin 槽，另一槽完整也不能过第一步", () => {
    let state = applyClassroom(createEmptyModule1Lesson2State(), "shexi", true)
    expect(canCompleteModule1Lesson2Step2Round1(state)).toBe(true)
    state = selectOrigin(state, "external")
    expect(canCompleteModule1Lesson2Step2Round1(state)).toBe(false)
    expect(state.reference.classroomDraft.sourceConfirmed).toBe(true)
    state = fillFound(state, {
      workTitle: "我找的小说",
      excerpt: "自选片段B",
      sourceNote: "图书馆",
    })
    expect(canCompleteModule1Lesson2Step2Round1(state)).toBe(true)
    state = selectOrigin(state, "classroom")
    state = finalizeModule1Lesson2State(state, {
      ...state,
      reference: patchModule1Lesson2ActiveReference(state.reference, { sourceConfirmed: false }),
    })
    expect(canCompleteModule1Lesson2Step2Round1(state)).toBe(false)
    expect(state.reference.foundDraft.workTitle).toBe("我找的小说")
  })

  it("旧包只有扁平 reference 时按当时 origin 迁进对应槽，另一槽空", () => {
    const classroomNormalized = normalizeModule1Portfolio({
      lesson1: {
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        step4Completed: true,
        completed: true,
        sdg: "11 可持续城市和社区",
        sdgWhy: "相关",
        cityIssue: "路灯",
        audience: "小川",
        audienceConcern: "走路",
      },
      lesson2: {
        step1Completed: true,
        step2Completed: true,
        completed: true,
        recommendationReply: "旧的第一轮回复",
        round1PromptCopied: true,
        writingPlan: "1. 细节\n2. 顺序",
        reason: "理由",
        reference: {
          origin: "classroom",
          caseId: "shexi",
          workTitle: "社戏",
          author: "鲁迅",
          location: "夜航",
          versionNote: "中文原作",
          excerpt: "两岸的豆麦",
          sourceNote: "课堂材料：shexi",
          sourceConfirmed: true,
        },
        character: {
          who: "林禾",
          want: "关灯",
          blocked: "邻居",
          firstAction: "下楼",
          possibleChange: "商量",
        },
      },
    }).lesson2
    expect(classroomNormalized.reference.origin).toBe("classroom")
    expect(classroomNormalized.reference.classroomDraft.workTitle).toBe("社戏")
    expect(classroomNormalized.reference.classroomDraft.sourceConfirmed).toBe(true)
    expect(classroomNormalized.reference.foundDraft.workTitle).toBe("")
    expect(classroomNormalized.reference.foundDraft.recommendationReply).toBe("旧的第一轮回复")
    expect(classroomNormalized.reference.foundDraft.round1PromptCopied).toBe(true)
    expect(classroomNormalized.recommendationReply).toBe("")
    expect(classroomNormalized.round1PromptCopied).toBe(false)
    expect(classroomNormalized.reference.workTitle).toBe("社戏")

    const foundNormalized = normalizeModule1Portfolio({
      lesson2: {
        recommendationReply: "候选一",
        round1PromptCopied: true,
        reference: {
          origin: "external",
          workTitle: "旧自选",
          author: "作者",
          location: "开头",
          excerpt: "旧片段",
          sourceNote: "网页",
          sourceConfirmed: true,
        },
      },
    }).lesson2
    expect(foundNormalized.reference.origin).toBe("external")
    expect(foundNormalized.reference.foundDraft.workTitle).toBe("旧自选")
    expect(foundNormalized.reference.foundDraft.recommendationReply).toBe("候选一")
    expect(foundNormalized.reference.classroomDraft.workTitle).toBe("")
    expect(foundNormalized.recommendationReply).toBe("候选一")
    expect(foundNormalized.reference.workTitle).toBe("旧自选")
  })

  it("伪造 completed 必须按当前槽重算，缺当前参照不能过关", () => {
    const empty = createEmptyModule1Lesson2Reference()
    const normalized = normalizeModule1Portfolio({
      lesson2: {
        step1Completed: true,
        step2Completed: true,
        completed: true,
        study: { caseId: "shexi", response: "观察", aiAssistUsed: false },
        reference: {
          origin: "external",
          classroomDraft: {
            caseId: "shexi",
            workTitle: "社戏",
            author: "鲁迅",
            location: "夜航",
            versionNote: "",
            excerpt: "两岸的豆麦",
            sourceNote: "课堂材料：shexi",
            sourceConfirmed: true,
          },
          foundDraft: empty.foundDraft,
        },
      },
    }).lesson2
    expect(normalized.step2Completed).toBe(false)
    expect(normalized.completed).toBe(false)
    expect(normalized.reference.workTitle).toBe("")
    expect(normalized.reference.classroomDraft.workTitle).toBe("社戏")
  })
})

describe("模块 1 课时 2 第 3 关选择理由与外部 AI 辅助", () => {
  function withReasonGateReady(
    overrides: Partial<ReturnType<typeof createEmptyModule1Lesson2State>> = {},
  ) {
    const classroom = buildModule1ClassroomReference("shexi")
    if (!classroom) throw new Error("课堂案例 shexi 必须存在")
    const state = createEmptyModule1Lesson2State()
    state.study = { caseId: "shexi", response: "山向船尾跑", aiReply: "", aiAssistUsed: false }
    state.reference = patchModule1Lesson2ActiveReference(classroom, { sourceConfirmed: true })
    state.writingPlan = "1. 细节\n2. 顺序"
    state.reason = "希望读者先感到现场"
    state.step1Completed = true
    state.step2Completed = true
    state.step3Completed = true
    return { ...state, ...overrides }
  }

  it("未点复制只填理由可通过第 3 关", () => {
    const state = withReasonGateReady({ reasonAiAssistUsed: false, reasonAiReply: "" })
    expect(hasModule1Lesson2Reason(state)).toBe(true)
    const normalized = normalizeModule1Portfolio({ lesson2: state }).lesson2
    expect(normalized.reasonAiAssistUsed).toBe(false)
    expect(normalized.step3Completed).toBe(true)
  })

  it("点了复制但 AI 框空则不能完成第 3 关", () => {
    const state = withReasonGateReady({
      reasonAiAssistUsed: true,
      reasonAiReply: "",
      completed: true,
    })
    expect(hasModule1Lesson2Reason(state)).toBe(false)
    const normalized = normalizeModule1Portfolio({ lesson2: state }).lesson2
    expect(normalized.step3Completed).toBe(false)
    expect(normalized.completed).toBe(false)
  })

  it("点了复制且理由与 AI 回复都填可通过第 3 关", () => {
    const state = withReasonGateReady({
      reasonAiAssistUsed: true,
      reasonAiReply: "候选一：希望读者感到灯光不便。",
    })
    expect(hasModule1Lesson2Reason(state)).toBe(true)
    const normalized = normalizeModule1Portfolio({ lesson2: state }).lesson2
    expect(normalized.reasonAiAssistUsed).toBe(true)
    expect(normalized.step3Completed).toBe(true)
  })

  it("旧包缺少 reasonAiAssistUsed 视为未选用辅助", () => {
    const classroom = buildModule1ClassroomReference("shexi")
    if (!classroom) throw new Error("课堂案例 shexi 必须存在")
    const normalized = normalizeModule1Portfolio({
      lesson2: {
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
        study: { caseId: "shexi", response: "山向船尾跑", aiReply: "" },
        writingPlan: "1. 细节\n2. 顺序",
        reason: "希望读者先感到现场",
        reference: {
          origin: "classroom",
          caseId: "shexi",
          workTitle: classroom.workTitle,
          author: classroom.author,
          location: classroom.location,
          versionNote: classroom.versionNote,
          excerpt: classroom.excerpt,
          sourceNote: classroom.sourceNote,
          sourceConfirmed: true,
        },
      },
    }).lesson2
    expect(normalized.reasonAiAssistUsed).toBe(false)
    expect(normalized.step3Completed).toBe(true)
  })
})
