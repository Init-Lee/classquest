/**
 * 文件说明：课时 1 第 2 关本机记号的回归测试。
 * 职责：锁住“打开第 2 关后能在本机读回，不同档案互不影响”。
 * 更新触发：lesson1-step2-visit.ts 的记号口径变化时，需要同步更新本文件。
 */

import { afterEach, describe, expect, it, vi } from "vitest"
import { hasLesson1Step2Entered, markLesson1Step2Entered } from "./lesson1-step2-visit"

describe("课时 1 第 2 关本机记号", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("打开过后能读回，另一份档案不受影响", () => {
    const saved = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value) },
    })
    expect(hasLesson1Step2Entered("档案甲")).toBe(false)
    markLesson1Step2Entered("档案甲")
    expect(hasLesson1Step2Entered("档案甲")).toBe(true)
    expect(hasLesson1Step2Entered("档案乙")).toBe(false)
  })
})
