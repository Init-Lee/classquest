/**
 * 文件说明：模块四班学号校验工具。
 * 职责：解析班级序号；支持「仅学号后两位」输入（左侧配合班级前缀展示，合成四位班学号）或完整四位校验。
 * 更新触发：班级命名格式、班学号位数或学号范围规则变化时，需要同步更新本文件。
 */

/** 从「初一（n）班」解析 n，失败返回 null */
export function parseModule4ClassNumber(clazz: string): number | null {
  const m = clazz.trim().match(/初一（(\d{1,2})）班/)
  if (!m) return null
  const n = Number.parseInt(m[1], 10)
  if (!Number.isFinite(n) || n < 1 || n > 12) return null
  return n
}

/** 班学号：4 位数字；前两位 = 班级序号（01–12）；后两位班内学号 01–50 */
export function validateModule4ClassSeatCode(clazz: string, raw: string): string | null {
  const trimmed = raw.trim().replace(/\D/g, "").slice(0, 4)
  if (trimmed.length !== 4) {
    return "班学号须为 4 位数字。"
  }
  const classNum = parseModule4ClassNumber(clazz)
  if (classNum === null) {
    return "请先选择班级。"
  }
  const prefix = String(classNum).padStart(2, "0")
  if (trimmed.slice(0, 2) !== prefix) {
    return `班学号前两位须与班级一致（应为 ${prefix} 开头）。`
  }
  const seat = Number.parseInt(trimmed.slice(2), 10)
  if (!Number.isFinite(seat) || seat < 1 || seat > 50) {
    return "班学号后两位须在 01～50 之间。"
  }
  return null
}

/**
 * 仅学号后两位（2 位数字 01～50），须已选择合法班级；登记表单左侧展示班级前缀，与本字段合成四位班学号。
 */
export function validateModule4SeatOnly(clazz: string, raw: string): string | null {
  const digits = raw.trim().replace(/\D/g, "").slice(0, 2)
  if (digits.length !== 2) {
    return "学号后两位须为 2 位数字（01～50）。"
  }
  const classNum = parseModule4ClassNumber(clazz)
  if (classNum === null) {
    return "请先选择班级。"
  }
  const seat = Number.parseInt(digits, 10)
  if (!Number.isFinite(seat) || seat < 1 || seat > 50) {
    return "学号须在 01～50 之间。"
  }
  return null
}

/**
 * 由班级 + 两位学号合成四位班学号（形如 01xx、12xx）。请先通过 validateModule4SeatOnly 再调用。
 */
export function composeModule4ClassSeatFromSeat(clazz: string, seatRaw: string): string {
  const digits = seatRaw.trim().replace(/\D/g, "").slice(0, 2)
  const classNum = parseModule4ClassNumber(clazz)!
  const prefix = String(classNum).padStart(2, "0")
  const seat = Number.parseInt(digits, 10)
  return `${prefix}${String(seat).padStart(2, "0")}`
}
