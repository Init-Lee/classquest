/**
 * 文件说明：模块 4 教师讲解档案常量。
 * 职责：生成课堂讲解用的 Module4Portfolio，供教师模式初始化和重置讲解状态使用，不写入学生真实数据。
 * 更新触发：Module4Portfolio 结构、课时 1 示例字段或教师讲解状态策略发生变化时，需要同步更新本文件。
 */

import type { Module4CompressedMaterialAsset, Module4Lesson2State, Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  createEmptyModule4Lesson2State,
  createNewModule4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import lesson1ImageSampleSvg from "@/modules/module-4-ai-info-detective/lessons/lesson-1/assets/image-ai-library-robot.svg?raw"
import lesson1NewsSampleSvg from "@/modules/module-4-ai-info-detective/lessons/lesson-1/assets/news-screenshot-ai-reading.svg?raw"

const DEMO_MISSION_QUIZ_PASSED_AT = "2026-04-28T02:00:00.000Z"
const DEMO_STEP2_INTERACTION_AT = "2026-04-28T02:08:00.000Z"
const DEMO_TEMPLATE_CONFIRMED_AT = "2026-04-28T02:16:00.000Z"
const DEMO_LESSON2_COMPLETED_AT = "2026-05-07T03:00:00.000Z"

function createSvgDataUrl(svg: string, title: string, description: string): string {
  const cleaned = svg
    .replace(/<title[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<desc[\s\S]*?<\/desc>/, `<desc>${description}</desc>`)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleaned)}`
}

const DEMO_NEWS_DATA_URL = createSvgDataUrl(lesson1NewsSampleSvg, "课时1新闻样例截图", "教师模式沿用课时1新闻素材示例。")
const DEMO_IMAGE_DATA_URL = createSvgDataUrl(lesson1ImageSampleSvg, "课时1图片样例素材", "教师模式沿用课时1图片素材示例。")

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

function createDemoLesson2Asset(originalName: string, uploadCount: number, dataUrl: string): Module4CompressedMaterialAsset {
  return {
    dataUrl,
    mimeType: "image/webp",
    originalName,
    originalSizeBytes: 420000,
    compressedSizeBytes: 120000,
    width: 960,
    height: 600,
    compressedAt: DEMO_LESSON2_COMPLETED_AT,
    uploadCount,
  }
}

function createCompletedLesson2DemoState(): Module4Lesson2State {
  const base = createEmptyModule4Lesson2State()
  const lesson2: Module4Lesson2State = {
    ...base,
    step1Completed: true,
    step2Completed: true,
    step3Completed: true,
    step4Completed: true,
    step5Completed: true,
    taskBoundaryAcknowledged: true,
    step1ContextDwellMs: 45000,
    step1ContextViewedAt: DEMO_LESSON2_COMPLETED_AT,
    step1CaseAnswers: {
      "news-with-source": "可以继续",
      "image-no-source": "需要补信息",
      "privacy-photo": "建议更换",
    },
    criteriaAttempts: [
      {
        attemptNo: 1,
        submittedAt: DEMO_LESSON2_COMPLETED_AT,
        score: 4,
        answers: [
          { exampleId: "short-video", selectedCriterion: "typeFits", isCorrect: true },
          { exampleId: "forwarded-no-origin", selectedCriterion: "sourceTraceable", isCorrect: true },
          { exampleId: "classmate-face", selectedCriterion: "contentCompliant", isCorrect: true },
          { exampleId: "obvious-joke", selectedCriterion: "hasJudgmentValue", isCorrect: true },
        ],
      },
    ],
    criteriaExampleScore: 4,
    criteriaExampleAttemptCount: 1,
    news: {
      ...base.news,
      initialStatus: "ready",
      postCriteriaStatus: "usable",
      asset: createDemoLesson2Asset("课时1新闻样例截图.svg", 1, DEMO_NEWS_DATA_URL),
      titleOrName: "AI 新闻素材演示",
      sourceType: "web",
      sourceRecord: "学校科技栏目网页截图，保留标题、平台和发布时间线索。",
      sourceAutoPassed: true,
      sourceCheckCount: 1,
      sourceCheckLastReason: "来源记录格式通过：已填写链接或平台线索。",
      selfChecks: { typeFits: true, contentCompliant: true, hasJudgmentValue: true },
      clueNote: "标题与正文片段需要进一步核验 AI 相关表述是否准确。",
      clueEditCount: 1,
      peerFeedbackNote: "同伴提醒需要在下一课补充核验入口。",
      peerFeedbackEditCount: 1,
      completed: true,
      completedAt: DEMO_LESSON2_COMPLETED_AT,
    },
    image: {
      ...base.image,
      initialStatus: "incomplete",
      postCriteriaStatus: "need_fix",
      asset: createDemoLesson2Asset("课时1图片样例素材.svg", 2, DEMO_IMAGE_DATA_URL),
      titleOrName: "AI 图片素材演示",
      sourceType: "ai_generated",
      sourceRecord: "课堂演示用 AI 生成图片，记录工具名称和 Prompt 摘要。",
      sourceAutoPassed: true,
      sourceCheckCount: 2,
      sourceCheckLastReason: "来源记录格式通过：已说明生成工具、Prompt 摘要或生成记录。",
      selfChecks: { typeFits: true, contentCompliant: true, hasJudgmentValue: true },
      clueNote: "背景文字存在错乱，可能有 AI 生成或后期加工痕迹。",
      clueEditCount: 2,
      peerFeedbackNote: "同伴建议保留生成记录截图作为下一课来源线索。",
      peerFeedbackEditCount: 1,
      completed: true,
      completedAt: DEMO_LESSON2_COMPLETED_AT,
    },
    quickCheck: {
      T1: {
        achieved: true,
        evidence: {
          newsAssetReady: true,
          imageAssetReady: true,
          newsShortNameReady: true,
          imageShortNameReady: true,
        },
      },
      T2: {
        achieved: true,
        evidence: {
          criteriaCalibrationCompleted: true,
          newsSourceCheckPassed: true,
          imageSourceCheckPassed: true,
          newsSelfChecksCompleted: true,
          imageSelfChecksCompleted: true,
        },
      },
      T3: {
        achieved: true,
        evidence: {
          newsClueNoteValid: true,
          imageClueNoteValid: true,
        },
      },
      evaluatedAt: DEMO_LESSON2_COMPLETED_AT,
      metrics: {
        criteriaAttemptCount: 1,
        newsUploadCount: 1,
        imageUploadCount: 2,
        newsSourceCheckCount: 1,
        imageSourceCheckCount: 2,
        newsClueEditCount: 1,
        imageClueEditCount: 2,
        newsPeerOrSelfNoteEditCount: 1,
        imagePeerOrSelfNoteEditCount: 1,
      },
    },
    completed: true,
    completedAt: DEMO_LESSON2_COMPLETED_AT,
  }
  return lesson2
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
    progress: { lessonId: 2, stepId: 1 },
    lesson2: createCompletedLesson2DemoState(),
  }
}
