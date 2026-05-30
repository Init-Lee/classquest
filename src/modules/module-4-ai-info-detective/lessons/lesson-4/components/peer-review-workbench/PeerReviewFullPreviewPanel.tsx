/**
 * 文件说明：模块 4 课时 4 互审评价阶段左右分栏（遗留，已由 PeerReviewWorkbench 固定分栏取代）。
 * 职责：历史阶段 B 左栏题卡+完整解析、右栏评价；新布局左栏仅试答后 trial 解析、右栏常驻评价面板。
 * 更新触发：若恢复「试答完成后整屏切换」流程时再更新；否则以 PeerReviewWorkbench 为准。
 */

import type { Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/api/types"
import type { ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { PeerReviewAuthorAnalysisPanel } from "./PeerReviewAuthorAnalysisPanel"
import { PeerReviewCardMaterialTaskPanel } from "./PeerReviewCardMaterialTaskPanel"
import { PeerReviewWorkbenchSplitLayout } from "./PeerReviewWorkbenchSplitLayout"

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

/** @deprecated 请使用 PeerReviewWorkbench 固定左右分栏。 */
export function PeerReviewFullPreviewPanel({
  requestJson,
  activeKind,
  onActiveKindChange,
  evaluationPanel,
}: {
  requestJson: Lesson4ReviewRequestJson
  activeKind: Module4MaterialKind
  onActiveKindChange: (kind: Module4MaterialKind) => void
  evaluationPanel: ReactNode
}) {
  const card = requestJson.cards[activeKind]

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">对照题卡填写互审评价</p>
          <p className="text-xs text-muted-foreground">请改用 PeerReviewWorkbench 固定分栏（左试答、右评价）。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["news", "image"] as Module4MaterialKind[]).map(kind => (
            <Button
              key={kind}
              type="button"
              size="sm"
              variant={activeKind === kind ? "default" : "outline"}
              onClick={() => onActiveKindChange(kind)}
            >
              {CARD_LABEL[kind]}
            </Button>
          ))}
        </div>
      </div>
      <PeerReviewWorkbenchSplitLayout
        className="min-h-0 flex-1"
        left={(
          <>
            <PeerReviewCardMaterialTaskPanel card={card} header={`${CARD_LABEL[activeKind]} · 作者题卡`} />
            <PeerReviewAuthorAnalysisPanel card={card} mode="evaluation" />
          </>
        )}
        right={evaluationPanel}
      />
    </div>
  )
}
