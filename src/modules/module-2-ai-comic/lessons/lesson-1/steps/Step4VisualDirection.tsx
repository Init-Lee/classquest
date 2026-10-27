/**
 * 文件说明：课时 1 第 4 关「确定视觉方向」。
 * 职责：并排展示同一场景的三种风格，让学生自选或自定义 2—3 个视觉词并写一句理由。桌面左半是视觉词三层（已选、可点、自写），右半是理由，两组顶部对齐；窄屏改为视觉词在上、理由在下。「完成本课」放在这两组下面，靠右，使用普通主按钮尺寸，窄屏也不撑满整行。词和理由合格时按钮可点；保存成功后才打开完成弹窗。本关不要求上传或生成自己的图，也不在页面下铺本课小结。
 * 更新触发：风格对照、视觉词与理由的左右排版、完成本课的位置与尺寸、可点条件或完成弹窗打开时机变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import {
  confirmModule2VisualDirection,
  normalizeModule2VisualWords,
  setModule2VisualReason,
  setModule2VisualWords,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import { MODULE2_FIELD_LIMITS } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import { Lesson1CompletePanel } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/Lesson1CompletePanel"
import { commitLesson1Change } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-commit"
import { Lesson1StepHeader } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-chrome"
import { SampleFigure } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleFigure"
import { SampleMissingNotice } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/SampleMissingNotice"
import { useGuanDengSample } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/use-guan-deng-sample"
import { LESSON1_REASON_PLACEHOLDER } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"
import type { GuanDengSample, GuanDengStyle } from "@/modules/module-2-ai-comic/lessons/lesson-1/sample/load-guan-deng-sample"

/** 词或理由还不合格时，说明为什么「完成本课」不能点。合格则返回空字符串。 */
function finishBlockReason(words: string[], reason: string): string {
  const normalized = normalizeModule2VisualWords(words)
  const wordBad = normalized.length < 2 || normalized.length > 3
  const reasonBad = reason.trim() === ""
  if (wordBad && reasonBad) return "请先选出 2—3 个不同的视觉词，并写一句理由。"
  if (wordBad) return "请先选出 2—3 个不同的视觉词。"
  if (reasonBad) return "请写一句选择理由。"
  return ""
}

function StyleCard({ sample, style }: { sample: GuanDengSample; style: GuanDengStyle }) {
  return (
    <article className="min-w-0 rounded-lg border p-3">
      <h3 className="text-sm font-semibold">{style.name}</h3>
      <div className="mt-2">
        <SampleFigure sample={sample} file={style.image} alt={`${sample.manifest.title}：${style.name}`} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">可以注意：{style.observe}</p>
    </article>
  )
}

