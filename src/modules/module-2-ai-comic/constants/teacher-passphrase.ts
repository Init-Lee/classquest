/**
 * 文件说明：模块 2 课堂口令校验。
 * 职责：为模块 2 首页教师入口提供授课口令比对；口令常量在本模块内独立声明，不引用其他模块。
 * 更新触发：课堂口令口径或入口校验规则变化时，需要同步更新本文件。
 */

/** 课堂口令，授课入口。与模块 1、模块 4 课堂口令口径一致，仅用于本模块校验。 */
const MODULE2_CLASSROOM_PASSPHRASE = "xnwy"

export function verifyModule2TeacherPassphrase(input: string): boolean {
  return input === MODULE2_CLASSROOM_PASSPHRASE
}
