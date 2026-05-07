/**
 * 文件说明：课时 1 个人任务清单数据。
 * 职责：提供 Step 5 中学生必须确认的下一课素材准备任务，作为课时完成 Guard 的数据来源。
 * 更新触发：下一课准备任务、素材合规要求或任务清单字段变化时，需要同步更新本文件。
 */

export interface PersonalTaskChecklistItem {
  key: string
  label: string
}

export const PERSONAL_TASK_CHECKLIST: PersonalTaskChecklistItem[] = [
  { key: "news", label: "准备 1 条新闻素材" },
  { key: "image", label: "准备 1 张图片素材" },
  { key: "source", label: "保留来源或生成记录" },
  { key: "initialJudgment", label: "初步判断是否存在 AI 痕迹" },
  { key: "safeMaterial", label: "避免不适宜素材" },
]
