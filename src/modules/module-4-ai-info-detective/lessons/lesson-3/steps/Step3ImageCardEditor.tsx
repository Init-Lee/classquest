/**
 * 文件说明：模块 4 课时 3 第 3 步图片题卡编辑页。
 * 职责：从课时 2 图片素材生成快照草稿，并挂载图片题卡 V1 编辑工作台。
 * 更新触发：图片题卡字段、草稿迁移规则、工作台参数或进入第 4 步策略变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Module4Lesson3QuestionCardDraft, Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { evaluateLesson3QuickCheck } from "../utils/evaluate-lesson3-quickcheck"
import { ensureLesson3DraftFromLesson2 } from "../utils/build-lesson3-draft"
import { QuestionCardEditorWorkbench } from "../components/QuestionCardEditorWorkbench"
import type { Lesson3PreviewMode } from "../components/PreviewModeTabs"

export default function Step3ImageCardEditor() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [previewMode, setPreviewMode] = useState<Lesson3PreviewMode>("before")

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
    const nextLesson3 = {
      ...portfolio.lesson3,
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
      previewMode={previewMode}
      onPreviewModeChange={setPreviewMode}
      onCardChange={updateImageCard}
      onComplete={complete}
      completeLabel="完成图片题卡 V1，进入双卡总览"
    />
  )
}
