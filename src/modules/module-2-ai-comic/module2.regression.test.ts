/**
 * 文件说明：模块 2 阶段 A 骨架回归测试。
 * 职责：验证六课时注册表的两种访问条件、顶部进度状态、课时 1 关卡门禁、四关进度状态、教师口令，以及模块不 import 其他模块业务代码。
 * 更新触发：模块 2 课时开放范围、访问规则、关卡门禁、进度状态、教师口令或模块边界规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  canAccessModule2Lesson,
  isModule2LessonAvailable,
  isModule2PreviousLessonComplete,
  MODULE2_LESSON_REGISTRY,
} from "@/modules/module-2-ai-comic/app/lesson-registry"
import { buildModule2TopProgressItems } from "@/modules/module-2-ai-comic/app/layout/module2-top-progress-state"
import {
  canEnterModule2Lesson1Step,
  getModule2Lesson1RouteRedirect,
  isValidModule2Lesson1Step,
} from "@/modules/module-2-ai-comic/lessons/lesson-1/guards"
import { buildModule2InnerStepItems } from "@/modules/module-2-ai-comic/features/progress-ui/inner-step-progress-state"
import { verifyModule2TeacherPassphrase } from "@/modules/module-2-ai-comic/constants/teacher-passphrase"
import type { Module2PortfolioSkeleton } from "@/modules/module-2-ai-comic/domains/portfolio/types"

function lesson1Done(): Module2PortfolioSkeleton {
  return { lesson1: { step: 4, completed: true } }
}

describe("模块 2 六课时注册表", () => {
  it("固定六课时，只有课时 1 已开放", () => {
    expect(MODULE2_LESSON_REGISTRY.map(lesson => lesson.id)).toEqual([1, 2, 3, 4, 5, 6])
    expect(MODULE2_LESSON_REGISTRY.filter(lesson => lesson.available).map(lesson => lesson.id)).toEqual([1])
    expect(MODULE2_LESSON_REGISTRY[0].title).toBe("小说怎样变成漫画")
    expect(MODULE2_LESSON_REGISTRY[5].title).toBe("完成我的漫画")
  })

  it("课时 1 无需档案即可进入（不要求先登记身份）", () => {
    expect(canAccessModule2Lesson(null, 1)).toBe(true)
  })

  it("“已开放”与“前一课已完成”是两个独立条件", () => {
    expect(isModule2LessonAvailable(2)).toBe(false)
    expect(isModule2PreviousLessonComplete(lesson1Done(), 2)).toBe(true)
    expect(canAccessModule2Lesson(lesson1Done(), 2)).toBe(false)
  })

  it("教师模式不能越过“未开放”，也不能进入不存在的课时", () => {
    for (const lessonId of [2, 3, 4, 5, 6, 7, 0]) {
      expect(canAccessModule2Lesson(null, lessonId, true)).toBe(false)
    }
    expect(canAccessModule2Lesson(null, 1, true)).toBe(true)
  })
})

describe("模块 2 顶部课时进度", () => {
  it("无档案时课时 1 可进入课时入口，课时 2—6 为后续开放且不可点击", () => {
    const items = buildModule2TopProgressItems(null, 0)
    expect(items[0]).toMatchObject({ status: "available", target: "/module/2/lesson/1/step/1", clickable: true })
    expect(items.slice(1).every(item => item.status === "upcoming" && item.statusLabel === "后续开放" && !item.clickable && item.target === null)).toBe(true)
  })

  it("处于课时 1 时标为当前；完成课时 1 后课时 2 仍是后续开放而非可进入", () => {
    expect(buildModule2TopProgressItems(null, 1)[0].status).toBe("current")
    const items = buildModule2TopProgressItems(lesson1Done(), 1)
    expect(items[0]).toMatchObject({ status: "completed", clickable: true })
    expect(items[1]).toMatchObject({ status: "upcoming", clickable: false })
  })
})

describe("模块 2 课时 1 关卡门禁（阶段 A）", () => {
  it("学生只能进入第 1 关，越级回到第 1 关", () => {
    expect(canEnterModule2Lesson1Step(1)).toBe(true)
    for (const stepId of [2, 3, 4]) {
      expect(canEnterModule2Lesson1Step(stepId)).toBe(false)
      expect(getModule2Lesson1RouteRedirect(stepId)).toBe("/module/2/lesson/1/step/1")
    }
    expect(getModule2Lesson1RouteRedirect(1)).toBeNull()
  })

  it("教师模式四关全开，但无效关卡仍拒绝", () => {
    for (const stepId of [1, 2, 3, 4]) {
      expect(canEnterModule2Lesson1Step(stepId, true)).toBe(true)
      expect(getModule2Lesson1RouteRedirect(stepId, true)).toBeNull()
    }
    expect(isValidModule2Lesson1Step(5)).toBe(false)
    expect(isValidModule2Lesson1Step(Number.NaN)).toBe(false)
    expect(canEnterModule2Lesson1Step(5, true)).toBe(false)
  })
})

describe("模块 2 课时内四关进度", () => {
  it("区分完成、当前、可回看和锁定，并限制点击", () => {
    const steps = [1, 2, 3, 4].map(id => ({ id, label: `第 ${id} 关` }))
    const items = buildModule2InnerStepItems(steps, 2, [1], [1, 2, 3])
    expect(items.map(item => item.status)).toEqual(["completed", "current", "accessible", "locked"])
    expect(items.map(item => item.clickable)).toEqual([true, false, true, false])
  })
})

describe("模块 2 教师口令与模块边界", () => {
  it("口令与模块 1/4 口径一致，且严格比对", () => {
    expect(verifyModule2TeacherPassphrase("xnwy")).toBe(true)
    expect(verifyModule2TeacherPassphrase(" xnwy")).toBe(false)
    expect(verifyModule2TeacherPassphrase("")).toBe(false)
  })

  it("模块 2 源码不 import 其他模块业务代码", () => {
    const sources = import.meta.glob(["./**/*.ts", "./**/*.tsx"], { query: "?raw", import: "default", eager: true }) as Record<string, string>
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.endsWith(".regression.test.ts"))
      .filter(([, code]) => /from\s+["']@\/modules\/(?!module-2-ai-comic\/)/.test(code))
      .map(([path]) => path)
    expect(Object.keys(sources).length).toBeGreaterThan(10)
    expect(offenders).toEqual([])
  })
})
