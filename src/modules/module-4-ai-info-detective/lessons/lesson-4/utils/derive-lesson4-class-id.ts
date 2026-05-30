/**
 * 文件说明：课时 4 同伴互审 classId 派生工具。
 * 职责：从学生档案统一生成 create / inbox 使用的 classId，避免送审与收件箱查询键不一致。
 * 更新触发：班级命名规则、班学号格式或后端 class_id 约定变化时，需要同步更新本文件。
 */

/**
 * 从班学号前两位派生 classId（如 0222 → class-02）；班学号异常时回退到班级名称中的数字。
 */
export function deriveLesson4ClassId(classSeatCode: string, clazz: string): string {
  const prefix = classSeatCode.slice(0, 2)
  if (/^\d{2}$/.test(prefix)) {
    return `class-${prefix}`
  }
  const digits = clazz.match(/\d+/g)?.join("-")
  return digits ? `class-${digits}` : "class-demo"
}
