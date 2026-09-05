/**
 * 文件说明：模块 1 全局档案操作区。
 * 职责：提供显式保存后导出、预览确认导入、清档及导出并清档，确保失败不会改变现态。
 * 更新触发：模块 1 学习包交互、身份确认、导出刷新或共享设备清理流程变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent } from "react"
import { Download, Loader2, MoreHorizontal, Trash2, Upload } from "lucide-react"
import { useNavigate } from "react-router-dom"
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

export function Module1GlobalActions() {
  const { portfolio, flushPortfolio, importPortfolio, clearPortfolio } = useModule1Portfolio()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [pendingClear, setPendingClear] = useState<"clear" | "export-clear" | null>(null)
  const [pendingImport, setPendingImport] = useState<ParsedModule1ContinuePackage | null>(null)
  const [importError, setImportError] = useState("")

  const exportLatest = async () => {
    if (!portfolio) return
    downloadModule1ContinuePackage(await flushPortfolio())
  }

  const reportActionError = (error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error)
    setMessage(`操作未完成：${detail}。本机当前档案未被替换或清除。`)
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
    if (!pendingImport) return
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

  const confirmClear = async () => {
    if (!portfolio || !pendingClear) return
    setBusy(true)
    try {
      if (pendingClear === "export-clear") await exportLatest()
      await clearPortfolio()
      setPendingClear(null)
      navigate("/module/1")
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <Button
          size="sm"
          onClick={() => void exportLatest().catch(reportActionError)}
          disabled={!portfolio || busy}
          className="gap-1.5 bg-blue-600 px-2 text-xs text-white hover:bg-blue-700 sm:px-3"
        >
          <Download className="h-3.5 w-3.5" />
          导出学习包
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowImportDialog(true)}
          disabled={busy}
          className="gap-1.5 px-2 text-xs sm:px-3"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          导入学习包
        </Button>
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            disabled={!portfolio || busy}
            aria-haspopup="menu"
            aria-expanded={showMore}
            onClick={() => setShowMore(current => !current)}
            className="gap-1 px-2 text-xs sm:px-3"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            更多
          </Button>
          {showMore && portfolio && (
            <div role="menu" className="absolute right-0 top-11 z-50 w-52 space-y-1 rounded-md border bg-popover p-1 shadow-md">
              <button
                type="button"
                role="menuitem"
                onClick={() => { setShowMore(false); setPendingClear("clear") }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs text-destructive hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清除本机档案
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setShowMore(false); setPendingClear("export-clear") }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" />
                导出学习包后清除
              </button>
            </div>
          )}
        </div>
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
            <DialogTitle>导入学习包</DialogTitle>
            <DialogDescription>选择之前导出的模块一继续学习包；确认身份和恢复位置后才会替换本机档案。</DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary"
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <span className="block text-sm text-muted-foreground">点击选择继续学习包文件</span>
            <span className="mt-1 block text-xs text-muted-foreground">格式：模块1_姓名_课时N第M关_日期.json</span>
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

      <Dialog open={Boolean(pendingClear)} onOpenChange={open => { if (!open) setPendingClear(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingClear === "export-clear" ? "导出学习包后清除" : "清除本机档案"}</DialogTitle>
            <DialogDescription>
              {pendingClear === "export-clear"
                ? "系统会先下载最新学习包，再清除当前浏览器中的模块一档案。"
                : "此操作会清除当前浏览器中的模块一身份与学习进度，未导出的内容无法恢复。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingClear(null)}>取消</Button>
            <Button variant="destructive" onClick={() => void confirmClear()} disabled={busy}>
              {busy ? "处理中..." : pendingClear === "export-clear" ? "确认导出并清除" : "确认清除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(message)} onOpenChange={open => { if (!open) setMessage("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>学习包提示</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setMessage("")}>知道了</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
