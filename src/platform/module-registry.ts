/**
 * 文件说明：ClassQuest 平台模块注册表。
 * 职责：统一声明门户首页展示的模块入口和平台级模块元数据。
 * 更新触发：新增课程模块、调整模块入口路径或改变模块上线状态时，需要同步更新本文件。
 */

import type { PlatformModuleEntry } from "./types"

export const MODULE_REGISTRY: PlatformModuleEntry[] = [
  {
    id: "module-3",
    slug: "ai-science-station",
    title: "AI 科学传播站",
    subtitle: "已完成 6 个课时，保留本地优先学习进度、跨角色文件与阶段快照。",
    route: "/module/3",
    status: "active",
    grade: "七年级 · 模块三",
  },
  {
    id: "module-4",
    slug: "ai-info-detective",
    title: "AI 信息侦探",
    subtitle: "V1.5 新模块占位；课程内容将在后续独立分支中逐课开发。",
    route: "/module/4",
    status: "draft",
    grade: "七年级 · 模块四",
  },
]
