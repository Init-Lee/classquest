/**
 * 文件说明：模块 1 教师讲解演示档案。
 * 职责：生成课堂演示用的 Module1Portfolio，供教师模式初始化和重置讲解状态使用，只存在于内存。
 * 更新触发：课时 1/2/3/4/5 演示字段、第 3/4 关必用外部 AI 过程、身份口径、进度指针或后续课时空态策略变化时，需要同步更新本文件。
 */

import {
  createEmptyModule1Lesson3AiProcess,
  createEmptyModule1Lesson3State,
  createEmptyModule1Lesson4AiProcess,
  createEmptyModule1Lesson4State,
  createEmptyModule1Lesson5AiProcess,
  createEmptyModule1Lesson5State,
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  patchModule1Lesson2ActiveReference,
  type Module1Lesson3AiProcess,
  type Module1Lesson4AiProcess,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { MODULE1_LESSON3_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson3-copy"
import { MODULE1_LESSON4_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson4-copy"
import { MODULE1_LESSON5_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson5-copy"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"

const DEMO_COMPLETED_AT = "2026-09-05T02:00:00.000Z"

function createDemoRequiredAiProcess(aiReply: string): Module1Lesson3AiProcess {
  return {
    ...createEmptyModule1Lesson3AiProcess(),
    generatedPromptSnapshot: "课堂演示提示词",
    copiedPrompt: "课堂演示提示词",
    aiReply,
    copySucceeded: true,
    copiedAt: DEMO_COMPLETED_AT,
    copyCount: 1,
  }
}

function createDemoLesson4AiProcess(aiReply: string, contextKey = "demo"): Module1Lesson4AiProcess {
  return {
    ...createEmptyModule1Lesson4AiProcess(),
    generatedPromptSnapshot: "课堂演示提示词",
    copiedPrompt: "课堂演示提示词",
    aiReply,
    copySucceeded: true,
    copiedAt: DEMO_COMPLETED_AT,
    copyCount: 1,
    contextKey,
  }
}

function createDemoLesson5AiProcess(aiReply: string, contextKey = "demo") {
  return {
    ...createEmptyModule1Lesson5AiProcess(),
    generatedPromptSnapshot: "课堂演示提示词",
    copiedPrompt: "课堂演示提示词",
    aiReply,
    copySucceeded: true,
    copiedAt: DEMO_COMPLETED_AT,
    copyCount: 1,
    contextKey,
  }
}

export function createModule1TeacherLecturePortfolio(): Module1Portfolio {
  const base = createNewModule1Portfolio({
    studentName: "演示学生",
    clazz: "初一（1）班",
    classSeatCode: "0101",
  })
  const classroomReference = buildModule1ClassroomReference(MODULE1_LESSON2_EXAMPLE.referenceCase)
  const normalized = normalizeModule1Portfolio({
    ...base,
    id: "module1-teacher-demo-portfolio",
    createdAt: DEMO_COMPLETED_AT,
    updatedAt: DEMO_COMPLETED_AT,
    progress: { lessonId: 5, stepId: 4 },
    lesson1: {
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      sdg: MODULE1_LESSON2_EXAMPLE.sdg,
      sdgWhy: "小区夜间照明和走路安全都和我每天回家的路有关。",
      cityIssue: MODULE1_LESSON2_EXAMPLE.cityIssue,
      audience: MODULE1_LESSON2_EXAMPLE.audience,
      audienceConcern: MODULE1_LESSON2_EXAMPLE.audienceConcern,
    },
    lesson2: {
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      contentVersion: 2,
      step1Completed: true,
      step2Completed: true,
      step2Round1Passed: true,
      step3Completed: true,
      step4Completed: true,
      study: {
        caseId: MODULE1_LESSON2_EXAMPLE.referenceCase,
        response: MODULE1_LESSON2_EXAMPLE.observation,
        aiReply: "",
        aiAssistUsed: false,
      },
      recommendationReply: "",
      reference: classroomReference
        ? patchModule1Lesson2ActiveReference(classroomReference, { sourceConfirmed: true })
        : undefined,
      analysisReply: "",
      writingPlan: MODULE1_LESSON2_EXAMPLE.writingPlan,
      reasonAiReply: "",
      reasonAiAssistUsed: false,
      reason: MODULE1_LESSON2_EXAMPLE.reason,
      character: {
        who: MODULE1_LESSON2_EXAMPLE.who,
        want: MODULE1_LESSON2_EXAMPLE.want,
        blocked: MODULE1_LESSON2_EXAMPLE.blocked,
        firstAction: MODULE1_LESSON2_EXAMPLE.firstAction,
        possibleChange: MODULE1_LESSON2_EXAMPLE.possibleChange,
      },
      characterAiReply: "",
      characterAiAssistUsed: false,
    },
    lesson3: {
      ...createEmptyModule1Lesson3State(),
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      observation: MODULE1_LESSON3_EXAMPLE.observation,
      openingPlan: MODULE1_LESSON3_EXAMPLE.openingPlan,
      focusTechnique: MODULE1_LESSON3_EXAMPLE.focusTechnique,
      storyTitle: MODULE1_LESSON3_EXAMPLE.storyTitle,
      draftText: MODULE1_LESSON3_EXAMPLE.draftText,
      draftFrozenText: MODULE1_LESSON3_EXAMPLE.draftText,
      finalText: MODULE1_LESSON3_EXAMPLE.finalText,
      decisionNote: MODULE1_LESSON3_EXAMPLE.decisionNote,
      aiProcess: {
        ...createEmptyModule1Lesson3State().aiProcess,
        p3: createDemoRequiredAiProcess("演示用的开头初稿回复。"),
        p4: createDemoRequiredAiProcess("演示用的检查意见回复。"),
      },
    },
    lesson4: {
      ...createEmptyModule1Lesson4State(),
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      observation: MODULE1_LESSON4_EXAMPLE.observation,
      plotPlan: MODULE1_LESSON4_EXAMPLE.plotPlan,
      planReason: MODULE1_LESSON4_EXAMPLE.planReason,
      draftText: MODULE1_LESSON4_EXAMPLE.draftText,
      draftFrozenText: MODULE1_LESSON4_EXAMPLE.draftText,
      finalText: MODULE1_LESSON4_EXAMPLE.finalText,
      decisionNote: MODULE1_LESSON4_EXAMPLE.decisionNote,
      revisionInstruction: MODULE1_LESSON4_EXAMPLE.revisionInstruction,
      preserveText: MODULE1_LESSON4_EXAMPLE.preserveText,
      selfCheck: true,
      aiProcess: {
        ...createEmptyModule1Lesson4State().aiProcess,
        p3: createDemoLesson4AiProcess("演示用的承段初稿回复。"),
        p4: createDemoLesson4AiProcess("演示用的检查意见回复。"),
      },
    },
    lesson5: {
      ...createEmptyModule1Lesson5State(),
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      observation: MODULE1_LESSON5_EXAMPLE.observation,
      plotPlan: MODULE1_LESSON5_EXAMPLE.plotPlan,
      planReason: MODULE1_LESSON5_EXAMPLE.planReason,
      draftText: MODULE1_LESSON5_EXAMPLE.draftText,
      draftFrozenText: MODULE1_LESSON5_EXAMPLE.draftText,
      finalText: MODULE1_LESSON5_EXAMPLE.finalText,
      decisionNote: MODULE1_LESSON5_EXAMPLE.decisionNote,
      revisionInstruction: MODULE1_LESSON5_EXAMPLE.revisionInstruction,
      preserveText: MODULE1_LESSON5_EXAMPLE.preserveText,
      selfCheck: true,
      aiProcess: {
        ...createEmptyModule1Lesson5State().aiProcess,
        p3: createDemoLesson5AiProcess("演示用的转段初稿回复。"),
        p4: createDemoLesson5AiProcess("演示用的检查意见回复。"),
      },
    },
  })
  return {
    ...normalized,
    progress: { lessonId: 5, stepId: 4 },
  }
}
