/**
 * 文件说明：模块 2 学习包的 Vite Worker。
 * 职责：在页面之外执行 fflate 打包和解压，构建后是一份静态 js，可以和页面一起放到 OSS。校验仍由主页面在解压结果上完成。
 * 更新触发：Worker 消息格式、压缩方式或解压限额变化时，需要同步更新本文件与 pack-client.ts。
 */

import { unzipCqpack, zipCqpack } from "@/modules/module-2-ai-comic/features/learning-package/package-zip"

interface ZipRequest {
  id: number
  type: "zip"
  files: { path: string; bytes: ArrayBuffer; store: boolean }[]
}

interface UnzipRequest {
  id: number
  type: "unzip"
  bytes: ArrayBuffer
}

function copyBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

interface PackWorkerScope {
  onmessage: ((event: MessageEvent<ZipRequest | UnzipRequest>) => void) | null
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

const scope = globalThis as unknown as PackWorkerScope

scope.onmessage = (event: MessageEvent<ZipRequest | UnzipRequest>) => {
  const message = event.data
  try {
    if (message.type === "zip") {
      const zipped = zipCqpack(message.files.map(file => ({
        path: file.path,
        store: file.store,
        bytes: new Uint8Array(file.bytes),
      })))
      const bytes = copyBuffer(zipped)
      scope.postMessage({ id: message.id, ok: true, bytes }, [bytes])
      return
    }
    const entries = unzipCqpack(new Uint8Array(message.bytes)).map(entry => ({
      path: entry.path,
      bytes: copyBuffer(entry.bytes),
    }))
    scope.postMessage({ id: message.id, ok: true, files: entries }, entries.map(entry => entry.bytes))
  } catch (error) {
    scope.postMessage({
      id: message.id,
      ok: false,
      message: error instanceof Error ? error.message : "学习包处理失败",
    })
  }
}
