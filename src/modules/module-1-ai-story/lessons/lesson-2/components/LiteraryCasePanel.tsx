/**
 * 文件说明：模块 1 课时 2 课堂文学案例阅读组件。
 * 职责：展示标题、背景、原文/教学译文、配图、观察问题、可折叠讲解与出处。
 * 更新触发：案例展示结构、插图交互或讲解折叠交互变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/utils/cn"
import { MODULE1_LESSON2_PAGES } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import {
  isSafeHttpUrl,
  type Module1LiteraryCase,
} from "@/modules/module-1-ai-story/constants/literary-cases"

interface LiteraryCasePanelProps {
  literaryCase: Module1LiteraryCase
  selected: boolean
  onSelect: () => void
}

export function LiteraryCasePanel({ literaryCase, selected, onSelect }: LiteraryCasePanelProps) {
  const [showGuide, setShowGuide] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const sourceUrls = [literaryCase.source.url, literaryCase.source.stableUrl, literaryCase.source.catalogUrl]
    .filter((url): url is string => typeof url === "string" && isSafeHttpUrl(url))

  return (
    <article
      className={cn(
        "space-y-3 rounded-xl border p-4",
        selected ? "border-primary bg-primary/5" : "bg-background",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" className="text-left" onClick={onSelect}>
          <h3 className="text-base font-semibold">{literaryCase.cardTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {literaryCase.author} · {literaryCase.teachingRole}
          </p>
        </button>
        <Button type="button" size="sm" variant={selected ? "default" : "outline"} onClick={onSelect}>
          {selected ? "当前观察片段" : "选择这个片段"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">观察重点：{literaryCase.focus}</p>
      <p className="text-sm leading-relaxed">{literaryCase.background}</p>
      <p className="text-xs font-medium text-primary">{literaryCase.excerptLabel}</p>
      <blockquote className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">
        {literaryCase.excerpt}
      </blockquote>
      <button type="button" className="block w-full" onClick={() => setShowImage(true)}>
        <img
          src={literaryCase.illustrationSrc}
          alt={literaryCase.illustrationAlt}
          className="aspect-[3/2] w-full rounded-lg object-cover"
        />
      </button>
      <p className="text-xs text-muted-foreground">{MODULE1_LESSON2_PAGES.step1.hints[1]}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setShowGuide(current => !current)}>
          {showGuide ? MODULE1_LESSON2_PAGES.step1.buttons[2] : MODULE1_LESSON2_PAGES.step1.buttons[1]}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowSource(current => !current)}>
          {showSource ? "收起出处与版本说明" : "出处与版本说明"}
        </Button>
      </div>
      {showGuide && (
        <div className="space-y-3 rounded-lg border bg-background p-3 text-sm leading-relaxed">
          {literaryCase.questions.map(item => (
            <section key={item.question} className="space-y-1">
              <p className="font-medium">{item.question}</p>
              <p>{item.reference}</p>
              <p className="text-xs text-muted-foreground">文本依据：{item.evidence.join("；")}</p>
            </section>
          ))}
          <section>
            <p className="font-medium">可以借鉴的写法</p>
            {literaryCase.writingMoves.map(move => (
              <p key={move.name}>{move.name}：{move.instruction}</p>
            ))}
            <p className="text-muted-foreground">{literaryCase.boundary}</p>
            <p>{literaryCase.boardSummary}</p>
          </section>
          <section>
            <p className="font-medium">词语帮助</p>
            {literaryCase.glossary.map(item => (
              <p key={item.word}><strong>{item.word}</strong>：{item.meaning}</p>
            ))}
          </section>
        </div>
      )}
      {showSource && (
        <div className="space-y-1 rounded-lg border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          <p>{literaryCase.source.title}</p>
          <p>{literaryCase.source.version}</p>
          <p>{literaryCase.source.translationNote}</p>
          <p>{literaryCase.source.editorialNote}</p>
          <p>{literaryCase.source.publicDomainNote}</p>
          <p>核对日期：{literaryCase.source.checkedOn}</p>
          {sourceUrls.map(url => (
            <p key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {url}
              </a>
            </p>
          ))}
        </div>
      )}
      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{literaryCase.illustrationAlt}</DialogTitle>
          </DialogHeader>
          <img src={literaryCase.illustrationSrc} alt={literaryCase.illustrationAlt} className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </article>
  )
}
