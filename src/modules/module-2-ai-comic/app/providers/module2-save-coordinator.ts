/**
 * 文件说明：模块 2 本地优先保存协调器。
 * 职责：同步合并函数式乐观更新、串行写入（合并连续保存，只写最新内存态）、flush、代次失效（替换 / 新建 / 清除后旧排队保存作废），并对外发布 saveState（idle / saving / saved / error）；
 *       “saved” 只在持久化 Promise（即数据库事务完成）resolve 后才发布，失败时保留内存输入。清除当前档案不改保存状态条文案。
 * 更新触发：模块 2 保存队列、flush、替换 / 新建 / 清除语义、saveState 状态机或错误传播变化时，需要同步更新本文件与协调器回归测试。
 */

import type { Module2PortfolioV1, Module2StoredAsset } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export interface Module2PersistenceBoundary {
  /** 保存档案并设为活动档案；resolve 代表事务已完成，返回落盘后的 revision。 */
  save: (portfolio: Module2PortfolioV1) => Promise<{ revision: number }>
  /** 原子替换活动档案（导入 / 新建），资产与档案同事务提交；resolve 代表事务已完成。 */
  replace: (portfolio: Module2PortfolioV1, assets: Module2StoredAsset[]) => Promise<{ revision: number }>
  /** 删除模块二数据库里的当前活动档案。失败时不得把内存档案清空。 */
  clear: () => Promise<void>
}

export type Module2SaveState = "idle" | "saving" | "saved" | "error"

export interface Module2SaveStatus {
  state: Module2SaveState
  error: Error | null
}

type Module2PortfolioUpdater = (current: Module2PortfolioV1) => Module2PortfolioV1

export class Module2SaveCoordinator {
  private readonly persistence: Module2PersistenceBoundary
  private readonly onStatus: (status: Module2SaveStatus) => void
  private current: Module2PortfolioV1 | null = null
  private generation = 0
  private queue: Promise<void> = Promise.resolve()
  private pendingTasks = 0
  private saveQueued = false
  private lastError: Error | null = null
  private mutationLocked = false

  constructor(
    persistence: Module2PersistenceBoundary,
    onStatus: (status: Module2SaveStatus) => void = () => undefined,
  ) {
    this.persistence = persistence
    this.onStatus = onStatus
  }

  hydrate(portfolio: Module2PortfolioV1 | null): void {
    this.generation += 1
    this.current = portfolio
    this.lastError = null
    this.saveQueued = false
    this.onStatus({ state: "idle", error: null })
  }

  getCurrent(): Module2PortfolioV1 | null {
    return this.current
  }

  /** 乐观更新：立即合并到内存并排队保存；连续更新只保留一次待写入，写入时取最新内存态。 */
  update(updater: Module2PortfolioUpdater): Module2PortfolioV1 {
    if (this.mutationLocked) throw new Error("学习记录正在替换，请稍后重试。")
    if (!this.current) throw new Error("当前没有可更新的模块二学习记录。")
    const updated = updater(this.current)
    if (updated === this.current) return this.current
    const next = { ...updated, updatedAt: new Date().toISOString() }
    this.current = next
    this.scheduleSave()
    return next
  }

  /** 失败后重试：再次写入当前内存态。 */
  retry(): Promise<void> {
    if (!this.current) return Promise.resolve()
    return this.scheduleSave()
  }

  /** 等待全部排队写入完成；任一写入失败即抛出，不把旧数据冒充最新。 */
  async flush(): Promise<Module2PortfolioV1> {
    if (this.mutationLocked) throw new Error("学习记录正在替换，请稍后重试。")
    await this.queue
    if (this.lastError) throw this.lastError
    if (!this.current) throw new Error("当前没有可保存的模块二学习记录。")
    return this.current
  }

  /** 原子替换（新建空草稿或导入）：使旧排队保存失效，事务成功后才切换内存态；失败保持原档案。 */
  async replace(portfolio: Module2PortfolioV1, assets: Module2StoredAsset[] = []): Promise<Module2PortfolioV1> {
    if (this.mutationLocked) throw new Error("学习记录操作正在进行，请稍后重试。")
    this.mutationLocked = true
    this.generation += 1
    this.saveQueued = false
    const generation = this.generation
    try {
      let saved = portfolio
      await this.enqueue(async () => {
        const result = await this.persistence.replace(portfolio, assets)
        saved = { ...portfolio, revision: result.revision }
      })
      if (generation === this.generation) this.current = saved
      return saved
    } finally {
      this.mutationLocked = false
    }
  }

  /**
   * 清除当前档案：先让尚未落盘的旧保存失效，再删库中的活动档案。
   * 事务成功后内存才变为空；失败则保留内存档案，也不把顶栏标成保存失败。
   */
  async clear(): Promise<void> {
    if (this.mutationLocked) throw new Error("学习记录操作正在进行，请稍后重试。")
    this.mutationLocked = true
    this.generation += 1
    this.saveQueued = false
    const generation = this.generation
    try {
      await this.enqueue(async () => {
        await this.persistence.clear()
      }, false)
      if (generation === this.generation) {
        this.current = null
        this.lastError = null
        this.onStatus({ state: "idle", error: null })
      }
    } finally {
      this.mutationLocked = false
    }
  }

  private scheduleSave(): Promise<void> {
    if (this.saveQueued) return this.queue
    this.saveQueued = true
    const generation = this.generation
    return this.enqueue(async () => {
      this.saveQueued = false
      if (generation !== this.generation || !this.current) return
      const snapshot = this.current
      const result = await this.persistence.save(snapshot)
      // 写入期间若有新编辑，只同步 revision，不回退内存中的新内容
      if (generation === this.generation && this.current && this.current.id === snapshot.id) {
        this.current = { ...this.current, revision: result.revision }
      }
    }).catch(() => undefined)
  }

  private enqueue(task: () => Promise<void>, reportStatus = true): Promise<void> {
    if (reportStatus) {
      this.pendingTasks += 1
      this.onStatus({ state: "saving", error: null })
    }
    const result = this.queue.then(async () => {
      try {
        await task()
        if (reportStatus) this.lastError = null
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause))
        if (reportStatus) this.lastError = error
        throw error
      } finally {
        if (reportStatus) {
          this.pendingTasks -= 1
          if (this.pendingTasks === 0) {
            this.onStatus(this.lastError ? { state: "error", error: this.lastError } : { state: "saved", error: null })
          }
        }
      }
    })
    this.queue = result.catch(() => undefined)
    return result
  }
}
