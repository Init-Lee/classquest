/**
 * 文件说明：模块 2 图片版本与资产库存的纯函数修改。
 * 职责：把新的图片版本连同其原图、主图、参考图资产编号加入档案库存（去重，不只保留选中图），供图片资产服务在写库前构造完整档案。
 * 更新触发：图片版本字段、库存去重规则或版本编号唯一性规则变化时，需要同步更新本文件与回归测试。
 */

import type { AssetId, ImageVersion, Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export interface AddImageVersionResult {
  portfolio: Module2PortfolioV1
  /** 本次真正新增到库存的资产编号（已在库存中的不计入）。 */
  addedAssetIds: AssetId[]
}

export function addModule2ImageVersion(portfolio: Module2PortfolioV1, version: ImageVersion): AddImageVersionResult {
  if (portfolio.imageVersions.some(item => item.id === version.id)) {
    throw new Error(`图片版本编号重复：${version.id}`)
  }
  const inventory = new Set(portfolio.assetIds)
  const addedAssetIds: AssetId[] = []
  for (const assetId of [version.originalAssetId, version.mainAssetId, ...version.referenceAssetIds]) {
    if (inventory.has(assetId)) continue
    inventory.add(assetId)
    addedAssetIds.push(assetId)
  }
  return {
    portfolio: {
      ...portfolio,
      assetIds: [...portfolio.assetIds, ...addedAssetIds],
      imageVersions: [...portfolio.imageVersions, version],
    },
    addedAssetIds,
  }
}
