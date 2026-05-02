/**
 * 文件说明：模块 4 课时 1 第 3 关结构拆解页面。
 * 职责：承接第 2 关两张样例观察，将田字型四部分结构配对作为第 3 关主任务，验证学生是否真正理解题目卡结构。
 * 更新触发：田字型结构配对规则、Step 3 完成字段或结构图标反馈变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Lesson1StepLayout } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Lesson1StepLayout"
import { buildStructureFeedback } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/StructureLabelingTask"
import { Step2SampleStructureStage } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/components/Step2SampleStages"
import type { Step2StructureMatched } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"

const EMPTY_MATCHED: Step2StructureMatched = {
  material: false,
  task: false,
  explanation: false,
  source: false,
}

function allMatched(matched: Step2StructureMatched): boolean {
  return Object.values(matched).every(Boolean)
}

function mergeMatched(news: Step2StructureMatched, image: Step2StructureMatched): Step2StructureMatched {
  return {
    material: news.material && image.material,
    task: news.task && image.task,
    explanation: news.explanation && image.explanation,
    source: news.source && image.source,
  }
}

export default function Step3CardAnatomy() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  const initialMatched = portfolio
    ? mergeMatched(portfolio.lesson1.step2.news.structureMatched, portfolio.lesson1.step2.image.structureMatched)
    : EMPTY_MATCHED
  const [matchedParts, setMatchedParts] = useState<Step2StructureMatched>(initialMatched)
  const [activeLabelKey, setActiveLabelKey] = useState<CardPartKey | null>(null)
  const [feedback, setFeedback] = useState("")
  const [structureInteractionCount, setStructureInteractionCount] = useState(0)

  if (!portfolio) return null

  const canContinue = allMatched(matchedParts) || portfolio.lesson1.cardAnatomyCompleted

  const handleComplete = async () => {
    if (!canContinue) return
    const now = new Date().toISOString()
    const completedMatched = allMatched(matchedParts)
      ? matchedParts
      : { material: true, task: true, explanation: true, source: true }
    await savePortfolio({
      ...portfolio,
      progress: { lessonId: 1, stepId: 4 },
      lesson1: {
        ...portfolio.lesson1,
        step2: {
          ...portfolio.lesson1.step2,
          news: {
            ...portfolio.lesson1.step2.news,
            structureMatched: completedMatched,
            structureInteractionCount: portfolio.lesson1.step2.news.structureInteractionCount + structureInteractionCount,
            lastInteractionAt: now,
          },
          image: {
            ...portfolio.lesson1.step2.image,
            structureMatched: completedMatched,
            structureInteractionCount: portfolio.lesson1.step2.image.structureInteractionCount + structureInteractionCount,
            lastInteractionAt: now,
          },
        },
        cardAnatomyCompleted: true,
        cardAnatomyScore: 4,
        samplePartsConfirmed: true,
      },
    })
    navigate("/module/4/lesson/1/step/4")
  }

  const handleDropLabel = (partKey: CardPartKey, droppedKey: CardPartKey) => {
    setStructureInteractionCount(prev => prev + 1)
    setFeedback(buildStructureFeedback(partKey, droppedKey))
    setActiveLabelKey(null)
    if (partKey !== droppedKey) return
    setMatchedParts(prev => ({ ...prev, [partKey]: true }))
  }

  const handleTargetClick = (partKey: CardPartKey) => {
    if (!activeLabelKey) return
    handleDropLabel(partKey, activeLabelKey)
  }

  return (
    <Lesson1StepLayout
      title="第3关 · 四部分结构拆解"
      titleClassName="text-balance tracking-[0.06em] text-primary"
      subtitle="把第 2 关看到的题卡结构，放回田字型四个区域。"
      footer={(
        <Button onClick={handleComplete} disabled={!canContinue} className="gap-1.5">
          进入第4关：完整题卡长什么样？
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    >
      <Step2SampleStructureStage
        hideStageHeader
        matchedParts={matchedParts}
        activeLabelKey={activeLabelKey}
        feedback={feedback}
        onSelectLabel={setActiveLabelKey}
        onDropLabel={handleDropLabel}
        onTargetClick={handleTargetClick}
      />
    </Lesson1StepLayout>
  )
}
