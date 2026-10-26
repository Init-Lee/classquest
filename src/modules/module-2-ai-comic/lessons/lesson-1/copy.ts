/**
 * 文件说明：模块 2 课时 1 给学生看的固定文案。
 * 职责：集中放置四关标题说明、起承转合提示、人机职责、AARON 延展和学习目标；不放小说正文，正文只来自学生档案或样例清单。
 * 更新触发：课时 1 页面说明、三项目标表述、职责顺序或 AARON 延展文案变化时，需要同步更新本文件。
 */

import type { FourPart } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export const LESSON1_PARTS: { id: FourPart; label: string; hint: string }[] = [
  { id: "opening", label: "起", hint: "读者先看见谁，遇到什么处境？" },
  { id: "development", label: "承", hint: "人物做了什么，事情怎样向前？" },
  { id: "turn", label: "转", hint: "发生了什么关键变化，人物的做法或认识如何体现在行动中？" },
  { id: "ending", label: "合", hint: "最后留下什么状态或动作？开放结尾也可以。" },
]

export const LESSON1_RESPONSIBILITIES = [
  "作者选时刻与方向",
  "AI 按条件生成",
  "作者对照原作核查与选择",
] as const

export const LESSON1_AARON = {
  title: "AARON 小故事",
  body: "Harold Cohen 长期设计规则和程序，让机器能够作画。人仍然要作出表达和系统设计上的选择。AARON 不是今天这种用提示词生成画面的模型，也不能凭画风判断是不是 AI 画的。",
  href: "https://whitney.org/exhibitions/harold-cohen-aaron",
  linkLabel: "Whitney Museum 官方展览",
} as const

export const LESSON1_GOALS = [
  "能结合样例说明四格漫画与创作记录的任务要求，并区分作者选取、AI 生成、作者核查三项职责。",
  "能从已确认小说中选出起、承、转、合四个关键时刻，写成包含人物、地点和主要动作的四句画面描述。",
  "能用 2—3 个视觉词说明初步风格，并用一句话解释该风格与故事情绪的关系。",
] as const

export const LESSON1_SCENE_PROMPT = "谁，在什么地方，正在做什么？"

export const LESSON1_REASON_PLACEHOLDER = "我选择……，因为我的故事希望让读者感到/看清……"
