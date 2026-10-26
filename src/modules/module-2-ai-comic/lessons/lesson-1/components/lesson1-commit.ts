/**
 * 文件说明：课时 1 确认动作的保存等待。
 * 职责：把一次档案修改交给保存协调器，并等本机事务完成；失败时把原因交回页面，不宣布已经成功。
 * 更新触发：确认后的保存等待或失败返回方式变化时，需要同步更新本文件。
 */

import type { Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"

/** 先改档案，再等保存完成。返回非空字符串表示没有成功，调用方不要宣布完成。 */
export async function commitLesson1Change(
  updatePortfolio: (updater: (current: Module2PortfolioV1) => Module2PortfolioV1) => Module2PortfolioV1,
  flushPortfolio: () => Promise<Module2PortfolioV1>,
  updater: (current: Module2PortfolioV1) => { portfolio: Module2PortfolioV1; error: string },
): Promise<string | null> {
  let error = ""
  updatePortfolio((current) => {
    const result = updater(current)
    error = result.error
    return result.portfolio
  })
  if (error) return error
  await flushPortfolio()
  return null
}
