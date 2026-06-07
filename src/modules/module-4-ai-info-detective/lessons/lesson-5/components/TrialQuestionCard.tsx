/**
 * 文件说明：模块 4 课时 5 试答题卡组件。
 * 职责：展示当前 assignment 的题材、题干与选项，并在 trial_open 阶段收集学生单题选择后交给 Step2 提交。
 * 更新触发：assignment DTO 展示字段、试答交互顺序、选项提交规则或 C5 学生端 UI 文案变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import type { Lesson5AssignmentDto } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import { cn } from "@/shared/utils/cn"

function getCardKindLabel(kind: Lesson5AssignmentDto["cardKind"]): string {
  return kind === "news" ? "新闻题卡" : "图片题卡"
}

function getMaterialTitle(assignment: Lesson5AssignmentDto): string {
  return assignment.material.titleOrName || assignment.itemShortName || getCardKindLabel(assignment.cardKind)
}

export function TrialQuestionCard({
  assignment,
  selectedOptionKey,
  disabled,
  submitting,
  error,
  onSelect,
  onSubmit,
}: {
  assignment: Lesson5AssignmentDto
  selectedOptionKey: string
  disabled: boolean
  submitting: boolean
  error: string
  onSelect: (optionKey: string) => void
  onSubmit: () => void
}) {
  const asset = assignment.material.asset
  const assetAlt = asset?.alt || asset?.title || assignment.material.titleOrName || getCardKindLabel(assignment.cardKind)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>第 {assignment.orderIndex} 题 · {getMaterialTitle(assignment)}</CardTitle>
            <CardDescription>
              先独立判断，再提交；提交后才会看到正解、解析与来源摘要。
            </CardDescription>
          </div>
          <Badge variant={assignment.cardKind === "news" ? "secondary" : "warning"}>
            {getCardKindLabel(assignment.cardKind)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border bg-slate-50/70 p-4">
          <p className="text-xs font-semibold tracking-wide text-primary">素材区</p>
          {asset?.dataUrl ? (
            <figure className="mt-3">
              <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl border bg-white">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group flex w-full cursor-zoom-in items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label={`放大查看${assetAlt}`}
                    >
                      <img
                        src={asset.dataUrl}
                        alt={assetAlt}
                        title={asset?.title || assignment.material.titleOrName || undefined}
                        className="max-h-72 w-full object-contain transition-opacity group-hover:opacity-90"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-[min(92vw,56rem)] overflow-y-auto border-none bg-transparent p-2 shadow-none">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{assetAlt}放大预览</DialogTitle>
                      <DialogDescription>查看本题图片素材原图，按 Esc 或关闭按钮可退出预览。</DialogDescription>
                    </DialogHeader>
                    <img
                      src={asset.dataUrl}
                      alt={`${assetAlt}原图预览`}
                      className="max-h-[85vh] w-full rounded-2xl bg-white object-contain shadow-2xl"
                    />
                  </DialogContent>
                </Dialog>
              </div>
              {(asset.name || asset.mimeType) && (
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  {[asset.name, asset.mimeType].filter(Boolean).join(" · ")}
                </figcaption>
              )}
            </figure>
          ) : (
            <div className="mt-3 flex min-h-56 items-center justify-center rounded-xl border border-dashed bg-white px-4 text-center text-sm text-muted-foreground">
              {assignment.cardKind === "image" ? "本题暂未返回图片数据，请记录题号并刷新课堂状态。" : "新闻题卡暂无图片素材，请阅读下方文字说明。"}
            </div>
          )}
          <h3 className="mt-4 text-base font-semibold">{getMaterialTitle(assignment)}</h3>
          {assignment.material.displayNote && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{assignment.material.displayNote}</p>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-primary">你的判断</p>
          <p className="rounded-xl bg-muted/30 p-4 text-base font-semibold leading-7">
            {assignment.task.prompt || assignment.task.question || "本题暂未返回题干，请刷新课堂状态。"}
          </p>
          <div className="space-y-2">
            {assignment.options.map(option => {
              const optionKey = option.key ?? option.label ?? ""
              const selected = selectedOptionKey === optionKey
              return (
                <button
                  key={`${assignment.assignmentId}-${optionKey}`}
                  type="button"
                  disabled={disabled || submitting}
                  onClick={() => onSelect(optionKey)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                    selected ? "border-slate-900 bg-slate-900 text-white" : "bg-white hover:bg-slate-50",
                  )}
                >
                  <span className="font-semibold">{option.key ? `${option.key}. ` : ""}</span>
                  {option.label ?? "未命名选项"}
                </button>
              )
            })}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full rounded-full" onClick={onSubmit} disabled={disabled || submitting || !selectedOptionKey}>
            {submitting ? "提交中..." : "提交答案并查看解析"}
          </Button>
          {disabled && (
            <p className="text-xs text-muted-foreground">答案已提交，请在下方查看揭示并完成快评。</p>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
