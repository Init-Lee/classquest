/**
 * 文件说明：模块 4 教师讲解档案常量。
 * 职责：生成课堂讲解用的 Module4Portfolio，供教师模式初始化和重置讲解状态使用，不写入学生真实数据。
 * 更新触发：Module4Portfolio 结构、课时 1 示例字段或教师讲解状态策略发生变化时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { createNewModule4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

const DEMO_MISSION_QUIZ_PASSED_AT = "2026-04-28T02:00:00.000Z"
const DEMO_STEP2_INTERACTION_AT = "2026-04-28T02:08:00.000Z"
const DEMO_TEMPLATE_CONFIRMED_AT = "2026-04-28T02:16:00.000Z"

const DEMO_STEP2_COMPLETED = {
  introViewed: true,
  currentPage: "image" as const,
  news: {
    answered: true,
    selectedOptionKey: "C" as const,
    isCorrect: true,
    selectedAt: DEMO_STEP2_INTERACTION_AT,
    answeredAt: DEMO_STEP2_INTERACTION_AT,
    explanationViewedAt: DEMO_STEP2_INTERACTION_AT,
    materialPreviewOpenedCount: 1,
    structureInteractionCount: 4,
    lastInteractionAt: DEMO_STEP2_INTERACTION_AT,
    explanationRevealed: true,
    structureMatched: { material: true, task: true, explanation: true, source: true },
  },
  image: {
    answered: true,
    selectedOptionKey: "A" as const,
    isCorrect: true,
    selectedAt: DEMO_STEP2_INTERACTION_AT,
    answeredAt: DEMO_STEP2_INTERACTION_AT,
    explanationViewedAt: DEMO_STEP2_INTERACTION_AT,
    materialPreviewOpenedCount: 1,
    structureInteractionCount: 4,
    lastInteractionAt: DEMO_STEP2_INTERACTION_AT,
    explanationRevealed: true,
    structureMatched: { material: true, task: true, explanation: true, source: true },
  },
  completed: true,
}

export function createModule4DemoPortfolio(): Module4Portfolio {
  return {
    ...createNewModule4Portfolio({
      studentName: "演示学生",
      clazz: "初一（1）班",
      classSeatCode: "0101",
    }),
    id: "module4-teacher-demo-portfolio",
  }
}

export function createModule4InProgressDemoPortfolio(): Module4Portfolio {
  const base = createModule4DemoPortfolio()
  return {
    ...base,
    progress: { lessonId: 1, stepId: 3 },
    lesson1: {
      ...base.lesson1,
      missionAcknowledged: true,
      outcomeCheckPassed: true,
      missionQuizAttempts: [
        {
          attemptNo: 1,
          submittedAt: DEMO_MISSION_QUIZ_PASSED_AT,
          answers: { q1: "B", q2: "B", q3: "A" },
          wrongQuestionIds: [],
          passed: true,
        },
      ],
      missionQuizPassedAt: DEMO_MISSION_QUIZ_PASSED_AT,
      step2: DEMO_STEP2_COMPLETED,
      newsSampleViewed: true,
      imageSampleViewed: true,
      samplePartsConfirmed: true,
    },
  }
}

export function createModule4CompletedDemoPortfolio(): Module4Portfolio {
  const base = createModule4DemoPortfolio()
  return {
    ...base,
    progress: { lessonId: 2, stepId: 1 },
    lesson1: {
      missionAcknowledged: true,
      outcomeCheckPassed: true,
      missionQuizAttempts: [
        {
          attemptNo: 1,
          submittedAt: DEMO_MISSION_QUIZ_PASSED_AT,
          answers: { q1: "B", q2: "B", q3: "A" },
          wrongQuestionIds: [],
          passed: true,
        },
      ],
      missionQuizPassedAt: DEMO_MISSION_QUIZ_PASSED_AT,
      step2: DEMO_STEP2_COMPLETED,
      newsSampleViewed: true,
      imageSampleViewed: true,
      samplePartsConfirmed: true,
      cardAnatomyCompleted: true,
      cardAnatomyScore: 4,
      quizFlowSimulated: true,
      beforeAfterReason: "已确认完整题卡由素材展示、判断任务、解析、来源与核验入口四部分组成。",
      fullCardTemplateConfirmed: true,
      fullCardTemplateConfirmedAt: DEMO_TEMPLATE_CONFIRMED_AT,
      personalTaskChecklistCompleted: true,
      materialPrepChecklistKeys: ["prepareNewsPack", "prepareImagePack", "keepSourceRecord", "avoidUnsuitableMaterial", "exitAndAvoid"],
      materialPrepChecklistCompletedAt: DEMO_TEMPLATE_CONFIRMED_AT,
      step5: {
        newsPlanText: "从学校公众号、主流新闻网站或科技栏目中找一条有明确来源的新闻。",
        imagePlanText: "选择一张校园宣传图或 AI 生成图，并保留来源记录或生成说明。",
        newsPossibleSourceType: "news_site",
        imagePossibleSourceType: "ai_generated",
        exitAndAvoidAcknowledged: true,
        confirmed: {
          prepareNewsPack: true,
          prepareImagePack: true,
          keepSourceRecord: true,
          avoidUnsuitableMaterial: true,
        },
        completed: true,
      },
      newsSourcePlan: "从学校公众号、主流新闻网站或科技栏目中找一条有明确来源的新闻。",
      imageSourcePlan: "选择一张校园宣传图或 AI 生成图，并保留来源记录或生成说明。",
      completed: true,
    },
  }
}

export function createModule4TeacherLecturePortfolio(): Module4Portfolio {
  const completed = createModule4CompletedDemoPortfolio()
  return {
    ...completed,
    progress: { lessonId: 1, stepId: 1 },
  }
}
