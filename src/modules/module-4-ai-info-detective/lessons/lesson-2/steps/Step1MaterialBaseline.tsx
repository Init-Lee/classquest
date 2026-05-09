/**
 * 文件说明：模块 4 课时 2 第 1 关页面。
 * 职责：通过故事情境、案例判断和个人素材状态登记，记录新闻截图与图片素材的初始准备情况。
 * 更新触发：第 1 关教学流程、快判答题记录、状态选项、上传规则或完成条件变化时，需要同步更新本文件。
 */

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDown, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react"
import type { Module4CompressedMaterialAsset, Module4MaterialKind, Module4MaterialPrepStatus } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Lesson2ScreenPage, Lesson2ScreenSection } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/Lesson2ScreenLayout"
import { CompressedMaterialUploader } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/components/CompressedMaterialUploader"
import { LESSON2_STATUS_LABELS, LESSON2_STEP1_CASES } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/utils/cn"
import contextImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step1-context.jpg"
import caseNewsImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step1-case-news.png"
import caseAiImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step1-case-ai-image.jpg"
import casePrivacyImage from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step1-case-privacy.jpg"

const PREP_STATUSES: Module4MaterialPrepStatus[] = ["ready", "incomplete", "none"]
const CASE_OPTIONS = ["可以继续", "需要补信息", "建议更换"] as const
const CASE_IMAGE_MAP: Record<string, string> = {
  "news-with-source": caseNewsImage,
  "image-no-source": caseAiImage,
  "privacy-photo": casePrivacyImage,
}

