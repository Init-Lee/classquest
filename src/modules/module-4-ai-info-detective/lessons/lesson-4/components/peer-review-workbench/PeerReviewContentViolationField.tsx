/**
 * 文件说明：模块 4 课时 4 互审单卡内容违规判定字段。
 * 职责：收集当前题卡是否存在不适合课堂传播内容的判定与说明，并在字段下方展示红色提示。
 * 更新触发：违规判定文案、分卡 reviewJson.cards[].contentViolation 契约或 fieldKey 变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { Module4MaterialKind } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewModerationByField } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local"
import { PeerReviewFieldIssueBadges } from "./PeerReviewModerationTags"

const CARD_LABEL: Record<Module4MaterialKind, string> = {
  news: "新闻题卡",
  image: "图片题卡",
}

export function PeerReviewContentViolationField({
  activeKind,
  value,
  note,
  onChange,
  fieldErrors,
  moderationByField,
}: {
  activeKind: Module4MaterialKind
  value: boolean | null
  note: string
  onChange: (value: boolean, note: string) => void
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>
  moderationByField: Lesson4ReviewModerationByField
}) {
  const violationFieldKey = buildReviewFieldKey(activeKind, "contentViolation")
  const noteFieldKey = buildReviewFieldKey(activeKind, "contentViolationNote")

  return (
    <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/50 p-3">
      <p className="text-sm font-medium">{CARD_LABEL[activeKind]} · 内容违规</p>
      <p className="text-xs text-muted-foreground">
        本题卡是否存在不适合课堂传播、隐私泄露或攻击性内容？（原「安全」维度在此单独判定。）
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={value === false ? "default" : "outline"}
          onClick={() => onChange(false, "")}
        >
          未发现违规
        </Button>
        <Button
          type="button"
          variant={value === true ? "destructive" : "outline"}
          onClick={() => onChange(true, note)}
        >
          存在违规内容
        </Button>
      </div>
      <PeerReviewFieldIssueBadges
        fieldKey={violationFieldKey}
        fieldErrors={fieldErrors}
        moderationByField={moderationByField}
      />
      {value === true && (
        <div className="space-y-1 pt-1">
          <label className="text-sm font-medium" htmlFor={`peer-review-content-violation-note-${activeKind}`}>
            违规说明 <span className="text-destructive">*</span>
          </label>
          <Input
            id={`peer-review-content-violation-note-${activeKind}`}
            placeholder="简要说明违规类型或具体位置（必填）。"
            value={note}
            onChange={event => onChange(true, event.target.value)}
          />
          <PeerReviewFieldIssueBadges
            fieldKey={noteFieldKey}
            fieldErrors={fieldErrors}
            moderationByField={moderationByField}
          />
        </div>
      )}
    </div>
  )
}
