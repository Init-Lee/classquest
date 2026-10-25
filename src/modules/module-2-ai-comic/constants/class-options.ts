/**
 * 文件说明：模块 2 班级选项与四位班学号规则。
 * 职责：提供初一 1—12 班选项，并校验 / 组合“班级两位 + 座号两位”的四位班学号，供第 1 关身份核对与课时一 gate 使用。
 * 更新触发：年级、班级数量、班级命名或班学号范围变化时，需要同步更新本文件。
 *
 * 与模块一口径一致，独立维护：本文件从模块一 constants/class-options.ts 复制而来，模块 2 不 import 模块一代码；
 * 模块一口径调整时，需人工同步本文件及其回归测试。
 */

export const MODULE2_CLASS_OPTIONS = Array.from({ length: 12 }, (_, index) => `初一（${index + 1}）班`)

export function parseModule2ClassNumber(clazz: string): number | null {
  const match = clazz.trim().match(/^初一（(\d{1,2})）班$/)
  if (!match) return null
  const value = Number.parseInt(match[1], 10)
  return value >= 1 && value <= 12 ? value : null
}

export function validateModule2SeatOnly(clazz: string, raw: string): string | null {
  const digits = raw.trim().replace(/\D/g, "").slice(0, 2)
  if (parseModule2ClassNumber(clazz) === null) return "请先选择班级。"
  if (!/^\d{2}$/.test(digits)) return "学号后两位须为 2 位数字（01～50）。"
  const seat = Number.parseInt(digits, 10)
  return seat >= 1 && seat <= 50 ? null : "学号须在 01～50 之间。"
}

export function validateModule2ClassSeatCode(clazz: string, raw: string): string | null {
  const classNumber = parseModule2ClassNumber(clazz)
  if (classNumber === null) return "班级不在初一 1～12 班范围内。"
  if (!/^\d{4}$/.test(raw.trim())) return "班学号须为 4 位数字。"
  const expectedPrefix = String(classNumber).padStart(2, "0")
  if (!raw.startsWith(expectedPrefix)) return "班学号前两位与班级不一致。"
  const seat = Number.parseInt(raw.slice(2), 10)
  return seat >= 1 && seat <= 50 ? null : "班学号后两位须在 01～50 之间。"
}

export function composeModule2ClassSeatCode(clazz: string, seatRaw: string): string {
  const classNumber = parseModule2ClassNumber(clazz)
  if (classNumber === null || validateModule2SeatOnly(clazz, seatRaw)) {
    throw new Error("班级或学号不符合四位班学号规则。")
  }
  return `${String(classNumber).padStart(2, "0")}${seatRaw.replace(/\D/g, "").slice(0, 2)}`
}
