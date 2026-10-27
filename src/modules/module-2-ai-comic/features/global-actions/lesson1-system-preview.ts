/**
 * 文件说明：模块 2 课时 1「系统初看」纯函数。
 * 职责：只根据档案里已经存在的字段，给三项各返回一个档位和一句事实说明。档位只有「材料齐全」「待补充」「需教师判断」。返回的是数据，不带 HTML，不写学生档案，也不生成快照。
 * 边界：这是字段与规则检查，不是教师评价，不代表目标已经达成。本函数不返回 √、×、分数或「已通过」，也不能替老师填写教师记录。以后若引入 agent 助手，agent 的判断必须另起一栏，不能写入教师记录，也不能覆盖这里的系统初看。本文件不实现 agent。
 * 更新触发：三项档位规则、事实说明口径，或门禁里身份、四句确认、视觉词计数、重核、教学样例的含义变化时，需要同步更新本文件与阶段快照回归测试。
 */

import {
  isModule2IdentityComplete,
  normalizeModule2VisualWords,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  MODULE2_FOUR_PARTS,
  type FourPart,
  type Module2PortfolioV1,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

/**
 * 门禁函数把前一关绑在后一关上，不能直接当成单项档位。
 * 身份是否齐全调用 isModule2IdentityComplete，视觉词个数调用 normalizeModule2VisualWords。
 * 四句是否已确认、视觉方向是否已确认、是否需要重核、是否教学样例，读取门禁已经在用的同一字段。
 * 不另写人物、地点、动作或故事情绪判断。
 */

export const MODULE2_LESSON1_SYSTEM_LEVELS = ["材料齐全", "待补充", "需教师判断"] as const

export type Module2Lesson1SystemLevel = (typeof MODULE2_LESSON1_SYSTEM_LEVELS)[number]

export interface Module2Lesson1SystemLook {
  level: Module2Lesson1SystemLevel
  /** 一句事实说明，纯文本。 */
  fact: string
}

export interface Module2Lesson1SystemPreview {
  /** 任务要求与三项职责。材料齐全不会出现在这一项。 */
  task: Module2Lesson1SystemLook
  /** 起承转合四句画面。 */
  scenes: Module2Lesson1SystemLook
  /** 视觉词与理由。 */
  visual: Module2Lesson1SystemLook
}

const PART_LABELS: Record<FourPart, string> = {
  opening: "起",
  development: "承",
  turn: "转",
  ending: "合",
}

const TASK_NEEDS_TEACHER = "只看到观察句已填写，不能据此判断是否分得清作者选取、AI 生成、作者核查。"
const SCENES_READY = "四句已填写并确认。"
const VISUAL_READY = "已有 2–3 个不同视觉词，理由已填写。"

function sentence(parts: string[]): string {
  return `${parts.join("；")}。`
}

function previewTask(portfolio: Module2PortfolioV1): Module2Lesson1SystemLook {
  const missing: string[] = []
  if (!isModule2IdentityComplete(portfolio.student)) {
    missing.push("班级、姓名或班学号还没填好")
  }
  const source = portfolio.sourceSnapshot
  if (!source) {
    missing.push("还没有确认自己的小说")
  } else if (source.isTeachingSample) {
    missing.push("现在用的是教学样例，还不是自己的小说")
  }
  if (!portfolio.lesson1.sampleViewed) missing.push("还没有看过样例")
  if (portfolio.lesson1.sampleObservation.trim() === "") missing.push("第 2 关观察还没写")
  if (missing.length > 0) return { level: "待补充", fact: sentence(missing) }
  return { level: "需教师判断", fact: TASK_NEEDS_TEACHER }
}

function previewScenes(portfolio: Module2PortfolioV1): Module2Lesson1SystemLook {
  const { storyboard, lesson1, sourceSnapshot: source } = portfolio
  const emptyLabels = MODULE2_FOUR_PARTS
    .filter(part => storyboard.frames[part].sceneSentence.trim() === "")
    .map(part => PART_LABELS[part])
  const confirmed = storyboard.confirmedAt !== null
  if (emptyLabels.length > 0 || !confirmed) {
    const missing: string[] = []
    if (emptyLabels.length > 0) missing.push(`${emptyLabels.join("、")}还是空的`)
    if (!confirmed) {
      missing.push(lesson1.reviewNeeded.storyboard ? "换小说后还没有重新确认四句" : "四句还没有确认")
    }
    return { level: "待补充", fact: sentence(missing) }
  }

  const reasons: string[] = []
  if (source?.isTeachingSample) reasons.push("来源是教学样例")
  if (lesson1.reviewNeeded.storyboard) reasons.push("换小说后需要重新核对")
  const matchesCurrentNovel = Boolean(source && storyboard.sourceSnapshotId === source.id)
  if (!matchesCurrentNovel) reasons.push("对不上现在这篇小说")
  if (reasons.length > 0) {
    return { level: "需教师判断", fact: `四句已经确认，但${reasons.join("，")}。` }
  }
  return { level: "材料齐全", fact: SCENES_READY }
}

function previewVisual(portfolio: Module2PortfolioV1): Module2Lesson1SystemLook {
  const { visualDirection, lesson1 } = portfolio
  const words = normalizeModule2VisualWords(visualDirection.words)
  const confirmed = visualDirection.confirmedAt !== null
  const missing: string[] = []
  if (words.length === 0) missing.push("还没有视觉词")
  else if (words.length < 2) missing.push("不同的视觉词不到 2 个")
  else if (words.length > 3) missing.push("不同的视觉词超过 3 个")
  if (visualDirection.reason.trim() === "") missing.push("理由还没写")
  if (!confirmed) {
    missing.push(lesson1.reviewNeeded.visualDirection
      ? "前面改过之后，视觉词和理由还没有重新确认"
      : "视觉词和理由还没有确认")
  }
  if (missing.length > 0) return { level: "待补充", fact: sentence(missing) }
  if (lesson1.reviewNeeded.visualDirection) {
    return { level: "需教师判断", fact: "视觉词和理由已经确认，但前面改过，需要重新核对。" }
  }
  return { level: "材料齐全", fact: VISUAL_READY }
}

/** 三项按教案顺序返回。调用方只展示，不在这里写教师记录。 */
export function previewModule2Lesson1SystemLook(portfolio: Module2PortfolioV1): Module2Lesson1SystemPreview {
  return {
    task: previewTask(portfolio),
    scenes: previewScenes(portfolio),
    visual: previewVisual(portfolio),
  }
}
