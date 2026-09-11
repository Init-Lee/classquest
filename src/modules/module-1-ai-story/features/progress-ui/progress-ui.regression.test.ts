/**
 * 文件说明：模块 1 双层进度回归测试。
 * 职责：验证无档案入口、模块级课时状态、课时内 Step 状态及其可点击边界。
 * 更新触发：模块 1 顶部进度、课内进度、课时开放规则或无档案 Guard 策略变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { buildModule1TopProgressItems } from "@/modules/module-1-ai-story/app/layout/module1-top-progress-state"
import { createNewModule1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"
import { getModule1Lesson1RouteRedirect } from "@/modules/module-1-ai-story/lessons/lesson-1/guards"
import { getModule1Lesson2RouteRedirect } from "@/modules/module-1-ai-story/lessons/lesson-2/guards"
import { buildModule1InnerStepItems } from "@/modules/module-1-ai-story/features/progress-ui/inner-step-progress-state"

function createPortfolio() {
  return createNewModule1Portfolio({
    clazz: "初一（1）班",
    studentName: "张三",
    classSeatCode: "0101",
  })
}

describe("模块 1 顶部课时进度", () => {
  it("无档案时课时 1 只回模块入口，其余课时锁定", () => {
    const items = buildModule1TopProgressItems(null, 0)
    expect(items[0]).toMatchObject({
      status: "available",
      target: "/module/1",
      clickable: true,
    })
    expect(items.slice(1).every(item => item.status === "locked" && !item.clickable)).toBe(true)
    expect(getModule1Lesson1RouteRedirect(null, 1)).toBe("/module/1")
    expect(getModule1Lesson1RouteRedirect(null, 4, true)).toBe("/module/1")
    expect(getModule1Lesson2RouteRedirect(null, 1)).toBe("/module/1")
  })

  it("有档案时标出当前课时且遵守开放规则", () => {
    const items = buildModule1TopProgressItems(createPortfolio(), 1)
    expect(items[0]).toMatchObject({ status: "current", clickable: true })
    expect(items[1]).toMatchObject({ status: "locked", target: null, clickable: false })
  })

  it("完成课时 1 后开放课时 2，课时 3 仍锁定", () => {
    const portfolio = createPortfolio()
    portfolio.lesson1.completed = true
    const items = buildModule1TopProgressItems(portfolio, 2)
    expect(items[0]).toMatchObject({ status: "completed", clickable: true })
    expect(items[1]).toMatchObject({ status: "current", clickable: true, target: "/module/1/lesson/2/step/1" })
    expect(items[2]).toMatchObject({ status: "locked", target: null, clickable: false })
    expect(items[2].subtitle).toContain("未开放")
  })
})

describe("模块 1 课时内 Step 进度", () => {
  it("区分完成、当前、可访问和锁定，并限制点击", () => {
    const steps = [1, 2, 3, 4].map(id => ({ id, label: `步骤 ${id}` }))
    const items = buildModule1InnerStepItems(steps, 2, [1], [1, 2, 3], [4])
    expect(items.map(item => item.status)).toEqual(["completed", "current", "accessible", "locked"])
    expect(items.map(item => item.clickable)).toEqual([true, false, true, false])
  })

  it("已完成课时的四关均可回看，但当前关不重复点击", () => {
    const steps = [1, 2, 3, 4].map(id => ({ id, label: `步骤 ${id}` }))
    const items = buildModule1InnerStepItems(steps, 4, [1, 2, 3, 4], [1, 2, 3, 4])
    expect(items.map(item => item.status)).toEqual(["completed", "completed", "completed", "current"])
    expect(items.map(item => item.clickable)).toEqual([true, true, true, false])
  })
})
