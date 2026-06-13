/**
 * 文件说明：模块 4 课时 6 公共挑战题卡组件。
 * 职责：展示未作答公共挑战题目的素材、题干与选项，并把用户选择交给 Shell 提交；答前不显示答案、解析、来源或作者信息。
 * 更新触发：current question DTO、题卡素材字段、选项交互、答前隐私展示规则或公共挑战视觉样式变化时，需要同步更新本文件。
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
import { cn } from "@/shared/utils/cn"
import type { PublicChallengeCurrentQuestion } from "@/modules/module-4-ai-info-detective/api/lesson6-types"

function getKindLabel(kind: PublicChallengeCurrentQuestion["kind"]): string {
  if (kind === "news") return "新闻题卡"
  if (kind === "image") return "图片题卡"
  return "公共题卡"
}

function getMaterialTitle(question: PublicChallengeCurrentQuestion): string {
  const title = question.material.titleOrName
  return typeof title === "string" && title.trim()
    ? title.trim()
    : getKindLabel(question.kind)
}

export function PublicChallengeQuestionCard({
  question,
  selectedOptionKey,
  disabled,
  submitting,
  error,
  onSelect,
  onSubmit,
}: {
  question: PublicChallengeCurrentQuestion
  selectedOptionKey: string
  disabled: boolean
  submitting: boolean
  error: string
  onSelect: (optionKey: string) => void
  onSubmit: () => void
}) {
  const asset = question.material.asset
  const assetAlt = asset?.alt || asset?.title || getMaterialTitle(question)
  const options = question.task.options ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              第 {question.orderIndex ?? question.answeredCount + 1} 题 · {getMaterialTitle(question)}
            </CardTitle>
            <CardDescription>
              先独立判断，再提交；提交后才会看到正解、解析与来源摘要。
            </CardDescription>
          </div>
          <Badge variant={question.kind === "image" ? "warning" : "secondary"}>
            {getKindLabel(question.kind)}
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
                        title={asset?.title || getMaterialTitle(question)}
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
              {question.kind === "image" ? "本题暂未返回图片数据，请刷新公共挑战后重试。" : "新闻题卡暂无图片素材，请阅读下方文字说明。"}
            </div>
          )}
          <h3 className="mt-4 text-base font-semibold">{getMaterialTitle(question)}</h3>
          {typeof question.material.displayNote === "string" && question.material.displayNote.trim() && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.material.displayNote.trim()}</p>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-primary">你的判断</p>
          <p className="rounded-xl bg-muted/30 p-4 text-base font-semibold leading-7">
            {question.task.prompt || question.task.question || "本题暂未返回题干，请刷新公共挑战后重试。"}
          </p>
          <div className="space-y-2">
            {options.map(option => {
              const optionKey = option.key ?? option.label ?? ""
              const selected = selectedOptionKey === optionKey
              return (
                <button
                  key={`${question.runItemId}-${optionKey}`}
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
            <p className="text-xs text-muted-foreground">答案已提交，请在下方查看揭示后进入下一题。</p>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
