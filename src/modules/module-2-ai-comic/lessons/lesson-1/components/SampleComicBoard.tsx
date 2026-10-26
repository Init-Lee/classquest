/**
 * 文件说明：课时 1《关灯这件事》四格样例展示。
 * 职责：先展示四格整页和独立文字层，再展示始终可见的一次修改图文；四张四格图都出现后才通知页面可以记“看过样例”。修改图不参与这一记号。
 * 更新触发：四格版式、「看这一格」按钮外观、一次修改的图文比例或标签变化时，需要同步更新本文件。职责顺序不在本组件，而在第 2 关右侧滑出知识栏。
 */

import { useEffect, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { SampleFigure } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleFigure"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import {
  guanDengPartText,
  type GuanDengSample,
} from "@/modules/module-2-ai-comic/lessons/lesson-1/sample/load-guan-deng-sample"

export function SampleComicBoard({
  sample,
  onPanelsReady,
}: {
  sample: GuanDengSample
  onPanelsReady?: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<string[]>([])
  const [missing, setMissing] = useState<string[]>([])
  const readyRef = useRef(onPanelsReady)
  const notifiedRef = useRef(false)
  const openPanel = sample.manifest.panels.find(panel => panel.id === openId) ?? null

  useEffect(() => {
    readyRef.current = onPanelsReady
  }, [onPanelsReady])

  useEffect(() => {
    if (notifiedRef.current || missing.length > 0) return
    const needed = sample.manifest.panels.map(panel => panel.image)
    if (needed.every(file => loaded.includes(file))) {
      notifiedRef.current = true
      readyRef.current?.()
    }
  }, [loaded, missing.length, sample.manifest.panels])

  const markLoaded = (file: string) => {
    setLoaded(current => current.includes(file) ? current : [...current, file])
  }
  const markMissing = (file: string) => {
    setMissing(current => current.includes(file) ? current : [...current, file])
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="min-w-0 space-y-3" aria-label="四格整页">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">《{sample.manifest.title}》</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">教师虚构示例</span>
        </div>
        {missing.length > 0 && <SampleMissingNotice message="有样例图片没有读到，这一页还不能算看完。" missing={missing} />}
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          {sample.manifest.panels.map(panel => {
            const selected = openId === panel.id
            return (
              <article key={panel.id} className={`min-w-0 rounded-lg border p-2 ${selected ? "ring-2 ring-primary" : ""}`}>
                <p className="mb-1 text-sm font-medium">{panel.label}</p>
                <SampleFigure
                  sample={sample}
                  file={panel.image}
                  alt={`《${sample.manifest.title}》${panel.label}：${panel.caption}`}
                  onLoad={markLoaded}
                  onMissing={markMissing}
                />
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{panel.caption}</p>
                {/* 实色主按钮，和上方画面说明拉开 */}
                <Button
                  type="button"
                  variant={selected ? "outline" : "default"}
                  size="sm"
                  className={selected
                    ? "mt-2 border-2 border-primary font-semibold text-primary"
                    : "mt-2 border-2 border-primary font-semibold shadow-sm"}
                  aria-expanded={selected}
                  onClick={() => setOpenId(current => current === panel.id ? null : panel.id)}
                >
                  {selected ? "收起这一格" : "看这一格"}
                </Button>
              </article>
            )
          })}
        </div>
        {openPanel && (
          <section className="space-y-3 rounded-lg border bg-muted/30 p-4" aria-live="polite">
            <h3 className="text-sm font-semibold">{openPanel.label} · 原文对照</h3>
            <div>
              <p className="text-xs font-medium text-muted-foreground">这一段原文</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{guanDengPartText(sample, openPanel.sourcePart)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">画面句</p>
              <p className="mt-1 text-sm leading-relaxed">{openPanel.sentence}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">取舍</p>
              <p className="mt-1 text-sm leading-relaxed">{openPanel.choice}</p>
            </div>
          </section>
        )}
      </section>

      {/* 始终可见。修改图不调用 onMissing，避免缺图时改变“看过四格”的完成记号。 */}
      <section className="min-w-0 space-y-3" aria-label="一次修改">
        <h2 className="text-xl font-semibold">一次修改</h2>
        <div className="grid min-w-0 items-start gap-4 rounded-lg border p-4 md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium">修改前</p>
              <SampleFigure
                sample={sample}
                file={sample.manifest.revision.before}
                alt={`${sample.manifest.revision.label}：修改前`}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium">修改后</p>
              <SampleFigure
                sample={sample}
                file={sample.manifest.revision.after}
                alt={`${sample.manifest.revision.label}：修改后`}
              />
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              {sample.manifest.revision.label}
            </p>
            <p className="text-sm leading-relaxed"><span className="font-medium">问题：</span>{sample.problem}</p>
            <p className="text-sm leading-relaxed"><span className="font-medium">改了什么：</span>{sample.proposedChange}</p>
            <p className="text-sm leading-relaxed"><span className="font-medium">检查结果：</span>{sample.judgment}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{sample.productionDisclosure}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{sample.secondIterationNote}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{sample.readerFeedbackNote}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
