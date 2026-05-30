/**
 * 文件说明：模块 4 课时 4 同伴互审工作台入口（兼容旧路径）。
 * 职责：从 peer-review-workbench 子目录 re-export 编排组件，避免外部 import 路径断裂。
 * 更新触发：工作台子目录位置或导出名变化时，需要同步更新本文件。
 */

export { PeerReviewWorkbench } from "./peer-review-workbench/PeerReviewWorkbench"
