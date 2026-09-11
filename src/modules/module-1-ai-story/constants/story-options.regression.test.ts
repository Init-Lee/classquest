/**
 * 文件说明：模块 1 预设风格卡常量回归测试。
 * 职责：锁定 8 张 STYLE_CARDS 的数量、必需字段，以及课时 2 支架资料的英文静态路径。
 * 更新触发：风格卡数量、字段结构或支架资料路径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  getModule1StyleCardById,
  MODULE1_STYLE_CARDS,
  MODULE1_STYLE_WRITING_TEMPLATES_HREF,
} from "@/modules/module-1-ai-story/constants/story-options"

describe("模块 1 预设风格卡", () => {
  it("原样保存 8 张预设风格卡且不含死代码字段", () => {
    expect(MODULE1_STYLE_CARDS).toHaveLength(8)
    for (const card of MODULE1_STYLE_CARDS) {
      expect(card.id).toBeTruthy()
      expect(card.title).toBeTruthy()
      expect(card.sdg.length).toBeGreaterThan(0)
      expect(card.hint).toBeTruthy()
      expect(card.examples).toHaveLength(2)
      expect(card.examples[0]).toBeTruthy()
      expect(card.examples[1]).toBeTruthy()
      expect(card).not.toHaveProperty("details")
      expect(card).not.toHaveProperty("openings")
    }
    expect(getModule1StyleCardById("纪实")?.title).toBe("都市纪实时")
    expect(getModule1StyleCardById("custom")).toBeUndefined()
  })

  it("支架资料使用 public 下的英文路径", () => {
    expect(MODULE1_STYLE_WRITING_TEMPLATES_HREF).toBe("/module-1/style-writing-templates.html")
  })
})