export default function Step4VisualDirection() {
  const { portfolio, updatePortfolio, flushPortfolio } = useModule2State()
  const sampleState = useGuanDengSample()
  const [index, setIndex] = useState(0)
  const [custom, setCustom] = useState("")
  const [error, setError] = useState("")
  const [wordError, setWordError] = useState("")
  const [busy, setBusy] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  if (!portfolio) return null
  const words = portfolio.visualDirection.words
  const normalizedWords = normalizeModule2VisualWords(words)
  const selectedWords = new Set(normalizedWords)
  const atMax = normalizedWords.length >= 3
  const blockReason = finishBlockReason(words, portfolio.visualDirection.reason)
  const canFinish = blockReason === ""
  const sample = sampleState?.ok ? sampleState.sample : null
  const styles = sample?.manifest.styles ?? []
  const scene = sample?.manifest.panels.find(panel => panel.sourcePart === "turn")
  const suggestions = styles.flatMap(style => style.words).filter((word, position, all) => all.indexOf(word) === position)
  const safeIndex = styles.length === 0 ? 0 : Math.min(index, styles.length - 1)

  const addWord = (raw: string) => {
    const word = raw.trim()
    if (!word) {
      setWordError("请先写一个视觉词。")
      return
    }
    if (word.length > MODULE2_FIELD_LIMITS.visualWord) {
      setWordError("一个视觉词请控制在 30 个字以内。")
      return
    }
    const next = normalizeModule2VisualWords([...words, word])
    if (next.length > 3) {
      setWordError("最多 3 个视觉词，请先删除一个。")
      return
    }
    if (next.length === normalizeModule2VisualWords(words).length) {
      setWordError("这个词已经有了。")
      return
    }
    setWordError("")
    setCustom("")
    updatePortfolio(current => setModule2VisualWords(current, next, new Date().toISOString()))
  }

  const finish = async () => {
    if (!canFinish || busy) return
    setBusy(true)
    setError("")
    try {
      const failure = await commitLesson1Change(updatePortfolio, flushPortfolio, (current) => {
        const result = confirmModule2VisualDirection(current, new Date().toISOString())
        if (!result.ok) return { portfolio: current, error: result.reason }
        return { portfolio: result.portfolio, error: "" }
      })
      if (failure) {
        setError(failure)
        return
      }
      setSummaryOpen(true)
    } catch {
      setError("还没有保存成功。你写的视觉词和理由还在，请重试。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <Lesson1StepHeader
        step={4}
        title="确定视觉方向"
        lead="看同一场景的三种风格，再选出 2—3 个视觉词，并用一句话说明理由。本课不需要上传或生成自己的图。"
      />
      {sampleState === null && <p className="text-sm text-muted-foreground">正在读取风格示例…</p>}
      {sampleState && !sampleState.ok && <SampleMissingNotice message={sampleState.message} missing={sampleState.missing} />}
      {sample && (
        <section className="mb-6 min-w-0 space-y-3" aria-label="同一场景的三种风格">
          <p className="text-sm leading-relaxed">
            下面三张图是同一场景{scene ? `（${scene.label}）` : ""}：{scene?.sentence}
          </p>
          <div className="hidden min-w-0 gap-3 md:grid md:grid-cols-3">
            {styles.map(style => <StyleCard key={style.id} sample={sample} style={style} />)}
          </div>
          {styles[safeIndex] && (
            <div className="min-w-0 md:hidden">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" disabled={safeIndex === 0} onClick={() => setIndex(value => Math.max(0, value - 1))}>上一张</Button>
                <span className="text-sm">{safeIndex + 1} / {styles.length}</span>
                <Button type="button" variant="outline" size="sm" disabled={safeIndex >= styles.length - 1} onClick={() => setIndex(value => value + 1)}>下一张</Button>
              </div>
              <StyleCard sample={sample} style={styles[safeIndex]} />
            </div>
          )}
        </section>
      )}

      {portfolio.lesson1.reviewNeeded.visualDirection && words.length > 0 && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">视觉方向需要重新确认。</p>
      )}

      {/* 桌面左右各半、顶部对齐、中间留缝；窄屏视觉词在上、理由在下。已选建议只保持按下。 */}
      <div className="min-w-0">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium">视觉词（2—3 个，可以自己写，也可以点下面的词）</p>
              {words.length === 0 ? (
                <p className="text-sm text-muted-foreground">还没有视觉词</p>
              ) : (
                <div className="flex w-full min-w-0 flex-wrap gap-2">
                  {words.map((word, position) => (
                    <span key={`${word}-${position}`} className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm">
                      <span className="min-w-0 break-words">{word}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:text-foreground"
                        aria-label={`删除视觉词${word}`}
                        onClick={() => updatePortfolio(current => setModule2VisualWords(
                          current,
                          current.visualDirection.words.filter((_, item) => item !== position),
                          new Date().toISOString(),
                        ))}
                      >
                        删除
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="min-w-0 space-y-2">
                <p id="m2-word-suggestions-label" className="text-sm text-muted-foreground">可以点这些</p>
                <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-labelledby="m2-word-suggestions-label">
                  {suggestions.map(word => {
                    const chosen = selectedWords.has(word)
                    return (
                      <Button
                        key={word}
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-pressed={chosen}
                        disabled={chosen}
                        className={chosen
                          ? "h-auto max-w-full whitespace-normal break-words border-primary bg-accent shadow-inner disabled:opacity-100"
                          : "h-auto max-w-full whitespace-normal break-words"}
                        onClick={() => addWord(word)}
                      >
                        {word}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <div className="flex w-full min-w-0 max-w-md items-center gap-2">
                <label htmlFor="m2-custom-word" className="sr-only">自己写一个视觉词</label>
                <Input
                  id="m2-custom-word"
                  className="min-w-0 w-auto flex-1"
                  value={custom}
                  maxLength={MODULE2_FIELD_LIMITS.visualWord}
                  placeholder="自己写一个视觉词"
                  disabled={atMax}
                  aria-describedby={atMax ? "m2-visual-word-max" : undefined}
                  onChange={event => setCustom(event.target.value)}
                  onKeyDown={event => {
                    if (event.key !== "Enter" || atMax) return
                    event.preventDefault()
                    addWord(custom)
                  }}
                />
                <Button type="button" variant="outline" className="shrink-0" disabled={atMax} onClick={() => addWord(custom)}>添加</Button>
              </div>
              {atMax && <p id="m2-visual-word-max" className="text-sm text-muted-foreground">最多 3 个。</p>}
              {wordError && <p role="alert" className="text-sm text-red-600">{wordError}</p>}
              <p className="text-xs text-muted-foreground">不必从三种风格里选一种。第二课还可以再改。</p>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <label htmlFor="m2-visual-reason" className="text-sm font-medium">理由</label>
            <Textarea
              id="m2-visual-reason"
              value={portfolio.visualDirection.reason}
              maxLength={MODULE2_FIELD_LIMITS.visualReason}
              placeholder={LESSON1_REASON_PLACEHOLDER}
              onChange={event => updatePortfolio(current => setModule2VisualReason(current, event.target.value, new Date().toISOString()))}
            />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {blockReason && <p className="text-sm text-muted-foreground">{blockReason}</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {/* 普通主按钮靠右；窄屏也不拉成整行。 */}
          <div className="flex justify-end">
            <Button type="button" onClick={() => void finish()} disabled={!canFinish || busy}>
              {busy ? "正在保存…" : "完成本课"}
            </Button>
          </div>
        </div>
      </div>
      <Lesson1CompletePanel open={summaryOpen} onOpenChange={setSummaryOpen} portfolio={portfolio} />
    </div>
  )
}
