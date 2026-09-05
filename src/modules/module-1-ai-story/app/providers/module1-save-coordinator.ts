/**
 * 文件说明：模块 1 本地优先保存协调器。
 * 职责：同步合并函数式状态更新、串行持久化，并用代次令牌使清档或导入前的旧保存失效。
 * 更新触发：模块 1 保存队列、flush、清档、导入替换或错误传播语义变化时，需要同步更新本文件。
 */

import type { Module1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"

export interface Module1PersistenceBoundary {
  save: (portfolio: Module1Portfolio) => Promise<void>
  replaceWithImported: (portfolio: Module1Portfolio) => Promise<void>
  clear: () => Promise<void>
}

type Module1PortfolioUpdater = (current: Module1Portfolio) => Module1Portfolio
type Module1PersistOperation = "save" | "replace" | "clear"

export class Module1SaveCoordinator {
  private readonly persistence: Module1PersistenceBoundary
  private readonly prepare: (portfolio: Module1Portfolio) => Module1Portfolio
  private readonly onError: (error: Error, operation: Module1PersistOperation) => void
  private current: Module1Portfolio | null = null
  private generation = 0
  private queue: Promise<void> = Promise.resolve()
  private lastError: Error | null = null
  private mutationLocked = false

  constructor(
    persistence: Module1PersistenceBoundary,
    prepare: (portfolio: Module1Portfolio) => Module1Portfolio,
    onError: (error: Error, operation: Module1PersistOperation) => void = () => undefined,
  ) {
    this.persistence = persistence
    this.prepare = prepare
    this.onError = onError
  }

  hydrate(portfolio: Module1Portfolio | null): void {
    this.generation += 1
    this.current = portfolio ? this.prepare(portfolio) : null
    this.lastError = null
  }

  getCurrent(): Module1Portfolio | null {
    return this.current
  }

  update(updater: Module1PortfolioUpdater): Module1Portfolio {
    if (this.mutationLocked) throw new Error("档案正在替换或清除，请稍后重试。")
    if (!this.current) throw new Error("当前没有可更新的模块一学习档案。")
    const next = this.prepare({
      ...updater(this.current),
      updatedAt: new Date().toISOString(),
    })
    this.current = next
    const generation = this.generation
    this.enqueue("save", async () => {
      if (generation !== this.generation) return
      await this.persistence.save(next)
    })
    return next
  }

  async flush(): Promise<Module1Portfolio> {
    if (this.mutationLocked) throw new Error("档案正在替换或清除，请稍后重试。")
    await this.queue
    if (this.lastError) throw this.lastError
    if (!this.current) throw new Error("当前没有可导出的模块一学习档案。")
    return this.current
  }

  async replace(portfolio: Module1Portfolio): Promise<Module1Portfolio> {
    if (this.mutationLocked) throw new Error("档案操作正在进行，请稍后重试。")
    this.mutationLocked = true
    this.generation += 1
    const next = this.prepare(portfolio)
    try {
      await this.enqueue("replace", () => this.persistence.replaceWithImported(next))
      this.current = next
      return next
    } finally {
      this.mutationLocked = false
    }
  }

  async clear(): Promise<void> {
    if (this.mutationLocked) throw new Error("档案操作正在进行，请稍后重试。")
    this.mutationLocked = true
    this.generation += 1
    try {
      await this.enqueue("clear", () => this.persistence.clear())
      this.current = null
    } finally {
      this.mutationLocked = false
    }
  }

  private enqueue(operation: Module1PersistOperation, task: () => Promise<void>): Promise<void> {
    const result = this.queue.then(async () => {
      try {
        await task()
        this.lastError = null
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause))
        this.lastError = error
        this.onError(error, operation)
        throw error
      }
    })
    this.queue = result.catch(() => undefined)
    return result
  }
}
