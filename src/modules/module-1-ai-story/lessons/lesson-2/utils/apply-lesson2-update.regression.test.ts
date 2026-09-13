/**
 * 文件说明：模块 1 课时 2 复核与旧档映射回归测试。
 * 职责：锁定参照变更取消已读确认、旧风格卡归档、第 1 关观察/AI 辅助完成判定，以及不把旧行动复制进两个新字段。
 * 更新触发：复核规则、旧档迁移、第 1 关 AI 辅助必填口径或完成态重算变化时，需要同步更新本文件。
 * 被测实现位于 domains/portfolio/lesson2-update.ts 与 domains/portfolio/types.ts。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson2State,
  createNewModule1Portfolio,
  hasModule1Lesson2StudyFields,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { finalizeModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/lesson2-update"

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
    previous.reference = {
      origin: "classroom",
      caseId: "shexi",
      workTitle: "社戏",
      author: "鲁迅",
      location: "夜航",
      versionNote: "中文原作",
      excerpt: "两岸的豆麦",
      sourceNote: "课堂材料：shexi",
      sourceConfirmed: true,
    }
    previous.writingPlan = "1. 细节\n2. 顺序"
    previous.reason = "希望读者先感到现场"
    previous.character.who = "林禾"
    const next = finalizeModule1Lesson2State(previous, {
      ...previous,
      reference: { ...previous.reference, location: "夜航片段" },
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
