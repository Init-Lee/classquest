/**
 * 文件说明：模块 4 课时 4 Step3 双卡确认进度工具单元测试。
 * 职责：锁定待确认题卡推导与 Step3 完成判定，防止确认后无法进入第 4 关的回归。
 * 更新触发：lesson4-v2-step3-progress.ts 中双卡确认或待确认推导规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  getPendingLesson4V2CardKind,
  isLesson4V2Step3Complete,
} from "./lesson4-v2-step3-progress"

describe("getPendingLesson4V2CardKind", () => {
  it("优先提示确认新闻题卡", () => {
    expect(getPendingLesson4V2CardKind(false, false)).toBe("news")
    expect(getPendingLesson4V2CardKind(false, true)).toBe("news")
  })

  it("新闻已确认后提示图片题卡", () => {
    expect(getPendingLesson4V2CardKind(true, false)).toBe("image")
  })

  it("两卡均已确认时无待确认", () => {
    expect(getPendingLesson4V2CardKind(true, true)).toBeNull()
  })
})

describe("isLesson4V2Step3Complete", () => {
  it("仅当两卡标记为已确认时返回 true", () => {
    expect(isLesson4V2Step3Complete({ newsConfirmed: false, imageConfirmed: false })).toBe(false)
    expect(isLesson4V2Step3Complete({ newsConfirmed: true, imageConfirmed: false })).toBe(false)
    expect(isLesson4V2Step3Complete({ newsConfirmed: false, imageConfirmed: true })).toBe(false)
    expect(isLesson4V2Step3Complete({ newsConfirmed: true, imageConfirmed: true })).toBe(true)
  })
})
