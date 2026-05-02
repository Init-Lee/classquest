/**
 * 文件说明：模块 4 课时 1 第 2 关样例观察页面。
 * 职责：沿用第 1 关验证通过的全屏滚动样式，分屏完成新闻类/图片类观察判断与解析核验；四部分结构配对已迁移到第 3 关。
 * 更新触发：移除首屏按钮后的进度写入策略（滚动监听）、样例观察流程、全屏分屏顺序或 Step 2 状态字段变化时，需要同步更新本文件。
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { createEmptyModule4Lesson1Step2State, type Module4Lesson1Step2SampleKey, type Module4Lesson1Step2State } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Step2OptionKey, Step2SampleCard } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"
import { Lesson1ScreenPage, Lesson1ScreenSection } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Lesson1ScreenLayout"
import { Step2IntroPanel } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Step2IntroPanel"
import { Step2SampleObserveStage, Step2SampleRevealStage } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Step2SampleStages"
import { STEP2_IMAGE_SAMPLE_CARD, STEP2_NEWS_SAMPLE_CARD } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/data/step2-sample-cards"

function isStep2Completed(state: Module4Lesson1Step2State): boolean {
  return (
    state.introViewed
    && state.news.answered
    && state.news.explanationRevealed
    && state.image.answered
    && state.image.explanationRevealed
  )
}

function scrollToStep2Section(id: string): void {
  window.requestAnimationFrame(() => {
    const el = document.getElementById(id)
    if (!el) return
    const rootStyle = window.getComputedStyle(document.documentElement)
    const stickyHeight = Number.parseFloat(rootStyle.getPropertyValue("--module4-sticky-stack-height")) || 0
    const lessonChromeHeight = Number.parseFloat(rootStyle.getPropertyValue("--module4-lesson1-chrome-h")) || 0
    const targetTop = el.getBoundingClientRect().top + window.scrollY - stickyHeight - lessonChromeHeight
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" })
  })
}

function StageNotice({ message, targetId }: { message: string; targetId: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border bg-white/95 p-8 text-center shadow-xl shadow-slate-900/5">
      <p className="text-lg font-semibold">{message}</p>
      <p className="mt-2 text-sm text-muted-foreground">先完成前一个阶段，再继续观察这个页面。</p>
      <Button type="button" className="mt-5 rounded-full px-8" onClick={() => scrollToStep2Section(targetId)}>
        回到上一阶段
      </Button>
    </div>
  )
}

export default function Step2SampleObservation() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [step2State, setStep2State] = useState<Module4Lesson1Step2State>(
    portfolio?.lesson1.step2 ?? createEmptyModule4Lesson1Step2State(),
  )
  const [selectedOptions, setSelectedOptions] = useState<Record<Module4Lesson1Step2SampleKey, Step2OptionKey | undefined>>({
    news: step2State.news.selectedOptionKey,
    image: step2State.image.selectedOptionKey,
  })
  const [selectedAt, setSelectedAt] = useState<Record<Module4Lesson1Step2SampleKey, string>>({
    news: step2State.news.selectedAt,
    image: step2State.image.selectedAt,
  })

  /** 供滚动监听读取最新 Step2 状态，避免 IntersectionObserver 闭包陈旧。 */
  const step2Ref = useRef(step2State)
  step2Ref.current = step2State

  const persistStep2 = useCallback(
    async (next: Module4Lesson1Step2State, options: { preserveScroll?: boolean } = {}) => {
      if (!portfolio) return
      const scrollY = window.scrollY
      const completed = isStep2Completed(next)
      const normalized = { ...next, completed }
      setStep2State(normalized)
      await savePortfolio({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          step2: normalized,
          newsSampleViewed: normalized.news.explanationRevealed,
          imageSampleViewed: normalized.image.explanationRevealed,
          samplePartsConfirmed: portfolio.lesson1.samplePartsConfirmed,
        },
      })
      if (options.preserveScroll) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, left: 0, behavior: "auto" })
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, left: 0, behavior: "auto" })
          })
        })
      }
    },
    [portfolio, savePortfolio],
  )

  /** 进入第 2 关时回到说明页顶部，避免浏览器复用上一屏滚动位置。 */
  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    })
  }, [])

  /** 移除首屏按钮后：滚动至新闻样例区即视为已阅读任务说明，写入 introViewed。 */
  useEffect(() => {
    if (!portfolio || step2State.introViewed) return
    const el = document.getElementById("step2-news")
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        const hit = entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.06)
        if (!hit) return
        io.disconnect()
        const snap = step2Ref.current
        if (snap.introViewed) return
        void persistStep2({ ...snap, introViewed: true, currentPage: "news" }, { preserveScroll: true })
      },
      { threshold: [0, 0.08, 0.15], rootMargin: "0px 0px -12% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [portfolio, persistStep2, step2State.introViewed])

  if (!portfolio) return null

  const updateSampleState = async (
    sampleKey: Module4Lesson1Step2SampleKey,
    updater: (sample: Module4Lesson1Step2State[Module4Lesson1Step2SampleKey]) => Module4Lesson1Step2State[Module4Lesson1Step2SampleKey],
  ) => {
    await persistStep2({
      ...step2State,
      currentPage: sampleKey,
      [sampleKey]: updater(step2State[sampleKey]),
    })
  }

  const handleConfirmAnswer = async (sampleKey: Module4Lesson1Step2SampleKey, card: Step2SampleCard) => {
    const selectedOptionKey = selectedOptions[sampleKey]
    if (!selectedOptionKey) return
    const now = new Date().toISOString()
    await updateSampleState(sampleKey, sample => ({
      ...sample,
      answered: true,
      selectedOptionKey,
      isCorrect: selectedOptionKey === card.correctOptionKey,
      selectedAt: selectedAt[sampleKey] || sample.selectedAt || now,
      answeredAt: now,
      explanationViewedAt: now,
      lastInteractionAt: now,
      explanationRevealed: true,
    }))
    scrollToStep2Section(`step2-${sampleKey}-reveal`)
  }

  const handleSelectOption = (sampleKey: Module4Lesson1Step2SampleKey, key: Step2OptionKey) => {
    const now = new Date().toISOString()
    setSelectedOptions(prev => ({ ...prev, [sampleKey]: key }))
    setSelectedAt(prev => ({ ...prev, [sampleKey]: prev[sampleKey] || now }))
  }

  const handlePreviewOpen = async (sampleKey: Module4Lesson1Step2SampleKey) => {
    const now = new Date().toISOString()
    await updateSampleState(sampleKey, sample => ({
      ...sample,
      materialPreviewOpenedCount: sample.materialPreviewOpenedCount + 1,
      lastInteractionAt: now,
    }))
  }

  const handleGoImage = async () => {
    await persistStep2({ ...step2State, currentPage: "image" })
    scrollToStep2Section("step2-image")
  }

  const handleComplete = async () => {
    if (!isStep2Completed(step2State)) return
    await savePortfolio({
      ...portfolio,
      progress: portfolio.progress.lessonId === 1
        ? { lessonId: 1, stepId: Math.max(portfolio.progress.stepId, 3) }
        : portfolio.progress,
      lesson1: {
        ...portfolio.lesson1,
        step2: { ...step2State, completed: true },
        newsSampleViewed: true,
        imageSampleViewed: true,
        samplePartsConfirmed: false,
      },
    })
    navigate("/module/4/lesson/1/step/3")
  }

  return (
    <Lesson1ScreenPage>
      <Lesson1ScreenSection
        bgClassName="bg-gradient-to-b from-sky-50/90 via-background to-background dark:from-sky-950/30"
        className="scroll-mt-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson1-chrome-h,8rem))]"
      >
        <Step2IntroPanel />
      </Lesson1ScreenSection>

      <Lesson1ScreenSection
        id="step2-news"
        bgClassName="bg-gradient-to-b from-background via-sky-50/40 to-background dark:via-sky-950/20"
        className="!justify-start scroll-mt-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson1-chrome-h,8rem))]"
      >
        <Step2SampleObserveStage
          card={STEP2_NEWS_SAMPLE_CARD}
          selectedOptionKey={selectedOptions.news ?? step2State.news.selectedOptionKey}
          answered={step2State.news.answered}
          onSelectOption={(key) => handleSelectOption("news", key)}
          onConfirmAnswer={() => void handleConfirmAnswer("news", STEP2_NEWS_SAMPLE_CARD)}
          onContinue={() => scrollToStep2Section("step2-news-reveal")}
          onPreviewOpen={() => void handlePreviewOpen("news")}
        />
      </Lesson1ScreenSection>

      <Lesson1ScreenSection
        id="step2-news-reveal"
        bgClassName="bg-gradient-to-b from-sky-50/70 via-background to-background dark:from-sky-950/25"
        className="!justify-start scroll-mt-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson1-chrome-h,8rem))]"
      >
        {step2State.news.answered && step2State.news.selectedOptionKey ? (
          <Step2SampleRevealStage
            card={STEP2_NEWS_SAMPLE_CARD}
            selectedOptionKey={step2State.news.selectedOptionKey}
            continueLabel="继续观察图片类样例"
            onContinue={() => void handleGoImage()}
          />
        ) : (
          <StageNotice message="还没有完成新闻类样例判断" targetId="step2-news" />
        )}
      </Lesson1ScreenSection>

      <Lesson1ScreenSection
        id="step2-image"
        bgClassName="bg-gradient-to-b from-amber-50/70 via-muted/20 to-background dark:from-amber-950/25"
        className="!justify-start scroll-mt-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson1-chrome-h,8rem))]"
      >
        {step2State.news.answered ? (
          <Step2SampleObserveStage
            card={STEP2_IMAGE_SAMPLE_CARD}
            selectedOptionKey={selectedOptions.image ?? step2State.image.selectedOptionKey}
            answered={step2State.image.answered}
            onSelectOption={(key) => handleSelectOption("image", key)}
            onConfirmAnswer={() => void handleConfirmAnswer("image", STEP2_IMAGE_SAMPLE_CARD)}
            onContinue={() => scrollToStep2Section("step2-image-reveal")}
            onPreviewOpen={() => void handlePreviewOpen("image")}
          />
        ) : (
          <StageNotice message="先完成新闻类样例判断，才能解锁图片类样例" targetId="step2-news" />
        )}
      </Lesson1ScreenSection>

      <Lesson1ScreenSection
        id="step2-image-reveal"
        bgClassName="bg-gradient-to-b from-background via-amber-50/50 to-background dark:via-amber-950/20"
        className="!justify-start scroll-mt-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson1-chrome-h,8rem))]"
      >
        {step2State.image.answered && step2State.image.selectedOptionKey ? (
          <Step2SampleRevealStage
            card={STEP2_IMAGE_SAMPLE_CARD}
            selectedOptionKey={step2State.image.selectedOptionKey}
            continueLabel="进入第3关：四部分结构拆解"
            onContinue={() => void handleComplete()}
          />
        ) : (
          <StageNotice message="还没有完成图片类样例判断" targetId="step2-image" />
        )}
      </Lesson1ScreenSection>

    </Lesson1ScreenPage>
  )
}
