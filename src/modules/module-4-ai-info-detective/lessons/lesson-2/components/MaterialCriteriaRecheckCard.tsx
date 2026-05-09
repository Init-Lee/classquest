/**
 * 文件说明：模块 4 课时 2 素材四关复判卡片。
 * 职责：在新闻和图片工作台开头呈现学生个人素材的四关标准复判，并记录复判后的继续、补充或更换状态。
 * 更新触发：第 3/4 关复判流程、状态选项、四关标准文案或个人素材进入工作台条件变化时，需要同步更新本文件。
 */

import type {
  Module4MaterialKind,
  Module4MaterialScreeningRecord,
  Module4PostCriteriaStatus,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  LESSON2_CRITERIA,
  LESSON2_STATUS_LABELS,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"
import { MaterialPreviewCard } from "./MaterialPreviewCard"

const POST_STATUSES: Module4PostCriteriaStatus[] = ["usable", "need_fix", "need_replace"]

interface MaterialCriteriaRecheckCardProps {
  kind: Module4MaterialKind
  record: Module4MaterialScreeningRecord
  onStatusChange: (status: Module4PostCriteriaStatus) => void
}

export function MaterialCriteriaRecheckCard({
  kind,
  record,
  onStatusChange,
}: MaterialCriteriaRecheckCardProps) {
  const isNews = kind === "news"
  const title = isNews ? "新闻素材复判" : "图片素材复判"
  const description = isNews
    ? "先用四关标准检查你自己的新闻素材，再进入新闻素材工作台补全来源、疑点和交流记录。"
    : "先用四关标准检查你自己的图片素材，再进入图片素材工作台补全来源、疑点和交流记录。"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        <MaterialPreviewCard kind={kind} asset={record.asset} />
        <div className="grid gap-3 md:grid-cols-4">
          {LESSON2_CRITERIA.map((criterion, index) => (
            <div key={criterion.key} className="rounded-2xl border bg-muted/20 p-3 text-sm">
              <p className="font-semibold text-primary">{index + 1}. {criterion.title}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{criterion.description}</p>
            </div>
          ))}
        </div>
        {record.asset ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">按四关标准复判后，这份素材现在属于：</p>
            <div className="grid gap-3 md:grid-cols-3">
              {POST_STATUSES.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusChange(status)}
                  className={cn(
                    "rounded-2xl border p-3 text-left text-sm transition",
                    record.postCriteriaStatus === status
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "bg-white hover:border-primary/40",
                  )}
                >
                  {LESSON2_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            你还没有上传该类素材。请先在下面的工作台上传素材，再回到这里完成四关复判。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
