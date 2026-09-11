/**
 * 文件说明：模块 1 课时 2 人物设定大纲回归测试。
 * 职责：锁定预设/自定义风格摘要、四格弧光分析和完成关复制 payload，确认大纲不依赖落盘派生字段。
 * 更新触发：课时 2 大纲 selector、格式化模板、复制策略或占位文案变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { createEmptyModule1Lesson2State } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { MODULE1_STYLE_CARDS } from "@/modules/module-1-ai-story/constants/story-options"
import {
  buildModule1Lesson2CharacterOutline,
  resolveModule1Lesson2CopyPayload,
} from "@/modules/module-1-ai-story/lessons/lesson-2/utils/build-lesson2-character-outline"

describe("模块 1 课时 2 人物设定大纲", () => {
  it("未填写时保留结构并禁用复制", () => {
    const outline = buildModule1Lesson2CharacterOutline(createEmptyModule1Lesson2State())
    expect(outline.styleName).toBe("待选择")
    expect(outline.protagonistIdentity).toBe("待填写")
    expect(outline.arcAnalysis).toContain("待填写")
    expect(resolveModule1Lesson2CopyPayload(outline).enabled).toBe(false)
  })

  it("预设风格读取卡面特点与示例，自定义风格读取档案字段", () => {
    const presetCard = MODULE1_STYLE_CARDS[0]
    const preset = buildModule1Lesson2CharacterOutline({
      ...createEmptyModule1Lesson2State(),
      styleId: presetCard.id,
      styleName: presetCard.title,
      styleWhy: "给值班家长看，需要现场证据。",
      protagonistIdentity: "值日生",
      goal: "西门可通行",
      obstacle: "单车占道",
      changeAction: "连续三天计数",
    })
    expect(preset.styleDetailsLabel).toBe("风格特点")
    expect(preset.styleHint).toBe(presetCard.hint)
    expect(preset.styleExamples).toEqual([...presetCard.examples])

    const custom = buildModule1Lesson2CharacterOutline({
      ...createEmptyModule1Lesson2State(),
      styleId: "custom",
      styleName: "冷白描",
      styleWhy: "适合说服物业。",
      styleHint: "短句；证据；少抒情",
      styleExamples: ["开头一", "开头二"],
      protagonistIdentity: "值日生",
      goal: "西门可通行",
      obstacle: "单车占道",
      changeAction: "连续三天计数",
    })
    expect(custom.styleDetailsLabel).toBe("自定义风格特点")
    expect(custom.styleHint).toBe("短句；证据；少抒情")
    expect(custom.styleExamples).toEqual(["开头一", "开头二"])
    expect(resolveModule1Lesson2CopyPayload(custom).enabled).toBe(true)
    expect(resolveModule1Lesson2CopyPayload(custom).text).toContain("冷白描")
  })
})
