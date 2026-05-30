/**
 * 文件说明：模块 4 课时 4 互审评价右栏面板。
 * 职责：工作台右栏常驻展示当前 Tab 题卡的量规、该卡总体建议与内容违规；字段级红色提示贴在输入框下方。
 * 更新触发：量规维度交互、分卡总体建议/违规或 reviewJson.cards 字段变化时，需要同步更新本文件。
 */

import type {
  Module4Lesson4ReviewCardFeedback,
  Module4Lesson4ReviewJson,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewModerationByField } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local"
import { PeerReviewRubricPanel } from "../PeerReviewRubricPanel"
import { Textarea } from "@/shared/ui/textarea"
import { PeerReviewContentViolationField } from "./PeerReviewContentViolationField"
import { PeerReviewFieldIssueBadges } from "./PeerReviewModerationTags"

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

export function PeerReviewEvaluationPanel({
  reviewJson,
  activeKind,
  onActiveKindChange: _onActiveKindChange,
  onReviewJsonChange,
  trialSubmittedForActive = false,
  fieldErrors,
  moderationByField,
}: {
  reviewJson: Module4Lesson4ReviewJson
  activeKind: Module4MaterialKind
  onActiveKindChange: (kind: Module4MaterialKind) => void
  onReviewJsonChange: (reviewJson: Module4Lesson4ReviewJson) => void
  /** 当前 Tab 题卡是否已在左栏完成试答提交。 */
  trialSubmittedForActive?: boolean
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>
  moderationByField: Lesson4ReviewModerationByField
}) {
  const activeFeedback = reviewJson.cards[activeKind]
  const overallFieldKey = buildReviewFieldKey(activeKind, "overallComment")

  const updateActiveFeedback = (patch: Partial<Module4Lesson4ReviewCardFeedback>) => {
    onReviewJsonChange({
      ...reviewJson,
      cards: {
        ...reviewJson.cards,
        [activeKind]: {
          ...activeFeedback,
          ...patch,
        },
      },
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="shrink-0 text-sm font-semibold tracking-wide text-primary">审查要记录的内容</p>
        <p className="mt-1 text-xs text-muted-foreground">
          当前填写 {CARD_LABEL[activeKind]}：各维度档位与原因、本题卡总体建议与内容违规均在本栏；左侧仅负责试答与对照作者解析。
        </p>
        {!trialSubmittedForActive && (
          <p className="mt-2 text-xs text-amber-800">
            建议先完成左侧本题卡试答；本栏始终可填写，提交本卡审查前须完成试答与全部评价项。
          </p>
        )}
        {activeFeedback.approved && (
          <p className="mt-2 text-xs text-green-800">
            {CARD_LABEL[activeKind]}审查已通过；若修改内容需重新提交本卡审查。
          </p>
        )}
      </div>
      <PeerReviewRubricPanel
        feedback={activeFeedback}
        activeKind={activeKind}
        onChange={updateActiveFeedback}
        fieldErrors={fieldErrors}
        moderationByField={moderationByField}
      />
      <div className="space-y-2 border-t pt-4">
        <p className="text-sm font-medium">{CARD_LABEL[activeKind]} · 总体建议</p>
        <Textarea
          rows={3}
          placeholder={`概括${CARD_LABEL[activeKind]}最值得保留的地方，以及进入 V2 前最需要改的一点。`}
          value={activeFeedback.overallComment}
          onChange={event => updateActiveFeedback({ overallComment: event.target.value })}
        />
        <PeerReviewFieldIssueBadges
          fieldKey={overallFieldKey}
          fieldErrors={fieldErrors}
          moderationByField={moderationByField}
        />
      </div>
      <PeerReviewContentViolationField
        activeKind={activeKind}
        value={activeFeedback.contentViolation}
        note={activeFeedback.contentViolationNote}
        onChange={(contentViolation, contentViolationNote) =>
          updateActiveFeedback({ contentViolation, contentViolationNote })
        }
        fieldErrors={fieldErrors}
        moderationByField={moderationByField}
      />
    </div>
  )
}
