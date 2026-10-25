/**
 * 文件说明：模块 2 图片处理并发限制器。
 * 职责：把解码、压缩等耗内存任务按限定并发（默认 1，即串行）排队执行，避免同时解码多张大图；单个任务失败不影响后续任务。
 * 更新触发：图片处理并发策略变化时，需要同步更新本文件与回归测试。
 */

export type TaskRunner = <T>(task: () => Promise<T>) => Promise<T>

export function createLimitedRunner(concurrency: number): TaskRunner {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError("并发数至少为 1")
  let active = 0
  const waiting: Array<() => void> = []

  const next = () => {
    if (active >= concurrency) return
    const start = waiting.shift()
    if (start) start()
  }

  return <T>(task: () => Promise<T>) => new Promise<T>((resolve, reject) => {
    waiting.push(() => {
      active += 1
      task().then(resolve, reject).finally(() => {
        active -= 1
        next()
      })
    })
    next()
  })
}
