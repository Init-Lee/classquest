/**
 * 文件说明：模块 1 课时 2 课堂文学案例全文阅读面板。
 * 职责：在详情弹窗内以左文右图展示背景、原文/教学译文与窄配图；讲解与出处用页签替换主区，不向下堆成长页。
 * 更新触发：案例详情结构、横向图文比例、页签分段或插图展示方式变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { MODULE1_LESSON2_PAGES } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import {
  isSafeHttpUrl,
  type Module1LiteraryCase,
} from "@/modules/module-1-ai-story/constants/literary-cases"

type CaseDetailPane = "excerpt" | "guide" | "source"

interface LiteraryCasePanelProps {
  literaryCase: Module1LiteraryCase
}

export function LiteraryCasePanel({ literaryCase }: LiteraryCasePanelProps) {
  const [pane, setPane] = useState<CaseDetailPane>("excerpt")
  const sourceUrls = [literaryCase.source.url, literaryCase.source.stableUrl, literaryCase.source.catalogUrl]
    .filter((url): url is string => typeof url === "string" && isSafeHttpUrl(url))

  return (
    <article className="grid min-h-0 grid-cols-1 gap-4 md:h-full md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <p className="shrink-0 text-sm text-muted-foreground">观察重点：{literaryCase.focus}</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={pane === "excerpt" ? "default" : "outline"}
            aria-pressed={pane === "excerpt"}
            onClick={() => setPane("excerpt")}
          >
            原文
          </Button>
          <Button
            type="button"
            size="sm"
            variant={pane === "guide" ? "default" : "outline"}
            aria-pressed={pane === "guide"}
            onClick={() => setPane("guide")}
          >
            {MODULE1_LESSON2_PAGES.step1.buttons[1]}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={pane === "source" ? "default" : "outline"}
            aria-pressed={pane === "source"}
            onClick={() => setPane("source")}
          >
            出处与版本说明
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {pane === "excerpt" && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">{literaryCase.background}</p>
              <p className="text-xs font-medium text-primary">{literaryCase.excerptLabel}</p>
              <blockquote className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">
                {literaryCase.excerpt}
              </blockquote>
            </div>
          )}
          {pane === "guide" && (
            <div className="space-y-2.5 rounded-lg border bg-background p-3 text-sm leading-relaxed">
              {literaryCase.questions.map(item => (
                <section key={item.question} className="space-y-1">
                  <p className="font-medium">{item.question}</p>
                  <p>{item.reference}</p>
                  <p className="text-xs text-muted-foreground">文本依据：{item.evidence.join("；")}</p>
                </section>
              ))}
              <section className="space-y-1">
                <p className="font-medium">可以借鉴的写法</p>
                {literaryCase.writingMoves.map(move => (
                  <p key={move.name}>{move.name}：{move.instruction}</p>
                ))}
                <p className="text-muted-foreground">{literaryCase.boundary}</p>
                <p>{literaryCase.boardSummary}</p>
              </section>
              <section className="space-y-1">
                <p className="font-medium">词语帮助</p>
                {literaryCase.glossary.map(item => (
                  <p key={item.word}><strong>{item.word}</strong>：{item.meaning}</p>
                ))}
              </section>
            </div>
          )}
          {pane === "source" && (
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
        </div>
      </div>
      <aside className="flex shrink-0 flex-col gap-1.5 md:w-[280px]">
        <img
          src={literaryCase.illustrationSrc}
          alt={literaryCase.illustrationAlt}
          className="aspect-[3/2] w-full max-h-44 rounded-lg object-cover md:max-h-[240px]"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {MODULE1_LESSON2_PAGES.step1.hints[1]}
        </p>
      </aside>
    </article>
  )
}
