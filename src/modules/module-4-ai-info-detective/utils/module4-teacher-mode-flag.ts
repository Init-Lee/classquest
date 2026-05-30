/**
 * 文件说明：模块 4 教师讲解模式运行时标志。
 * 职责：通过 sessionStorage 向非 React 层（如 lesson4 adapter）暴露教师模式状态，避免教师演示时发起真实 HTTP。
 * 更新触发：教师模式入口/出口策略、存储键名或 adapter 读取方式变化时，需要同步更新本文件。
 */

const MODULE4_TEACHER_MODE_STORAGE_KEY = "module4_teacher_mode"

/** 进入/退出教师模式时同步 sessionStorage，供 adapter 在 shouldUseHttp 中读取。 */
export function setModule4TeacherModeFlag(enabled: boolean): void {
  if (typeof sessionStorage === "undefined") return
  if (enabled) {
    sessionStorage.setItem(MODULE4_TEACHER_MODE_STORAGE_KEY, "1")
    return
  }
  sessionStorage.removeItem(MODULE4_TEACHER_MODE_STORAGE_KEY)
}

/** adapter 层判断：当前是否处于教师讲解模式（强制 fixture、零 lesson4 HTTP）。 */
export function isModule4TeacherModeActive(): boolean {
  if (typeof sessionStorage === "undefined") return false
  return sessionStorage.getItem(MODULE4_TEACHER_MODE_STORAGE_KEY) === "1"
}
