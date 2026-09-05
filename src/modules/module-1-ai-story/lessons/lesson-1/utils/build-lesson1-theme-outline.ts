/**
 * 文件说明：模块 1 课时 1 故事主题大纲 selector 与文本格式化器。
 * 职责：从五个课时字段实时派生结构化大纲、主题核心和可复制纯文本，不持久化派生结果。
 * 更新触发：课时 1 大纲字段、占位口径、主题核心模板或故事年份迁移到 Phase 3 集中常量时，需要同步更新本文件。
 */

import type { Module1Lesson1State } from "@/modules/module-1-ai-story/domains/portfolio/types"

// Phase 3 引入 writing-constraints 时，将此唯一课时常量迁移到该文件，避免年份口径分叉。
export const MODULE1_LESSON1_STORY_YEAR = 2035

export interface Module1Lesson1ThemeOutline {
  title: string
  sdgTheme: string
  selectionReason: string
  cityIssue: string
  audience: string
  audienceConcern: string
  themeCore: string
  complete: boolean
}

function classroomValue(value: string, emptyLabel: "待选择" | "待填写"): string {
  return value.trim() || emptyLabel
}

export function buildModule1Lesson1ThemeOutline(
  state: Module1Lesson1State,
): Module1Lesson1ThemeOutline {
  const sdgTheme = classroomValue(state.sdg, "待选择")
  const selectionReason = classroomValue(state.sdgWhy, "待填写")
  const cityIssue = classroomValue(state.cityIssue, "待填写")
  const audience = classroomValue(state.audience, "待填写")
  const audienceConcern = classroomValue(state.audienceConcern, "待填写")
  const complete = [state.sdg, state.sdgWhy, state.cityIssue, state.audience, state.audienceConcern]
    .every(value => value.trim().length > 0)

  return {
    title: "故事主题设定大纲",
    sdgTheme,
    selectionReason,
    cityIssue,
    audience,
    audienceConcern,
    themeCore: `围绕“${cityIssue}”这个具体问题，通过 ${MODULE1_LESSON1_STORY_YEAR} 年回信的形式，向“${audience}”展示解决方案，体现所选 SDG“${sdgTheme}”的实践意义。`,
    complete,
  }
}

export function formatModule1Lesson1ThemeOutline(outline: Module1Lesson1ThemeOutline): string {
  return `【${outline.title}】

📋 SDG 主题：${outline.sdgTheme}
   选择理由：${outline.selectionReason}

🏙️ 城市问题：${outline.cityIssue}

👥 受众分析：
   写给：${outline.audience}
   关注点：${outline.audienceConcern}

💡 主题核心：${outline.themeCore}`
}
