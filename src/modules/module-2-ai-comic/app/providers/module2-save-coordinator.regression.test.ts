/**
 * 文件说明：模块 2 保存协调器与教师模式写入策略回归测试。
 * 职责：验证乐观更新与连续保存合并、“saved” 只在持久化完成后发布、失败保留内存输入并可重试、flush 不把旧数据冒充最新、替换或清除使旧排队保存失效、失败时保留原档案，以及教师模式 no-op。
 * 更新触发：module2-save-coordinator.ts 或 module2-teacher-mode.ts 的队列、状态机、替换、清除或教师旁路语义变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { Module2SaveCoordinator, type Module2PersistenceBoundary, type Module2SaveStatus } from "./module2-save-coordinator"
import { createModule2MemoryPersistence, runModule2StudentArchiveMutation } from "./module2-teacher-mode"
import { createNewModule2Portfolio, type Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"

function createDeferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

function observe(portfolio: Module2PortfolioV1, text: string): Module2PortfolioV1 {
  return { ...portfolio, lesson1: { ...portfolio.lesson1, sampleObservation: text } }
}

describe("Module2SaveCoordinator", () => {
  it("连续乐观更新立即合并，写入合并为最新内存态；saved 只在持久化完成后发布", async () => {
    const release = createDeferred()
    const persisted: string[] = []
    const statuses: Module2SaveStatus["state"][] = []
    let revision = 0
    const boundary: Module2PersistenceBoundary = {
      save: async (p) => { await release.promise; persisted.push(p.lesson1.sampleObservation); return { revision: (revision += 1) } },
      replace: async () => ({ revision: 0 }),
      clear: async () => undefined,
    }
    const coordinator = new Module2SaveCoordinator(boundary, status => statuses.push(status.state))
    coordinator.hydrate(createNewModule2Portfolio())
    coordinator.update(p => observe(p, "一"))
    coordinator.update(p => observe(p, "一二"))
    coordinator.update(p => observe(p, "一二三"))
    expect(coordinator.getCurrent()?.lesson1.sampleObservation).toBe("一二三")
    expect(statuses.at(-1)).toBe("saving")
    await Promise.resolve()
    expect(statuses).not.toContain("saved")
    release.resolve()
    const latest = await coordinator.flush()
    expect(persisted).toEqual(["一二三"])
    expect(statuses.at(-1)).toBe("saved")
    expect(latest.revision).toBe(1)
  })

  it("updater 返回原对象时不排队保存", async () => {
    let saves = 0
    const coordinator = new Module2SaveCoordinator({ save: async () => ({ revision: ++saves }), replace: async () => ({ revision: 0 }), clear: async () => undefined })
    coordinator.hydrate(createNewModule2Portfolio())
    coordinator.update(p => p)
    await coordinator.flush()
    expect(saves).toBe(0)
  })

  it("保存失败：状态为 error，内存输入保留，flush 抛错；重试成功后为 saved", async () => {
    let fail = true
    const statuses: Module2SaveStatus[] = []
    const coordinator = new Module2SaveCoordinator({
      save: async () => { if (fail) throw new DOMException("满了", "QuotaExceededError"); return { revision: 5 } },
      replace: async () => ({ revision: 0 }),
      clear: async () => undefined,
    }, status => statuses.push(status))
    coordinator.hydrate(createNewModule2Portfolio())
    coordinator.update(p => observe(p, "不能丢的输入"))
    await expect(coordinator.flush()).rejects.toThrow()
    expect(statuses.at(-1)?.state).toBe("error")
    expect(coordinator.getCurrent()?.lesson1.sampleObservation).toBe("不能丢的输入")
    fail = false
    await coordinator.retry()
    expect(statuses.at(-1)?.state).toBe("saved")
    expect((await coordinator.flush()).revision).toBe(5)
  })

  it("替换使尚未执行的旧排队保存失效，最终只属于新档案", async () => {
    const firstStarted = createDeferred()
    const releaseFirst = createDeferred()
    const events: string[] = []
    let count = 0
    const boundary: Module2PersistenceBoundary = {
      save: async (p) => {
        count += 1
        events.push(`save:${p.student.studentName}`)
        if (count === 1) { firstStarted.resolve(); await releaseFirst.promise }
        return { revision: count }
      },
      replace: async (p) => { events.push(`replace:${p.student.studentName}`); return { revision: 9 } },
      clear: async () => undefined,
    }
    const coordinator = new Module2SaveCoordinator(boundary)
    coordinator.hydrate(createNewModule2Portfolio({ clazz: "", studentName: "旧", classSeatCode: "" }))
    coordinator.update(p => observe(p, "在途"))
    await firstStarted.promise
    coordinator.update(p => observe(p, "排队中的旧写入"))
    const replacing = coordinator.replace(createNewModule2Portfolio({ clazz: "", studentName: "新", classSeatCode: "" }))
    releaseFirst.resolve()
    const replaced = await replacing
    await coordinator.flush()
    expect(events).toEqual(["save:旧", "replace:新"])
    expect(replaced.revision).toBe(9)
    expect(coordinator.getCurrent()?.student.studentName).toBe("新")
  })

  it("替换失败时保持原档案", async () => {
    const coordinator = new Module2SaveCoordinator({
      save: async () => ({ revision: 1 }),
      replace: async () => { throw new Error("模拟替换失败") },
      clear: async () => undefined,
    })
    coordinator.hydrate(createNewModule2Portfolio({ clazz: "", studentName: "原", classSeatCode: "" }))
    await expect(coordinator.replace(createNewModule2Portfolio())).rejects.toThrow("模拟替换失败")
    expect(coordinator.getCurrent()?.student.studentName).toBe("原")
  })

  it("清除使尚未执行的排队保存失效，成功后内存档案为空", async () => {
    const firstStarted = createDeferred()
    const releaseFirst = createDeferred()
    const events: string[] = []
    let count = 0
    const boundary: Module2PersistenceBoundary = {
      save: async () => {
        count += 1
        events.push("save")
        if (count === 1) {
          firstStarted.resolve()
          await releaseFirst.promise
        }
        return { revision: count }
      },
      replace: async () => ({ revision: 0 }),
      clear: async () => { events.push("clear") },
    }
    const coordinator = new Module2SaveCoordinator(boundary)
    coordinator.hydrate(createNewModule2Portfolio())
    coordinator.update(p => observe(p, "在途"))
    await firstStarted.promise
    coordinator.update(p => observe(p, "排队中的旧写入"))
    const clearing = coordinator.clear()
    releaseFirst.resolve()
    await clearing
    expect(events).toEqual(["save", "clear"])
    expect(coordinator.getCurrent()).toBeNull()
  })

  it("清除失败时保留内存档案", async () => {
    const coordinator = new Module2SaveCoordinator({
      save: async () => ({ revision: 1 }),
      replace: async () => ({ revision: 0 }),
      clear: async () => { throw new Error("模拟清除失败") },
    })
    coordinator.hydrate(createNewModule2Portfolio({ clazz: "", studentName: "原", classSeatCode: "" }))
    await expect(coordinator.clear()).rejects.toThrow("模拟清除失败")
    expect(coordinator.getCurrent()?.student.studentName).toBe("原")
  })

  it("没有档案时更新报错，不静默丢弃", () => {
    const coordinator = new Module2SaveCoordinator(createModule2MemoryPersistence())
    expect(() => coordinator.update(p => p)).toThrow()
  })
})

describe("模块 2 教师模式写入策略", () => {
  it("教师模式下学生档案变更 no-op，学生模式正常执行", async () => {
    let ran = 0
    expect(await runModule2StudentArchiveMutation(true, async () => { ran += 1 })).toBe(false)
    expect(ran).toBe(0)
    expect(await runModule2StudentArchiveMutation(false, async () => { ran += 1 })).toBe(true)
    expect(ran).toBe(1)
  })

  it("内存 persistence 不依赖浏览器数据库", async () => {
    expect(typeof (globalThis as { indexedDB?: unknown }).indexedDB).toBe("undefined")
    const coordinator = new Module2SaveCoordinator(createModule2MemoryPersistence())
    coordinator.hydrate(createNewModule2Portfolio())
    coordinator.update(p => observe(p, "演示"))
    expect((await coordinator.flush()).lesson1.sampleObservation).toBe("演示")
  })
})
