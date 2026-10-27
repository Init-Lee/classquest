/**
 * 文件说明：课时 1 第 3 关「选出四个关键画面」。
 * 职责：让学生为起承转合各写一句画面（每句一行），对照自己的原作；点「进入下一关」时才写入选景确认。教师示例只展示，不填进输入框。
 * 更新触发：四句输入的排布、原作对照、进入下一关前的确认条件、示例按钮位置或连读预览变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import {
  confirmModule2Storyboard,
  setModule2SceneSentence,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import { MODULE2_FIELD_LIMITS } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import { Lesson1ContinueButton, Lesson1StepHeader } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-chrome"
import { OriginalWorkPanel } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/OriginalWorkPanel"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import { useGuanDengSample } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/use-guan-deng-sample"
import { LESSON1_PARTS, LESSON1_SCENE_PROMPT } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"

/** 点名还空着的句子，给学生看，不出现字段名。 */
function missingSceneHint(labels: string[]): string {
  if (labels.length === 1) return `还要补上「${labels[0]}」。`
  const earlier = labels.slice(0, -1).map(label => `「${label}」`).join("、")
  return `还要补上${earlier}和「${labels[labels.length - 1]}」。`
}

export default function Step3PickScenes() {
  const { portfolio, updatePortfolio } = useModule2State()
  const sampleState = useGuanDengSample()
  const [exampleOpen, setExampleOpen] = useState(false)

  if (!portfolio) return null
  const source = portfolio.sourceSnapshot
  const sentences = LESSON1_PARTS.map(part => portfolio.storyboard.frames[part.id].sceneSentence.trim()).filter(Boolean)
  const missingLabels = LESSON1_PARTS
    .filter(part => portfolio.storyboard.frames[part.id].sceneSentence.trim() === "")
    .map(part => part.label)
  const sourceReady = Boolean(source && !source.isTeachingSample)
  const canContinue = missingLabels.length === 0 && sourceReady
  const continueHint = missingLabels.length > 0
    ? missingSceneHint(missingLabels)
    : source?.isTeachingSample
      ? "这篇和课堂练习《关灯这件事》相同，不能用来完成你的本人项目。"
      : "请先确认你的小说，再进入下一关。"

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <Lesson1StepHeader step={3} title="选出四个关键画面" lead="从你的小说里选出起、承、转、合四个能看见的时刻。每格只写一句。" />
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm font-medium">{LESSON1_SCENE_PROMPT}</p>
        {/* 只打开对照，不写入输入。主色描边比灰框醒目，并和底部的「进入下一关」分开。 */}
        <Button
          type="button"
          variant="outline"
          className="border-2 border-primary font-semibold text-primary shadow-sm hover:bg-primary/10"
          onClick={() => setExampleOpen(true)}
        >
          看看教师示例
        </Button>
      </div>
      {portfolio.lesson1.reviewNeeded.storyboard && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">四个画面需要对照当前小说重新确认。</p>
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="min-w-0 space-y-4">
          {/* 四句各占一行。窄屏标签在上、输入在下；宽屏同一行。灰色提示只作占位。 */}
          <div className="divide-y overflow-hidden rounded-lg border">
            {LESSON1_PARTS.map(part => (
              <div key={part.id} className="flex flex-col gap-1.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-3">
                <label htmlFor={`m2-scene-${part.id}`} className="w-8 shrink-0 text-base font-semibold">{part.label}</label>
                <Input
                  id={`m2-scene-${part.id}`}
                  className="min-w-0 flex-1"
                  value={portfolio.storyboard.frames[part.id].sceneSentence}
                  maxLength={MODULE2_FIELD_LIMITS.sceneSentence}
                  placeholder={part.hint}
                  onChange={event => updatePortfolio(current => setModule2SceneSentence(current, part.id, event.target.value, new Date().toISOString()))}
                />
              </div>
            ))}
          </div>
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
          <Lesson1ContinueButton
            enabled={canContinue}
            toStep={4}
            label="进入下一关"
            hint={canContinue ? undefined : continueHint}
            prepare={(current, now) => {
              const result = confirmModule2Storyboard(current, now)
              if (!result.ok) return { portfolio: current, error: result.reason }
              return { portfolio: result.portfolio, error: "" }
            }}
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
