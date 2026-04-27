/**
 * 文件说明：PortfolioRepository 接口定义
 * 职责：定义操作学生档案的抽象接口，隔离页面与存储实现
 *       页面和 Domain 层只依赖此接口，不依赖具体存储实现
 * 更新触发：需要新增档案操作方法时
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"

/** 档案仓库接口：所有档案操作的抽象层 */
export interface PortfolioRepository {
  /** 获取当前活跃的学生档案（本机最新记录） */
  getCurrent(): Promise<ModulePortfolio | null>

  /** 保存档案（新增或覆盖） */
  save(portfolio: ModulePortfolio): Promise<void>

  /** 导入外部档案（如继续学习包），完全覆盖当前本地档案 */
  replaceWithImported(portfolio: ModulePortfolio): Promise<void>

  /** 清空当前档案（危险操作，谨慎调用） */
  clear(): Promise<void>
}
