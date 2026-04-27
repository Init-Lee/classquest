/**
 * 文件说明：材料处理参考功能模块入口
 * 职责：对外导出面板组件与材料类型配置，供多课时步骤复用
 * 更新触发：新增导出符号或模块拆分时
 */

export { MaterialProcessingReferencePanel } from "./MaterialProcessingReferencePanel"
export type { MaterialProcessingReferencePanelProps } from "./MaterialProcessingReferencePanel"
export { MATERIAL_PROCESSING_TYPES } from "./materialTypes"
export type { MaterialTypeId, MaterialTypeConfig } from "./materialTypes"
