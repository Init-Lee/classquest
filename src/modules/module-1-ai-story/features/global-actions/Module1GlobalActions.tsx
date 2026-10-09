/**
 * 文件说明：模块 1 全局档案操作区。
 * 职责：学生模式提供保存进度、导入进度与重置；导入对话框左侧拖入或点选继续学习包，右侧显示结果。教师模式仅在课时 1/2 页保留当前课阶段快照，方便投影。
 * 更新触发：模块 1 学习包交互、导入拖拽或结果区、教师顶栏阶段快照入口、教师模式按钮策略或顶栏口径变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
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
import { downloadModule1SnapshotByLessonId } from "@/modules/module-1-ai-story/infra/persistence/serializers/snapshot-html"
import {
  getModule1GlobalActionAvailability,
  getModule1SnapshotDisabledReason,
} from "@/modules/module-1-ai-story/features/global-actions/module1-global-actions-state"
import { getModule1TeacherTopBarSnapshotState } from "@/modules/module-1-ai-story/features/global-actions/module1-lesson-snapshot-entry"
import type { Module1Portfolio } from "@/modules/module-1-ai-story/domains/portfolio/types"

function dataTransferHasDirectory(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.items ?? []).some(item => {
    if (typeof item.webkitGetAsEntry !== "function") return false
    return Boolean(item.webkitGetAsEntry()?.isDirectory)
  })
}

function formatCompletedLessons(portfolio: Module1Portfolio): string {
  const done = [
    portfolio.lesson1.completed ? "课时1" : "",
    portfolio.lesson2.completed ? "课时2" : "",
    portfolio.lesson3.completed ? "课时3" : "",
    portfolio.lesson4.completed ? "课时4" : "",
    portfolio.lesson5.completed ? "课时5" : "",
    portfolio.lesson6.completed ? "课时6" : "",
  ].filter(Boolean)
  return done.length > 0 ? done.join("、") : "还没有完成的课"
}

function formatExportedAt(value: string): string {
  if (!value) return "学习包未记录"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-CN", { hour12: false })
}

function ImportPackageFacts({
  portfolio,
  exportedAt,
  replacingName,
}: {
  portfolio: Module1Portfolio
  exportedAt: string
  replacingName?: string
}) {
  const rows = [
    ["姓名", portfolio.student.studentName],
    ["班级座位", `${portfolio.student.clazz} · ${portfolio.student.classSeatCode}`],
    ["当前课时", `课时 ${portfolio.progress.lessonId} 第 ${portfolio.progress.stepId} 关`],
    ["已完成", formatCompletedLessons(portfolio)],
    ["导出时间", formatExportedAt(exportedAt)],
  ]
  return (
    <div className="mt-3 space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <p key={label} className="grid grid-cols-[4.5rem_1fr] gap-2">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </p>
      ))}
      {replacingName && <p className="font-medium text-destructive">将替换本机档案：{replacingName}</p>}
    </div>
  )
}

function swallowClickAfterDrop(zone: HTMLElement) {
  const swallow = (clickEvent: MouseEvent) => {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    zone.removeEventListener("click", swallow, true)
  }
  zone.addEventListener("click", swallow, true)
  window.setTimeout(() => zone.removeEventListener("click", swallow, true), 100)
}

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
      title={enabled ? "下载当前课阶段快照，供课堂投影；不能用来恢复进度" : reason}
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
  const [importDone, setImportDone] = useState<ParsedModule1ContinuePackage | null>(null)
  const [importError, setImportError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const teacherSnapshot = getModule1TeacherTopBarSnapshotState(location.pathname, portfolio)
  const showSnapshot = isTeacherMode && teacherSnapshot.visible
  const snapshotReady = teacherSnapshot.enabled
  const snapshotKind = teacherSnapshot.kind
  const snapshotLessonId = snapshotKind === "lesson2" ? 2 : snapshotKind === "lesson1" ? 1 : null
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
    if (!portfolio || snapshotLessonId == null || !snapshotReady) return
    downloadModule1SnapshotByLessonId(portfolio, snapshotLessonId)
  }

  const resetImportDialog = () => {
    setPendingImport(null)
    setImportDone(null)
    setImportError("")
    setDragOver(false)
  }

  const readImportFile = async (file: File) => {
    setBusy(true)
    setMessage("")
    setImportError("")
    setImportDone(null)
    setPendingImport(null)
    try {
      setPendingImport(await deserializeModule1ContinuePackage(file))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入失败，当前档案未发生变化。")
    } finally {
      setBusy(false)
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || busy) return
    await readImportFile(file)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setDragOver(false)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    swallowClickAfterDrop(event.currentTarget)
    setDragOver(false)
    if (busy) return
    if (dataTransferHasDirectory(event.dataTransfer)) {
      setPendingImport(null)
      setImportDone(null)
      setImportError("请拖入继续学习包文件，不要拖文件夹。")
      return
    }
    const file = event.dataTransfer.files?.[0]
    if (!file) {
      setPendingImport(null)
      setImportDone(null)
      setImportError("请拖入继续学习包文件。")
      return
    }
    await readImportFile(file)
  }

  const confirmImport = async () => {
    // 教师讲解模式导入不写学生库；拖拽只解析，确认时同样直接返回。
    if (!pendingImport || isTeacherMode) return
    setBusy(true)
    try {
      const imported = await importPortfolio(pendingImport.portfolio)
      setImportDone({ portfolio: imported, exportedAt: pendingImport.exportedAt })
      setPendingImport(null)
      setImportError("")
      navigate("/module/1")
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setImportError(`恢复失败：${detail}。本机档案未替换。`)
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
        if (!open) resetImportDialog()
      }}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          onDragOver={event => event.preventDefault()}
          onDrop={event => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>导入进度</DialogTitle>
            <DialogDescription className="sr-only">
              {importDone ? "导入成功" : importError ? "无法导入" : "把继续学习包拖到左边，或点选文件。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
            <div
              role="button"
              tabIndex={0}
              aria-disabled={busy}
              onClick={() => {
                if (!busy) fileInputRef.current?.click()
              }}
              onKeyDown={event => {
                if (busy) return
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={event => void handleDrop(event)}
              className={`flex min-h-36 cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                dragOver
                  ? "border-blue-600 bg-blue-100 ring-2 ring-blue-600 ring-offset-2"
                  : "border-slate-300 hover:border-blue-600 hover:bg-blue-50"
              } ${busy ? "pointer-events-none opacity-60" : ""}`}
            >
              <Upload className={`mb-2 h-8 w-8 ${dragOver ? "text-blue-600" : "text-slate-500"}`} />
              <span className="text-sm font-medium">拖入继续学习包，或点击选择</span>
            </div>
            <div
              aria-live="polite"
              className={`flex min-h-36 flex-col justify-center rounded-lg border p-4 ${
                importDone
                  ? "border-green-600 bg-green-50"
                  : importError
                    ? "border-red-300 bg-red-50"
                    : pendingImport
                      ? "border-blue-300 bg-blue-50"
                      : "border-border bg-muted/40"
              }`}
            >
              {importDone ? (
                <>
                  <h2 className="text-lg font-semibold text-green-900">导入成功</h2>
                  <ImportPackageFacts portfolio={importDone.portfolio} exportedAt={importDone.exportedAt} />
                </>
              ) : importError ? (
                <>
                  <h2 className="text-lg font-semibold text-red-900">无法导入</h2>
                  <p role="alert" className="mt-2 text-sm text-red-800">{importError}</p>
                </>
              ) : pendingImport ? (
                <>
                  <h2 className="text-lg font-semibold text-blue-950">请确认</h2>
                  <ImportPackageFacts
                    portfolio={pendingImport.portfolio}
                    exportedAt={pendingImport.exportedAt}
                    replacingName={portfolio?.student.studentName}
                  />
                </>
              ) : busy ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在读取…
                </p>
              ) : (
                <div className="space-y-1 text-sm text-foreground">
                  <p>把继续学习包拖到左边，或点选文件。</p>
                  <p>阶段快照不能用来恢复。</p>
                </div>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={event => void handleFile(event)} />
          <DialogFooter className="gap-2 sm:space-x-0">
            {!importDone && (
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
                disabled={busy}
                className="border-slate-500 bg-white text-slate-900 hover:bg-slate-100"
              >
                取消
              </Button>
            )}
            {pendingImport && !importDone && (
              <Button
                onClick={() => void confirmImport()}
                disabled={busy}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                确认导入
              </Button>
            )}
            {importDone && (
              <Button
                onClick={() => setShowImportDialog(false)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                知道了
              </Button>
            )}
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
