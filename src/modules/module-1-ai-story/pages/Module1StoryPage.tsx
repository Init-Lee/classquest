/**
 * 文件说明：模块 1「我的小说」作品页。
 * 职责：在 `/module/1/story` 只读展示上次整体确认的四段，段落固定带课时来源标签，并提供复制全文、下载 JSON 和返回修改；不是第 7 课。
 * 更新触发：解锁条件、确认版本展示、来源标签、复制范围或返回修改入口变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import { resolveModule1PortfolioPointer } from "@/modules/module-1-ai-story/app/lesson-registry"
import { MODULE1_LESSON6_NOVEL_UI } from "@/modules/module-1-ai-story/constants/lesson6-copy"
import { getCurrentModule1Lesson6Step } from "@/modules/module-1-ai-story/lessons/lesson-6/guards"
import { downloadModule1ContinuePackage } from "@/modules/module-1-ai-story/infra/persistence/serializers/continue-package"
import {
  buildModule1ConfirmedStoryCopyText,
  buildModule1ConfirmedStoryParts,
  module1StoryNeedsReview,
  resolveModule1StoryAccess,
} from "@/modules/module-1-ai-story/features/story/module1-story-access"
import { Module1StoryReading } from "@/modules/module-1-ai-story/features/story/Module1StoryReading"

export default function Module1StoryPage() {
  const { portfolio, loading, isTeacherMode, flushPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [copyState, setCopyState] = useState<"idle" | "success" | "fail">("idle")
  const [copyText, setCopyText] = useState("")

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">正在准备学习档案...</div>
  if (!portfolio) return null

  const access = resolveModule1StoryAccess(portfolio)
  const goContinue = () => {
    if (!portfolio.lesson5.completed) {
      const pointer = resolveModule1PortfolioPointer(portfolio)
      navigate(`/module/1/lesson/${pointer.lessonId}/step/${pointer.stepId}`)
      return
    }
    navigate(`/module/1/lesson/6/step/${getCurrentModule1Lesson6Step(portfolio.lesson6)}`)
  }

  if (access === "locked") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>{MODULE1_LESSON6_NOVEL_UI.lockedTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{MODULE1_LESSON6_NOVEL_UI.lockedBody}</p>
            <p className="text-muted-foreground">{MODULE1_LESSON6_NOVEL_UI.lockedHint}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={goContinue}>{MODULE1_LESSON6_NOVEL_UI.goLesson6}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/module/1")}>{MODULE1_LESSON6_NOVEL_UI.backArchive}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (access === "integrity" || !portfolio.lesson6.confirmedEdition) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader><CardTitle>{MODULE1_LESSON6_NOVEL_UI.integrityTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{MODULE1_LESSON6_NOVEL_UI.integrityBody}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={goContinue}>{MODULE1_LESSON6_NOVEL_UI.goLesson6}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/module/1")}>{MODULE1_LESSON6_NOVEL_UI.backArchive}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const edition = portfolio.lesson6.confirmedEdition
  const parts = buildModule1ConfirmedStoryParts(edition)
  const needsReview = module1StoryNeedsReview(portfolio)
  const copyFullText = async () => {
    const text = buildModule1ConfirmedStoryCopyText(edition)
    setCopyText(text)
    try {
      await navigator.clipboard.writeText(text)
      setCopyState("success")
    } catch (error) {
      console.error("[module1 story] copy failed", error)
      setCopyState("fail")
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{MODULE1_LESSON6_NOVEL_UI.title}</h1>
          {isTeacherMode && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{MODULE1_LESSON6_NOVEL_UI.demoBadge}</span>
          )}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {needsReview ? MODULE1_LESSON6_NOVEL_UI.reviewBadge : MODULE1_LESSON6_NOVEL_UI.confirmedBadge}
          </span>
        </div>
        {isTeacherMode && <p className="text-sm text-amber-900">{MODULE1_LESSON6_NOVEL_UI.demoHint}</p>}
        {needsReview && (
          <p className="text-sm text-amber-900">
            {MODULE1_LESSON6_NOVEL_UI.reviewNotice}{" "}
            <button type="button" className="underline" onClick={() => navigate("/module/1/lesson/6/step/4")}>
              {MODULE1_LESSON6_NOVEL_UI.reviewEnding}
            </button>
          </p>
        )}
      </div>
      <Module1StoryReading
        title={edition.storyTitle}
        untitledLabel={MODULE1_LESSON6_NOVEL_UI.noTitle}
        parts={parts}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setEditOpen(open => !open)}>{MODULE1_LESSON6_NOVEL_UI.edit}</Button>
        <Button type="button" variant="outline" onClick={() => void copyFullText()}>{MODULE1_LESSON6_NOVEL_UI.copy}</Button>
        {!isTeacherMode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void flushPortfolio().then(latest => {
                if (latest) downloadModule1ContinuePackage(latest)
              })
            }}
          >
            {MODULE1_LESSON6_NOVEL_UI.save}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => navigate("/module/1")}>{MODULE1_LESSON6_NOVEL_UI.backArchive}</Button>
      </div>
      {copyState === "success" && <p className="text-sm text-green-700">{MODULE1_LESSON6_NOVEL_UI.copySuccess}</p>}
      {copyState === "fail" && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{MODULE1_LESSON6_NOVEL_UI.copyFail}</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">{copyText}</pre>
        </div>
      )}
      {editOpen && (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <Button type="button" variant="outline" onClick={() => navigate("/module/1/lesson/3/step/4")}>{MODULE1_LESSON6_NOVEL_UI.editOpening}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/module/1/lesson/4/step/4")}>{MODULE1_LESSON6_NOVEL_UI.editDevelopment}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/module/1/lesson/5/step/4")}>{MODULE1_LESSON6_NOVEL_UI.editTurn}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/module/1/lesson/6/step/4")}>{MODULE1_LESSON6_NOVEL_UI.editEnding}</Button>
        </div>
      )}
    </div>
  )
}
