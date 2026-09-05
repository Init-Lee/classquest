/**
 * 文件说明：模块 1 阶段 1 回归测试。
 * 职责：覆盖档案创建归一化、门禁指针、学习包拒绝与往返，以及替换和清档防旧回写边界。
 * 更新触发：模块 1 数据契约、Guard、指针、学习包或清档保护语义变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  createNewModule1Portfolio,
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
} from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
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

describe("模块 1 档案与进度", () => {
  it("显式创建六课时且不产生额外故事字段", () => {
    const portfolio = createStudent()
    expect(portfolio.moduleId).toBe(MODULE1_ID)
    expect(Object.keys(portfolio).filter(key => /^lesson\d+$/.test(key))).toEqual([
      "lesson1", "lesson2", "lesson3", "lesson4", "lesson5", "lesson6",
    ])
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

  it("按真实关卡完成态修复指针并阻止越级", () => {
    const portfolio = createStudent()
    expect(getCurrentModule1Lesson1Step(portfolio.lesson1)).toBe(1)
    expect(canEnterModule1Lesson1Step(portfolio.lesson1, 2)).toBe(false)
    portfolio.lesson1.step1Completed = true
    expect(resolveModule1PortfolioPointer(portfolio)).toEqual({ lessonId: 1, stepId: 2 })
    expect(canAccessModule1Lesson(portfolio, 1)).toBe(true)
    expect(canAccessModule1Lesson(portfolio, 2)).toBe(false)
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
      cityIssue: "夜间照明影响睡眠",
      audience: "社区物业",
      audienceConcern: "安全与成本",
    }
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

  it.each([
    ["损坏内容", "{", "无法解析"],
    ["错误模块", JSON.stringify({ ...buildModule1ContinuePackage(createStudent()), portfolio: { ...createStudent(), moduleId: "module-4-ai-info-detective" } }), "其他模块"],
    ["未来版本", JSON.stringify({ ...buildModule1ContinuePackage(createStudent()), version: 2 }), "更高版本"],
    ["旧扁平格式", JSON.stringify({ sdg: "11", cityIssue: "浪费" }), "暂不支持"],
  ])("拒绝%s且在写入边界前报错", (_name, text, expected) => {
    expect(() => deserializeModule1ContinuePackageText(text)).toThrow(expected)
  })

  it("不同学生替换只保留导入档案字段", () => {
    const oldStudent = createStudent("旧学生")
    oldStudent.lesson1.cityIssue = "旧问题"
    const imported = prepareModule1ImportedReplacement(createStudent("新学生"))
    expect(imported.student.studentName).toBe("新学生")
    expect(imported.lesson1.cityIssue).toBe("")
  })
})
