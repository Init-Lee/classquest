/**
 * 文件说明：模块 1 课时 2 人物设定大纲 selector 与文本格式化器。
 * 职责：从风格与人物四格实时派生结构化大纲和弧光分析，以及 Step 4 交给外部 AI 的复制文本；不持久化派生结果。
 * 更新触发：课时 2 大纲字段、占位口径、弧光分析模板或复制策略变化时，需要同步更新本文件。
 */

import {
  hasMeaningfulModule1Lesson2Fields,
  MODULE1_CUSTOM_STYLE_ID,
  type Module1Lesson2State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getModule1StyleCardById } from "@/modules/module-1-ai-story/constants/story-options"

export interface Module1Lesson2CharacterOutline {
  title: string
  styleName: string
  styleWhy: string
  styleDetailsLabel: string
  styleHint: string
  styleExamples: string[]
  protagonistIdentity: string
  goal: string
  obstacle: string
  changeAction: string
  arcAnalysis: string
  complete: boolean
}

function classroomValue(value: string, emptyLabel: "待选择" | "待填写"): string {
  return value.trim() || emptyLabel
}

export function buildModule1Lesson2CharacterOutline(
  state: Module1Lesson2State,
): Module1Lesson2CharacterOutline {
  const preset = state.styleId && state.styleId !== MODULE1_CUSTOM_STYLE_ID
    ? getModule1StyleCardById(state.styleId)
    : undefined
  const styleHint = (preset?.hint || state.styleHint).trim()
  const styleExamples = (preset?.examples ?? state.styleExamples)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 2)
  const who = classroomValue(state.protagonistIdentity, "待填写")
  const want = classroomValue(state.goal, "待填写")
  const blocked = classroomValue(state.obstacle, "待填写")
  const change = classroomValue(state.changeAction, "待填写")

  return {
    title: "故事人物设定大纲",
    styleName: classroomValue(state.styleName, "待选择"),
    styleWhy: classroomValue(state.styleWhy, "待填写"),
    styleDetailsLabel: state.styleId === MODULE1_CUSTOM_STYLE_ID ? "自定义风格特点" : "风格特点",
    styleHint: styleHint || "待填写",
    styleExamples,
    protagonistIdentity: who,
    goal: want,
    obstacle: blocked,
    changeAction: change,
    arcAnalysis: `作为“${who}”，从“${blocked}”的困境出发，通过“${change}”的具体行动，最终实现“${want}”的目标，体现个人成长与社会责任。`,
    complete: hasMeaningfulModule1Lesson2Fields(state),
  }
}

export function formatModule1Lesson2CharacterOutline(outline: Module1Lesson2CharacterOutline): string {
  const examples = outline.styleExamples.length >= 2
    ? `\n   示例开头：\n   • ${outline.styleExamples[0]}\n   • ${outline.styleExamples[1]}`
    : ""
  return `【${outline.title}】

🎭 写作风格：${outline.styleName}
   选择理由：${outline.styleWhy}
   ${outline.styleDetailsLabel}：${outline.styleHint}${examples}

📝 人物弧光：
   我是谁：${outline.protagonistIdentity}
   我想要：${outline.goal}
   我卡在：${outline.obstacle}
   我改变：${outline.changeAction}

   弧光分析：${outline.arcAnalysis}

💡 写作提示：参考所选风格的示例开头，结合人物弧光设定，创作符合风格特点的故事开头。`
}

export function resolveModule1Lesson2CopyPayload(outline: Module1Lesson2CharacterOutline): {
  enabled: boolean
  text: string
} {
  return {
    enabled: outline.complete,
    text: formatModule1Lesson2CharacterOutline(outline),
  }
}
