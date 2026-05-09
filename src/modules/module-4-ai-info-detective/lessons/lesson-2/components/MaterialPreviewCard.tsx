/**
 * 文件说明：模块 4 课时 2 素材预览卡片。
 * 职责：统一展示新闻截图或图片素材的压缩预览与基本元数据，供复判、工作台和报告页复用。
 * 更新触发：素材预览样式、元数据展示字段或无素材提示变化时，需要同步更新本文件。
 */

import type { Module4MaterialKind, Module4CompressedMaterialAsset } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export function MaterialPreviewCard({ kind, asset }: { kind: Module4MaterialKind; asset?: Module4CompressedMaterialAsset }) {
  const title = kind === "news" ? "新闻截图预览" : "图片素材预览"
  if (!asset) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
        暂无{kind === "news" ? "新闻截图" : "图片素材"}，下一步可以继续上传或补充。
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="mb-3 font-medium">{title}</p>
      <img src={asset.dataUrl} alt={title} className="max-h-64 w-full rounded-xl border object-contain" />
      <p className="mt-2 text-xs text-muted-foreground">
        {asset.originalName} · {asset.width}×{asset.height} · 第 {asset.uploadCount} 次上传
      </p>
    </div>
  )
}
