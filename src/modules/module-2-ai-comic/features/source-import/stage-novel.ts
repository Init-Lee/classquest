/**
 * 文件说明：模块 2 小说候选的接入事务。
 * 职责：把解析结果保存为待核对草稿，或在拒绝时原样退回档案；确认、换来源和同来源去重继续使用课时一已有的纯函数。
 * 更新触发：候选草稿是否允许覆盖已确认来源、拒绝时的档案保持规则变化时，需要同步更新本文件。
 */

import { saveModule2SourceImportDraft } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import type { Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"
import type { NovelParseResult } from "@/modules/module-2-ai-comic/features/source-import/novel-types"

export interface NovelStageResult {
  /** false 表示档案对象保持调用前的那一份。 */
  applied: boolean
  portfolio: Module2PortfolioV1
  message: string
}

/**
 * 候选写入 sourceImportDraft。已确认的原作、档案身份和完成状态都不动。
 * 拒绝结果不产生新档案。
 */
export function stageNovelCandidate(portfolio: Module2PortfolioV1, result: NovelParseResult): NovelStageResult {
  if (result.kind === "rejected") {
    return { applied: false, portfolio, message: result.message }
  }
  return {
    applied: true,
    portfolio: saveModule2SourceImportDraft(portfolio, result.draft),
    message: result.message,
  }
}
