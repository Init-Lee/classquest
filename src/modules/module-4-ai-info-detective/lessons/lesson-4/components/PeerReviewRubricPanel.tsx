/**
 * 文件说明：模块 4 课时 4 互审单卡量规评价面板。
 * 职责：为当前题卡各评价维度展示通过/小修/重改 radio、必填原因，并在原因框下方展示字段级红色提示。
 * 更新触发：量规维度、档位文案、fieldKey 映射或 reviewJson.cards[].rubric 字段变化时，需要同步更新本文件。
 */

import { useState } from "react"
import type {
  Lesson4ReviewRubricDimensionKey,
  Lesson4ReviewRubricLevel,
  Module4Lesson4ReviewCardFeedback,
  Module4MaterialKind,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/utils/cn"
import { buildReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewFieldKey } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/collect-lesson4-review-texts"
import type { Lesson4ReviewModerationByField } from "@/modules/module-4-ai-info-detective/lessons/lesson-4/utils/lesson4-review-moderation-local"
import { LESSON4_REVIEW_CRITERIA, LESSON4_VERDICT_LEVELS } from "../data/lesson4-rubric"
import { PeerReviewFieldIssueBadges } from "./peer-review-workbench/PeerReviewModerationTags"

export function PeerReviewRubricPanel({
  feedback,
  activeKind,
  onChange,
  fieldErrors,
  moderationByField,
}: {
  feedback: Module4Lesson4ReviewCardFeedback
  /** 用于 radio name 去重（新闻/图片 Tab 切换）。 */
  activeKind: Module4MaterialKind
  onChange: (patch: Partial<Module4Lesson4ReviewCardFeedback>) => void
  fieldErrors: Partial<Record<Lesson4ReviewFieldKey, string>>
  moderationByField: Lesson4ReviewModerationByField
}) {
  const [helpOpen, setHelpOpen] = useState(false)

  const updateDimension = (
    area: Lesson4ReviewRubricDimensionKey,
    patch: Partial<Module4Lesson4ReviewCardFeedback["rubric"][Lesson4ReviewRubricDimensionKey]>,
  ) => {
    onChange({
      rubric: {
        ...feedback.rubric,
        [area]: {
          ...feedback.rubric[area],
          ...patch,
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">本题卡评价维度</p>
          <p className="text-xs text-muted-foreground">
            每个维度独立选择通过 / 小修 / 重改，并填写原因；隐私与课堂适宜性在底部「内容违规」单独判定。
          </p>
        </div>
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs">
              评价标准说明
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>互审评价标准</DialogTitle>
              <DialogDescription>
                按素材、任务、解析、来源四个维度分别给出档位与原因；不适合课堂传播的内容在底部「内容违规」单独判定。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-2 font-medium">评价维度</p>
                <ul className="space-y-2">
                  {LESSON4_REVIEW_CRITERIA.map(item => (
                    <li key={item.area}>
                      <span className="font-medium">{item.title}：</span>
                      <span className="text-muted-foreground">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-medium">档位说明</p>
                <ul className="space-y-2">
                  {LESSON4_VERDICT_LEVELS.map(level => (
                    <li key={level.level}>
                      <span className="font-medium">{level.label}：</span>
                      <span className="text-muted-foreground">{level.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {LESSON4_REVIEW_CRITERIA.map(criterion => {
        const entry = feedback.rubric[criterion.area]
        const radioName = `peer-review-rubric-${activeKind}-${criterion.area}`
        const reasonFieldKey = buildReviewFieldKey(activeKind, `${criterion.area}.reason`)
        return (
          <div key={criterion.area} className="space-y-2 rounded-lg border border-border/80 p-3">
            <div>
              <p className="text-sm font-medium">{criterion.title}</p>
              <p className="text-xs text-muted-foreground">{criterion.description}</p>
            </div>
            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-2"
              role="radiogroup"
              aria-label={`${criterion.title}评价档位`}
            >
              {LESSON4_VERDICT_LEVELS.map(level => (
                <label
                  key={level.level}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 text-sm",
                    entry.level === level.level ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={level.level}
                    checked={entry.level === level.level}
                    onChange={() => updateDimension(criterion.area, { level: level.level as Lesson4ReviewRubricLevel })}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>{level.label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor={`peer-review-rubric-reason-${activeKind}-${criterion.area}`}>
                原因 <span className="text-destructive">*</span>
              </label>
              <Input
                id={`peer-review-rubric-reason-${activeKind}-${criterion.area}`}
                placeholder={`简要说明「${criterion.title}」的评价理由（必填）。`}
                value={entry.reason}
                onChange={event => updateDimension(criterion.area, { reason: event.target.value })}
              />
              <PeerReviewFieldIssueBadges
                fieldKey={reasonFieldKey}
                fieldErrors={fieldErrors}
                moderationByField={moderationByField}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
