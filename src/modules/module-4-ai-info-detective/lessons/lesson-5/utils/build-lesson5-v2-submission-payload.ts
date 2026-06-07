/**
 * 文件说明：模块 4 课时 5 V2 提交 payload 构建工具。
 * 职责：从本地学生档案与 lesson4 ready 包派生后端 v2-submissions 所需字段，并统一 g7cXX classId 口径。
 * 更新触发：后端提交字段、班级 ID 规则、学生档案字段或 ready 包位置变化时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import type { Lesson5V2SubmissionPayload } from "@/modules/module-4-ai-info-detective/api/lesson5-types"
import type { Lesson5ReadyPackage } from "../types"

function deriveLesson5ClassId(classSeatCode: string, clazz: string): string {
  const prefix = classSeatCode.slice(0, 2)
  if (/^\d{2}$/.test(prefix)) return `g7c${prefix}`
  const digits = clazz.match(/\d+/)?.[0]
  return digits ? `g7c${digits.padStart(2, "0")}` : "g7c00"
}

export function buildLesson5V2SubmissionPayload(
  portfolio: Module4Portfolio,
  readyPackage: Lesson5ReadyPackage,
  lesson5ClientId: string,
): Lesson5V2SubmissionPayload {
  return {
    classId: deriveLesson5ClassId(portfolio.student.classSeatCode, portfolio.student.clazz),
    studentName: portfolio.student.studentName,
    classSeatCode: portfolio.student.classSeatCode,
    lesson5ClientId,
    readyPackage: readyPackage as unknown as Record<string, unknown>,
  }
}
