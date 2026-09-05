/**
 * 文件说明：模块 1 平台配置。
 * 职责：声明模块标识、基础路径、显示信息与六课时数量。
 * 更新触发：模块名称、slug、基础路径、状态或课时数量变化时，需要同步更新本文件。
 */

export const MODULE1_CONFIG = {
  id: "module-1",
  slug: "ai-story",
  title: "未来来信",
  basePath: "/module/1",
  status: "active",
  lessonCount: 6,
} as const
