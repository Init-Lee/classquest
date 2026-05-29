/**
 * 文件说明：模块 4 课时 3 第 3 步图片题卡编辑页。
 * 职责：从课时 2 图片素材生成快照草稿，并挂载图片题卡 V1 编辑工作台。
 * 更新触发：图片题卡字段、草稿迁移规则、工作台参数或进入第 4 步策略变化时，需要同步更新本文件。
 */

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { Module4Lesson3QuestionCardDraft, Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { evaluateLesson3QuickCheck } from "../utils/evaluate-lesson3-quickcheck"
import { ensureLesson3DraftFromLesson2 } from "../utils/build-lesson3-draft"
import { hasLesson2SnapshotDrift, syncLesson3CardWithLesson2Snapshot } from "../utils/lesson2-snapshot-sync"
import { invalidateLesson3SelfTrialOnCardSave } from "../utils/self-trial-invalidation"
import { QuestionCardEditorWorkbench } from "../components/QuestionCardEditorWorkbench"

export default function Step3ImageCardEditor() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()

  useEffect(() => {
    if (!portfolio) return
    const draft = ensureLesson3DraftFromLesson2(portfolio.lesson3.imageCard, portfolio.lesson2.image)
    if (draft !== portfolio.lesson3.imageCard) {
      void savePortfolio({
        ...portfolio,
        lesson3: {
          ...portfolio.lesson3,
          imageCard: draft,
        },
      })
    }
  }, [portfolio, savePortfolio])

  if (!portfolio) return null

  const updateImageCard = (imageCard: Module4Lesson3QuestionCardDraft) => {
    const withInvalidation = invalidateLesson3SelfTrialOnCardSave(
      portfolio.lesson3,
      "image",
      portfolio.lesson3.imageCard,
      imageCard,
    )
    const nextLesson3 = {
      ...withInvalidation,
      imageCard,
      step3Completed: imageCard.selfCheck.allRequiredPassed,
    }
    void savePortfolio({
      ...portfolio,
      lesson3: {
        ...nextLesson3,
        quickCheck: evaluateLesson3QuickCheck(nextLesson3),
      },
    })
  }

  const syncLatestLesson2Snapshot = () => {
    const previousCard = portfolio.lesson3.imageCard
    const syncedCard = syncLesson3CardWithLesson2Snapshot(previousCard, portfolio.lesson2.image)
    const withInvalidation = invalidateLesson3SelfTrialOnCardSave(
      portfolio.lesson3,
      "image",
      previousCard,
      syncedCard,
    )
    const nextLesson3 = {
      ...withInvalidation,
      imageCard: syncedCard,
      step3Completed: syncedCard.selfCheck.allRequiredPassed,
    }
    void savePortfolio({
      ...portfolio,
      lesson3: {
        ...nextLesson3,
        quickCheck: evaluateLesson3QuickCheck(nextLesson3),
      },
    })
  }

  const complete = () => {
    if (!portfolio.lesson3.imageCard.selfCheck.allRequiredPassed) return
    const nextPortfolio: Module4Portfolio = {
      ...portfolio,
      progress: { lessonId: 3, stepId: 4 },
      lesson3: {
        ...portfolio.lesson3,
        step3Completed: true,
      },
    }
    void savePortfolio(nextPortfolio)
    navigate("/module/4/lesson/3/step/4")
  }

  return (
    <QuestionCardEditorWorkbench
      cardType="image"
      card={portfolio.lesson3.imageCard}
      onCardChange={updateImageCard}
      onComplete={complete}
      completeLabel="完成图片题卡 V1，进入双卡自测"
      lesson2SnapshotOutdated={hasLesson2SnapshotDrift(portfolio.lesson3.imageCard, portfolio.lesson2.image)}
      onSyncLesson2Snapshot={syncLatestLesson2Snapshot}
    />
  )
}
