/**
 * 文件说明：模块 1 保存协调器回归测试。
 * 职责：验证函数式连续更新、串行落盘、flush 最新态，以及清档和导入对旧保存代次的失效保护。
 * 更新触发：模块 1 乐观更新、保存队列、flush、清档或导入替换语义变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { Module1SaveCoordinator, type Module1PersistenceBoundary } from "./module1-save-coordinator"
import {
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

function createStudent(name: string): Module1Portfolio {
  return createNewModule1Portfolio({
    clazz: "初一（1）班",
    studentName: name,
    classSeatCode: "0101",
  })
}

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => {
    resolve = done
  })
  return { promise, resolve }
}

describe("Module1SaveCoordinator", () => {
  it("函数式连续更新立即合并字段，并按确定顺序保存", async () => {
    const persisted: Module1Portfolio[] = []
    const boundary: Module1PersistenceBoundary = {
      save: async portfolio => { persisted.push(structuredClone(portfolio)) },
      replaceWithImported: async () => undefined,
      clear: async () => undefined,
    }
    const coordinator = new Module1SaveCoordinator(boundary, normalizeModule1Portfolio)
    coordinator.hydrate(createStudent("连续输入"))

    coordinator.update(current => ({
      ...current,
      lesson1: { ...current.lesson1, sdgWhy: "第一个字段" },
    }))
    coordinator.update(current => ({
      ...current,
      lesson1: { ...current.lesson1, cityIssue: "第二个字段" },
    }))

    expect(coordinator.getCurrent()?.lesson1).toMatchObject({
      sdgWhy: "第一个字段",
      cityIssue: "第二个字段",
    })
    const latest = await coordinator.flush()
    expect(persisted).toHaveLength(2)
    expect(persisted[1].lesson1).toMatchObject({
      sdgWhy: "第一个字段",
      cityIssue: "第二个字段",
    })
    expect(latest).toEqual(persisted[1])
  })

  it("清档使尚未执行的旧代次保存失效，并在在途保存后最终清空", async () => {
    const firstSaveStarted = createDeferred()
    const releaseFirstSave = createDeferred()
    const events: string[] = []
    let stored: Module1Portfolio | null = null
    let saveCount = 0
    const boundary: Module1PersistenceBoundary = {
      save: async portfolio => {
        saveCount += 1
        events.push(`save:${portfolio.student.studentName}`)
        if (saveCount === 1) {
          firstSaveStarted.resolve()
          await releaseFirstSave.promise
        }
        stored = portfolio
      },
      replaceWithImported: async portfolio => { stored = portfolio },
      clear: async () => { events.push("clear"); stored = null },
    }
    const coordinator = new Module1SaveCoordinator(boundary, normalizeModule1Portfolio)
    coordinator.hydrate(createStudent("旧学生"))
    coordinator.update(current => ({ ...current, lesson1: { ...current.lesson1, sdgWhy: "第一次" } }))
    coordinator.update(current => ({ ...current, lesson1: { ...current.lesson1, cityIssue: "不应落盘" } }))
    await firstSaveStarted.promise

    const clearing = coordinator.clear()
    releaseFirstSave.resolve()
    await clearing

    expect(events).toEqual(["save:旧学生", "clear"])
    expect(stored).toBeNull()
    expect(coordinator.getCurrent()).toBeNull()
  })

  it("导入替换使旧档案排队保存失效，最终状态只属于新学生", async () => {
    const firstSaveStarted = createDeferred()
    const releaseFirstSave = createDeferred()
    const events: string[] = []
    let stored: Module1Portfolio | null = null
    let saveCount = 0
    const boundary: Module1PersistenceBoundary = {
      save: async portfolio => {
        saveCount += 1
        events.push(`save:${portfolio.student.studentName}`)
        if (saveCount === 1) {
          firstSaveStarted.resolve()
          await releaseFirstSave.promise
        }
        stored = portfolio
      },
      replaceWithImported: async portfolio => {
        events.push(`replace:${portfolio.student.studentName}`)
        stored = portfolio
      },
      clear: async () => undefined,
    }
    const coordinator = new Module1SaveCoordinator(boundary, normalizeModule1Portfolio)
    coordinator.hydrate(createStudent("旧学生"))
    coordinator.update(current => ({ ...current, lesson1: { ...current.lesson1, sdgWhy: "在途" } }))
    coordinator.update(current => ({ ...current, lesson1: { ...current.lesson1, cityIssue: "排队旧写入" } }))
    await firstSaveStarted.promise

    const replacing = coordinator.replace(createStudent("新学生"))
    releaseFirstSave.resolve()
    const imported = await replacing

    expect(events).toEqual(["save:旧学生", "replace:新学生"])
    expect(stored?.student.studentName).toBe("新学生")
    expect(imported.student.studentName).toBe("新学生")
  })

  it("导入持久化失败时保留原内存档案并向调用方抛错", async () => {
    const boundary: Module1PersistenceBoundary = {
      save: async () => undefined,
      replaceWithImported: async () => { throw new Error("模拟替换失败") },
      clear: async () => undefined,
    }
    const coordinator = new Module1SaveCoordinator(boundary, normalizeModule1Portfolio)
    coordinator.hydrate(createStudent("原学生"))

    await expect(coordinator.replace(createStudent("新学生"))).rejects.toThrow("模拟替换失败")
    expect(coordinator.getCurrent()?.student.studentName).toBe("原学生")
  })

  it("flush 等待全部写入并返回可供导出的最新乐观状态", async () => {
    const releaseSave = createDeferred()
    let persisted = createStudent("初始")
    const boundary: Module1PersistenceBoundary = {
      save: async portfolio => {
        await releaseSave.promise
        persisted = portfolio
      },
      replaceWithImported: async () => undefined,
      clear: async () => undefined,
    }
    const coordinator = new Module1SaveCoordinator(boundary, normalizeModule1Portfolio)
    coordinator.hydrate(createStudent("导出学生"))
    coordinator.update(current => ({
      ...current,
      lesson1: { ...current.lesson1, audience: "最新受众" },
    }))
    const flushing = coordinator.flush()
    releaseSave.resolve()

    const exported = await flushing
    expect(exported.lesson1.audience).toBe("最新受众")
    expect(persisted.lesson1.audience).toBe("最新受众")
  })
})
