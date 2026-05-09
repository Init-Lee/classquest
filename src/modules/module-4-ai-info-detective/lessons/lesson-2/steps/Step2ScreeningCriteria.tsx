/**
 * 文件说明：模块 4 课时 2 第 2 关页面。
 * 职责：通过标准说明和校准案例，正式建立素材入题的四关体检标准。
 * 更新触发：第 2 关标准定义、逐项解锁、停留时间记录、校准案例、反馈语气或进入第 3 关条件变化时，需要同步更新本文件。
 */

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import type { Module4Lesson2State, Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Lesson2ScreenPage, Lesson2ScreenSection } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/Lesson2ScreenLayout"
import {
  LESSON2_CRITERIA,
  LESSON2_CRITERIA_CHALLENGES,
  type Lesson2CriterionKey,
} from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"
import { ArrowDown, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react"
import typeFitsImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/类型符合.jpg"
import sourceTraceableImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/来源追溯.jpg"
import contentCompliantImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/内容合规.jpg"
import judgmentValueImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/价值判断.jpg"
import videoClipCaseImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step2_case_video_clip.jpg"
import unsourcedImageCaseImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step2_case_unsourced_image.jpg"
import clearFacesCaseImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step2_case_clear_faces.jpg"
import obviousAiMemeCaseImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step2_case_obvious_ai_meme.jpg"

const CRITERION_KEYS: Lesson2CriterionKey[] = ["typeFits", "sourceTraceable", "contentCompliant", "hasJudgmentValue"]
const DEFAULT_CHALLENGE_IDS = LESSON2_CRITERIA_CHALLENGES.map(item => item.id)

const CRITERIA_VISUALS: Record<Lesson2CriterionKey, string> = {
  typeFits: typeFitsImage,
  sourceTraceable: sourceTraceableImage,
  contentCompliant: contentCompliantImage,
  hasJudgmentValue: judgmentValueImage,
}

const CHALLENGE_IMAGE_MAP: Record<string, string> = {
  "short-video": videoClipCaseImage,
  "forwarded-no-origin": unsourcedImageCaseImage,
  "classmate-face": clearFacesCaseImage,
  "obvious-joke": obviousAiMemeCaseImage,
}

const CRITERIA_DETAIL_POINTS: Record<Lesson2CriterionKey, string[]> = {
  typeFits: [
    "新闻素材：能看到标题、正文片段和来源线索。",
    "图片素材：单张静态图片。",
    "短视频、长文全文、多图拼图、聊天长截图先排除。",
  ],
  sourceTraceable: [
    "网络素材：保留链接、平台或发布时间线索。",
    "AI 生成：记录 Prompt 摘要或生成记录。",
    "现场采集 / 混合加工：说明时间地点、采集方式或加工过程。",
  ],
  contentCompliant: [
    "避开隐私信息、未经授权的人脸和攻击性内容。",
    "警惕不适宜传播内容和明显侵权风险。",
    "能判断，不代表能使用。",
  ],
  hasJudgmentValue: [
    "能围绕 AI 痕迹或核验需求展开讨论。",
    "不是一眼看穿、纯搞笑或完全无法分析。",
    "好素材要留下观察、分析和讨论空间。",
  ],
}

function readPerformanceMs(): number {
  return performance.now()
}

function createRandomChallengeOrder(): string[] {
  const ids = [...DEFAULT_CHALLENGE_IDS]
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]]
  }
  return ids
}

