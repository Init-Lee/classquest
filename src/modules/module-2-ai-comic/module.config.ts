/**
 * 文件说明：模块 2 平台配置。
 * 职责：声明模块标识、基础路径、显示信息、建设状态与六课时数量。
 * 更新触发：模块名称、副标题、slug、基础路径、建设状态或课时数量变化时，需要同步更新本文件。
 */

export const MODULE2_CONFIG = {
  id: "module-2",
  slug: "ai-comic",
  title: "AI 四格漫画",
  subtitle: "图像生成：把我的小说改编成四格漫画",
  basePath: "/module/2",
  /** 课时一四关已实现。门户仍保持 draft，等阶段 D 验收后再改为 active。 */
  status: "draft",
  lessonCount: 6,
} as const
