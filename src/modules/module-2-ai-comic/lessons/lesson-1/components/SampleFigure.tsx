/**
 * 文件说明：课时一样例图片。
 * 职责：显示一张静态样例图。点图片本身，或点右下角放大图标，打开同一张放大对话框；加载失败时报告文件名，不把空图当成已经展示。
 * 更新触发：样例图的点按放大、右下角图标、替代说明或失败提示变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { ZoomIn } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import {
  guanDengAssetUrl,
  guanDengImageSize,
  type GuanDengSample,
} from "@/modules/module-2-ai-comic/lessons/lesson-1/sample/load-guan-deng-sample"

export function SampleFigure({
  sample,
  file,
  alt,
  onLoad,
  onMissing,
}: {
  sample: GuanDengSample
  file: string
  alt: string
  onLoad?: (file: string) => void
  onMissing?: (file: string) => void
}) {
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState(false)
  const size = guanDengImageSize(sample, file)
  const bind = (node: HTMLImageElement | null) => {
    if (!node?.complete) return
    if (node.naturalWidth > 0) onLoad?.(file)
    else {
      setFailed(true)
      onMissing?.(file)
    }
  }
  if (failed) return <SampleMissingNotice message="这一张图没有显示出来。" missing={[file]} />
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        className="block w-full cursor-zoom-in rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`放大查看：${alt}`}
        onClick={() => setZoom(true)}
      >
        <img
          ref={bind}
          src={guanDengAssetUrl(file)}
          alt={alt}
          width={size?.width}
          height={size?.height}
          className="h-auto w-full max-w-full"
          onLoad={() => onLoad?.(file)}
          onError={() => {
            setFailed(true)
            onMissing?.(file)
          }}
        />
      </button>
      {/* 只占右下角，不盖住画面主体；和点图打开同一个对话框 */}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute bottom-1.5 right-1.5 z-10 h-7 w-7 border border-foreground/20 bg-background/90 text-foreground shadow-sm hover:bg-background"
        aria-label="放大查看"
        onClick={() => setZoom(true)}
      >
        <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-h-[90vh] max-w-[min(100vw-1.5rem,56rem)] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{alt}</DialogTitle>
          </DialogHeader>
          <img src={guanDengAssetUrl(file)} alt={alt} className="h-auto w-full max-w-full" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