export default function Step2ScreeningCriteria() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, Lesson2CriterionKey>>({})
  const [activeCriterionKey, setActiveCriterionKey] = useState<Lesson2CriterionKey>("typeFits")
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0)
  const [challengeOrderIds, setChallengeOrderIds] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const activeEnteredAtRef = useRef<number>(0)
  const latestPortfolioRef = useRef<Module4Portfolio | null>(portfolio)
  const latestActiveCriterionKeyRef = useRef<Lesson2CriterionKey>(activeCriterionKey)

  useEffect(() => {
    if (activeEnteredAtRef.current <= 0) activeEnteredAtRef.current = readPerformanceMs()
    latestPortfolioRef.current = portfolio
  }, [portfolio])

  useEffect(() => {
    latestActiveCriterionKeyRef.current = activeCriterionKey
  }, [activeCriterionKey])

  useEffect(() => {
    if (!portfolio) return
    const shouldUseReviewOrder = portfolio.lesson2.step2Completed || portfolio.lesson2.criteriaAttempts.length > 0
    setChallengeOrderIds(current => {
      if (shouldUseReviewOrder) return DEFAULT_CHALLENGE_IDS
      if (portfolio.lesson2.step2ChallengeOrderIds.length === DEFAULT_CHALLENGE_IDS.length) {
        return portfolio.lesson2.step2ChallengeOrderIds
      }
      if (current.length === DEFAULT_CHALLENGE_IDS.length) return current
      const nextOrderIds = createRandomChallengeOrder()
      void savePortfolio({
        ...portfolio,
        lesson2: {
          ...portfolio.lesson2,
          step2ChallengeOrderIds: nextOrderIds,
        },
      })
      return nextOrderIds
    })
  }, [portfolio, savePortfolio])

  useEffect(() => {
    if (!portfolio || Object.keys(answers).length > 0) return
    const latestAttempt = portfolio.lesson2.criteriaAttempts.at(-1)
    if (!latestAttempt) return
    const restoredAnswers: Record<string, Lesson2CriterionKey> = {}
    latestAttempt.answers.forEach(answer => {
      restoredAnswers[answer.exampleId] = answer.selectedCriterion
    })
    setAnswers(restoredAnswers)
  }, [answers, portfolio])

  useEffect(() => () => {
    const currentPortfolio = latestPortfolioRef.current
    if (!currentPortfolio) return
    const criterionKey = latestActiveCriterionKeyRef.current
    const dwellMs = Math.max(0, Math.round(readPerformanceMs() - activeEnteredAtRef.current))
    if (dwellMs <= 0) return
    void savePortfolio({
      ...currentPortfolio,
      lesson2: {
        ...currentPortfolio.lesson2,
        step2CriteriaDwellMs: {
          ...currentPortfolio.lesson2.step2CriteriaDwellMs,
          [criterionKey]: (currentPortfolio.lesson2.step2CriteriaDwellMs[criterionKey] ?? 0) + dwellMs,
        },
      },
    })
  }, [savePortfolio])

  if (!portfolio) return null

  const lesson2 = portfolio.lesson2
  const orderedChallenges = (challengeOrderIds.length === DEFAULT_CHALLENGE_IDS.length ? challengeOrderIds : DEFAULT_CHALLENGE_IDS)
    .map(id => LESSON2_CRITERIA_CHALLENGES.find(item => item.id === id))
    .filter((item): item is (typeof LESSON2_CRITERIA_CHALLENGES)[number] => Boolean(item))
  const correctChallengeCount = LESSON2_CRITERIA_CHALLENGES.filter(item => answers[item.id] === item.correctCriterion).length
  const allChallengesCorrect = correctChallengeCount === LESSON2_CRITERIA_CHALLENGES.length
  const activeCriterion = LESSON2_CRITERIA.find(criterion => criterion.key === activeCriterionKey) ?? LESSON2_CRITERIA[0]
  const activeCriterionImage = CRITERIA_VISUALS[activeCriterion.key]
  const activeChallenge = orderedChallenges[activeChallengeIndex] ?? orderedChallenges[0] ?? LESSON2_CRITERIA_CHALLENGES[0]
  const activeChallengeSelected = answers[activeChallenge.id]
  const activeChallengeCorrectTitle = LESSON2_CRITERIA.find(criterion => criterion.key === activeChallenge.correctCriterion)?.title
  const activeChallengeSelectedTitle = LESSON2_CRITERIA.find(criterion => criterion.key === activeChallengeSelected)?.title
  const activeChallengeCorrect = activeChallengeSelected === activeChallenge.correctCriterion
  const activeChallengeImage = CHALLENGE_IMAGE_MAP[activeChallenge.id]
  const unlockedCriteriaKeys = lesson2.step2Completed
    ? CRITERION_KEYS
    : CRITERION_KEYS.filter(key => key === "typeFits" || lesson2.step2CriteriaUnlockedKeys.includes(key))
  const allCriteriaUnlocked = unlockedCriteriaKeys.length === CRITERION_KEYS.length
  const nextLockedCriterionKey = CRITERION_KEYS.find(key => !unlockedCriteriaKeys.includes(key))

  const withActiveCriterionDwell = (baseLesson2: Module4Lesson2State): Module4Lesson2State => {
    const dwellMs = Math.max(0, Math.round(readPerformanceMs() - activeEnteredAtRef.current))
    if (dwellMs <= 0) return baseLesson2
    return {
      ...baseLesson2,
      step2CriteriaDwellMs: {
        ...baseLesson2.step2CriteriaDwellMs,
        [activeCriterionKey]: (baseLesson2.step2CriteriaDwellMs[activeCriterionKey] ?? 0) + dwellMs,
      },
    }
  }

  const handleSelectCriterion = (criterionKey: Lesson2CriterionKey) => {
    if (!unlockedCriteriaKeys.includes(criterionKey) || criterionKey === activeCriterionKey) return
    const nextPortfolio = {
      ...portfolio,
      lesson2: withActiveCriterionDwell(lesson2),
    }
    latestPortfolioRef.current = nextPortfolio
    void savePortfolio(nextPortfolio)
    activeEnteredAtRef.current = readPerformanceMs()
    setActiveCriterionKey(criterionKey)
  }

  const unlockNextCriterion = () => {
    if (!nextLockedCriterionKey) return
    const nextLesson2 = withActiveCriterionDwell({
      ...lesson2,
      step2CriteriaUnlockedKeys: Array.from(new Set([...unlockedCriteriaKeys, nextLockedCriterionKey])),
    })
    const nextPortfolio = { ...portfolio, lesson2: nextLesson2 }
    latestPortfolioRef.current = nextPortfolio
    void savePortfolio(nextPortfolio)
    activeEnteredAtRef.current = readPerformanceMs()
    setActiveCriterionKey(nextLockedCriterionKey)
  }

  const complete = () => {
    if (!allChallengesCorrect) return
    const normalizedAnswers = LESSON2_CRITERIA_CHALLENGES.map(item => {
      const selectedCriterion = answers[item.id]
      return {
        exampleId: item.id,
        selectedCriterion,
        isCorrect: selectedCriterion === item.correctCriterion,
      }
    })
    if (normalizedAnswers.some(answer => !answer.selectedCriterion)) return
    const score = normalizedAnswers.filter(answer => answer.isCorrect).length
    const nextAttempts = [
      ...lesson2.criteriaAttempts,
      {
        attemptNo: lesson2.criteriaAttempts.length + 1,
        submittedAt: new Date().toISOString(),
        answers: normalizedAnswers,
        score,
      },
    ]
    const nextPortfolio = {
      ...portfolio,
      progress: { lessonId: 2, stepId: 3 },
      lesson2: withActiveCriterionDwell({
        ...lesson2,
        criteriaAttempts: nextAttempts,
        criteriaExampleAttemptCount: nextAttempts.length,
        criteriaExampleScore: score,
        step2CriteriaUnlockedKeys: CRITERION_KEYS,
        step2Completed: true,
      }),
    }
    latestPortfolioRef.current = nextPortfolio
    void savePortfolio(nextPortfolio)
    navigate("/module/4/lesson/2/step/3")
  }

  const scrollToCalibration = () => {
    const nextPortfolio = {
      ...portfolio,
      lesson2: withActiveCriterionDwell(lesson2),
    }
    latestPortfolioRef.current = nextPortfolio
    void savePortfolio(nextPortfolio)
    activeEnteredAtRef.current = readPerformanceMs()
    document.getElementById("lesson2-step2-calibration")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goToPreviousChallenge = () => {
    setActiveChallengeIndex(index => Math.max(0, index - 1))
  }

  const goToNextChallenge = () => {
    setActiveChallengeIndex(index => Math.min(orderedChallenges.length - 1, index + 1))
  }

  const selectChallengeAnswer = (criterionKey: Lesson2CriterionKey) => {
    if (lesson2.step2Completed) return
    const attemptIndex = lesson2.step2ChallengeEvents.filter(event => event.exampleId === activeChallenge.id).length + 1
    const nextEvent = {
      exampleId: activeChallenge.id,
      selectedCriterion: criterionKey,
      isCorrect: criterionKey === activeChallenge.correctCriterion,
      selectedAt: new Date().toISOString(),
      attemptIndex,
    }
    const nextPortfolio = {
      ...portfolio,
      lesson2: {
        ...lesson2,
        step2ChallengeEvents: [...lesson2.step2ChallengeEvents, nextEvent],
      },
    }
    latestPortfolioRef.current = nextPortfolio
    void savePortfolio(nextPortfolio)
    setAnswers(current => ({ ...current, [activeChallenge.id]: criterionKey }))
  }

  return (
    <Lesson2ScreenPage>
      <Lesson2ScreenSection
        id="lesson2-step2-standards"
        bgClassName="bg-gradient-to-b from-blue-50 via-background to-background"
        className="py-4 md:py-5"
      >
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">第2关 · 四关体检标准</h1>
            <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">
              第1关已经对素材能不能继续做了快速判断。现在，我们要建立一把更清楚的“素材入题尺子”。
            </p>
          </div>
          <Card className="overflow-hidden border-white/70 bg-white/95 shadow-xl">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr),minmax(360px,1.05fr)] lg:items-stretch">
              <div className="flex min-h-[clamp(340px,52vh,500px)] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 via-white to-amber-50 p-2">
                <button
                  type="button"
                  className="h-full w-full cursor-zoom-in"
                  onClick={() => setPreviewImage({ src: activeCriterionImage, alt: activeCriterion.title })}
                >
                  <img
                    src={activeCriterionImage}
                    alt={activeCriterion.title}
                    className="max-h-[clamp(300px,50vh,480px)] w-full rounded-2xl object-contain shadow-sm"
                  />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {LESSON2_CRITERIA.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectCriterion(item.key)}
                      disabled={!unlockedCriteriaKeys.includes(item.key)}
                      className={cn(
                        "rounded-2xl border px-4 py-2.5 text-left transition",
                        activeCriterionKey === item.key
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : unlockedCriteriaKeys.includes(item.key)
                            ? "bg-white hover:border-primary/40 hover:bg-primary/5"
                            : "cursor-not-allowed bg-slate-50 text-muted-foreground opacity-60",
                      )}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                        <span className="text-lg font-bold">{item.title}</span>
                        </span>
                        {!unlockedCriteriaKeys.includes(item.key) && <span className="text-xs">待解锁</span>}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex-1 rounded-3xl border bg-blue-50/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-primary">当前标准</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">{activeCriterion.title}</h2>
                    </div>
                    {!allCriteriaUnlocked && nextLockedCriterionKey && (
                      <Button type="button" size="sm" className="rounded-full" onClick={unlockNextCriterion}>
                        解锁下一项
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeCriterion.description}</p>
                  <div className="mt-3 grid gap-2.5">
                    {CRITERIA_DETAIL_POINTS[activeCriterion.key].map((point, index) => (
                      <div key={point} className="flex gap-3 rounded-2xl bg-white/85 p-2.5 text-sm leading-6 shadow-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <p>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button size="lg" className="gap-2 rounded-full px-8" onClick={scrollToCalibration} disabled={!allCriteriaUnlocked}>
              进入四关标准校准
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Lesson2ScreenSection>

      <Lesson2ScreenSection
        id="lesson2-step2-calibration"
        bgClassName="bg-gradient-to-b from-background via-amber-50/70 to-blue-50"
        className="py-4 md:py-5"
      >
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">四关标准练习</h2>
          </div>
          <Card className="border-white/70 bg-white/95 shadow-xl">
            <CardContent className="p-4 md:p-5">
              <p className="mb-3 rounded-2xl bg-slate-50 px-4 py-2 text-sm font-medium leading-6 text-slate-900">
                请判断素材主要卡在哪一关；需要回看标准时，向上滚动即可。
              </p>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr),minmax(320px,0.88fr)] lg:items-center">
                <div className="space-y-3">
                  <div className="rounded-3xl border bg-white p-2.5">
                    <button
                      type="button"
                      className="w-full cursor-zoom-in"
                      onClick={() => setPreviewImage({ src: activeChallengeImage, alt: activeChallenge.title })}
                    >
                      <img
                        src={activeChallengeImage}
                        alt={activeChallenge.title}
                        className="h-[clamp(220px,38vh,430px)] w-full rounded-2xl object-contain"
                      />
                    </button>
                  </div>
                  <div className="rounded-2xl border bg-blue-50/70 px-4 py-2.5 text-sm leading-6 text-blue-950">
                    <p className="font-semibold">{activeChallenge.title}</p>
                    <p className="mt-1 text-muted-foreground">{activeChallenge.issue}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">
                      第 {activeChallengeIndex + 1} / {orderedChallenges.length} 个练习素材
                    </p>
                    <h3 className="text-xl font-bold tracking-tight text-primary text-balance md:text-2xl">
                      它主要卡在哪一关？
                    </h3>
                  </div>
                  <div className="grid gap-2.5">
                    {LESSON2_CRITERIA.map(criterion => (
                      <button
                        key={criterion.key}
                        type="button"
                        onClick={() => selectChallengeAnswer(criterion.key)}
                        className={cn(
                          "rounded-2xl border px-5 py-3 text-left text-sm font-medium transition",
                          activeChallengeSelected === criterion.key
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "bg-white hover:border-primary/40 hover:bg-primary/5",
                        )}
                      >
                        {criterion.title}
                      </button>
                    ))}
                  </div>
                  {activeChallengeSelected && (
                    <div className={cn(
                      "rounded-2xl border px-4 py-2.5 text-sm leading-6",
                      activeChallengeCorrect
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-amber-200 bg-amber-50 text-amber-900",
                    )}
                    >
                      <p className="font-medium">
                        {activeChallengeCorrect
                          ? `校准到位：${activeChallengeCorrectTitle}`
                          : `再校准一下：这题主要卡在「${activeChallengeCorrectTitle}」。`}
                      </p>
                      {!activeChallengeCorrect && activeChallengeSelectedTitle && (
                        <p className="mt-1">你刚才选择的是「{activeChallengeSelectedTitle}」，可以对照左侧素材再看一次。</p>
                      )}
                      <p className="mt-1">{activeChallenge.feedback}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Button variant="outline" onClick={goToPreviousChallenge} disabled={activeChallengeIndex === 0} className="gap-1.5 rounded-full">
                      <ChevronLeft className="h-4 w-4" />
                      上一题
                    </Button>
                    {activeChallengeCorrect && activeChallengeIndex < orderedChallenges.length - 1 && (
                      <Button onClick={goToNextChallenge} className="gap-1.5 rounded-full">
                        下一题
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                {orderedChallenges.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (index <= activeChallengeIndex || answers[orderedChallenges[index - 1]?.id] === orderedChallenges[index - 1]?.correctCriterion) {
                        setActiveChallengeIndex(index)
                      }
                    }}
                    disabled={index > activeChallengeIndex && answers[orderedChallenges[index - 1]?.id] !== orderedChallenges[index - 1]?.correctCriterion}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      index === activeChallengeIndex
                        ? "w-7 bg-slate-400"
                        : answers[item.id] === item.correctCriterion
                          ? "w-2.5 bg-slate-300"
                          : answers[item.id]
                            ? "w-2.5 bg-amber-200"
                            : "w-2.5 bg-slate-200",
                    )}
                    aria-label={`查看第 ${index + 1} 个标准校准素材`}
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                已校准正确 {correctChallengeCount} / {LESSON2_CRITERIA_CHALLENGES.length} 张练习卡。
              </p>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button size="lg" className="gap-2 rounded-full px-8" onClick={complete} disabled={!allChallengesCorrect}>
              完成校准，进入第3关
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Lesson2ScreenSection>
      {previewImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-full max-w-6xl" onClick={event => event.stopPropagation()}>
            <button
              type="button"
              className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100"
              onClick={() => setPreviewImage(null)}
              aria-label="关闭图片预览"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[88vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </Lesson2ScreenPage>
  )
}
