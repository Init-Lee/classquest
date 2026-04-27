/**
 * 文件说明：ClassQuest 平台层类型定义。
 * 职责：描述平台门户可识别的模块元数据，不承载任何模块内部课程业务类型。
 * 更新触发：模块注册表需要新增展示字段、状态字段或平台级导航约定时，需要同步更新本文件。
 */

export type ModuleStatus = "active" | "draft" | "planned"

export interface PlatformModuleEntry {
  id: string
  title: string
  subtitle: string
  slug: string
  route: string
  status: ModuleStatus
  grade: string
}
