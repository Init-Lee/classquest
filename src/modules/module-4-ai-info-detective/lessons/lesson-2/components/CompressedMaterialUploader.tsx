/**
 * 文件说明：模块 4 课时 2 压缩素材上传组件。
 * 职责：处理新闻截图和图片素材的本地选择、压缩、预览和替换，并把压缩后的资产写回父级状态。
 * 更新触发：课时 2 上传交互、压缩提示、预览信息或资产字段变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent } from "react"
import { ImagePlus, Loader2, Replace, X } from "lucide-react"
import type { Module4CompressedMaterialAsset, Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { compressModule4MaterialImage } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/compress-material-image"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

interface CompressedMaterialUploaderProps {
  kind: Module4MaterialKind
  asset?: Module4CompressedMaterialAsset
  disabled?: boolean
  onAssetChange: (asset: Module4CompressedMaterialAsset) => void
  helperText?: string
}

function formatBytes(value: number): string {
  if (value <= 0) return "未记录"
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`
  return `${Math.round(value / 1024)}KB`
}

function formatMimeType(value: Module4CompressedMaterialAsset["mimeType"]): string {
  if (value === "image/webp") return "WebP"
  if (value === "image/png") return "PNG"
  return "JPEG"
}

export function CompressedMaterialUploader({
  kind,
  asset,
  disabled,
  onAssetChange,
  helperText,
}: CompressedMaterialUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const label = kind === "news" ? "上传新闻截图" : "上传图片素材"

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCompressing(true)
    setError("")
    try {
      const nextAsset = await compressModule4MaterialImage(file, asset?.uploadCount ?? 0)
      onAssetChange(nextAsset)
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片处理失败，请重新上传。")
    } finally {
      setCompressing(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("rounded-2xl border bg-white p-4", disabled && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {helperText ?? "系统会自动压缩图片，尽量保持文字和主体清楚。"}
          </p>
        </div>
        <Button
          type="button"
          variant={asset ? "outline" : "default"}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || compressing}
          className="gap-1.5"
        >
          {compressing ? <Loader2 className="h-4 w-4 animate-spin" /> : asset ? <Replace className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          {asset ? "替换素材" : label}
        </Button>
        <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      {asset && (
        <div className="mt-4 grid gap-4 md:grid-cols-[220px,1fr]">
          <button
            type="button"
            className="cursor-zoom-in"
            onClick={() => setPreviewOpen(true)}
          >
            <img src={asset.dataUrl} alt={kind === "news" ? "新闻截图预览" : "图片素材预览"} className="max-h-52 w-full rounded-xl border object-contain" />
          </button>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">文件：</span>{asset.originalName}</p>
            <p><span className="text-muted-foreground">尺寸：</span>{asset.width} × {asset.height}</p>
            <p><span className="text-muted-foreground">压缩：</span>{formatBytes(asset.originalSizeBytes)} → {formatBytes(asset.compressedSizeBytes)}</p>
            <p><span className="text-muted-foreground">格式：</span>{formatMimeType(asset.mimeType)} · 第 {asset.uploadCount} 次上传</p>
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">请确认压缩后的截图仍然能看清关键信息。</p>
          </div>
        </div>
      )}
      {asset && previewOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-h-full max-w-6xl" onClick={event => event.stopPropagation()}>
            <button
              type="button"
              className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100"
              onClick={() => setPreviewOpen(false)}
              aria-label="关闭图片预览"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={asset.dataUrl}
              alt={kind === "news" ? "新闻截图放大预览" : "图片素材放大预览"}
              className="max-h-[88vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
