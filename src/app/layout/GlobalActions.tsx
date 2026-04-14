/**
 * 文件说明：全局动作区组件
 * 职责：右上角常驻的全局操作入口（保存进度、导入进度、生成快照、重置数据）
 *       在任意页面均可触发，不依赖当前步骤是否完成
 *       教师演示模式下隐藏保存/导入/重置等会修改数据的按钮
 * 更新触发：新增全局操作时；操作触发逻辑变化时；教师模式 UI 调整时
 */

import { useState, useRef } from "react"
import { Download, Upload, Camera, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog"
import { usePortfolio } from "@/app/providers/AppProvider"
import { downloadContinuePackage, deserializeContinuePackage } from "@/infra/persistence/serializers/continue-package"
import { downloadSnapshot } from "@/infra/persistence/serializers/snapshot-html"
import { formatDateReadable } from "@/shared/utils/format"
import { resolvePortfolioPointer } from "@/app/lesson-registry"
import { useNavigate, useLocation } from "react-router-dom"

export function GlobalActions() {
  const { portfolio, savePortfolio, importPortfolio, clearPortfolio, isTeacherMode } = usePortfolio()
  const navigate = useNavigate()
  const location = useLocation()
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)
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
      // 修正可能过期的进度指针（档案实际已完成的课时比指针更靠后）
      const repairedPointer = resolvePortfolioPointer(imported)
      const repairedPortfolio = { ...imported, pointer: repairedPointer }
      await importPortfolio(repairedPortfolio)
      setImportResult({
        success: true,
        message: `已恢复到：课时${repairedPointer.lessonId} 第${repairedPointer.stepId}关\n文件保存时间：${formatDateReadable(imported.updatedAt)}`,
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

  /** 生成阶段快照：根据当前浏览页面决定类型，而非仅依赖完成标志 */
  const handleSnapshot = () => {
    if (!portfolio) return
    // 从当前 URL 解析课时和步骤，精确感知用户正在浏览哪一页
    const routeMatch = location.pathname.match(/\/lesson\/(\d+)\/step\/(\d+)/)
    const currentLessonId = routeMatch ? parseInt(routeMatch[1]) : portfolio.pointer.lessonId
    const currentStepId = routeMatch ? parseInt(routeMatch[2]) : portfolio.pointer.stepId

    let type: "r1-personal" | "lesson1-full" | "lesson2-public" | "lesson3-toolbox" | "lesson4-full" | "lesson5-full"
    if (currentLessonId === 1) {
      // 课时1 第1-2关只有个人 R1 数据；第3关起有小组数据，生成完整课时1快照
      type = currentStepId <= 2 ? "r1-personal" : "lesson1-full"
    } else if (currentLessonId === 2) {
      type = "lesson2-public"
    } else if (currentLessonId === 4) {
      type = "lesson4-full"
    } else if (currentLessonId === 5) {
      type = "lesson5-full"
    } else {
      // 课时3：生成课时3阶段快照（含课时2证据摘要）
      type = "lesson3-toolbox"
    }
    // #region agent log
    fetch('http://127.0.0.1:7867/ingest/f477b48f-d907-4d17-af01-17b6b09ded5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2a660e'},body:JSON.stringify({sessionId:'2a660e',location:'GlobalActions.tsx:handleSnapshot',message:'snapshot triggered [post-fix]',data:{pathname:location.pathname,currentLessonId,currentStepId,chosenType:type,pointer:portfolio.pointer},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    downloadSnapshot(type, portfolio)
  }

  /** 重置所有数据 */
  const handleReset = async () => {
    setResetting(true)
    setShowResetDialog(false)
    try {
      await clearPortfolio()
    } finally {
      setResetting(false)
      navigate("/")
    }
  }

  // 教师模式下只显示阶段快照（供课堂展示用，仅在闯关步骤页显示），隐藏保存/导入/重置
  if (isTeacherMode) {
    return (
      <div className="flex items-center gap-2">
        {/\/lesson\/\d+\/step\/\d+/.test(location.pathname) && (
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
        {/* 保存进度（蓝色主题） */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!portfolio || saving}
          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
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

        {/* 生成阶段快照（仅在闯关步骤页启用，首页不展示） */}
        {/\/lesson\/\d+\/step\/\d+/.test(location.pathname) && <Button
          size="sm"
          onClick={handleSnapshot}
          disabled={!portfolio}
          className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
        >
          <Camera className="h-3.5 w-3.5" />
          阶段快照
        </Button>}

        {/* 重置数据 */}
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

      {/* 重置确认对话框 */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置所有学习数据</DialogTitle>
            <DialogDescription>
              此操作将清除你在本设备上保存的所有学习进度，包括学生信息、课时记录和证据清单。
              <strong className="block mt-2 text-destructive">此操作不可撤销。</strong>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            如需保留进度，请先点击「保存进度」下载继续学习包，再进行重置。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />重置中...</> : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
