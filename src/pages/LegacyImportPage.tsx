/**
 * 文件说明：旧版数据导入页（临时功能）
 * 职责：为旧版工具数据迁移提供独立页面容器，内嵌4步向导组件。
 *       独立路由 /legacy-import，避免与首页主流程混合展示。
 * 更新触发：导入向导标题/说明文案调整时
 * 删除触发：全班迁移完成后，连同 legacy-import/ 目录一并删除，同步移除路由
 */

import { useNavigate } from "react-router-dom"
import { ArrowLeft, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { LegacyImportWizard } from "@/features/legacy-import"

export default function LegacyImportPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      {/* 页眉 */}
      <div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">旧版数据迁移</h1>
            <p className="text-sm text-muted-foreground">将旧版工具的历史数据导入新版 ClassQuest</p>
          </div>
        </div>
      </div>

      {/* 向导卡片 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">导入向导</CardTitle>
          <CardDescription>
            你需要两个文件：课时1的「分工手册」和课时2的「素材收集包」（JSON格式）。
            上传后系统自动对齐数据，直接跳转到对应进度。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LegacyImportWizard />
        </CardContent>
      </Card>
    </div>
  )
}
