/**
 * 文件说明：模块 1 顶栏全局操作可用性纯函数。
 * 职责：根据是否有本机档案与忙碌态，给出保存进度、导入进度、重置三个主按钮的启用规则。
 * 更新触发：顶栏三按钮策略、无档案禁用规则或忙碌互斥变化时，需要同步更新本文件。
 */

export interface Module1GlobalActionAvailability {
  canSave: boolean
  canImport: boolean
  canReset: boolean
}

export function getModule1GlobalActionAvailability(
  hasPortfolio: boolean,
  busy: boolean,
): Module1GlobalActionAvailability {
  return {
    canSave: hasPortfolio && !busy,
    canImport: !busy,
    canReset: hasPortfolio && !busy,
  }
}
