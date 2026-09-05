/**
 * 文件说明：模块 1 顶栏三按钮可用性回归测试。
 * 职责：锁定无档案时仅导入可用、有档案且空闲时三按钮均可、忙碌时全部禁用。
 * 更新触发：顶栏按钮策略或无档案/忙碌可用性规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { getModule1GlobalActionAvailability } from "@/modules/module-1-ai-story/features/global-actions/module1-global-actions-state"

describe("模块 1 顶栏三按钮可用性", () => {
  it("无档案时仅导入进度可用", () => {
    expect(getModule1GlobalActionAvailability(false, false)).toEqual({
      canSave: false,
      canImport: true,
      canReset: false,
    })
  })

  it("有档案且空闲时三个主按钮都可用", () => {
    expect(getModule1GlobalActionAvailability(true, false)).toEqual({
      canSave: true,
      canImport: true,
      canReset: true,
    })
  })

  it("忙碌时三个主按钮都禁用", () => {
    expect(getModule1GlobalActionAvailability(true, true)).toEqual({
      canSave: false,
      canImport: false,
      canReset: false,
    })
    expect(getModule1GlobalActionAvailability(false, true).canImport).toBe(false)
  })
})
