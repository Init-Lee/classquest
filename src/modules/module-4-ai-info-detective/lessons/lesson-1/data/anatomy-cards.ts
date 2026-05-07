/**
 * 文件说明：课时 1 四部分题目卡拆解数据。
 * 职责：提供题目卡四部分定义和 Step 3 结构匹配题目，服务样例观察与结构拆解页面。
 * 更新触发：题目卡结构、四部分名称、Step 3 拆解样例或匹配规则变化时，需要同步更新本文件。
 */

import type { CardPartKey } from "@/modules/module-4-ai-info-detective/domains/question-card/types"

export interface CardPartDefinition {
  key: CardPartKey
  title: string
  description: string
}

export interface AnatomyItem {
  id: string
  text: string
  correctPart: CardPartKey
}

export const CARD_PARTS: CardPartDefinition[] = [
  {
    key: "material",
    title: "素材展示",
    description: "新闻标题 + 导语 / 正文片段，或单张静态图片。",
  },
  {
    key: "task",
    title: "判断任务",
    description: "请判断该内容是否存在 AI 痕迹，并从默认选项中作答。",
  },
  {
    key: "explanation",
    title: "解析",
    description: "由出题学生填写 1 条核心解析，用于说明正确答案的主要依据。",
  },
  {
    key: "source",
    title: "来源与核验入口",
    description: "填写素材来源方式及对应核验入口说明。",
  },
]

export const ANATOMY_ITEMS: AnatomyItem[] = [
  {
    id: "item-material",
    text: "某新闻标题 + 一段导语",
    correctPart: "material",
  },
  {
    id: "item-task",
    text: "请判断该内容是否存在 AI 痕迹",
    correctPart: "task",
  },
  {
    id: "item-explanation",
    text: "判断依据：该内容缺少明确出处，且表述高度模板化，因此需要进一步核验。",
    correctPart: "explanation",
  },
  {
    id: "item-source",
    text: "来源方式：网络来源；核验入口：原始发布平台或链接。",
    correctPart: "source",
  },
]
