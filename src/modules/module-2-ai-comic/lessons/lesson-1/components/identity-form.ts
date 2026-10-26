/**
 * 文件说明：课时 1 第 1 关身份表单的纯转换。
 * 职责：在班级加两位座号与档案里的四位班学号之间转换；文件里已经读到的身份保持原样，只有缺的班级、姓名或班学号用表单补上。
 * 更新触发：第 1 关身份字段、班学号规则、文件身份只读或缺项补填口径变化时，需要同步更新本文件。
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

/** 文件里非空的身份项视为已读到，界面只读；空白不算读到。 */
export function importedIdentityLocks(file: StudentIdentity): Record<keyof Lesson1IdentityForm, boolean> {
  return {
    clazz: file.clazz.trim() !== "",
    studentName: file.studentName.trim() !== "",
    seatOnly: file.classSeatCode.trim() !== "",
  }
}

/** 已读到的项用文件；缺的项沿用这台电脑上已经写下的身份。 */
export function mergeReviewedIdentity(existing: StudentIdentity, file: StudentIdentity): Lesson1IdentityForm {
  const fromFile = identityToForm(file)
  const fromExisting = identityToForm(existing)
  return {
    clazz: file.clazz.trim() ? fromFile.clazz : fromExisting.clazz,
    studentName: file.studentName.trim() ? fromFile.studentName : fromExisting.studentName,
    seatOnly: file.classSeatCode.trim() ? fromFile.seatOnly : fromExisting.seatOnly,
  }
}

/**
 * 确认时采用的身份。
 * 文件里读到的班级、姓名、班学号原样保留；只有没锁上的项用表单。
 * 不传文件锁时，整份表单就是学生自己填写的身份。
 */
export function reviewedIdentityForConfirm(
  form: Lesson1IdentityForm,
  file: StudentIdentity | null,
  locks: Partial<Record<keyof Lesson1IdentityForm, boolean>> | null,
): StudentIdentity {
  const fromForm = formToIdentity(form)
  if (!file || !locks) return fromForm
  let classSeatCode = fromForm.classSeatCode
  if (locks.seatOnly && (locks.clazz || classSeatCode === "")) {
    classSeatCode = file.classSeatCode.trim()
  }
  return {
    clazz: locks.clazz ? file.clazz.trim() : fromForm.clazz,
    studentName: locks.studentName ? file.studentName.trim() : fromForm.studentName,
    classSeatCode,
  }
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
