/**
 * 文件说明：模块 4 课时 3 第 4 步双卡自测试答与 V1 保存页。
 * 职责：引导作者分别自测新闻/图片题卡，确认体验后保存 V1 初稿；编辑后需重新自测对应题卡。
 * 更新触发：自测流程、指纹失效规则、保存出口或双卡切换交互变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type {
  Lesson3CardSelfTrialRecord,
  Module4Lesson3OptionKey,
  Module4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { MODULE4_LESSON_REGISTRY } from "@/modules/module-4-ai-info-detective/app/lesson-registry"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { evaluateLesson3QuickCheck } from "../utils/evaluate-lesson3-quickcheck"
import { buildLesson3CardContentFingerprint } from "../utils/build-lesson3-card-fingerprint"
import { invalidateStaleLesson3SelfTrials, resetLesson3SelfTrialForReturnToEditor } from "../utils/self-trial-invalidation"
import { QuestionCardSelfTrialPanel } from "../components/QuestionCardSelfTrialPanel"
import { SelfTrialStatusStrip } from "../components/SelfTrialStatusStrip"

type SelfTrialCardKey = "news" | "image"

const EDITOR_PATH: Record<SelfTrialCardKey, string> = {
  news: "/module/4/lesson/3/step/2",
  image: "/module/4/lesson/3/step/3",
}

function getLesson3PostSaveTarget() {
  const lesson4 = MODULE4_LESSON_REGISTRY.find(entry => entry.id === 4)
  if (lesson4?.available) {
    return { path: lesson4.path, label: "进入课时4" }
  }
  return { path: "/module/4", label: "返回模块首页" }
}

function updateSelfTrialRecord(
  record: Lesson3CardSelfTrialRecord,
  patch: Partial<Lesson3CardSelfTrialRecord>,
): Lesson3CardSelfTrialRecord {
  return { ...record, ...patch }
}

export default function Step4DualCardPreview() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState<SelfTrialCardKey>("news")

  useEffect(() => {
    if (!portfolio) return
    const normalized = invalidateStaleLesson3SelfTrials(portfolio.lesson3)
    if (normalized !== portfolio.lesson3) {
      void savePortfolio({
        ...portfolio,
        lesson3: {
          ...normalized,
          quickCheck: evaluateLesson3QuickCheck(normalized),
        },
      })
    }
  }, [portfolio, savePortfolio])

  if (!portfolio) return null

  const lesson3 = portfolio.lesson3
  const card = activeCard === "news" ? lesson3.newsCard : lesson3.imageCard
  const record = lesson3.selfTrial[activeCard]
  const bothConfirmed = lesson3.selfTrial.news.confirmed && lesson3.selfTrial.image.confirmed
  const canSave = bothConfirmed
    && lesson3.newsCard.selfCheck.allRequiredPassed
    && lesson3.imageCard.selfCheck.allRequiredPassed
  const postSaveTarget = getLesson3PostSaveTarget()

  const persistLesson3 = (nextLesson3: Module4Portfolio["lesson3"]) => {
    void savePortfolio({
      ...portfolio,
      lesson3: {
        ...nextLesson3,
        quickCheck: evaluateLesson3QuickCheck(nextLesson3),
      },
    })
  }

  const updateRecord = (patch: Partial<Lesson3CardSelfTrialRecord>) => {
    persistLesson3({
      ...lesson3,
      selfTrial: {
        ...lesson3.selfTrial,
        [activeCard]: updateSelfTrialRecord(record, patch),
      },
    })
  }

  const handleSelectOption = (key: Module4Lesson3OptionKey) => {
    if (record.submitted) return
    updateRecord({ selectedOptionKey: key, needsRetrial: false })
  }

  const handleSubmit = () => {
    if (!record.selectedOptionKey) return
    const isCorrect = card.task.correctOptionKey
      ? record.selectedOptionKey === card.task.correctOptionKey
      : undefined
    updateRecord({
      submitted: true,
      isCorrect,
      submittedAt: new Date().toISOString(),
      feedbackViewed: true,
      needsRetrial: false,
    })
  }

  const handleReturnToEditor = async (cardKind: SelfTrialCardKey) => {
    const nextLesson3 = resetLesson3SelfTrialForReturnToEditor(lesson3, cardKind)
    await savePortfolio({
      ...portfolio,
      lesson3: {
        ...nextLesson3,
        quickCheck: evaluateLesson3QuickCheck(nextLesson3),
      },
    })
    navigate(EDITOR_PATH[cardKind])
  }

  const handleConfirm = () => {
    if (!record.submitted || !record.feedbackViewed || record.confirmed) return
    persistLesson3({
      ...lesson3,
      selfTrial: {
        ...lesson3.selfTrial,
        [activeCard]: updateSelfTrialRecord(record, {
          confirmed: true,
          confirmedAt: new Date().toISOString(),
          contentFingerprint: buildLesson3CardContentFingerprint(card),
        }),
      },
    })
  }

  const saveV1 = async () => {
    if (lesson3.completed) {
      navigate(postSaveTarget.path)
      return
    }
    if (!canSave) return
    const now = new Date().toISOString()
    const nextLesson3 = {
      ...lesson3,
      step4Completed: true,
      newsCard: { ...lesson3.newsCard, status: "ready_for_lesson4" as const, updatedAt: now },
      imageCard: { ...lesson3.imageCard, status: "ready_for_lesson4" as const, updatedAt: now },
      finalPreviewConfirmed: true,
      finalPreviewConfirmedAt: now,
      completed: true,
      completedAt: now,
    }
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 3, stepId: 4 },
      lesson3: {
        ...nextLesson3,
        quickCheck: evaluateLesson3QuickCheck(nextLesson3),
      },
    })
    navigate(postSaveTarget.path)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 pb-4 sm:px-8 lg:px-10">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight">第4步 · 双卡自测试答与 V1 保存</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <SelfTrialStatusStrip
          hint="分别试答两张题卡，确认后保存 V1 初稿"
          selfTrial={lesson3.selfTrial}
          activeCard={activeCard}
          activeRecord={record}
          onSelectCard={setActiveCard}
          onReturnEditor={() => void handleReturnToEditor(activeCard)}
          onConfirm={handleConfirm}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <QuestionCardSelfTrialPanel
            card={card}
            record={record}
            onSelectOption={handleSelectOption}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <div className="mt-4 flex shrink-0 justify-end border-t pt-4">
        <Button onClick={() => void saveV1()} disabled={!lesson3.completed && !canSave}>
          {lesson3.completed ? postSaveTarget.label : "保存为课时3 V1 初稿，等待课时4互审与 V2 优化"}
        </Button>
      </div>
    </div>
  )
}
