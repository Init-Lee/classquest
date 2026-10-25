/**
 * 文件说明：模块 2 IndexedDB 事务运行器与持久化错误类型。
 * 职责：以 Promise 包装单个事务，只在 oncomplete 后 resolve；任何回调异常、请求错误、QuotaExceeded 或主动中止都会 abort 整个事务并把带分类的错误抛给调用方。
 * 更新触发：事务错误分类、中止策略、错误提示口径或事务回调约定变化时，需要同步更新本文件。
 *
 * 约定：body 与请求回调内只能同步发起 IDB 请求，禁止 await 外部 Promise（否则事务会自动提交或失活）。
 */

import type { Module2StoreName } from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/connection"

export type Module2PersistenceErrorKind =
  | "quota"
  | "aborted"
  | "invalid"
  | "conflict"
  | "missing"
  | "unavailable"
  | "unknown"

/** 带分类的持久化错误；message 为开发可定位的中文详情，界面按 kind 显示课堂友好文案。 */
export class Module2PersistenceError extends Error {
  readonly kind: Module2PersistenceErrorKind
  readonly details: string[]

  constructor(kind: Module2PersistenceErrorKind, message: string, details: string[] = [], options?: { cause?: unknown }) {
    super(message, options)
    this.name = "Module2PersistenceError"
    this.kind = kind
    this.details = details
  }
}

export function toModule2PersistenceError(
  cause: unknown,
  fallbackKind: Module2PersistenceErrorKind = "unknown",
): Module2PersistenceError {
  if (cause instanceof Module2PersistenceError) return cause
  const name = typeof cause === "object" && cause !== null && "name" in cause ? String((cause as { name: unknown }).name) : ""
  const detail = cause instanceof Error ? cause.message : String(cause ?? "")
  if (name === "QuotaExceededError") {
    return new Module2PersistenceError("quota", `本机存储空间不足：${detail}`, [], { cause })
  }
  if (name === "AbortError") {
    return new Module2PersistenceError("aborted", `本机保存被中止：${detail}`, [], { cause })
  }
  return new Module2PersistenceError(fallbackKind, `本机保存失败：${detail || name || "未知原因"}`, [], { cause })
}

export interface Module2TxContext<T> {
  setResult: (value: T) => void
  /** 记录错误并中止事务；同一事务只保留第一个错误。 */
  fail: (error: Error) => void
  /** 包装同步回调：回调抛错即中止事务。 */
  guard: <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => void
  /** 发起请求并在成功时同步执行 onSuccess；请求失败即中止事务。 */
  request: <R>(req: IDBRequest<R>, onSuccess?: (result: R) => void) => void
}

export function runModule2Transaction<T>(
  db: IDBDatabase,
  storeNames: Module2StoreName[],
  mode: IDBTransactionMode,
  body: (tx: IDBTransaction, ctx: Module2TxContext<T>) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let tx: IDBTransaction
    try {
      tx = db.transaction(storeNames, mode)
    } catch (cause) {
      reject(toModule2PersistenceError(cause, "unavailable"))
      return
    }
    let failure: Module2PersistenceError | null = null
    let result: T | undefined

    const fail = (error: Error) => {
      if (!failure) failure = toModule2PersistenceError(error)
      try {
        tx.abort()
      } catch {
        // 事务已结束时 abort 会抛 InvalidStateError，此时由 onabort/oncomplete 收尾
      }
    }
    const guard = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
      if (failure) return
      try {
        fn(...args)
      } catch (cause) {
        fail(cause instanceof Error ? cause : new Error(String(cause)))
      }
    }
    const request = <R>(req: IDBRequest<R>, onSuccess?: (value: R) => void) => {
      req.onsuccess = guard(() => onSuccess?.(req.result))
      req.onerror = (event) => {
        event.preventDefault()
        event.stopPropagation()
        fail(req.error ?? new Error("本机数据库请求失败"))
      }
    }

    tx.oncomplete = () => {
      if (failure) reject(failure)
      else resolve(result as T)
    }
    tx.onabort = () => {
      reject(failure ?? toModule2PersistenceError(tx.error ?? new Error("事务被中止"), "aborted"))
    }

    guard(() => body(tx, {
      setResult: (value) => { result = value },
      fail,
      guard,
      request,
    }))()
  })
}
