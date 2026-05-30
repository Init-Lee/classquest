/**
 * 文件说明：模块 4 课时 4 同伴互审工作台编排组件。
 * 职责：固定左右分栏；顶栏 Tab 分卡编辑；分卡提交通过后解锁下一张；字段级红色提示在右栏输入框下方。
 * 更新触发：互审分栏布局、分卡提交流程、reviewJson 契约或试答/重新答题状态变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import type {
  Module4Lesson3OptionKey,
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson4ReviewRequestJson } from "@/modules/module-4-ai-info-detective/api/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { PeerReviewEvaluationPanel } from "./PeerReviewEvaluationPanel"
import type { Lesson4ReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewModerationByField } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local"
import { PeerReviewSubmitBar } from "./PeerReviewSubmitBar"
import { PeerReviewSelfTrialPanel, type PeerReviewTrialRecord } from "./PeerReviewSelfTrialPanel"
import { PeerReviewWorkbenchSplitLayout } from "./PeerReviewWorkbenchSplitLayout"

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

const CARD_ORDER: Module4MaterialKind[] = ["news", "image"]

function buildInitialTrialRecords(reviewJson: Module4Lesson4ReviewJson): Record<Module4MaterialKind, PeerReviewTrialRecord> {
  const buildOne = (kind: Module4MaterialKind): PeerReviewTrialRecord => {
    const trialAnswer = reviewJson.cards[kind].trialAnswer
    return {
      selectedOptionKey: trialAnswer,
      submitted: Boolean(trialAnswer),
      isCorrect: undefined,
    }
  }
  return { news: buildOne("news"), image: buildOne("image") }
}

function cardFeedbackContentChanged(
  prev: Module4Lesson4ReviewJson["cards"][Module4MaterialKind],
  next: Module4Lesson4ReviewJson["cards"][Module4MaterialKind],
): boolean {
  return JSON.stringify({ ...prev, approved: undefined }) !== JSON.stringify({ ...next, approved: undefined })
}

function clearApprovalIfChanged(
  prev: Module4Lesson4ReviewJson,
  next: Module4Lesson4ReviewJson,
): Module4Lesson4ReviewJson {
  const cards = { ...next.cards }
  for (const kind of CARD_ORDER) {
    if (cards[kind].approved && cardFeedbackContentChanged(prev.cards[kind], next.cards[kind])) {
      cards[kind] = { ...cards[kind], approved: undefined }
    }
  }
  return { ...next, cards }
}

export function PeerReviewWorkbench({
  requestJson,
  reviewJson,
  activeKind,
  onActiveKindChange,
  fieldErrors,
  validationMessage,
  cardSubmitSuccessMessage,
  aiModerating,
  aiUnavailableMessage,
  moderationByField,
  busy,
  onReviewJsonChange,
  onSubmitCard,
}: {
  requestJson: Lesson4ReviewRequestJson
  reviewJson: Module4Lesson4ReviewJson
  activeKind: Module4MaterialKind
  onActiveKindChange: (kind: Module4MaterialKind) => void
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>
  validationMessage: string
  cardSubmitSuccessMessage: string
  aiModerating: boolean
  aiUnavailableMessage: string
  moderationByField: Lesson4ReviewModerationByField
  busy: boolean
  onReviewJsonChange: (reviewJson: Module4Lesson4ReviewJson) => void
  onSubmitCard: (kind: Module4MaterialKind) => void
}) {
  const [trialRecords, setTrialRecords] = useState(() => buildInitialTrialRecords(reviewJson))

  useEffect(() => {
    setTrialRecords(buildInitialTrialRecords(reviewJson))
  }, [reviewJson.cards.news.trialAnswer, reviewJson.cards.image.trialAnswer])

  const card = requestJson.cards[activeKind]
  const record = trialRecords[activeKind]
  const bothTrialsSubmitted = trialRecords.news.submitted && trialRecords.image.submitted
  const newsApproved = Boolean(reviewJson.cards.news.approved)
  const imageApproved = Boolean(reviewJson.cards.image.approved)

  const updateRecord = (kind: Module4MaterialKind, patch: Partial<PeerReviewTrialRecord>) => {
    setTrialRecords(prev => ({
      ...prev,
      [kind]: { ...prev[kind], ...patch },
    }))
  }

  const handleReviewJsonChange = (next: Module4Lesson4ReviewJson) => {
    onReviewJsonChange(clearApprovalIfChanged(reviewJson, next))
  }

  const handleTrialAnswerChange = (kind: Module4MaterialKind, key: Module4Lesson3OptionKey) => {
    handleReviewJsonChange({
      ...reviewJson,
      cards: {
        ...reviewJson.cards,
        [kind]: {
          ...reviewJson.cards[kind],
          trialAnswer: key,
        },
      },
    })
  }

  const handleSubmitTrial = () => {
    if (!record.selectedOptionKey) return
    const correctKey = card.task.correctOptionKey
    const isCorrect = correctKey ? record.selectedOptionKey === correctKey : undefined
    updateRecord(activeKind, { submitted: true, isCorrect })
    handleTrialAnswerChange(activeKind, record.selectedOptionKey)
  }

  const handleRetakeTrial = () => {
    updateRecord(activeKind, {
      selectedOptionKey: undefined,
      submitted: false,
      isCorrect: undefined,
    })
    handleReviewJsonChange({
      ...reviewJson,
      cards: {
        ...reviewJson.cards,
        [activeKind]: {
          ...reviewJson.cards[activeKind],
          trialAnswer: undefined,
          approved: undefined,
        },
      },
    })
  }

  const canSwitchTo = (kind: Module4MaterialKind): boolean => {
    if (kind === "news") return true
    return newsApproved
  }

  const handleTabClick = (kind: Module4MaterialKind) => {
    if (!canSwitchTo(kind)) return
    onActiveKindChange(kind)
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="flex min-h-[32rem] flex-col gap-4 p-4">
        <div className="shrink-0">
          <p className="text-base font-semibold">互审工作台</p>
          <p className="text-xs text-muted-foreground">
            左栏试答题卡与作者解析，右栏填写当前题卡评价；请逐卡提交审查，两张均通过后在上方整体提交。
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {CARD_ORDER.map(kind => {
              const approved = Boolean(reviewJson.cards[kind].approved)
              const disabled = !canSwitchTo(kind)
              return (
                <Button
                  key={kind}
                  type="button"
                  size="sm"
                  variant={activeKind === kind ? "default" : "outline"}
                  disabled={disabled}
                  onClick={() => handleTabClick(kind)}
                >
                  {CARD_LABEL[kind]}
                  {approved ? " · 已通过" : trialRecords[kind].submitted ? " · 已试答" : ""}
                </Button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {bothTrialsSubmitted && <Badge variant="success">试答已完成</Badge>}
            {newsApproved && imageApproved && <Badge variant="success">双卡审查已通过</Badge>}
          </div>
        </div>

        {!newsApproved && activeKind === "news" && (
          <p className="text-xs text-muted-foreground">请先完成并提交新闻题卡审查，再填写图片题卡。</p>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <PeerReviewWorkbenchSplitLayout
            left={(
              <PeerReviewSelfTrialPanel
                card={card}
                record={record}
                onSelectOption={key => updateRecord(activeKind, { selectedOptionKey: key })}
                onSubmit={handleSubmitTrial}
                onRetake={handleRetakeTrial}
              />
            )}
            right={(
              <PeerReviewEvaluationPanel
                reviewJson={reviewJson}
                activeKind={activeKind}
                onActiveKindChange={onActiveKindChange}
                onReviewJsonChange={handleReviewJsonChange}
                trialSubmittedForActive={record.submitted}
                fieldErrors={fieldErrors}
                moderationByField={moderationByField}
              />
            )}
          />
        </div>

        <PeerReviewSubmitBar
          activeKind={activeKind}
          cardApproved={Boolean(reviewJson.cards[activeKind].approved)}
          validationMessage={validationMessage}
          cardSubmitSuccessMessage={cardSubmitSuccessMessage}
          aiModerating={aiModerating}
          aiUnavailableMessage={aiUnavailableMessage}
          busy={busy}
          onSubmitCard={onSubmitCard}
        />
      </CardContent>
    </Card>
  )
}
