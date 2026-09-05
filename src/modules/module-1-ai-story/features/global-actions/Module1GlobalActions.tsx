/**
 * 文件说明：模块 1 全局档案操作区。
 * 职责：提供显式保存后导出、预览确认导入、清档及导出并清档，确保失败不会改变现态。
 * 更新触发：模块 1 学习包交互、身份确认、导出刷新或共享设备清理流程变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent } from "react"
import { Download, Loader2, Trash2, Upload } from "lucide-react"
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
  const [pendingImport, setPendingImport] = useState<ParsedModule1ContinuePackage | null>(null)

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
    try {
      setPendingImport(await deserializeModule1ContinuePackage(file))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败，当前档案未发生变化。")
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
      setMessage(`已恢复 ${imported.student.studentName} 的学习进度。`)
      navigate("/module/1")
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    if (!portfolio || !window.confirm("确定清除本机模块一档案吗？未导出的进度无法恢复。")) return
    try {
      await clearPortfolio()
      navigate("/module/1")
    } catch (error) {
      reportActionError(error)
    }
  }

  const handleExportAndClear = async () => {
    if (!portfolio || !window.confirm("将先下载最新学习包，再清除本机档案。是否继续？")) return
    setBusy(true)
    try {
      await exportLatest()
      await clearPortfolio()
      navigate("/module/1")
    } catch (error) {
      reportActionError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" aria-label="导出学习包" title="导出学习包" onClick={() => void exportLatest().catch(reportActionError)} disabled={!portfolio || busy}>
          <Download className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">导出</span>
        </Button>
        <Button size="sm" variant="outline" aria-label="导入学习包" title="导入学习包" onClick={() => fileInputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin sm:mr-1" /> : <Upload className="h-4 w-4 sm:mr-1" />}
          <span className="hidden sm:inline">导入</span>
        </Button>
        <Button size="sm" variant="outline" aria-label="清除本机档案" title="清除本机档案" onClick={() => void handleClear()} disabled={!portfolio || busy}>
          <Trash2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">清除</span>
        </Button>
        <Button size="sm" variant="outline" aria-label="导出学习包并清除本机档案" title="导出并清除" onClick={() => void handleExportAndClear()} disabled={!portfolio || busy}>
          <span className="flex items-center -space-x-1 sm:hidden">
            <Download className="h-3.5 w-3.5" />
            <Trash2 className="h-3.5 w-3.5" />
          </span>
          <span className="hidden sm:inline">导出并清除</span>
        </Button>
        <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
      </div>

      <Dialog open={Boolean(pendingImport)} onOpenChange={open => { if (!open) setPendingImport(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认恢复学习进度</DialogTitle>
            <DialogDescription>确认身份和恢复位置后，才会替换本机已有档案。</DialogDescription>
          </DialogHeader>
          {pendingImport && (
            <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
              <p>学生：{pendingImport.portfolio.student.clazz} · {pendingImport.portfolio.student.studentName} · {pendingImport.portfolio.student.classSeatCode}</p>
              <p>恢复位置：课时 {pendingImport.portfolio.progress.lessonId} 第 {pendingImport.portfolio.progress.stepId} 关</p>
              <p>导出时间：{pendingImport.exportedAt || "学习包未记录"}</p>
              {portfolio && <p className="text-destructive">本机当前档案：{portfolio.student.studentName}（确认后将被完整替换）</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingImport(null)}>取消</Button>
            <Button onClick={() => void confirmImport()} disabled={busy}>确认替换</Button>
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
