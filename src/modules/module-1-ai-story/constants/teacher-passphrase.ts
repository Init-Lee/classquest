/**
 * 文件说明：模块 1 课堂口令校验。
 * 职责：为首页教师入口提供授课口令比对；课堂口令，授课入口。
 * 更新触发：课堂口令口径或入口校验规则变化时，需要同步更新本文件。
 */

/** 课堂口令，授课入口。与模块 4 课堂口令口径一致，仅用于本模块校验。 */
const MODULE1_CLASSROOM_PASSPHRASE = "xnwy"

export function verifyModule1TeacherPassphrase(input: string): boolean {
  return input === MODULE1_CLASSROOM_PASSPHRASE
}
