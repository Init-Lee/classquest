/**
 * 文件说明：模块 1 教师讲解演示档案。
 * 职责：生成课堂演示用的 Module1Portfolio，供教师模式初始化和重置讲解状态使用，只存在于内存。
 * 更新触发：课时 1/2 演示字段、身份口径、进度指针或后续课时空态策略变化时，需要同步更新本文件。
 */

import {
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_LESSON2_EXAMPLE } from "@/modules/module-1-ai-story/constants/lesson2-copy"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"

const DEMO_COMPLETED_AT = "2026-09-05T02:00:00.000Z"

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
    progress: { lessonId: 2, stepId: 4 },
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
      step3Completed: true,
      step4Completed: true,
      study: {
        caseId: MODULE1_LESSON2_EXAMPLE.referenceCase,
        response: MODULE1_LESSON2_EXAMPLE.observation,
        aiReply: "",
      },
      recommendationReply: "",
      reference: classroomReference
        ? { ...classroomReference, sourceConfirmed: true }
        : undefined,
      analysisReply: "",
      writingPlan: MODULE1_LESSON2_EXAMPLE.writingPlan,
      reasonAiReply: "",
      reason: MODULE1_LESSON2_EXAMPLE.reason,
      character: {
        who: MODULE1_LESSON2_EXAMPLE.who,
        want: MODULE1_LESSON2_EXAMPLE.want,
        blocked: MODULE1_LESSON2_EXAMPLE.blocked,
        firstAction: MODULE1_LESSON2_EXAMPLE.firstAction,
        possibleChange: MODULE1_LESSON2_EXAMPLE.possibleChange,
      },
      characterAiReply: "",
    },
  })
  return {
    ...normalized,
    progress: { lessonId: 2, stepId: 4 },
  }
}
