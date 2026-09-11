/**
 * 文件说明：模块 1 自定义风格抽取器提示词回归测试。
 * 职责：锁定提示词只生成文本、转义学生输入，且不含站内调用模型的暗示。
 * 更新触发：抽取器提示词模板或输入嵌入方式变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { buildModule1CustomStyleExtractorPrompt } from "@/modules/module-1-ai-story/features/style-selector/build-custom-style-prompt"

describe("模块 1 自定义风格抽取器提示词", () => {
  it("把学生输入放进 JSON 字段并保持外部分析任务口径", () => {
    const prompt = buildModule1CustomStyleExtractorPrompt('雨停在午夜，街灯却像"失眠"的人')
    expect(prompt).toContain("文学风格分析师")
    expect(prompt).toContain('"input_text": "雨停在午夜，街灯却像\\"失眠\\"的人"')
    expect(prompt).toContain("【风格名称】")
    expect(prompt).toContain("【示例语句】")
    expect(prompt).not.toMatch(/API|接口|模型调用/)
  })
})
