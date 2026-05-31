/**
 * 文件说明：模块 4 课时 4 V2 修改台主工作台。
 * 职责：拷贝课时 3 题卡编辑工作台的左右分栏与满屏高度模式，左侧 wizard 逐段编辑，右侧单卡三区建议。
 * 更新触发：Step3 整体布局、wizard 锁定规则、题卡切换位置或确认流程变化时，需要同步更新本文件。
 */

import { useMemo, useState } from "react"
import type {
  Lesson4FeedbackDecision,
  Module4Lesson4ReviewJson,
  Module4Lesson4V2CardDraft,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"
import { getLesson4CardLabel } from "../../utils/build-lesson4-feedback-digest"
import type { Lesson4V2CardReadiness } from "../../utils/evaluate-lesson4-v2-card-readiness"
import {
  V2_REVISION_SECTIONS,
  areAllCardSectionsPass,
  computeMaxAccessibleSectionIndex,
  getSectionDecisions,
  getSectionIndex,
  getSectionStatus,
  getSectionStatusLabel,
  isSectionBlockingUnresolved,
  type V2RevisionSectionId,
} from "../../utils/get-lesson4-v2-revision-sections"
import { V2RevisionAdviceCard } from "./V2RevisionAdviceCard"
import { V2RevisionSectionEditor } from "./V2RevisionSectionEditor"

const SECTION_STATUS_BADGE_CLASS: Record<ReturnType<typeof getSectionStatus>, string> = {
  pass: "bg-green-100 text-green-700",
  pending: "bg-red-100 text-red-700",
  modified: "bg-amber-100 text-amber-800",
}

export function V2RevisionWorkbench({
  cardKind,
  card,
  decisions,
  receivedReviewJson,
  newsConfirmed,
  imageConfirmed,
  step3Complete,
  readiness,
  resolveNote,
  onResolveNoteChange,
  onResolveDecision,
  onUnresolveDecision,
  onCardChange,
  onCardKindChange,
  onConfirmCard,
  onEnterStep4,
}: {
  cardKind: Module4MaterialKind
  card: Module4Lesson4V2CardDraft
  decisions: Lesson4FeedbackDecision[]
  receivedReviewJson?: Module4Lesson4ReviewJson
  newsConfirmed: boolean
  imageConfirmed: boolean
  step3Complete: boolean
  readiness: Lesson4V2CardReadiness
  resolveNote: string
  onResolveNoteChange: (value: string) => void
  onResolveDecision: (decisionId: string) => void
  onUnresolveDecision: (decisionId: string) => void
  onCardChange: (card: Module4Lesson4V2CardDraft) => void
  onCardKindChange: (kind: Module4MaterialKind) => void
  onConfirmCard: () => void
  onEnterStep4: () => void
}) {
  const [activeSectionId, setActiveSectionId] = useState<V2RevisionSectionId>("material")
  const activeSectionIndex = getSectionIndex(activeSectionId)
  const maxAccessibleIndex = useMemo(
    () => computeMaxAccessibleSectionIndex(decisions, card, cardKind),
    [decisions, card, cardKind],
  )
  const cardFeedback = receivedReviewJson?.cards[cardKind]
  const sectionDecisions = getSectionDecisions(decisions, cardKind, activeSectionId)
  const currentBlocking = isSectionBlockingUnresolved(decisions, card, cardKind, activeSectionId)
  const confirmed = cardKind === "news" ? newsConfirmed : imageConfirmed
  const allSectionsPass = areAllCardSectionsPass(decisions, card, cardKind)

  const switchSection = (sectionId: V2RevisionSectionId) => {
    const index = getSectionIndex(sectionId)
    if (index <= maxAccessibleIndex) setActiveSectionId(sectionId)
  }

  const goPrevSection = () => {
    if (activeSectionIndex > 0) setActiveSectionId(V2_REVISION_SECTIONS[activeSectionIndex - 1].id)
  }

  const goNextSection = () => {
    if (currentBlocking) return
    if (activeSectionIndex < V2_REVISION_SECTIONS.length - 1) {
      setActiveSectionId(V2_REVISION_SECTIONS[activeSectionIndex + 1].id)
    }
  }

  const updateAuthorReply = (summary: string) => {
    onCardChange({
      ...card,
      revision: { ...card.revision, summary },
      status: "draft",
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-5">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white lg:flex-none">
          <div className="shrink-0 border-b px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="shrink-0 text-base font-semibold sm:text-lg">
                {getLesson4CardLabel(cardKind)} · V2 修改台
              </h3>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
                {V2_REVISION_SECTIONS.map((section, index) => {
                  const accessible = index <= maxAccessibleIndex
                  const active = activeSectionId === section.id
                  const sectionStatus = getSectionStatus(decisions, card, cardKind, section.id)
                  return (
                    <button
                      key={section.id}
                      type="button"
                      disabled={!accessible}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition sm:px-2.5 sm:text-sm",
                        active
                          ? "border-primary/30 bg-primary/5 text-primary shadow-sm"
                          : accessible
                            ? "border-transparent bg-slate-50 hover:bg-slate-100"
                            : "cursor-not-allowed border-transparent bg-slate-100 text-muted-foreground opacity-60",
                      )}
                      onClick={() => switchSection(section.id)}
                    >
                      <span className="font-medium">{section.shortLabel}</span>
                      <span
                        className={cn(
                          "rounded-full px-1 py-0.5 text-[10px] font-medium sm:text-xs",
                          SECTION_STATUS_BADGE_CLASS[sectionStatus],
                        )}
                      >
                        {getSectionStatusLabel(sectionStatus)}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
                {(["news", "image"] as Module4MaterialKind[]).map(kind => (
                  <Button
                    key={kind}
                    type="button"
                    size="sm"
                    variant={cardKind === kind ? "default" : "outline"}
                    onClick={() => {
                      onCardKindChange(kind)
                      setActiveSectionId("material")
                    }}
                  >
                    {getLesson4CardLabel(kind)}
                    {(kind === "news" ? newsConfirmed : imageConfirmed) ? " · 已确认" : " · 待确认"}
                  </Button>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {allSectionsPass
                ? "本题卡四段均为通过，核对内容后直接确认即可，无需填写修改说明。"
                : "每次只编辑一项；有必改反馈的分项需先修改并标记完成，才能进入下一项。"}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <V2RevisionSectionEditor
              sectionId={activeSectionId}
              card={card}
              sectionDecisions={sectionDecisions}
              locked={confirmed}
              resolveNote={resolveNote}
              onResolveNoteChange={onResolveNoteChange}
              onResolveDecision={onResolveDecision}
              onUnresolveDecision={onUnresolveDecision}
              onChange={onCardChange}
            />
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t bg-slate-50/80 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={activeSectionIndex === 0} onClick={goPrevSection}>
                上一项
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeSectionIndex >= V2_REVISION_SECTIONS.length - 1 || currentBlocking}
                onClick={goNextSection}
              >
                下一项
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!confirmed && (
                <>
                  {!readiness.ready && (
                    <p className="max-w-[18rem] text-right text-[11px] text-muted-foreground">
                      {readiness.unresolvedDecisionIds.length > 0
                        ? "还有必改反馈未标记完成"
                        : readiness.missing.length > 0
                          ? `缺少：${readiness.missing.join("、")}`
                          : "请完成全部必填项"}
                    </p>
                  )}
                  <Button type="button" size="sm" disabled={!readiness.ready} onClick={onConfirmCard}>
                    确认这张题卡为 V2
                  </Button>
                </>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!step3Complete}
                onClick={onEnterStep4}
              >
                进入第 4 关
              </Button>
            </div>
          </div>
        </section>

        <V2RevisionAdviceCard
          cardKind={cardKind}
          sectionId={activeSectionId}
          cardFeedback={cardFeedback}
          decisions={decisions}
          authorRevisionReply={card.revision.summary}
          onAuthorRevisionReplyChange={updateAuthorReply}
          requiresRevisionSummary={!allSectionsPass}
        />
      </div>
    </div>
  )
}
