/**
 * 文件说明：学生领域类型定义
 * 职责：定义学生身份相关的类型，是整个应用中用户身份的基础数据结构
 * 更新触发：需要新增学生属性（如年级、教师等）时
 */

/** 学生角色：组长或组员 */
export type StudentRole = "leader" | "member"

/** 学生个人信息 */
export interface StudentProfile {
  /** 班级，如"七年级2班" */
  clazz: string
  /** 学生姓名 */
  studentName: string
  /** 小组名称 */
  groupName: string
  /** 角色：组长 / 组员 */
  role: StudentRole
}
