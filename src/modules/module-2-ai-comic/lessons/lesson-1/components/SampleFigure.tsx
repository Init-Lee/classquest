/**
 * 文件说明：课时一样例图片。
 * 职责：显示一张静态样例图，提供放大查看；加载失败时报告文件名，不把空图当成已经展示。
 * 更新触发：样例图的放大、替代说明或失败提示变化时，需要同步更新本文件。
 */

import { useState } from "react"
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
    <div className="min-w-0">
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
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setZoom(true)}>
        放大查看
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
