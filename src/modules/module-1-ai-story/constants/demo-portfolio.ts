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
import { MODULE1_STYLE_CARDS } from "@/modules/module-1-ai-story/constants/story-options"

const DEMO_COMPLETED_AT = "2026-09-05T02:00:00.000Z"
const DEMO_STYLE = MODULE1_STYLE_CARDS[0]

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
    progress: { lessonId: 2, stepId: 4 },
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
    lesson2: {
      step: 4,
      completed: true,
      completedAt: DEMO_COMPLETED_AT,
      step1Completed: true,
      step2Completed: true,
      step3Completed: true,
      step4Completed: true,
      styleId: DEMO_STYLE.id,
      styleName: DEMO_STYLE.title,
      styleWhy: "值周老师和值班家长更信现场事实。纪实口吻能把西门占道写成可观察的放学秩序问题，而不是抱怨。",
      styleHint: DEMO_STYLE.hint,
      styleExamples: [...DEMO_STYLE.examples],
      protagonistIdentity: "七年级值日生，每天放学帮老师看西门，给值班家长写说明。",
      goal: "把放学后西门人行道连续 10 分钟保持可通行，同学不用走到机动车道边上。",
      obstacle: "共享单车被随手停进盲道；有人说反正一会儿就走；门口没有立刻可看的停放提示。",
      changeAction: "连续三天在 16:40 拍照并数占道车辆；把统计贴在值周看板；约物业在西门外画出临时停放框。",
    },
  })
  return {
    ...normalized,
    progress: { lessonId: 2, stepId: 4 },
  }
}
