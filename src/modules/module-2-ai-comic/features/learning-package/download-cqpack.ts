/**
 * 文件说明：模块 2 学习包的浏览器下载触发。
 * 职责：用临时链接请浏览器下载 .cqpack。只表示下载已经交给浏览器，不表示文件已经写入磁盘。
 * 更新触发：下载文件名、链接回收时机或下载方式变化时，需要同步更新本文件。
 */

export function downloadCqpack(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/octet-stream" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
