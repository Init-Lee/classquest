/**
 * 文件说明：模块 4 全局动作区组件。
 * 职责：提供保存进度、导入进度、生成阶段快照和重置入口；教师讲解模式下仅保留课堂讲解需要的阶段快照。
 * 更新触发：模块 4 全局操作、继续学习包格式、快照类型或教师模式按钮策略变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Camera, Download, Loader2, RotateCcw, Upload } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import {
  deserializeModule4ContinuePackage,
  downloadModule4ContinuePackage,
} from "@/modules/module-4-ai-info-detective/infra/persistence/serializers/continue-package"
import { downloadModule4Snapshot } from "@/modules/module-4-ai-info-detective/infra/persistence/serializers/snapshot-html"

export function Module4GlobalActions() {
  const { portfolio, savePortfolio, importPortfolio, clearPortfolio, isTeacherMode } = useModule4Portfolio()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)

  const canSnapshot = /\/module\/4\/lesson\/1\/step\/\d+/.test(location.pathname)

  const handleSave = async () => {
    if (!portfolio) return
    setSaving(true)
    try {
      await savePortfolio(portfolio)
      downloadModule4ContinuePackage(portfolio)
      setSaveSuccess(true)
      window.setTimeout(() => setSaveSuccess(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    try {
      const imported = await deserializeModule4ContinuePackage(file)
      await importPortfolio(imported)
      setImportResult({
        success: true,
        message: `已恢复模块四学习进度：课时${imported.progress.lessonId} 第${imported.progress.stepId}关`,
      })
      navigate("/module/4")
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "导入失败，请重试。",
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSnapshot = () => {
    if (!portfolio) return
    downloadModule4Snapshot("lesson1-full", portfolio)
  }

  const handleReset = async () => {
    setResetting(true)
    setShowResetDialog(false)
    try {
      await clearPortfolio()
      navigate("/module/4")
    } finally {
      setResetting(false)
    }
  }

  if (isTeacherMode) {
    return (
      <div className="flex items-center gap-2">
        {canSnapshot && (
          <Button
            size="sm"
            onClick={handleSnapshot}
            disabled={!portfolio}
            className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <Camera className="h-3.5 w-3.5" />
            阶段快照
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!portfolio || saving}
          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {saveSuccess ? "已保存" : "保存进度"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          导入进度
        </Button>
        {canSnapshot && (
          <Button
            size="sm"
            onClick={handleSnapshot}
            disabled={!portfolio}
            className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <Camera className="h-3.5 w-3.5" />
            阶段快照
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResetDialog(true)}
          disabled={!portfolio}
          className="gap-1.5 text-xs text-destructive hover:text-destructive"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置
        </Button>
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入进度</DialogTitle>
            <DialogDescription>选择之前导出的模块四继续学习包，系统会恢复本设备上的学习进度。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">点击选择继续学习包文件</p>
              <p className="text-xs text-muted-foreground mt-1">格式：模块4_姓名_当前进度_日期.json</p>
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
                {importResult.message}
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

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置模块四学习数据</DialogTitle>
            <DialogDescription>
              此操作会清除本设备上保存的模块四学习进度。需要保留时，请先保存继续学习包。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />重置中...</> : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
