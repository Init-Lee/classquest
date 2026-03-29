/**
 * 文件说明：旧版数据导入功能入口（临时功能）
 * 职责：统一 re-export，方便其他模块（如 HomePage）直接引用，
 *       删除时只需移除此目录即可，不影响其他模块内部实现。
 * 更新触发：当前目录中新增或重命名导出时
 * 删除触发：全班迁移完成后，连同整个 legacy-import/ 目录一并删除
 */

export { LegacyImportWizard } from "./LegacyImportSection"
export { buildPortfolioFromLegacy, isLegacyL1, isLegacyL2 } from "./legacy-import"
export type { LegacyL1, LegacyL2, LegacyImportParams } from "./legacy-import"
