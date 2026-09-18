/**
 * 文件说明：模块 1 课时 3 页内案例配图。
 * 职责：尝试加载内容包英文文件名配图；缺图时隐藏图片、不阻塞通关。
 * 更新触发：配图路径、alt 或缺失降级策略变化时，需要同步更新本文件。
 */

import { useState } from "react"

interface Lesson3OptionalImageProps {
  src: string
  alt: string
}

export function Lesson3OptionalImage({ src, alt }: Lesson3OptionalImageProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt={alt}
      className="max-h-48 w-full rounded-lg border object-cover"
      onError={() => setFailed(true)}
    />
  )
}
