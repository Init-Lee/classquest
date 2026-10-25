/**
 * 文件说明：模块 2 班级选项与四位班学号校验回归测试。
 * 职责：锁定与模块一一致的口径：初一 1—12 班、班学号 = 两位班号 + 两位座号（01—50），以及组合函数的拒绝规则。
 * 更新触发：constants/class-options.ts 的班级范围或班学号规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  composeModule2ClassSeatCode,
  MODULE2_CLASS_OPTIONS,
  parseModule2ClassNumber,
  validateModule2ClassSeatCode,
  validateModule2SeatOnly,
} from "./class-options"

describe("模块 2 班级选项与班学号", () => {
  it("提供初一 1—12 班", () => {
    expect(MODULE2_CLASS_OPTIONS).toHaveLength(12)
    expect(MODULE2_CLASS_OPTIONS[0]).toBe("初一（1）班")
    expect(parseModule2ClassNumber("初一（12）班")).toBe(12)
    expect(parseModule2ClassNumber("初一（13）班")).toBeNull()
    expect(parseModule2ClassNumber("初二（1）班")).toBeNull()
  })

  it("四位班学号：前两位与班级一致、后两位 01—50", () => {
    expect(validateModule2ClassSeatCode("初一（3）班", "0312")).toBeNull()
    expect(validateModule2ClassSeatCode("初一（3）班", "0412")).toContain("前两位")
    expect(validateModule2ClassSeatCode("初一（3）班", "0351")).toContain("01～50")
    expect(validateModule2ClassSeatCode("初一（3）班", "0300")).toContain("01～50")
    expect(validateModule2ClassSeatCode("初一（3）班", "312")).toContain("4 位")
    expect(validateModule2ClassSeatCode("", "0312")).toContain("班级")
  })

  it("座号校验与组合", () => {
    expect(validateModule2SeatOnly("初一（10）班", "7")).toContain("2 位")
    expect(validateModule2SeatOnly("初一（10）班", "07")).toBeNull()
    expect(composeModule2ClassSeatCode("初一（10）班", "07")).toBe("1007")
    expect(() => composeModule2ClassSeatCode("初一（10）班", "99")).toThrow()
  })
})
