/**
 * 文件说明：模块 4 课时 4 完成后导航目标单元测试。
 * 职责：锁定 Step4 保存入库包后：课时 5 未开放时回模块首页，registry 开放时使用其 path。
 * 更新触发：MODULE4_LESSON_REGISTRY 课时 5 availability/path 或 getLesson4PostSaveTarget 规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { MODULE4_LESSON_REGISTRY } from "@/modules/module-4-ai-info-detective/app/lesson-registry"
import { getLesson4PostSaveTarget } from "./get-lesson4-post-save-target"

describe("getLesson4PostSaveTarget", () => {
  it("当前 registry 课时 5 未开放时返回模块 4 首页", () => {
    const lesson5 = MODULE4_LESSON_REGISTRY.find(entry => entry.id === 5)
    expect(lesson5?.available).toBe(false)
    expect(getLesson4PostSaveTarget()).toEqual({
      path: "/module/4",
      label: "返回模块首页",
    })
  })
})
