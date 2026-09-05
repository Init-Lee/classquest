/**
 * 文件说明：模块 1 教师讲解演示档案。
 * 职责：生成课堂演示用的 Module1Portfolio，供教师模式初始化和重置讲解状态使用，只存在于内存。
 * 更新触发：课时 1 演示字段、身份口径、进度指针或后续课时空态策略变化时，需要同步更新本文件。
 */

import {
  createNewModule1Portfolio,
  normalizeModule1Portfolio,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

const DEMO_COMPLETED_AT = "2026-09-05T02:00:00.000Z"

export function createModule1TeacherLecturePortfolio(): Module1Portfolio {
  const base = createNewModule1Portfolio({
    studentName: "演示学生",
    clazz: "初一（1）班",
    classSeatCode: "0101",
  })
  const normalized = normalizeModule1Portfolio({
    ...base,
    id: "module1-teacher-demo-portfolio",
    createdAt: DEMO_COMPLETED_AT,
    updatedAt: DEMO_COMPLETED_AT,
    progress: { lessonId: 1, stepId: 4 },
    lesson1: {
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      sdg: "11 可持续城市和社区",
      sdgWhy: "放学后在小区里走路，经常要绕开乱停的共享单车，这和我们每天回家的路直接相关。",
      cityIssue: "学校西门放学后，共享单车占满人行道，同学只能走到机动车道边上。",
      audience: "2025 年的值周老师和值班家长",
      audienceConcern: "放学秩序、行人安全和门口通行是否还能保持畅通。",
    },
  })
  return {
    ...normalized,
    progress: { lessonId: 1, stepId: 4 },
  }
}