export default function Step1MaterialBaseline() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [activeCaseIndex, setActiveCaseIndex] = useState(0)
  const [triageHelperAcknowledged, setTriageHelperAcknowledged] = useState(false)
  const [helperBubbleOpen, setHelperBubbleOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [statusSelected, setStatusSelected] = useState<Record<Module4MaterialKind, boolean>>({ news: false, image: false })
  const contextEnteredAtRef = useRef<number>(0)
  const contextDwellRecordedRef = useRef(false)

  useEffect(() => {
    contextEnteredAtRef.current = performance.now()
  }, [])

  if (!portfolio) return null

  const lesson2 = portfolio.lesson2
  const caseAnswers = lesson2.step1CaseAnswers
  const allCasesAnswered = LESSON2_STEP1_CASES.every(item => caseAnswers[item.id])
  const hasTriageHistory = lesson2.step1Completed || Object.keys(caseAnswers).length > 0
  const activeCase = LESSON2_STEP1_CASES[activeCaseIndex]
  const activeCaseSelected = caseAnswers[activeCase.id]
  const activeCaseCorrect = activeCaseSelected === activeCase.statusLabel
  const hasSelectedStatus = (kind: Module4MaterialKind) => (
    statusSelected[kind]
    || lesson2.step1MaterialStatusLocked[kind]
    || lesson2.step1Completed
    || Boolean(lesson2[kind].asset)
    || lesson2[kind].initialStatus !== "none"
  )
  const isStatusLocked = (kind: Module4MaterialKind) => hasSelectedStatus(kind)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goToPreviousCase = () => {
    setActiveCaseIndex(index => Math.max(0, index - 1))
  }

  const goToNextCase = () => {
    setActiveCaseIndex(index => Math.min(LESSON2_STEP1_CASES.length - 1, index + 1))
  }

  const selectCaseAnswer = (option: string) => {
    void savePortfolio({
      ...portfolio,
      lesson2: {
        ...lesson2,
        step1CaseAnswers: {
          ...caseAnswers,
          [activeCase.id]: option,
        },
      },
    })
  }

  const handleContextConfirmed = async () => {
    if (!contextDwellRecordedRef.current) {
      const enteredAt = contextEnteredAtRef.current || performance.now()
      const dwellMs = Math.max(0, Math.round(performance.now() - enteredAt))
      contextDwellRecordedRef.current = true
      await savePortfolio({
        ...portfolio,
        lesson2: {
          ...lesson2,
          taskBoundaryAcknowledged: true,
          step1ContextDwellMs: lesson2.step1ContextDwellMs + dwellMs,
          step1ContextViewedAt: new Date().toISOString(),
        },
      })
    }
    scrollToSection("lesson2-step1-cases")
  }

  const updateRecord = (kind: Module4MaterialKind, patch: Partial<typeof lesson2.news>) => {
    if (patch.initialStatus && isStatusLocked(kind)) return
    if (patch.initialStatus) {
      setStatusSelected(current => ({ ...current, [kind]: true }))
    }
    const nextLesson2 = {
      ...lesson2,
      [kind]: { ...lesson2[kind], ...patch },
      step1MaterialStatusLocked: patch.initialStatus
        ? { ...lesson2.step1MaterialStatusLocked, [kind]: true }
        : lesson2.step1MaterialStatusLocked,
      step1Completed: false,
    }
    void savePortfolio({ ...portfolio, lesson2: nextLesson2 })
  }

  const complete = () => {
    const step1Completed = (
      hasSelectedStatus("news")
      && hasSelectedStatus("image")
      && (lesson2.news.initialStatus === "none" || Boolean(lesson2.news.asset))
      && (lesson2.image.initialStatus === "none" || Boolean(lesson2.image.asset))
    )
    if (!step1Completed) return
    void savePortfolio({
      ...portfolio,
      progress: { lessonId: 2, stepId: 2 },
      lesson2: { ...lesson2, step1Completed },
    })
    navigate("/module/4/lesson/2/step/2")
  }

  const canComplete = hasSelectedStatus("news")
    && hasSelectedStatus("image")
    && (lesson2.news.initialStatus === "none" || Boolean(lesson2.news.asset))
    && (lesson2.image.initialStatus === "none" || Boolean(lesson2.image.asset))

  const renderStatusGroup = (kind: Module4MaterialKind) => {
    const record = lesson2[kind]
    const title = kind === "news" ? "新闻素材准备情况" : "图片素材准备情况"
    const locked = isStatusLocked(kind)
    return (
      <Card className="border-white/70 bg-white/90 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locked && (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              已完成本项准备状态登记。第 1 关的状态选择为一次性锁定，后续只可继续上传或替换当前素材。
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {PREP_STATUSES.map(status => (
              <button
                key={status}
                type="button"
                onClick={() => updateRecord(kind, { initialStatus: status })}
                disabled={locked}
                className={cn(
                  "rounded-2xl border p-4 text-left text-sm transition disabled:cursor-not-allowed",
                  hasSelectedStatus(kind) && record.initialStatus === status
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "bg-white hover:border-primary/40 disabled:opacity-50 disabled:hover:border-border",
                )}
              >
                <span className="font-medium">{LESSON2_STATUS_LABELS[status]}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {status === "ready"
                    ? (kind === "news" ? "必须上传新闻截图。" : "必须上传图片素材。")
                    : status === "incomplete"
                      ? "也需要上传已有截图，因为它仍然是“已有材料”。"
                      : "不要求上传，后面工作台再现场补。"}
                </span>
              </button>
            ))}
          </div>
          {record.initialStatus !== "none" && (
            <CompressedMaterialUploader
              kind={kind}
              asset={record.asset}
              onAssetChange={(asset: Module4CompressedMaterialAsset) => updateRecord(kind, { asset })}
            />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Lesson2ScreenPage>
      <Lesson2ScreenSection
        id="lesson2-step1-context"
        bgClassName="relative overflow-hidden bg-gradient-to-b from-blue-50 via-background to-background"
      >
        <div className="mx-auto flex min-h-[calc(var(--module4-lesson2-content-h,70dvh)-4rem)] w-full max-w-7xl flex-col">
          <div className="self-start space-y-2">
            <p className="text-balance text-3xl font-bold tracking-[0.06em] text-primary md:text-4xl">
              第1关 · 素材不等于题目
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-start gap-3 pt-2">
            <button
              type="button"
              className="w-full max-w-4xl cursor-zoom-in"
              onClick={() => setPreviewImage({ src: contextImage, alt: "小西和小位面对五花八门素材的课堂情境" })}
            >
              <img
                src={contextImage}
                alt="小西和小位面对五花八门素材的课堂情境"
                className="max-h-[clamp(300px,50vh,580px)] w-full object-contain drop-shadow-2xl"
              />
            </button>
            <div className="max-w-4xl text-pretty rounded-3xl border border-white/80 bg-white/85 px-5 py-4 text-sm leading-7 text-muted-foreground shadow-xl backdrop-blur md:text-base md:leading-8">
              <p>
              课时一结束后，小西和小位期待大家带来“AI 辨识素材”。但到了教室才发现，大家的材料五花八门：有人有新闻链接，有人只有模糊截图；有些图片看起来很“AI”，却说不清来源；还有同学暂时没有找到合适材料。
              </p>
            </div>
          </div>
          <div className="mt-auto flex justify-end pb-2">
            <Button size="lg" className="gap-2 rounded-full px-8" onClick={handleContextConfirmed}>
              我明白了 下一步
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Lesson2ScreenSection>

      <Lesson2ScreenSection
        id="lesson2-step1-cases"
        bgClassName="bg-gradient-to-b from-background via-indigo-50/70 to-blue-50"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <div className="relative flex flex-wrap items-center justify-between gap-3 text-left">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">三个素材快判</h2>
            {triageHelperAcknowledged && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full border-blue-200 bg-white/80 text-blue-700 shadow-sm hover:bg-blue-50"
                onClick={() => setHelperBubbleOpen(true)}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                小助手提醒
              </Button>
            )}
            {helperBubbleOpen && (
              <div
                className="fixed inset-0 z-50 bg-transparent"
                onClick={() => setHelperBubbleOpen(false)}
              >
                <div
                  className="absolute right-4 top-[calc(var(--module4-sticky-stack-height,7rem)+var(--module4-lesson2-chrome-h,8rem)+5.5rem)] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-blue-200 bg-white p-5 text-sm text-blue-950 shadow-2xl"
                  onClick={event => event.stopPropagation()}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 font-semibold text-blue-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      小助手提醒
                    </p>
                    <button
                      type="button"
                      className="rounded-full p-1 text-blue-700 hover:bg-blue-50"
                      onClick={() => setHelperBubbleOpen(false)}
                      aria-label="关闭小助手提醒"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 leading-6">
                    <p>判断时不要急着问“是不是 AI”，先问：</p>
                    <p>1. 来源够不够清楚？</p>
                    <p>2. 有没有隐私或授权风险？</p>
                    <p>3. 这个素材能不能让别人继续讨论？</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!triageHelperAcknowledged ? (
            <Card className="mx-auto max-w-3xl border-white/70 bg-white/90 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">快判前先记住三件事</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 text-base leading-7 text-muted-foreground">
                  <p>1. 🔎 看来源：有没有链接、平台、截图说明或生成记录？</p>
                  <p>2. 🛡️ 看合规：有没有隐私、肖像、侵权或不适宜内容？</p>
                  <p>3. 💬 看价值：能不能引发判断和讨论，而不是一眼看穿？</p>
                </div>
                <div className="flex justify-end">
                  <Button className="rounded-full px-8" onClick={() => setTriageHelperAcknowledged(true)}>
                    {hasTriageHistory ? "回顾快判" : "我知道了，开始快判"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-white/70 bg-white/90 shadow-xl backdrop-blur">
                <CardContent className="p-5 md:p-6">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(320px,0.8fr)] lg:items-center">
                    <div className="rounded-3xl border bg-white p-3">
                      <button
                        type="button"
                        className="w-full cursor-zoom-in"
                        onClick={() => setPreviewImage({ src: CASE_IMAGE_MAP[activeCase.id], alt: activeCase.title })}
                      >
                        <img
                          src={CASE_IMAGE_MAP[activeCase.id]}
                          alt={activeCase.title}
                          className="h-[clamp(260px,46vh,520px)] w-full rounded-2xl object-contain"
                        />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          第 {activeCaseIndex + 1} / {LESSON2_STEP1_CASES.length} 个素材快判
                        </p>
                        <h3 className="text-2xl font-bold tracking-tight text-primary text-balance">
                          {activeCase.title}
                        </h3>
                      </div>
                      <div className="grid gap-3">
                        {CASE_OPTIONS.map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => selectCaseAnswer(option)}
                            className={cn(
                              "rounded-2xl border px-5 py-4 text-left text-sm font-medium transition",
                              activeCaseSelected === option
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "bg-white hover:border-primary/40 hover:bg-primary/5",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {activeCaseSelected && (
                        <div className={cn(
                          "rounded-2xl border px-4 py-3 text-sm leading-6",
                          activeCaseCorrect ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900",
                        )}
                        >
                          <p className="font-medium">{activeCaseCorrect ? "判断到位" : `再想想：这类素材更适合判断为「${activeCase.statusLabel}」。`}</p>
                          <p className="mt-1">{activeCase.point}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <Button variant="outline" onClick={goToPreviousCase} disabled={activeCaseIndex === 0} className="gap-1.5 rounded-full">
                          <ChevronLeft className="h-4 w-4" />
                          上一题
                        </Button>
                        {activeCaseSelected && activeCaseIndex < LESSON2_STEP1_CASES.length - 1 && (
                          <Button onClick={goToNextCase} className="gap-1.5 rounded-full">
                            下一题
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                        {activeCaseSelected && activeCaseIndex === LESSON2_STEP1_CASES.length - 1 && allCasesAnswered && (
                          <Button onClick={() => scrollToSection("lesson2-step1-status")} className="gap-1.5 rounded-full">
                            {lesson2.step1Completed ? "回顾我的素材现状" : "继续记录我的素材现状"}
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-center gap-2">
                    {LESSON2_STEP1_CASES.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveCaseIndex(index)}
                        className={cn(
                          "h-2.5 rounded-full transition-all",
                          index === activeCaseIndex
                            ? "w-7 bg-slate-400"
                            : caseAnswers[item.id]
                              ? "w-2.5 bg-slate-300"
                              : "w-2.5 bg-slate-200",
                        )}
                        aria-label={`查看第 ${index + 1} 个素材快判`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Lesson2ScreenSection>

      <Lesson2ScreenSection
        id="lesson2-step1-status"
        bgClassName="bg-gradient-to-b from-blue-50 via-orange-50/60 to-background"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">我的素材准备现状</h2>
            <p className="text-muted-foreground md:text-lg">
              这一屏才开始记录你的新闻和图片素材。已准备与材料不完整都需要上传，暂无合适素材可以留空进入工作台。
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {renderStatusGroup("news")}
            {renderStatusGroup("image")}
          </div>
          <div className="flex flex-col items-center gap-3 pb-8">
            {!canComplete && (
              <p className="rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-800">
                如果选择“已准备”或“材料不完整”，请先上传对应素材。
              </p>
            )}
            <Button size="lg" className="gap-2 rounded-full px-8" onClick={complete} disabled={!canComplete}>
              进入第2关：用四项标准重新判断我的材料
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
