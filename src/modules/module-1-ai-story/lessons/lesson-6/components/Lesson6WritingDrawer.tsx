/**
 * 文件说明：模块 1 课时 6 四关右侧写作设定滑动抽屉。
 * 职责：复用模块共用抽屉壳，挂入课时 6 只读汇总；默认收起，开合不落盘，不挡关卡条。
 * 更新触发：课时 6 抽屉文案、有内容判定、汇总组件或四关挂载范围变化时，需要同步更新本文件。
 */

import type {
  Module1Lesson1State,
  Module1Lesson2State,
  Module1Lesson3State,
  Module1Lesson4State,
  Module1Lesson5State,
  Module1Lesson6State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON6_SHARED_COPY } from "@/modules/module-1-ai-story/constants/lesson6-copy"
import { Module1WritingDrawer } from "@/modules/module-1-ai-story/features/writing-drawer/Module1WritingDrawer"
import { Lesson6WritingSummary } from "@/modules/module-1-ai-story/lessons/lesson-6/components/Lesson6WritingSummary"
import { hasModule1Lesson6ConfirmedSummary } from "@/modules/module-1-ai-story/lessons/lesson-6/utils/build-lesson6-writing-summary"

interface Lesson6WritingDrawerProps {
  lesson1: Module1Lesson1State
  lesson2: Module1Lesson2State
  lesson3: Module1Lesson3State
  lesson4: Module1Lesson4State
  lesson5: Module1Lesson5State
  lesson6: Module1Lesson6State
}

export function Lesson6WritingDrawer({
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
}: Lesson6WritingDrawerProps) {
  return (
    <Module1WritingDrawer
      title={MODULE1_LESSON6_SHARED_COPY.summaryTitle}
      handleLabel={MODULE1_LESSON6_SHARED_COPY.writingDrawerHandle}
      openLabel={MODULE1_LESSON6_SHARED_COPY.openWritingDrawer}
      closeLabel={MODULE1_LESSON6_SHARED_COPY.closeWritingDrawer}
      hasContent={hasModule1Lesson6ConfirmedSummary(lesson1, lesson2, lesson3, lesson4, lesson5, lesson6)}
    >
      <Lesson6WritingSummary
        lesson1={lesson1}
        lesson2={lesson2}
        lesson3={lesson3}
        lesson4={lesson4}
        lesson5={lesson5}
        lesson6={lesson6}
      />
    </Module1WritingDrawer>
  )
}
