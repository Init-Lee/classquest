/**
 * 文件说明：模块 1 SDG 常量回归测试。
 * 职责：锁定课时 1 第 2 关支架资料的可发布静态路径，以及编号+中文名的展示格式。
 * 更新触发：SDG 支架页发布路径、第 2 关外链约定或主题格式化规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { formatModule1SdgTheme, MODULE1_SDG_INTRO_HREF } from "@/modules/module-1-ai-story/constants/sdgs"

describe("模块 1 SDG 支架资料路径", () => {
  it("第 2 关外链指向 public 下的英文静态页", () => {
    expect(MODULE1_SDG_INTRO_HREF).toBe("/module-1/sdg-intro.html")
  })
})

describe("模块 1 SDG 主题展示", () => {
  it("空值显示待选择，已选值规范成编号加中文名", () => {
    expect(formatModule1SdgTheme("")).toBe("待选择")
    expect(formatModule1SdgTheme("11 可持续城市和社区")).toBe("11 可持续城市和社区")
    expect(formatModule1SdgTheme("SDG 11 可持续城市和社区")).toBe("11 可持续城市和社区")
    expect(formatModule1SdgTheme("5")).toBe("05 性别平等")
  })
})
