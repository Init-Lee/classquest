/**
 * 文件说明：模块 4 课时 4 互审工作台分卡提交栏。
 * 职责：展示本卡提交 loading/不可用提示与「提交本卡审查」按钮；字段级错误由右栏输入框下方 Badge 展示。
 * 更新触发：分卡提交文案、busy 状态或 AI 审核流程变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import type { Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

export function PeerReviewSubmitBar({
  activeKind,
  cardApproved,
  validationMessage,
  cardSubmitSuccessMessage,
  aiModerating,
  aiUnavailableMessage,
  busy,
  onSubmitCard,
}: {
  activeKind: Module4MaterialKind
  cardApproved: boolean
  validationMessage: string
  cardSubmitSuccessMessage: string
  aiModerating: boolean
  aiUnavailableMessage: string
  busy: boolean
  onSubmitCard: (kind: Module4MaterialKind) => void
}) {
  const submitDisabled = busy || aiModerating || cardApproved

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      {aiModerating && (
        <p className="text-sm text-muted-foreground">AI 正在检查 {CARD_LABEL[activeKind]} 的评价文字…</p>
      )}
      {aiUnavailableMessage && (
        <p className="text-sm text-destructive">{aiUnavailableMessage}</p>
      )}
      {cardSubmitSuccessMessage && (
        <p className="text-sm text-green-800">{cardSubmitSuccessMessage}</p>
      )}
      {validationMessage && !cardApproved && (
        <p className="text-sm text-destructive">{validationMessage}</p>
      )}
      {!validationMessage && !aiModerating && !cardApproved && !cardSubmitSuccessMessage && (
        <p className="text-xs text-muted-foreground">
          确认本题卡试答、量规、总体建议与违规判定均已填写后再提交；不通过原因会显示在对应输入框下方。
        </p>
      )}
      {cardApproved && (
        <p className="text-xs text-green-800">
          {CARD_LABEL[activeKind]}审查已通过。请切换另一张题卡继续，或在上方「我要审查别人」区域整体提交。
        </p>
      )}
      <div className="flex justify-end">
        <Button className="shrink-0" disabled={submitDisabled} onClick={() => onSubmitCard(activeKind)}>
          {aiModerating ? "AI 正在检查…" : cardApproved ? `${CARD_LABEL[activeKind]}已通过` : "提交本卡审查"}
        </Button>
      </div>
    </div>
  )
}
