/**
 * 文件说明：模块 1 阶段快照入口回归测试。
 * 职责：锁定首页课卡按课时下载、身份卡不再提供快照、学生顶栏无快照、教师演示可从课卡导出且不落盘。
 * 更新触发：课卡快照入口、身份卡入口、学生/教师顶栏策略或课时号导出规则变化时，需要同步更新本文件。
 */

import { describe, expect, it, vi } from "vitest"
import { createModule1MemoryPersistence } from "@/modules/module-1-ai-story/app/providers/module1-teacher-mode"
import { canAccessModule1Lesson } from "@/modules/module-1-ai-story/app/lesson-registry"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getModule1GlobalActionAvailability } from "@/modules/module-1-ai-story/features/global-actions/module1-global-actions-state"
import {
  getModule1LessonCardSnapshotButton,
  getModule1TeacherTopBarSnapshotState,
  shouldShowModule1IdentityCardSnapshot,
  shouldShowModule1StudentTopBarSnapshot,
} from "@/modules/module-1-ai-story/features/global-actions/module1-lesson-snapshot-entry"
import { deserializeModule1ContinuePackageText } from "@/modules/module-1-ai-story/infra/persistence/serializers/continue-package"
import {
  buildModule1Lesson1SnapshotHtml,
  buildModule1Lesson2SnapshotHtml,
  buildModule1Lesson3SnapshotHtml,
  isModule1SnapshotReady,
  resolveModule1SnapshotKindFromLessonId,
} from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"

function createStudent() {
  return createNewModule1Portfolio({
    clazz: "初一（1）班",
    studentName: "张三",
    classSeatCode: "0101",
  })
}

function completeLesson1(portfolio: ReturnType<typeof createStudent>) {
  portfolio.lesson1 = {
    ...portfolio.lesson1,
    completed: true,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    sdg: "11 可持续城市和社区",
    sdgWhy: "与社区生活相关",
    cityIssue: "夜间照明影响睡眠",
    audience: "社区物业",
    audienceConcern: "安全与成本",
  }
  return portfolio
}

function completeLesson2(portfolio: ReturnType<typeof createStudent>) {
  portfolio.lesson2 = {
    ...portfolio.lesson2,
    completed: true,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
  }
  return portfolio
}

function cardSnapshot(portfolio: ReturnType<typeof createStudent>, lessonId: number) {
  return getModule1LessonCardSnapshotButton(lessonId, {
    available: lessonId <= 3,
    accessible: canAccessModule1Lesson(portfolio, lessonId),
    completed: lessonId === 1 ? portfolio.lesson1.completed : lessonId === 2 ? portfolio.lesson2.completed : false,
  })
}

