/**
 * 文件说明：模块 2 浏览器环境默认仓库实例。
 * 职责：让档案仓库与资产仓库共用同一个 classquest-module2-v1 连接，供 Provider 与开发测试页使用；测试代码应自行用 fake-indexeddb 构造仓库，不使用这里的实例。
 * 更新触发：默认数据库连接方式或对外暴露的仓库实例变化时，需要同步更新本文件。
 */

import { createModule2DbProvider } from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/connection"
import { Module2AssetRepository } from "@/modules/module-2-ai-comic/infra/persistence/repositories/asset.repository"
import { Module2PortfolioRepository } from "@/modules/module-2-ai-comic/infra/persistence/repositories/portfolio.repository"

const getModule2Db = createModule2DbProvider()

export const module2PortfolioRepository = new Module2PortfolioRepository(getModule2Db)
export const module2AssetRepository = new Module2AssetRepository(getModule2Db)
