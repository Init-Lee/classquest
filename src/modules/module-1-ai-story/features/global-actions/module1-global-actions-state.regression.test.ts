/**
 * 文件说明：模块 1 顶栏按钮可用性回归测试。
 * 职责：锁定无档案、有档案、忙碌态和教师模式下的保存、导入、重置与阶段快照规则。
 * 更新触发：顶栏按钮策略、教师模式禁用或阶段快照可见条件变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  getModule1GlobalActionAvailability,
  getModule1SnapshotDisabledReason,
} from "@/modules/module-1-ai-story/features/global-actions/module1-global-actions-state"

describe("模块 1 顶栏三按钮可用性", () => {
  it("无档案时仅导入进度可用", () => {
    expect(getModule1GlobalActionAvailability(false, false)).toEqual({
      canSave: false,
      canImport: true,
      canReset: false,
      canSnapshot: false,
    })
  })

  it("有档案且空闲时三个主按钮都可用", () => {
    expect(getModule1GlobalActionAvailability(true, false)).toEqual({
      canSave: true,
      canImport: true,
      canReset: true,
      canSnapshot: false,
    })
  })

  it("忙碌时三个主按钮都禁用", () => {
    expect(getModule1GlobalActionAvailability(true, true)).toEqual({
      canSave: false,
      canImport: false,
      canReset: false,
      canSnapshot: false,
    })
    expect(getModule1GlobalActionAvailability(false, true).canImport).toBe(false)
  })

  it("教师模式禁用真实档案操作，仅在当前课时完成后开放阶段快照", () => {
    expect(getModule1GlobalActionAvailability(true, false, {
      isTeacherMode: true,
      snapshotReady: true,
      showSnapshot: true,
    })).toEqual({
      canSave: false,
      canImport: false,
      canReset: false,
      canSnapshot: true,
    })
    expect(getModule1SnapshotDisabledReason(true, false, "lesson1")).toContain("完成课时 1")
    expect(getModule1SnapshotDisabledReason(true, false, "lesson2")).toContain("完成课时 2")
  })
})
