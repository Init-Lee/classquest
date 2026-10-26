/**
 * 文件说明：课时 1 第 1 关身份表单的纯转换。
 * 职责：在班级加两位座号与档案里的四位班学号之间转换，并判断文件身份和已有身份是否需要学生核对。
 * 更新触发：第 1 关身份字段、班学号规则或“不静默覆盖”的核对口径变化时，需要同步更新本文件。
 */

import {
  parseModule2ClassNumber,
  validateModule2ClassSeatCode,
  validateModule2SeatOnly,
} from "@/modules/module-2-ai-comic/constants/class-options"
import { isModule2IdentityComplete } from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import type { StudentIdentity } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export interface Lesson1IdentityForm {
  clazz: string
  studentName: string
  seatOnly: string
}

export function identityHasText(student: StudentIdentity): boolean {
  return [student.clazz, student.studentName, student.classSeatCode].some(value => value.trim() !== "")
}

export function sameIdentity(left: StudentIdentity, right: StudentIdentity): boolean {
  return left.clazz.trim() === right.clazz.trim()
    && left.studentName.trim() === right.studentName.trim()
    && left.classSeatCode.trim() === right.classSeatCode.trim()
}

export function identityToForm(student: StudentIdentity): Lesson1IdentityForm {
  const code = student.classSeatCode.trim()
  return {
    clazz: student.clazz.trim(),
    studentName: student.studentName.trim(),
    seatOnly: /^\d{4}$/.test(code) ? code.slice(2) : "",
  }
}

/** 已有身份优先，避免用文件里的身份悄悄换掉。全新学生才用文件预填。 */
export function initialReviewedIdentity(existing: StudentIdentity, file: StudentIdentity): Lesson1IdentityForm {
  return identityToForm(identityHasText(existing) ? existing : file)
}

export function formToIdentity(form: Lesson1IdentityForm): StudentIdentity {
  const classNumber = parseModule2ClassNumber(form.clazz)
  const seat = form.seatOnly.trim()
  const classSeatCode = classNumber !== null && /^\d{2}$/.test(seat)
    ? `${String(classNumber).padStart(2, "0")}${seat}`
    : ""
  return {
    clazz: form.clazz.trim(),
    studentName: form.studentName.trim(),
    classSeatCode,
  }
}

export function identityFieldErrors(form: Lesson1IdentityForm): Partial<Record<keyof Lesson1IdentityForm, string>> {
  const errors: Partial<Record<keyof Lesson1IdentityForm, string>> = {}
  if (!form.clazz.trim()) errors.clazz = "请选择班级。"
  else if (parseModule2ClassNumber(form.clazz) === null) errors.clazz = "班级不在初一 1～12 班范围内。"
  if (!form.studentName.trim()) errors.studentName = "请填写姓名。"
  else if (form.studentName.trim().length > 64) errors.studentName = "姓名太长。"
  if (!errors.clazz) {
    const seatError = validateModule2SeatOnly(form.clazz, form.seatOnly)
    if (seatError) errors.seatOnly = seatError
  } else {
    errors.seatOnly = "请先选择班级。"
  }
  if (!errors.clazz && !errors.seatOnly && !errors.studentName) {
    const identity = formToIdentity(form)
    const codeError = validateModule2ClassSeatCode(identity.clazz, identity.classSeatCode)
    if (codeError) errors.seatOnly = codeError
  }
  return errors
}

export function reviewedIdentityReady(form: Lesson1IdentityForm): boolean {
  return isModule2IdentityComplete(formToIdentity(form))
}

/** 两边都写了身份、而且对不上时，要学生看见差别。文件没写身份不算冲突。 */
export function identityConflict(existing: StudentIdentity, file: StudentIdentity): boolean {
  if (!isModule2IdentityComplete(existing) || !identityHasText(file)) return false
  return !sameIdentity(existing, file)
}

export function displayIdentity(student: StudentIdentity): string {
  return [
    student.clazz.trim() || "班级未填写",
    student.studentName.trim() || "姓名未填写",
    `班学号 ${student.classSeatCode.trim() || "未填写"}`,
  ].join(" · ")
}
