/**
 * 文件说明：模块 2 学习包 Worker 的页面侧调用。
 * 职责：用 Vite 的模块 Worker 把打包和解压放到后台；构建后仍是静态 js。测试可以直接调用 package-zip，不必启动 Worker。
 * 更新触发：Worker 文件名、消息字段或传输方式变化时，需要同步更新本文件与 pack.worker.ts。
 */

import type { ZipFileInput } from "@/modules/module-2-ai-comic/features/learning-package/package-zip"

interface WorkerSuccess {
  id: number
  ok: true
  bytes?: ArrayBuffer
  files?: { path: string; bytes: ArrayBuffer }[]
}

interface WorkerFailure {
  id: number
  ok: false
  message: string
}

function copyBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export function createPackWorker(): Worker {
  return new Worker(new URL("./pack.worker.ts", import.meta.url), { type: "module" })
}

function callWorker(worker: Worker, message: object, transfer: ArrayBuffer[]): Promise<WorkerSuccess> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("后台处理超时")), 120_000)
    worker.onmessage = (event: MessageEvent<WorkerSuccess | WorkerFailure>) => {
      window.clearTimeout(timer)
      if (!event.data.ok) reject(new Error(event.data.message))
      else resolve(event.data)
    }
    worker.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error("无法在后台处理学习包"))
    }
    worker.postMessage(message, transfer)
  })
}

export async function zipWithPackWorker(files: ZipFileInput[]): Promise<Uint8Array> {
  const worker = createPackWorker()
  try {
    const payload = files.map(file => ({ path: file.path, store: file.store, bytes: copyBuffer(file.bytes) }))
    const response = await callWorker(
      worker,
      { id: 1, type: "zip", files: payload },
      payload.map(file => file.bytes),
    )
    if (!response.bytes) throw new Error("打包没有返回内容")
    return new Uint8Array(response.bytes)
  } finally {
    worker.terminate()
  }
}

export async function unzipWithPackWorker(bytes: Uint8Array): Promise<{ path: string; bytes: Uint8Array }[]> {
  const worker = createPackWorker()
  try {
    const buffer = copyBuffer(bytes)
    const response = await callWorker(worker, { id: 1, type: "unzip", bytes: buffer }, [buffer])
    return (response.files ?? []).map(file => ({ path: file.path, bytes: new Uint8Array(file.bytes) }))
  } finally {
    worker.terminate()
  }
}
