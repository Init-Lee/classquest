/**
 * 文件说明：模块 1 SDG 常量回归测试。
 * 职责：锁定课时 1 第 2 关支架资料的可发布静态路径，避免中文文件名或 SPA 路由路径被误改。
 * 更新触发：SDG 支架页发布路径或第 2 关外链约定变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { MODULE1_SDG_INTRO_HREF } from "@/modules/module-1-ai-story/constants/sdgs"

describe("模块 1 SDG 支架资料路径", () => {
  it("第 2 关外链指向 public 下的英文静态页", () => {
    expect(MODULE1_SDG_INTRO_HREF).toBe("/module-1/sdg-intro.html")
  })
})
