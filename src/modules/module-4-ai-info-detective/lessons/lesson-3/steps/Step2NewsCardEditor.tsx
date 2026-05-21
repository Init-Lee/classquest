/**
 * 文件说明：模块 4 课时 3 第 2 步新闻题卡编辑页。
 * 职责：从课时 2 新闻素材生成快照草稿，并提供新闻题卡 V1 的编辑、预览、自审与保存入口。
 * 更新触发：新闻题卡字段、草稿迁移规则、编辑器布局或进入第 3 步策略变化时，需要同步更新本文件。
 */

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Module4Lesson3QuestionCardDraft, Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { evaluateLesson3QuickCheck } from "../utils/evaluate-lesson3-quickcheck"
import { ensureLesson3DraftFromLesson2 } from "../utils/build-lesson3-draft"
import { QuestionCardEditorLayout } from "../components/QuestionCardEditorLayout"
import type { Lesson3PreviewMode } from "../components/PreviewModeTabs"

export default function Step2NewsCardEditor() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const [previewMode, setPreviewMode] = useState<Lesson3PreviewMode>("before")

  useEffect(() => {
    if (!portfolio) return
    const draft = ensureLesson3DraftFromLesson2(portfolio.lesson3.newsCard, portfolio.lesson2.news)
    if (draft !== portfolio.lesson3.newsCard) {
      void savePortfolio({
        ...portfolio,
        lesson3: {
          ...portfolio.lesson3,
          newsCard: draft,
        },
      })
    }
  }, [portfolio, savePortfolio])

  if (!portfolio) return null

  const updateNewsCard = (newsCard: Module4Lesson3QuestionCardDraft) => {
    const nextLesson3 = {
      ...portfolio.lesson3,
      newsCard,
      step2Completed: newsCard.selfCheck.allRequiredPassed,
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
    if (!portfolio.lesson3.newsCard.selfCheck.allRequiredPassed) return
    const nextPortfolio: Module4Portfolio = {
      ...portfolio,
      progress: { lessonId: 3, stepId: 3 },
      lesson3: {
        ...portfolio.lesson3,
        step2Completed: true,
      },
    }
    void savePortfolio(nextPortfolio)
    navigate("/module/4/lesson/3/step/3")
  }

  return (
    <QuestionCardEditorLayout
      card={portfolio.lesson3.newsCard}
      previewMode={previewMode}
      onPreviewModeChange={setPreviewMode}
      onCardChange={updateNewsCard}
      onComplete={complete}
      completeButtonLabel="完成新闻题卡 V1，进入图片题卡"
      helperText="新闻题卡会从课时2新闻素材复制快照；你在这里填写题干、答案、解析和核验入口，不会改动课时2素材。"
    />
  )
}
