/**
 * 文件说明：课时 3 读取课时 2 素材就绪状态文案。
 * 职责：根据课时 2 体检记录给出友好中文状态，供 Step1 启动页素材摘要卡展示，避免误导性「来源真实可信」表述。
 * 更新触发：课时 2 完成判定字段、postCriteriaStatus 枚举或 Step1 就绪文案策略变化时，需要同步更新本文件。
 */

import type { Module4MaterialScreeningRecord } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON2_STATUS_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { isLesson2MaterialComplete } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/material-completion"

/** 返回 Step1 素材摘要卡使用的就绪状态短文案。 */
export function getLesson2MaterialReadinessLabel(record: Module4MaterialScreeningRecord): string {
  if (isLesson2MaterialComplete(record)) return "已就绪"
  if (record.completed) return "体检项已登记"
  if (record.postCriteriaStatus === "usable") return LESSON2_STATUS_LABELS.usable
  if (record.postCriteriaStatus === "need_fix") return "待补充"
  if (record.postCriteriaStatus === "need_replace") return "待更换"
  if (record.initialStatus === "ready") return "素材已上传"
  if (record.initialStatus === "incomplete") return "材料不完整"
  if (record.initialStatus === "none") return "暂无合适素材"
  if (record.asset) return "待补充体检信息"
  return "待补充"
}
