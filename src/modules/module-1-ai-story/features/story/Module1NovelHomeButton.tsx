/**
 * 文件说明：模块 1 首页「我的小说」入口按钮。
 * 职责：只在课时 6 已完成时渲染按钮；未完成时返回空，不留禁用按钮。
 * 更新触发：首页小说入口的显示条件或按钮文案变化时，需要同步更新本文件。
 */

import { BookOpen } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { MODULE1_LESSON6_NOVEL_UI } from "@/modules/module-1-ai-story/constants/lesson6-copy"

export function Module1NovelHomeButton({
  visible,
  onOpen,
}: {
  visible: boolean
  onOpen: () => void
}) {
  if (!visible) return null
  return (
    <Button type="button" variant="outline" onClick={onOpen}>
      <BookOpen className="mr-1 h-4 w-4" />
      {MODULE1_LESSON6_NOVEL_UI.button}
    </Button>
  )
}
