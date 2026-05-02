/**
 * 文件说明：模块 4 课时 1 第 2 关素材图片展示组件。
 * 职责：统一展示新闻网页截图风格图和图片类静态素材，提供 contain、圆角边框、说明文字、加载失败 fallback 和点击放大预览遮罩。
 * 更新触发：Step 2 素材图片展示尺寸、放大预览交互、占位策略、图片加载错误文案或素材视觉规范变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import type { Step2SampleMaterial } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"

interface SampleMaterialImageProps {
  material: Step2SampleMaterial
  allowPreview?: boolean
  onPreviewOpen?: () => void
}

export function SampleMaterialImage({ material, allowPreview = true, onPreviewOpen }: SampleMaterialImageProps) {
  const [failed, setFailed] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (!previewOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewOpen])

  return (
    <figure className="rounded-2xl border border-border/80 bg-muted/20 p-3">
      {failed ? (
        <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-dashed bg-background text-sm text-muted-foreground">
          示例素材图片暂未加载
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={!allowPreview}
            className="group block w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-default disabled:focus:ring-0 disabled:focus:ring-offset-0"
            onClick={() => {
              if (!allowPreview) return
              onPreviewOpen?.()
              setPreviewOpen(true)
            }}
            aria-label={allowPreview ? "放大查看素材图片" : "素材图片缩略图"}
          >
            <img
              src={material.imageSrc}
              alt={material.alt}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className={`max-h-[min(45vh,28rem)] w-full rounded-xl object-contain transition-transform duration-200 ${allowPreview ? "cursor-zoom-in group-hover:scale-[1.01]" : ""}`}
            />
          </button>
          {allowPreview && previewOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="素材图片放大预览"
              onClick={() => setPreviewOpen(false)}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-lg hover:bg-white"
                onClick={() => setPreviewOpen(false)}
              >
                关闭
              </button>
              <img
                src={material.imageSrc}
                alt={material.alt}
                className="max-h-[88vh] max-w-[92vw] rounded-2xl bg-white object-contain shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          )}
        </>
      )}
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">{material.caption}</figcaption>
    </figure>
  )
}
