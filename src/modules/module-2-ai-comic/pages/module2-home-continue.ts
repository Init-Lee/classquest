/**
 * 文件说明：模块 2 首页中间主按钮的续学判断。
 * 职责：按课时 1 的真实进度决定「开始课时 1」「继续学习」或「查看课时 1」，并给出可进入的关卡地址。不读取伪造的完成标记，也不指向尚未开放的课时 2—6。
 * 更新触发：首页主按钮文案、续学关卡、课时 1 完成口径或后续课时开放规则变化时，需要同步更新本文件与回归测试。
 */

import {
  computeModule2Lesson1Gates,
  getModule2Lesson1FurthestStep,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  MODULE2_FOUR_PARTS,
  type Module2PortfolioV1,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

export interface Module2HomeContinue {
  label: "开始课时 1" | "继续学习" | "查看课时 1"
  path: string
  /** 进行中时说明当前关；还没开始或本课已完成时为空。 */
  hint: string | null
}

function lesson1StepPath(step: number): string {
  return `/module/2/lesson/1/step/${step}`
}

/** 第 1 关有没有留下真实内容。空草稿和只改过完成标记都不算开始。 */
function hasModule2Lesson1Started(portfolio: Module2PortfolioV1): boolean {
  if (getModule2Lesson1FurthestStep(portfolio) > 1) return true
  if (portfolio.sourceSnapshot || portfolio.sourceImportDraft || portfolio.sourceHistory.length > 0) return true
  if (portfolio.lesson1.sampleViewed || portfolio.lesson1.sampleObservation.trim() !== "") return true
  const { student, storyboard, visualDirection } = portfolio
  if (student.clazz.trim() !== "" || student.studentName.trim() !== "" || student.classSeatCode.trim() !== "") return true
  if (MODULE2_FOUR_PARTS.some(part => storyboard.frames[part].sceneSentence.trim() !== "")) return true
  if (visualDirection.reason.trim() !== "" || visualDirection.words.some(word => word.trim() !== "")) return true
  if (portfolio.assetIds.length > 0 || portfolio.imageVersions.length > 0) return true
  return false
}

/** 首页中间主按钮。课时 2—6 未开放，这里的地址只落在课时 1。 */
export function resolveModule2HomeContinue(portfolio: Module2PortfolioV1 | null): Module2HomeContinue {
  if (computeModule2Lesson1Gates(portfolio).completed) {
    return { label: "查看课时 1", path: lesson1StepPath(4), hint: null }
  }
  if (!portfolio || !hasModule2Lesson1Started(portfolio)) {
    return { label: "开始课时 1", path: lesson1StepPath(1), hint: null }
  }
  const step = getModule2Lesson1FurthestStep(portfolio)
  return {
    label: "继续学习",
    path: lesson1StepPath(step),
    hint: `当前在课时 1 第 ${step} 关`,
  }
}
