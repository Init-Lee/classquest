/**
 * 文件说明：模块 4 课时 4 互审题卡完整预览（兼容导出，内部已拆分为左右分栏子组件）。
 * 职责：保留旧组件名供 FILE-STRUCTURE 引用；新代码请使用 PeerReviewCardMaterialTaskPanel + PeerReviewAuthorAnalysisPanel。
 * 更新触发：若仍有调用方需要单卡片预览容器时，同步组合子组件或删除本文件。
 */

import type { Module4Lesson3QuestionCardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { PeerReviewAuthorAnalysisPanel } from "./PeerReviewAuthorAnalysisPanel"
import { PeerReviewCardMaterialTaskPanel } from "./PeerReviewCardMaterialTaskPanel"

export function PeerReviewCardLivePreview({ card }: { card: Module4Lesson3QuestionCardDraft }) {
  const cardAltLabel = card.kind === "news" ? "新闻题卡 V1" : "图片题卡 V1"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-2">
        <p className="text-lg font-semibold leading-none tracking-tight">{cardAltLabel} · 完整预览</p>
      </CardHeader>
      <CardContent className="p-0">
        <PeerReviewCardMaterialTaskPanel card={card} />
        <PeerReviewAuthorAnalysisPanel card={card} mode="evaluation" />
      </CardContent>
    </Card>
  )
}
