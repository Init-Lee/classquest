/**
 * 文件说明：模块 4 课时 2 来源记录检查状态标签。
 * 职责：用统一文案展示未检查、未通过和“来源记录格式通过”三类状态，避免误导为真实来源验证。
 * 更新触发：来源检查状态文案、颜色或通过口径变化时，需要同步更新本文件。
 */

import { Badge } from "@/shared/ui/badge"

export function SourceRecordCheckBadge({ checked, passed, reason }: { checked: boolean; passed: boolean; reason: string }) {
  if (!checked) return <Badge variant="outline">尚未检查</Badge>
  if (passed) return <Badge variant="success">来源记录格式通过</Badge>
  return <Badge variant="warning">{reason || "来源记录还不完整"}</Badge>
}
