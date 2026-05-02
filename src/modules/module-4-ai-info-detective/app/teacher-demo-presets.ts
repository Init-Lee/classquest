/**
 * 文件说明：模块 4 教师演示模式预设。
 * 职责：根据课堂讲解需要生成空白、进行中和已完成三种演示档案，供顶部教师横幅切换。
 * 更新触发：教师演示入口、演示进度档位或 Module4Portfolio 演示字段变化时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { normalizeModule4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import {
  createModule4CompletedDemoPortfolio,
  createModule4DemoPortfolio,
  createModule4InProgressDemoPortfolio,
} from "@/modules/module-4-ai-info-detective/constants/demo-portfolio"

export type TeacherDemoPresetId = "reset_full" | "lesson1_blank" | "lesson1_in_progress" | "lesson1_completed"

export function applyModule4TeacherDemoPreset(preset: TeacherDemoPresetId): Module4Portfolio {
  if (preset === "lesson1_in_progress") {
    return normalizeModule4Portfolio(createModule4InProgressDemoPortfolio())
  }

  if (preset === "lesson1_completed" || preset === "reset_full") {
    return normalizeModule4Portfolio(createModule4CompletedDemoPortfolio())
  }

  return normalizeModule4Portfolio(createModule4DemoPortfolio())
}
