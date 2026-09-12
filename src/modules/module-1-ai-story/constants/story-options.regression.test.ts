/**
 * 文件说明：模块 1 课时 2 课堂文学案例常量回归测试。
 * 职责：锁定三则课堂案例、异体用字、插图英文路径，以及课堂参照自动填入。
 * 更新触发：案例数量、原文用字、插图路径或课堂填入字段变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { MODULE1_LITERARY_CASES } from "@/modules/module-1-ai-story/constants/literary-cases"
import { buildModule1ClassroomReference } from "@/modules/module-1-ai-story/constants/story-options"

describe("模块 1 课时 2 课堂文学案例", () => {
  it("保留三则课堂案例且不改动关键原文用字", () => {
    expect(MODULE1_LITERARY_CASES.map(item => item.id)).toEqual(["shexi", "chameleon", "last_leaf"])
    const shexi = MODULE1_LITERARY_CASES[0]
    expect(shexi.excerpt).toContain("沈静")
    expect(shexi.excerpt).toContain("濔散")
    expect(shexi.illustrationSrc).toBe("/module-1/literary-cases/shexi.png")
    expect(shexi.illustrationAlt).toBe("《社戏》教学情境插画")
  })

  it("选用课堂案例时自动填入作品、片段、版本和出处", () => {
    const reference = buildModule1ClassroomReference("shexi")
    expect(reference?.workTitle).toBe("社戏")
    expect(reference?.author).toBe("鲁迅")
    expect(reference?.location).toBe("乘船前往赵庄的夜航片段")
    expect(reference?.excerpt).toContain("两岸的豆麦")
    expect(reference?.sourceNote).toContain("课堂材料：shexi")
    expect(reference?.sourceConfirmed).toBe(false)
  })
})
