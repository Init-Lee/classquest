/**
 * 文件说明：模块 1 阶段 1—2 回归测试。
 * 职责：覆盖档案创建归一化、课时 2 完成判定与门禁、学习包拒绝与往返，以及替换和清档防旧回写边界。
 * 更新触发：模块 1 数据契约、Guard、指针、学习包或清档保护语义变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createEmptyModule1Lesson2State,
  createNewModule1Portfolio,
  hasMeaningfulModule1Lesson2Fields,
  MODULE1_ID,
  normalizeModule1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  canAccessModule1Lesson,
  resolveModule1PortfolioPointer,
} from "@/modules/module-1-ai-story/app/lesson-registry"
import {
  canEnterModule1Lesson1Step,
  getCurrentModule1Lesson1Step,
  getModule1Lesson1RouteRedirect,
} from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
import {
  canEnterModule1Lesson2Step,
  getCurrentModule1Lesson2Step,
  getModule1Lesson2RouteRedirect,
} from "@/modules/module-1-ai-story/lessons/lesson-2/guards"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"
import {
  buildModule1ContinuePackage,
  deserializeModule1ContinuePackageText,
} from "@/modules/module-1-ai-story/infra/persistence/serializers/continue-package"
import { prepareModule1ImportedReplacement } from "@/modules/module-1-ai-story/infra/persistence/repositories/portfolio.repository"

function createStudent(name = "张三") {
  return createNewModule1Portfolio({
    clazz: "初一（1）班",
    studentName: name,
    classSeatCode: "0101",
  })
}

function completeLesson1(portfolio: ReturnType<typeof createStudent>) {
  portfolio.lesson1 = {
    ...portfolio.lesson1,
    step: 4,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    completed: true,
    completedAt: "2026-09-05T00:00:00.000Z",
    sdg: "11 可持续城市和社区",
    sdgWhy: "与社区生活相关",
    cityIssue: "夜间照明影响睡眠",
    audience: "社区物业",
    audienceConcern: "安全与成本",
  }
  return portfolio
}

function fillLesson2Content(portfolio: ReturnType<typeof createStudent>) {
  const reference = buildModule1ClassroomReference("shexi")
  portfolio.lesson2 = {
    ...createEmptyModule1Lesson2State(),
    step: 4,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    completed: true,
    completedAt: "2026-09-05T01:00:00.000Z",
    study: {
      caseId: "shexi",
      response: MODULE1_LESSON2_EXAMPLE.observation,
      aiReply: "",
    },
    reference: reference
      ? { ...reference, sourceConfirmed: true }
      : createEmptyModule1Lesson2State().reference,
    writingPlan: MODULE1_LESSON2_EXAMPLE.writingPlan,
    reason: MODULE1_LESSON2_EXAMPLE.reason,
    character: {
      who: MODULE1_LESSON2_EXAMPLE.who,
      want: MODULE1_LESSON2_EXAMPLE.want,
      blocked: MODULE1_LESSON2_EXAMPLE.blocked,
      firstAction: MODULE1_LESSON2_EXAMPLE.firstAction,
      possibleChange: MODULE1_LESSON2_EXAMPLE.possibleChange,
    },
  }
  return portfolio
}

describe("模块 1 档案与进度", () => {
  it("显式创建六课时且不产生额外故事字段", () => {
    const portfolio = createStudent()
    expect(portfolio.moduleId).toBe(MODULE1_ID)
    expect(Object.keys(portfolio).filter(key => /^lesson\d+$/.test(key))).toEqual([
      "lesson1", "lesson2", "lesson3", "lesson4", "lesson5", "lesson6",
    ])
    expect(portfolio.lesson2).toMatchObject(createEmptyModule1Lesson2State())
    expect(portfolio).not.toHaveProperty("fullStory")
  })

  it("只叠加已知字段并为缺失课时补安全空态", () => {
    const normalized = normalizeModule1Portfolio({
      ...createStudent(),
      unknown: "丢弃",
      lesson1: { sdg: "11 可持续城市和社区", injected: "丢弃" },
      lesson4: undefined,
    })
    expect(normalized.lesson1.sdg).toBe("11 可持续城市和社区")
    expect(normalized.lesson1).not.toHaveProperty("injected")
    expect(normalized.lesson4).toEqual({ step: 1, completed: false, completedAt: null })
  })

  it("旧学习包缺少课时 2 字段时补空态且不丢课时 1 数据", () => {
    const oldPackage = completeLesson1(createStudent())
    const raw = {
      ...oldPackage,
      lesson2: { step: 1, completed: false, completedAt: null },
    }
    const normalized = normalizeModule1Portfolio(raw)
    expect(normalized.lesson1.sdg).toBe("11 可持续城市和社区")
    expect(normalized.lesson1.completed).toBe(true)
    expect(normalized.lesson2).toMatchObject(createEmptyModule1Lesson2State())
    expect(resolveModule1PortfolioPointer(normalized)).toEqual({ lessonId: 2, stepId: 1 })
  })

  it("按真实关卡完成态修复指针并阻止越级", () => {
    const portfolio = createStudent()
    expect(getCurrentModule1Lesson1Step(portfolio.lesson1)).toBe(1)
    expect(canEnterModule1Lesson1Step(portfolio.lesson1, 2)).toBe(false)
    portfolio.lesson1.step1Completed = true
    expect(resolveModule1PortfolioPointer(portfolio)).toEqual({ lessonId: 1, stepId: 2 })
    expect(canAccessModule1Lesson(portfolio, 1)).toBe(true)
    expect(canAccessModule1Lesson(portfolio, 2)).toBe(false)
    expect(canAccessModule1Lesson(portfolio, 1, true)).toBe(true)
    expect(canAccessModule1Lesson(portfolio, 2, true)).toBe(true)
    expect(canAccessModule1Lesson(portfolio, 3, true)).toBe(false)
    const demo = createModule1TeacherLecturePortfolio()
    expect(getModule1Lesson1RouteRedirect(demo, 1, true)).toBeNull()
    expect(getModule1Lesson1RouteRedirect(demo, 4, true)).toBeNull()
    expect(getModule1Lesson2RouteRedirect(demo, 4, true)).toBeNull()
  })

  it("课时 1 完成后指针停在课时 2 对应关", () => {
    const portfolio = completeLesson1(createStudent())
    expect(canAccessModule1Lesson(portfolio, 2)).toBe(true)
    expect(resolveModule1PortfolioPointer(portfolio)).toEqual({ lessonId: 2, stepId: 1 })
    expect(canEnterModule1Lesson2Step(portfolio.lesson2, 2)).toBe(false)
    expect(getModule1Lesson2RouteRedirect(portfolio, 3)).toBe("/module/1/lesson/2/step/1")
    expect(getModule1Lesson2RouteRedirect(null, 1)).toBe("/module/1")
  })

  it("课时 2 完成判定要求观察、参照、写法和人物五项都有意义填写", () => {
    const portfolio = completeLesson1(createStudent())
    portfolio.lesson2 = {
      ...createEmptyModule1Lesson2State(),
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      completed: true,
      study: { caseId: "shexi", response: "", aiReply: "" },
      reason: "",
      character: {
        who: "值日生",
        want: "西门可通行",
        blocked: "单车占道",
        firstAction: "",
        possibleChange: "",
      },
    }
    expect(hasMeaningfulModule1Lesson2Fields(portfolio.lesson2)).toBe(false)
    const normalized = normalizeModule1Portfolio(portfolio)
    expect(normalized.lesson2.completed).toBe(false)
    expect(getCurrentModule1Lesson2Step(normalized.lesson2)).toBe(1)

    fillLesson2Content(portfolio)
    const complete = normalizeModule1Portfolio(portfolio)
    expect(complete.lesson2.completed).toBe(true)
    expect(complete.lesson2.character.who).toBe(MODULE1_LESSON2_EXAMPLE.who)
    expect(complete.lesson2.protagonistIdentity).toBe(MODULE1_LESSON2_EXAMPLE.who)
    expect(resolveModule1PortfolioPointer(complete)).toEqual({ lessonId: 3, stepId: 1 })
    expect(canAccessModule1Lesson(complete, 3)).toBe(false)
  })

  it("只填行动、变化为空时不能完成课时 2", () => {
    const portfolio = fillLesson2Content(completeLesson1(createStudent()))
    portfolio.lesson2.character.possibleChange = ""
    expect(hasMeaningfulModule1Lesson2Fields(portfolio.lesson2)).toBe(false)
    const normalized = normalizeModule1Portfolio(portfolio)
    expect(normalized.lesson2.completed).toBe(false)
    expect(getCurrentModule1Lesson2Step(normalized.lesson2)).toBe(4)
  })

  it("缺字段时降级伪造完成态并把指针修复到正确关卡", () => {
    const portfolio = createStudent()
    portfolio.lesson1 = {
      ...portfolio.lesson1,
      step: 4,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      completed: true,
      completedAt: "2026-09-05T00:00:00.000Z",
      sdg: "11 可持续城市和社区",
      sdgWhy: "与社区生活相关",
      cityIssue: "",
      audience: "社区物业",
      audienceConcern: "安全",
    }
    const normalized = normalizeModule1Portfolio(portfolio)
    expect(normalized.lesson1.step2Completed).toBe(true)
    expect(normalized.lesson1.step3Completed).toBe(false)
    expect(normalized.lesson1.step4Completed).toBe(false)
    expect(normalized.lesson1.completed).toBe(false)
    expect(normalized.lesson1.completedAt).toBeNull()
    expect(resolveModule1PortfolioPointer(normalized)).toEqual({ lessonId: 1, stepId: 3 })
  })

  it("保留字段和确认标记均有效的既有完成数据", () => {
    const portfolio = completeLesson1(createStudent())
    const normalized = normalizeModule1Portfolio(portfolio)
    expect(normalized.lesson1.completed).toBe(true)
    expect(normalized.lesson1.completedAt).toBe(portfolio.lesson1.completedAt)
  })
})

describe("模块 1 继续学习包", () => {
  it("version 1 学习包可归一化往返并修复指针", () => {
    const portfolio = createStudent()
    portfolio.lesson1.step1Completed = true
    portfolio.progress = { lessonId: 6, stepId: 99 }
    const parsed = deserializeModule1ContinuePackageText(JSON.stringify(buildModule1ContinuePackage(portfolio)))
    expect(parsed.portfolio.student).toEqual(portfolio.student)
    expect(parsed.portfolio.progress).toEqual({ lessonId: 1, stepId: 2 })
  })

  it("课时 2 新字段可以完整往返", () => {
    const portfolio = fillLesson2Content(completeLesson1(createStudent()))
    const parsed = deserializeModule1ContinuePackageText(JSON.stringify(buildModule1ContinuePackage(portfolio)))
    expect(parsed.portfolio.lesson2.study.caseId).toBe("shexi")
    expect(parsed.portfolio.lesson2.reference.workTitle).toBe("社戏")
    expect(parsed.portfolio.lesson2.reference.excerpt).toContain("两岸的豆麦")
    expect(parsed.portfolio.lesson2.writingPlan).toBe(MODULE1_LESSON2_EXAMPLE.writingPlan)
    expect(parsed.portfolio.lesson2.character.who).toBe(MODULE1_LESSON2_EXAMPLE.who)
    expect(parsed.portfolio.lesson2.completed).toBe(true)
    expect(parsed.portfolio.progress).toEqual({ lessonId: 3, stepId: 1 })
  })

  it.each([
    ["损坏内容", "{", "无法解析"],
    ["错误模块", JSON.stringify({ ...buildModule1ContinuePackage(createStudent()), portfolio: { ...createStudent(), moduleId: "module-4-ai-info-detective" } }), "其他模块"],
    ["未来版本", JSON.stringify({ ...buildModule1ContinuePackage(createStudent()), version: 2 }), "更高版本"],
    ["旧扁平格式", JSON.stringify({ sdg: "11", cityIssue: "浪费" }), "暂不支持"],
    ["阶段快照 HTML", "<!doctype html><html><body>阶段快照</body></html>", "阶段快照不能恢复进度，请选择继续学习包"],
  ])("拒绝%s且在写入边界前报错", (_name, text, expected) => {
    expect(() => deserializeModule1ContinuePackageText(text)).toThrow(expected)
  })

  it("按扩展名拒绝阶段快照文件", () => {
    expect(() => deserializeModule1ContinuePackageText("{}", "模块1_演示学生_课时1主题设定快照_2026-09-05.html"))
      .toThrow("阶段快照不能恢复进度，请选择继续学习包")
    expect(() => deserializeModule1ContinuePackageText("{}", "模块1_演示学生_课时2风格与人物快照_2026-09-05.html"))
      .toThrow("阶段快照不能恢复进度，请选择继续学习包")
  })

  it("不同学生替换只保留导入档案字段", () => {
    const oldStudent = createStudent("旧学生")
    oldStudent.lesson1.cityIssue = "旧问题"
    const imported = prepareModule1ImportedReplacement(createStudent("新学生"))
    expect(imported.student.studentName).toBe("新学生")
    expect(imported.lesson1.cityIssue).toBe("")
  })
})