describe("模块 1 阶段快照入口", () => {
  it("课时 1 完成、课时 2 未完成时，课卡 1 可下课时 1 快照，课卡 2 禁用，身份卡无快照按钮", () => {
    const portfolio = completeLesson1(createStudent())
    const card1 = cardSnapshot(portfolio, 1)
    const card2 = cardSnapshot(portfolio, 2)
    expect(card1).toMatchObject({ visible: true, enabled: true, kind: "lesson1" })
    expect(card2).toMatchObject({ visible: true, enabled: false, kind: "lesson2", hint: "完成本课后可下载" })
    expect(cardSnapshot(portfolio, 3)).toMatchObject({ visible: false })
    expect(shouldShowModule1IdentityCardSnapshot()).toBe(false)
    expect(isModule1SnapshotReady(portfolio, "lesson1")).toBe(true)
    expect(isModule1SnapshotReady(portfolio, "lesson2")).toBe(false)
    const html = buildModule1Lesson1SnapshotHtml(portfolio)
    expect(html).toContain("课时 1")
    expect(html).toContain("主题设定")
    expect(html).not.toContain("文学参照与写法")
    expect(html).not.toContain("人物四格")
  })

  it("两课都完成时，两张卡各自下对应快照，而不是只下最新一课", () => {
    const portfolio = completeLesson2(completeLesson1(createStudent()))
    expect(cardSnapshot(portfolio, 1)).toMatchObject({ visible: true, enabled: true, kind: "lesson1" })
    expect(cardSnapshot(portfolio, 2)).toMatchObject({ visible: true, enabled: true, kind: "lesson2" })
    expect(cardSnapshot(portfolio, 3)).toMatchObject({ visible: true, enabled: false, kind: "lesson3", hint: "完成本课后可下载" })
    expect(resolveModule1SnapshotKindFromLessonId(1)).toBe("lesson1")
    expect(resolveModule1SnapshotKindFromLessonId(2)).toBe("lesson2")
    expect(resolveModule1SnapshotKindFromLessonId(3)).toBe("lesson3")
    const html1 = buildModule1Lesson1SnapshotHtml(portfolio)
    const html2 = buildModule1Lesson2SnapshotHtml(portfolio)
    expect(html1).toContain("课时 1")
    expect(html1).not.toContain("文学参照与写法")
    expect(html2).toContain("课时 2")
    expect(html2).toContain("文学参照")
    expect(html2).toContain("人物四格")
    expect(shouldShowModule1IdentityCardSnapshot()).toBe(false)
  })

  it("学生顶栏无快照，未解锁或待开发课时不出现快照按钮", () => {
    const unfinished = createStudent()
    expect(shouldShowModule1StudentTopBarSnapshot()).toBe(false)
    expect(getModule1GlobalActionAvailability(true, false, {
      snapshotReady: true,
      showSnapshot: true,
    }).canSnapshot).toBe(false)
    expect(cardSnapshot(unfinished, 1)).toMatchObject({ visible: true, enabled: false, hint: "完成本课后可下载" })
    expect(cardSnapshot(unfinished, 2).visible).toBe(false)
    expect(cardSnapshot(unfinished, 3).visible).toBe(false)
    expect(cardSnapshot(unfinished, 6).visible).toBe(false)
  })

  it("导入 HTML 仍拒绝恢复进度", () => {
    expect(() => deserializeModule1ContinuePackageText("<!doctype html><html><body>阶段快照</body></html>"))
      .toThrow("阶段快照不能恢复进度，请选择继续学习包")
    expect(() => deserializeModule1ContinuePackageText("{}", "模块1_张三_课时1主题设定快照_2026-09-05.html"))
      .toThrow("阶段快照不能恢复进度，请选择继续学习包")
  })

  it("教师演示可从课卡导出且不落盘", () => {
    const persistence = createModule1MemoryPersistence()
    const save = vi.spyOn(persistence, "save")
    const demo = createModule1TeacherLecturePortfolio()
    expect(getModule1LessonCardSnapshotButton(1, {
      available: true,
      accessible: true,
      completed: demo.lesson1.completed,
    })).toMatchObject({ visible: true, enabled: true, kind: "lesson1" })
    expect(getModule1LessonCardSnapshotButton(2, {
      available: true,
      accessible: true,
      completed: demo.lesson2.completed,
    })).toMatchObject({ visible: true, enabled: true, kind: "lesson2" })
    expect(getModule1LessonCardSnapshotButton(3, {
      available: true,
      accessible: true,
      completed: demo.lesson3.completed,
    })).toMatchObject({ visible: true, enabled: true, kind: "lesson3" })
    expect(buildModule1Lesson1SnapshotHtml(demo)).toContain("演示学生")
    expect(buildModule1Lesson2SnapshotHtml(demo)).toContain("文学参照")
    expect(buildModule1Lesson3SnapshotHtml(demo)).toContain("写一个吸引人的开头")
    expect(getModule1TeacherTopBarSnapshotState("/module/1/lesson/1/step/4", demo)).toMatchObject({
      visible: true,
      enabled: true,
      kind: "lesson1",
    })
    expect(getModule1TeacherTopBarSnapshotState("/module/1/lesson/2/step/4", demo)).toMatchObject({
      visible: true,
      enabled: true,
      kind: "lesson2",
    })
    expect(getModule1TeacherTopBarSnapshotState("/module/1/lesson/3/step/4", demo)).toMatchObject({
      visible: true,
      enabled: true,
      kind: "lesson3",
    })
    expect(getModule1TeacherTopBarSnapshotState("/module/1", demo).visible).toBe(false)
    expect(getModule1TeacherTopBarSnapshotState("/module/1/lesson/1/step/1", null).visible).toBe(false)
    expect(save).not.toHaveBeenCalled()
  })
})
