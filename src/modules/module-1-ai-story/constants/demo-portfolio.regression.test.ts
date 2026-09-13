/**
 * 文件说明：模块 1 教师讲解演示档案回归测试。
 * 职责：锁定演示身份、课时 1/2 预填完成态，并确认不出现额外课时或全文副本。
 * 更新触发：演示档案字段、完成标记、身份规则或空课时策略变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { validateModule1ClassSeatCode } from "@/modules/module-1-ai-story/constants/class-options"
import {
  hasMeaningfulModule1Lesson1Fields,
  hasMeaningfulModule1Lesson2Fields,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

describe("模块 1 讲解演示档案", () => {
  it("课时 1 与课时 2 字段齐全，后续课时空态，不含额外故事字段", () => {
    const portfolio = createModule1TeacherLecturePortfolio()
    expect(portfolio.student.studentName).toBe("演示学生")
    expect(validateModule1ClassSeatCode(portfolio.student.clazz, portfolio.student.classSeatCode)).toBeNull()
    expect(hasMeaningfulModule1Lesson1Fields(portfolio.lesson1)).toBe(true)
    expect(hasMeaningfulModule1Lesson2Fields(portfolio.lesson2)).toBe(true)
    expect(portfolio.lesson1).toMatchObject({
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      completed: true,
    })
    expect(portfolio.lesson2).toMatchObject({
      step1Completed: true,
      step2Completed: true,
      step2Round1Passed: true,
      step3Completed: true,
      step4Completed: true,
      completed: true,
      study: { caseId: "shexi" },
      reference: { workTitle: "社戏", sourceConfirmed: true },
    })
    expect(portfolio.lesson2.character.who).toContain("林禾")
    expect(portfolio.lesson2.character.firstAction).toBeTruthy()
    expect(portfolio.lesson2.character.possibleChange).toBeTruthy()
    expect(portfolio.progress).toEqual({ lessonId: 2, stepId: 4 })
    expect(portfolio.lesson3).toEqual({ step: 1, completed: false, completedAt: null })
    expect(portfolio.lesson6).toEqual({ step: 1, completed: false, completedAt: null })
    expect(Object.keys(portfolio).filter(key => /^lesson\d+$/.test(key))).toEqual([
      "lesson1", "lesson2", "lesson3", "lesson4", "lesson5", "lesson6",
    ])
    expect(portfolio).not.toHaveProperty("lesson7")
    expect(portfolio).not.toHaveProperty("fullStory")
  })
})
