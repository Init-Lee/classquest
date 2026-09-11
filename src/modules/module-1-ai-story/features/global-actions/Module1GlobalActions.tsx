/**
 * 文件说明：模块 1 全局档案操作区。
 * 职责：学生模式提供保存进度、导入进度与重置；当前课时页提供对应阶段快照；教师模式只保留阶段快照。
 * 更新触发：模块 1 学习包交互、阶段快照入口、教师模式按钮策略或顶栏口径变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent } from "react"
import { Camera, Download, Loader2, RotateCcw, Upload } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { useModule1Portfolio } from "@/modules/module-1-ai-story/app/providers/Module1Provider"
import {
  deserializeModule1ContinuePackage,
  downloadModule1ContinuePackage,
  type ParsedModule1ContinuePackage,
} from "@/modules/module-1-ai-story/infra/persistence/serializers/continue-package"
import {
  downloadModule1Snapshot,
  isModule1SnapshotReady,
  resolveModule1SnapshotKind,
} from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"
import {
  getModule1GlobalActionAvailability,
  getModule1SnapshotDisabledReason,
} from "@/modules/module-1-ai-story/features/global-actions/module1-global-actions-state"

function SnapshotButton({
  enabled,
  reason,
  onClick,
}: {
  enabled: boolean
  reason: string
  onClick: () => void
}) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={!enabled}
      title={enabled ? "下载阶段快照，不能用来恢复进度" : reason}
      className="gap-1.5 border-green-600 bg-green-600 px-2 text-xs text-white hover:bg-green-700 sm:px-3"
    >
      <Camera className="h-3.5 w-3.5" />
      阶段快照
    </Button>
  )
}

export function Module1GlobalActions() {
  const { portfolio, flushPortfolio, importPortfolio, clearPortfolio, isTeacherMode } = useModule1Portfolio()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [pendingImport, setPendingImport] = useState<ParsedModule1ContinuePackage | null>(null)
  const [importError, setImportError] = useState("")
  const snapshotKind = resolveModule1SnapshotKind(location.pathname)
  const showSnapshot = Boolean(snapshotKind)
  const snapshotReady = Boolean(portfolio && snapshotKind && isModule1SnapshotReady(portfolio, snapshotKind))
  const actions = getModule1GlobalActionAvailability(Boolean(portfolio), busy, {
    isTeacherMode,
    snapshotReady,
    showSnapshot,
  })
  const snapshotReason = getModule1SnapshotDisabledReason(Boolean(portfolio), snapshotReady, snapshotKind)

  const exportLatest = async () => {
    if (!portfolio) return
    downloadModule1ContinuePackage(await flushPortfolio())
  }

  const reportActionError = (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error)
    setMessage(`操作未完成：${detail}。本机当前档案未被替换或清除。`)
  }

  const handleSave = async () => {
    if (!portfolio || isTeacherMode) return
    setBusy(true)
    setSaving(true)
    setMessage("")
    try {
      await exportLatest()
      setSaveSuccess(true)
      window.setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      reportActionError(error)
    } finally {
      setSaving(false)
      setBusy(false)
    }
  }

  const handleSnapshot = () => {
    if (!portfolio || !snapshotKind || !snapshotReady) return
    downloadModule1Snapshot(portfolio, snapshotKind)
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage("")
    setImportError("")
    try {
      setPendingImport(await deserializeModule1ContinuePackage(file))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入失败，当前档案未发生变化。")
    } finally {
      setBusy(false)
      event.target.value = ""
    }
  }

  const confirmImport = async () => {
    if (!pendingImport || isTeacherMode) return
    setBusy(true)
    try {
      const imported = await importPortfolio(pendingImport.portfolio)
      setPendingImport(null)
      setShowImportDialog(false)
      setMessage(`已恢复 ${imported.student.studentName} 的学习进度。`)
      navigate("/module/1")
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setImportError(`恢复失败：${detail}。本机当前档案未被替换。`)
    } finally {
      setBusy(false)
    }
  }

  const confirmReset = async () => {
    if (!portfolio || isTeacherMode) return
    setBusy(true)
    try {
      await clearPortfolio()
      setShowResetDialog(false)
      navigate("/module/1")
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusy(false)
    }
  }

  if (isTeacherMode) {
    return (
      <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
        {showSnapshot && (
          <SnapshotButton enabled={actions.canSnapshot} reason={snapshotReason} onClick={handleSnapshot} />
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={!actions.canSave}
          className="gap-1.5 border-blue-600 bg-blue-600 px-2 text-xs text-white hover:bg-blue-700 sm:px-3"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {saveSuccess ? "已保存" : "保存进度"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowImportDialog(true)}
          disabled={!actions.canImport}
          className="gap-1.5 px-2 text-xs sm:px-3"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          导入进度
        </Button>
        {showSnapshot && (
          <SnapshotButton enabled={actions.canSnapshot} reason={snapshotReason} onClick={handleSnapshot} />
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          disabled={!actions.canReset}
          className="gap-1.5 px-2 text-xs text-destructive hover:text-destructive sm:px-3"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置
        </Button>
      </div>

      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open)
        if (!open) {
          setPendingImport(null)
          setImportError("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入进度</DialogTitle>
            <DialogDescription>
              选择之前导出的模块一继续学习包；阶段快照不能恢复进度，请选择继续学习包。确认身份和恢复位置后才会替换本机档案。
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary"
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <span className="block text-sm text-muted-foreground">点击选择继续学习包文件</span>
            <span className="mt-1 block text-xs text-muted-foreground">格式：模块1_姓名_课时N第M关_日期（学习包）</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
          {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />正在读取学习包...</p>}
          {importError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{importError}</p>}
          {pendingImport && (
            <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
              <p>学生：{pendingImport.portfolio.student.clazz} · {pendingImport.portfolio.student.studentName} · {pendingImport.portfolio.student.classSeatCode}</p>
              <p>恢复位置：课时 {pendingImport.portfolio.progress.lessonId} 第 {pendingImport.portfolio.progress.stepId} 关</p>
              <p>导出时间：{pendingImport.exportedAt || "学习包未记录"}</p>
              {portfolio && <p className="text-destructive">本机当前档案：{portfolio.student.studentName}（确认后将被完整替换）</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>关闭</Button>
            {pendingImport && <Button onClick={() => void confirmImport()} disabled={busy}>确认替换</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置模块一学习数据</DialogTitle>
            <DialogDescription>
              此操作会清除本设备上保存的模块一学习进度。需要保留时，请先保存继续学习包。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            如需保留进度，请先点击「保存进度」下载继续学习包，再进行重置。阶段快照不能恢复进度。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={() => void confirmReset()} disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />重置中...</> : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(message)} onOpenChange={open => { if (!open) setMessage("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>学习进度提示</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setMessage("")}>知道了</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
