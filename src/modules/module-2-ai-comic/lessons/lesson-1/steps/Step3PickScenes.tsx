/**
 * 文件说明：课时 1 第 3 关「选出四个关键画面」。
 * 职责：让学生为起承转合各写一句画面，对照自己的原作，确认后写入选景；教师示例只展示，不填进输入框。
 * 更新触发：四句输入、原作对照、确认条件或连读预览变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import {
  computeModule2Lesson1Gates,
  confirmModule2Storyboard,
  setModule2SceneSentence,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import { MODULE2_FIELD_LIMITS } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import { Lesson1ContinueButton, Lesson1StepHeader } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-chrome"
import { commitLesson1Change } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-commit"
import { OriginalWorkPanel } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/OriginalWorkPanel"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import { useGuanDengSample } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/use-guan-deng-sample"
import { LESSON1_PARTS, LESSON1_SCENE_PROMPT } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"

export default function Step3PickScenes() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule2State()
  const sampleState = useGuanDengSample()
  const [exampleOpen, setExampleOpen] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  if (!portfolio) return null
  const source = portfolio.sourceSnapshot
  const gates = computeModule2Lesson1Gates(portfolio)
  const sentences = LESSON1_PARTS.map(part => portfolio.storyboard.frames[part.id].sceneSentence.trim()).filter(Boolean)
  const confirmed = portfolio.storyboard.confirmedAt !== null && !portfolio.lesson1.reviewNeeded.storyboard && gates.step3

  const confirm = async () => {
    setBusy(true)
    setError("")
    try {
      const failure = await commitLesson1Change(updatePortfolio, flushPortfolio, (current) => {
        const result = confirmModule2Storyboard(current, new Date().toISOString())
        if (!result.ok) return { portfolio: current, error: result.reason }
        return { portfolio: result.portfolio, error: "" }
      })
      if (failure) setError(failure)
    } catch {
      setError("确认还没有保存成功。四句还在，请重试。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <Lesson1StepHeader step={3} title="选出四个关键画面" lead="从你的小说里选出起、承、转、合四个能看见的时刻。每格只写一句。" />
      <p className="mb-4 text-sm font-medium">{LESSON1_SCENE_PROMPT}</p>
      {portfolio.lesson1.reviewNeeded.storyboard && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">四个画面需要对照当前小说重新确认。</p>
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="min-w-0 space-y-4">
          <Button type="button" variant="outline" onClick={() => setExampleOpen(true)}>看看教师示例</Button>
          {LESSON1_PARTS.map(part => (
            <section key={part.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor={`m2-scene-${part.id}`} className="text-base font-semibold">{part.label}</label>
                <p className="text-xs text-muted-foreground">{part.hint}</p>
              </div>
              <Textarea
                id={`m2-scene-${part.id}`}
                value={portfolio.storyboard.frames[part.id].sceneSentence}
                maxLength={MODULE2_FIELD_LIMITS.sceneSentence}
                placeholder={LESSON1_SCENE_PROMPT}
                onChange={event => updatePortfolio(current => setModule2SceneSentence(current, part.id, event.target.value, new Date().toISOString()))}
              />
            </section>
          ))}
          <section className="rounded-lg bg-muted/40 p-4" aria-label="把四句连起来读">
            <h2 className="text-sm font-semibold">把四句连起来读</h2>
            {sentences.length === 0
              ? <p className="mt-2 text-sm text-muted-foreground">写下画面后，这里会把四句连起来，方便你读一遍。这段预览不会另外保存。</p>
              : (
                <div className="mt-2 space-y-2 text-sm leading-relaxed">
                  {LESSON1_PARTS.map(part => {
                    const sentence = portfolio.storyboard.frames[part.id].sceneSentence.trim()
                    if (!sentence) return null
                    return <p key={part.id} className="whitespace-pre-wrap break-words"><span className="font-medium">{part.label}：</span>{sentence}</p>
                  })}
                </div>
              )}
            <p className="mt-3 text-xs text-muted-foreground">老师会和你一起看，这四句能不能让人想象出人物、地点和动作。</p>
          </section>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void confirm()} disabled={busy}>{busy ? "正在保存…" : "确认四个画面"}</Button>
            {confirmed && <p className="text-sm text-green-700">四个画面已确认。</p>}
          </div>
          <Lesson1ContinueButton
            enabled={gates.step3 && !busy}
            toStep={4}
            label="进入下一关"
            hint="四个画面都写好并确认后，才能进入下一关。"
          />
        </div>
        <div className="min-w-0 lg:sticky lg:top-[calc(var(--module2-sticky-stack-height,4rem)+var(--module2-lesson-chrome-height,5rem))] lg:self-start">
          {source
            ? <OriginalWorkPanel source={source} />
            : <p className="rounded-lg border p-4 text-sm text-muted-foreground">还没有确认的小说。讲解时可以先浏览这一关。</p>}
        </div>
      </div>

      <Dialog open={exampleOpen} onOpenChange={setExampleOpen}>
        <DialogContent className="max-h-[90vh] max-w-[min(100vw-1.5rem,40rem)] overflow-auto">
          <DialogHeader>
            <DialogTitle>教师虚构示例</DialogTitle>
            <DialogDescription>这些句子只供参考，不会填进你的输入框。</DialogDescription>
          </DialogHeader>
          {sampleState === null && <p className="text-sm text-muted-foreground">正在读取示例…</p>}
          {sampleState && !sampleState.ok && <SampleMissingNotice message={sampleState.message} missing={sampleState.missing} />}
          {sampleState?.ok && (
            <div className="space-y-3 text-sm">
              {sampleState.sample.manifest.panels.map(panel => (
                <p key={panel.id}><span className="font-medium">{panel.label}：</span>{panel.sentence}</p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
