/**
 * 文件说明：模块 4 教师讲解档案常量。
 * 职责：生成课堂讲解用的 Module4Portfolio，供教师模式初始化和重置讲解状态使用，不写入学生真实数据。
 * 更新触发：Module4Portfolio 结构、课时 1 示例字段或教师讲解状态策略发生变化时，需要同步更新本文件。
 */

import type {
  Module4CompressedMaterialAsset,
  Module4Lesson2State,
  Module4Lesson3QuestionCardDraft,
  Module4Lesson3State,
  Module4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  createEmptyModule4Lesson2State,
  createEmptyModule4Lesson3State,
  createNewModule4Portfolio,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { buildLesson3DraftFromLesson2 } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/utils/build-lesson3-draft"
import { buildLesson3CardContentFingerprint } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/utils/build-lesson3-card-fingerprint"
import { evaluateLesson3QuickCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/utils/evaluate-lesson3-quickcheck"
import { evaluateLesson3SelfCheck } from "@/modules/module-4-ai-info-detective/lessons/lesson-3/utils/evaluate-lesson3-self-check"
import lesson2ImageSampleUrl from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step1-case-ai-image.jpg"
import lesson2NewsSampleUrl from "@/modules/module-4-ai-info-detective/lessons/lesson-2/assets/step1-case-news.png"

const DEMO_MISSION_QUIZ_PASSED_AT = "2026-04-28T02:00:00.000Z"
const DEMO_STEP2_INTERACTION_AT = "2026-04-28T02:08:00.000Z"
const DEMO_TEMPLATE_CONFIRMED_AT = "2026-04-28T02:16:00.000Z"
const DEMO_LESSON2_COMPLETED_AT = "2026-05-07T03:00:00.000Z"
const DEMO_LESSON3_AT = "2026-05-08T03:00:00.000Z"

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

function createDemoLesson2Asset(originalName: string, uploadCount: number, dataUrl: string, mimeType: Module4CompressedMaterialAsset["mimeType"]): Module4CompressedMaterialAsset {
  return {
    dataUrl,
    mimeType,
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
      asset: createDemoLesson2Asset("step1-case-news.png", 1, lesson2NewsSampleUrl, "image/jpeg"),
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
      asset: createDemoLesson2Asset("step1-case-ai-image.jpg", 2, lesson2ImageSampleUrl, "image/jpeg"),
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

function finalizeLesson3DemoCard(card: Module4Lesson3QuestionCardDraft): Module4Lesson3QuestionCardDraft {
  return {
    ...card,
    selfCheck: evaluateLesson3SelfCheck(card),
    updatedAt: DEMO_LESSON3_AT,
  }
}

function createLesson3NewsDemoCard(lesson2: Module4Lesson2State): Module4Lesson3QuestionCardDraft {
  const base = buildLesson3DraftFromLesson2("news", lesson2.news)
  return finalizeLesson3DemoCard({
    ...base,
    material: {
      ...base.material,
      displayNote: "展示学校科技栏目新闻截图，保留标题、平台名称与发布时间线索，供同学判断是否存在 AI 辅助编写痕迹。",
    },
    task: {
      ...base.task,
      prompt: "请结合标题、截图来源和正文线索，判断这则新闻是否存在明显的 AI 生成或 AI 辅助编写痕迹。",
      correctOptionKey: "C",
    },
    explanation: {
      text: "标题表述偏夸张，截图中的数据出处未在正文中完整呈现，需要核对发布平台、发布时间与原始报道是否一致，目前证据不足以直接下结论。",
      editCount: 1,
      updatedAt: DEMO_LESSON3_AT,
    },
    source: {
      ...base.source,
      verificationNote: "打开来源链接后，请核对发布时间、发布机构、正文是否与截图一致，并查找是否有其他权威报道交叉印证。",
    },
    aiReview: {
      enabled: true,
      status: "completed",
      lastRequestId: "demo_lesson3_news_ai_review",
      lastReviewedAt: DEMO_LESSON3_AT,
      isStale: false,
      errorMessage: "",
      result: {
        status: "pass",
        summary: "题卡结构完整，可以保存为 V1。",
        checks: [
          { area: "material", level: "ok", message: "素材展示完整。" },
          { area: "task", level: "ok", message: "判断任务与参考答案齐全。" },
          { area: "explanation", level: "ok", message: "核心解析已给出基本依据。" },
          { area: "source", level: "ok", message: "来源与核验入口清楚。" },
        ],
        missingRequiredFields: [],
        suggestedEdits: [],
        safetyFlags: [],
      },
      history: [],
    },
    metrics: {
      ...base.metrics,
      materialEditCount: 1,
      taskEditCount: 1,
      explanationEditCount: 1,
      sourceEditCount: 1,
      aiReviewRequestCount: 1,
    },
  })
}

function createLesson3ImageDemoCard(lesson2: Module4Lesson2State): Module4Lesson3QuestionCardDraft {
  const base = buildLesson3DraftFromLesson2("image", lesson2.image)
  return finalizeLesson3DemoCard({
    ...base,
    material: {
      ...base.material,
      displayNote: "展示 AI 生成图片样例，保留画面细节与生成记录线索，供同学判断是否存在明显 AI 痕迹。",
    },
    task: {
      ...base.task,
      prompt: "请结合画面细节、文字错乱和来源记录，判断这张图片是否存在明显的 AI 生成痕迹。",
      correctOptionKey: "A",
    },
    explanation: {
      text: "背景文字存在错乱，人物手指比例不自然，且来源记录指向 AI 生成工具，综合判断存在明显 AI 生成痕迹。",
      editCount: 1,
      updatedAt: DEMO_LESSON3_AT,
    },
    source: {
      ...base.source,
      verificationNote: "打开生成工具记录或原图来源后，请核对 Prompt 摘要、生成参数，或尝试反向搜图比对画面细节。",
    },
    aiReview: {
      enabled: true,
      status: "completed",
      lastRequestId: "demo_lesson3_image_ai_review",
      lastReviewedAt: DEMO_LESSON3_AT,
      isStale: false,
      errorMessage: "",
      result: {
        status: "pass",
        summary: "题卡结构完整，可以保存为 V1。",
        checks: [
          { area: "material", level: "ok", message: "素材展示完整。" },
          { area: "task", level: "ok", message: "判断任务与参考答案齐全。" },
          { area: "explanation", level: "ok", message: "核心解析已给出基本依据。" },
          { area: "source", level: "ok", message: "来源与核验入口清楚。" },
        ],
        missingRequiredFields: [],
        suggestedEdits: [],
        safetyFlags: [],
      },
      history: [],
    },
    metrics: {
      ...base.metrics,
      materialEditCount: 1,
      taskEditCount: 1,
      explanationEditCount: 1,
      sourceEditCount: 1,
      aiReviewRequestCount: 1,
    },
  })
}

function createLesson3TeacherDemoState(lesson2: Module4Lesson2State): Module4Lesson3State {
  const newsCard = createLesson3NewsDemoCard(lesson2)
  const imageCard = createLesson3ImageDemoCard(lesson2)
  const newsFingerprint = buildLesson3CardContentFingerprint(newsCard)
  const imageFingerprint = buildLesson3CardContentFingerprint(imageCard)
  const lesson3: Module4Lesson3State = {
    ...createEmptyModule4Lesson3State(),
    step1Acknowledged: true,
    step1AcknowledgedAt: DEMO_LESSON3_AT,
    step2Completed: true,
    step3Completed: true,
    newsCard,
    imageCard,
    selfTrial: {
      news: {
        submitted: true,
        selectedOptionKey: "C",
        isCorrect: true,
        submittedAt: DEMO_LESSON3_AT,
        feedbackViewed: true,
        confirmed: true,
        confirmedAt: DEMO_LESSON3_AT,
        contentFingerprint: newsFingerprint,
        needsRetrial: false,
      },
      image: {
        submitted: true,
        selectedOptionKey: "A",
        isCorrect: true,
        submittedAt: DEMO_LESSON3_AT,
        feedbackViewed: true,
        confirmed: true,
        confirmedAt: DEMO_LESSON3_AT,
        contentFingerprint: imageFingerprint,
        needsRetrial: false,
      },
    },
    finalPreviewConfirmed: false,
    completed: false,
  }
  return {
    ...lesson3,
    quickCheck: evaluateLesson3QuickCheck(lesson3),
  }
}

export function createModule4TeacherLecturePortfolio(): Module4Portfolio {
  const completed = createModule4CompletedDemoPortfolio()
  const lesson2 = createCompletedLesson2DemoState()
  const lesson3 = createLesson3TeacherDemoState(lesson2)
  return {
    ...completed,
    progress: { lessonId: 3, stepId: 2 },
    lesson2,
    lesson3,
  }
}
