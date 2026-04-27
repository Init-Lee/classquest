/**
 * 文件说明：模块 4 的平台注册配置。
 * 职责：声明模块 4 的基础路径和展示元数据，供平台注册表或后续模块内部路由引用。
 * 更新触发：模块 4 名称、路径、上线状态或课程数量发生变化时，需要同步更新本文件。
 */

export const MODULE4_CONFIG = {
  id: "module-4",
  slug: "ai-info-detective",
  title: "AI 信息侦探",
  basePath: "/module/4",
  status: "draft",
  lessonCount: 6,
} as const
