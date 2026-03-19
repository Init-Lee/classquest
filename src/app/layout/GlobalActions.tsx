/**
 * 文件说明：全局动作区组件
 * 职责：右上角常驻的三个全局操作入口（保存进度、导入进度、生成阶段快照）
 *       在任意页面均可触发，不依赖当前步骤是否完成
 * 更新触发：新增全局操作时；操作触发逻辑变化时
 */

import { useState, useRef } from "react"
import { Download, Upload, Camera, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog"
import { usePortfolio } from "@/app/providers/AppProvider"
import { downloadContinuePackage, deserializeContinuePackage } from "@/infra/persistence/serializers/continue-package"
import { downloadSnapshot } from "@/infra/persistence/serializers/snapshot-html"
import { formatDateReadable } from "@/shared/utils/format"

export function GlobalActions() {
  const { portfolio, savePortfolio, importPortfolio } = usePortfolio()
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** 保存进度：导出继续学习包 */
  const handleSave = async () => {
    if (!portfolio) return
    setSaving(true)
    try {
      await savePortfolio(portfolio)
      downloadContinuePackage(portfolio)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  /** 导入进度：读取继续学习包文件 */
  const handleImportClick = () => {
    setShowImportDialog(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const imported = await deserializeContinuePackage(file)
      await importPortfolio(imported)
      setImportResult({
        success: true,
        message: `已恢复到：课时${imported.pointer.lessonId} 第${imported.pointer.stepId}关\n文件保存时间：${formatDateReadable(imported.updatedAt)}`,
      })
    } catch (err) {
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : "导入失败，请重试",
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  /** 生成阶段快照 */
  const handleSnapshot = () => {
    if (!portfolio) return
    const type = portfolio.pointer.lessonId === 1
      ? (portfolio.lesson1.completed ? "lesson1-full" : "r1-personal")
      : "lesson2-public"
    downloadSnapshot(type, portfolio)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 保存进度 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!portfolio || saving}
          className="gap-1.5 text-xs"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {saveSuccess ? "已保存！" : "保存进度"}
        </Button>

        {/* 导入进度 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          className="gap-1.5 text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          导入进度
        </Button>

        {/* 生成阶段快照 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSnapshot}
          disabled={!portfolio}
          className="gap-1.5 text-xs"
        >
          <Camera className="h-3.5 w-3.5" />
          阶段快照
        </Button>
      </div>

      {/* 导入对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入进度</DialogTitle>
            <DialogDescription>
              选择之前导出的继续学习包文件（.json），系统将恢复你的学习进度。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">点击选择继续学习包文件</p>
              <p className="text-xs text-muted-foreground mt-1">格式：AI科学传播站_模块三_*.json</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {importing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在读取文件...</span>
              </div>
            )}

            {importResult && (
              <div className={`rounded-lg p-3 text-sm ${importResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                {importResult.message.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportResult(null) }}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
