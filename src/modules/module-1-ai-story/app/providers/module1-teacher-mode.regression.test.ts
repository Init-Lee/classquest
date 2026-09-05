/**
 * 文件说明：模块 1 教师讲解写入策略回归测试。
 * 职责：确认讲解会话只走内存边界，导入与清除不会触达真实 persistence。
 * 更新触发：教师模式旁路、内存 coordinator 或真实档案 no-op 规则变化时，需要同步更新本文件。
 */

import { describe, expect, it, vi } from "vitest"
import {
  Module1SaveCoordinator,
  type Module1PersistenceBoundary,
} from "@/modules/module-1-ai-story/app/providers/module1-save-coordinator"
import {
  createModule1MemoryPersistence,
  runModule1StudentArchiveMutation,
} from "@/modules/module-1-ai-story/app/providers/module1-teacher-mode"
import { createModule1TeacherLecturePortfolio } from "@/modules/module-1-ai-story/constants/demo-portfolio"
import { normalizeModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"

function createFakeBoundary(): Module1PersistenceBoundary {
  return {
    save: vi.fn(async () => undefined),
    replaceWithImported: vi.fn(async () => undefined),
    clear: vi.fn(async () => undefined),
  }
}

describe("模块 1 教师模式写入旁路", () => {
  it("讲解更新与 flush 不调用真实 persistence", async () => {
    const real = createFakeBoundary()
    const memory = createModule1MemoryPersistence()
    const coordinator = new Module1SaveCoordinator(memory, normalizeModule1Portfolio)
    coordinator.hydrate(createModule1TeacherLecturePortfolio())
    coordinator.update(current => ({
      ...current,
      lesson1: { ...current.lesson1, sdgWhy: "课堂改写示例" },
    }))
    await coordinator.flush()
    expect(real.save).not.toHaveBeenCalled()
    expect(real.replaceWithImported).not.toHaveBeenCalled()
    expect(real.clear).not.toHaveBeenCalled()
    expect(coordinator.getCurrent()?.lesson1.sdgWhy).toBe("课堂改写示例")
  })

  it("导入与清除在教师模式下不触达真实档案", async () => {
    const real = createFakeBoundary()
    await runModule1StudentArchiveMutation(true, () => real.replaceWithImported(createModule1TeacherLecturePortfolio()))
    await runModule1StudentArchiveMutation(true, () => real.clear())
    expect(real.replaceWithImported).not.toHaveBeenCalled()
    expect(real.clear).not.toHaveBeenCalled()

    await runModule1StudentArchiveMutation(false, () => real.clear())
    expect(real.clear).toHaveBeenCalledTimes(1)
  })
})
