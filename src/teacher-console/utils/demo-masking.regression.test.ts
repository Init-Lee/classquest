/**
 * 文件说明：teacher-console demo 展示脱敏工具回归测试。
 * 职责：锁定 demo 角色判断、学生姓名、班级/座位标识和短标题最小脱敏口径。
 * 更新触发：demo 隐私展示规则、教师 session 角色契约或脱敏 helper 行为变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import type { TeacherSession } from "@/teacher-console/types"
import {
  maskDemoIdentifier,
  maskDemoStudentName,
  maskDemoText,
  shouldMaskTeacherDemo,
} from "./demo-masking"

function buildSession(role: TeacherSession["user"]["role"]): TeacherSession {
  return {
    token: "test-token",
    user: {
      userId: "user-1",
      account: "xnwy-demo",
      displayName: "测试账号",
      role,
    },
    classPermissions: [],
  }
}

describe("demo-masking", () => {
  it("仅 demo 角色需要展示脱敏", () => {
    expect(shouldMaskTeacherDemo(buildSession("demo"))).toBe(true)
    expect(shouldMaskTeacherDemo(buildSession("teacher"))).toBe(false)
    expect(shouldMaskTeacherDemo(buildSession("admin"))).toBe(false)
    expect(shouldMaskTeacherDemo(null)).toBe(false)
  })

  it("学生姓名保留首字符并统一补 xx", () => {
    expect(maskDemoStudentName("张三")).toBe("张xx")
    expect(maskDemoStudentName("欧阳娜娜")).toBe("欧xx")
    expect(maskDemoStudentName("")).toBe("匿名学生")
  })

  it("班级、座位与学号保留最小可读前缀", () => {
    expect(maskDemoIdentifier("A01")).toBe("Axx")
    expect(maskDemoIdentifier("20240123")).toBe("2024xx")
    expect(maskDemoIdentifier("0301")).toBe("03xx")
    expect(maskDemoIdentifier("七年级 3 班")).toBe("七年级 xx 班")
  })

  it("短标题只处理明显身份标识和文件名式姓名片段", () => {
    expect(maskDemoText("新闻 V3 0301")).toBe("新闻 V3 03xx")
    expect(maskDemoText("图片 A01")).toBe("图片 Axx")
    expect(maskDemoText("20240123 新闻题")).toBe("2024xx 新闻题")
    expect(maskDemoText("3 班 · 0301")).toBe("xx 班 · 03xx")
    expect(maskDemoText("王一诺-image-v2")).toBe("王xx-image-v2")
    expect(maskDemoText("王宇晨-image-v2")).toBe("王xx-image-v2")
    expect(maskDemoText("图片题卡 · 王一诺-image-v2")).toBe("图片题卡 · 王xx-image-v2")
    expect(maskDemoText("新闻题卡 · 王一诺-news-v2")).toBe("新闻题卡 · 王xx-news-v2")
    expect(maskDemoText("2班公共图片题：王一诺...")).toBe("2xx公共图片题：王xx...")
    expect(maskDemoText("素材标题：王者荣耀新闻题")).toBe("素材标题：王者荣耀新闻题")
  })
})
