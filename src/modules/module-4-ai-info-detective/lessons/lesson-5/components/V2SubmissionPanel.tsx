/**
 * 文件说明：模块 4 课时 5 V2 提交面板组件。
 * 职责：展示课时4 ready 包摘要、提交按钮、提交结果、课堂连接提示和进入 Step2 的入口，是 Step1 的主要交互面板。
 * 更新触发：Step1 提交文案、结果字段、ready 包摘要或错误展示方式变化时，需要同步更新本文件。
 */

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import type { Lesson5SubmitUiState, Lesson5ReadyPackage } from "../types"

export function V2SubmissionPanel({
  readyPackage,
  mode,
  state,
  disabled,
  onSubmit,
  onContinue,
}: {
  readyPackage: Lesson5ReadyPackage
  mode: "fixture" | "http"
  state: Lesson5SubmitUiState
  disabled: boolean
  onSubmit: () => void
  onContinue?: () => void
}) {
  const alreadySubmitted = state.status === "success"
  const newsTitle = readyPackage.cards.news.material.titleOrName || readyPackage.cards.news.task.prompt
  const imageTitle = readyPackage.cards.image.material.titleOrName || readyPackage.cards.image.task.prompt

  return (
    <Card>
      <CardHeader>
        <CardTitle>提交 V2 到班级题池</CardTitle>
        <CardDescription>
          当前模式：
          <span className="font-medium text-foreground">{mode === "http" ? "HTTP 后端" : "fixture 演示"}</span>
          。重复提交同一内容时，后端会返回幂等结果。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">新闻题卡</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium">{newsTitle}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              正确答案：
              {readyPackage.cards.news.task.correctOptionKey ?? "未填写"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">图片题卡</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium">{imageTitle}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              正确答案：
              {readyPackage.cards.image.task.correctOptionKey ?? "未填写"}
            </p>
          </div>
        </div>

        {state.message && (
          <div
            className={
              state.status === "error"
                ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                : "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            }
          >
            {state.message}
          </div>
        )}

        {state.response && (
          <div className="grid gap-3 md:grid-cols-2">
            {(["news", "image"] as const).map(kind => {
              const item = state.response?.items[kind]
              if (!item) return null
              return (
                <div key={kind} className="rounded-lg border p-4 text-sm">
                  <p className="font-medium">{kind === "news" ? "新闻题卡" : "图片题卡"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.deduped ? "本次命中同内容版本，已幂等复用。" : "本次生成新的 V2 版本。"}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onSubmit} disabled={disabled || state.status === "submitting"}>
            {state.status === "submitting" ? "提交中..." : alreadySubmitted ? "再次提交验证幂等" : "提交到班级题池"}
          </Button>
          {alreadySubmitted && onContinue && (
            <Button variant="outline" onClick={onContinue}>
              进入第 2 关
            </Button>
          )}
          <p className="text-xs text-muted-foreground">提交成功后，本地档案会记录课时5 Step1 完成状态。</p>
        </div>
      </CardContent>
    </Card>
  )
}
