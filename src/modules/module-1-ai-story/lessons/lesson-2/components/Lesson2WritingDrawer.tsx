/**
 * 文件说明：模块 1 课时 2 第 2 关右侧写作设定滑动抽屉。
 * 职责：复用共用抽屉壳，挂入课时 2 只读汇总；默认收起，开合不落盘。把手靠上并高于左右翻页箭头，避免抢位置。
 * 更新触发：课时 2 抽屉文案、有内容判定或汇总组件变化时，需要同步更新本文件。
 */

import type { Module1Lesson1State, Module1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { Module1WritingDrawer } from "@/modules/module-1-ai-story/features/writing-drawer/Module1WritingDrawer"
import { Lesson2WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-2/components/Lesson2WritingSummary"
import { hasModule1Lesson2ConfirmedSummary } from "@/modules/module-1-ai-story/lessons/lesson-2/utils/step2-round"

interface Lesson2WritingDrawerProps {
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
}

export function Lesson2WritingDrawer({
  lesson1,
  lesson2,
}: Lesson2WritingDrawerProps) {
  return (
    <Module1WritingDrawer
      title={MODULE1_LESSON2_SHARED_COPY.summaryTitle}
      handleLabel={MODULE1_LESSON2_SHARED_COPY.writingDrawerHandle}
      openLabel={MODULE1_LESSON2_SHARED_COPY.openWritingDrawer}
      closeLabel={MODULE1_LESSON2_SHARED_COPY.closeWritingDrawer}
      hasContent={hasModule1Lesson2ConfirmedSummary(lesson1, lesson2)}
    >
      <Lesson2WritingSummary lesson1={lesson1} lesson2={lesson2} />
    </Module1WritingDrawer>
  )
}
