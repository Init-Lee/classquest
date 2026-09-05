/**
 * 文件说明：模块 1 课堂口令校验回归测试。
 * 职责：覆盖口令比对的接受与拒绝，不描述课堂组织策略。
 * 更新触发：口令校验函数签名或比对规则变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import { verifyModule1TeacherPassphrase } from "@/modules/module-1-ai-story/constants/teacher-passphrase"

describe("模块 1 授课入口校验", () => {
  it("拒绝空值和错误输入", () => {
    expect(verifyModule1TeacherPassphrase("")).toBe(false)
    expect(verifyModule1TeacherPassphrase("wrong")).toBe(false)
    expect(verifyModule1TeacherPassphrase("XNWY")).toBe(false)
  })

  it("接受正确输入", () => {
    expect(verifyModule1TeacherPassphrase("xnwy")).toBe(true)
  })
})
