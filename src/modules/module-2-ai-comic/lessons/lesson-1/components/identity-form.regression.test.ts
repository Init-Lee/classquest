/**
 * 文件说明：课时 1 第 1 关身份只读与缺项补填的回归测试。
 * 职责：锁住“文件里已有的班级、姓名、班学号不能被表单改写，只有缺的项用学生补上的内容”。
 * 更新触发：identity-form.ts 的文件身份锁、合并或确认口径变化时，需要同步更新本文件。
 */

import { describe, expect, it } from "vitest"
import {
  importedIdentityLocks,
  mergeReviewedIdentity,
  reviewedIdentityForConfirm,
  type Lesson1IdentityForm,
} from "./identity-form"
import type { StudentIdentity } from "@/modules/module-2-ai-comic/domains/portfolio/types"

const onFile: StudentIdentity = { clazz: "初一（1）班", studentName: "王芳", classSeatCode: "0108" }
const onMachine: StudentIdentity = { clazz: "初一（2）班", studentName: "李明", classSeatCode: "0203" }

function form(clazz: string, studentName: string, seatOnly: string): Lesson1IdentityForm {
  return { clazz, studentName, seatOnly }
}

describe("第 1 关文件身份只读与缺项", () => {
  it("只有文件里写了的身份项上锁，空白不算", () => {
    expect(importedIdentityLocks(onFile)).toEqual({ clazz: true, studentName: true, seatOnly: true })
    expect(importedIdentityLocks({ clazz: "  ", studentName: "", classSeatCode: "\n" })).toEqual({
      clazz: false,
      studentName: false,
      seatOnly: false,
    })
    expect(importedIdentityLocks({ clazz: "初一（4）班", studentName: "", classSeatCode: "" })).toEqual({
      clazz: true,
      studentName: false,
      seatOnly: false,
    })
  })

  it("合并时保留文件里的项，缺的项沿用这台电脑上的身份", () => {
    const file: StudentIdentity = { clazz: "初一（2）班", studentName: "李明", classSeatCode: "" }
    expect(mergeReviewedIdentity(onMachine, file)).toEqual({
      clazz: "初一（2）班",
      studentName: "李明",
      seatOnly: "03",
    })
    expect(mergeReviewedIdentity(onMachine, onFile).seatOnly).toBe("08")
  })

  it("确认时文件里的班学号原样保留，缺座号才用表单补", () => {
    const locks = importedIdentityLocks(onFile)
    expect(reviewedIdentityForConfirm(form("初一（9）班", "别人", "09"), onFile, locks)).toEqual(onFile)

    const missingSeat: StudentIdentity = { clazz: "初一（2）班", studentName: "李明", classSeatCode: "" }
    expect(reviewedIdentityForConfirm(
      form("初一（2）班", "李明", "03"),
      missingSeat,
      importedIdentityLocks(missingSeat),
    )).toEqual({ clazz: "初一（2）班", studentName: "李明", classSeatCode: "0203" })

    expect(reviewedIdentityForConfirm(form("初一（4）班", "赵六", "07"), null, null)).toEqual({
      clazz: "初一（4）班",
      studentName: "赵六",
      classSeatCode: "0407",
    })
  })
})
