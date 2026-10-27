/**
 * 文件说明：模块 2 顶栏全局学习包操作。
 * 职责：学生模式在同一行提供小号的保存学习包、导入学习包和重置。导入前预览身份、小说、进度和图片数量，确认后才替换本机作品。重置前确认，确认后只清除模块二当前档案。教师讲解模式不显示这三颗，也不执行导入或重置。
 * 更新触发：学习包导出顺序、导入预览、覆盖提示、重置确认文案、教师模式按钮规则或给学生看的文案变化时，需要同步更新本文件。
 */

import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { Download, Loader2, RotateCcw, Upload } from "lucide-react"
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
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { Module2PersistenceError } from "@/modules/module-2-ai-comic/infra/persistence/indexeddb/transaction"
import { module2PortfolioRepository } from "@/modules/module-2-ai-comic/infra/persistence/module2-persistence"
import {
  CqpackError,
  isZipSignature,
  LEARNING_PACKAGE_MESSAGES,
  type LearningPackagePreview,
} from "@/modules/module-2-ai-comic/features/learning-package/package-contract"
import { explainNonZipLearningPackage, interpretCqpack } from "@/modules/module-2-ai-comic/features/learning-package/package-read"
import { prepareModule2LearningPackage } from "@/modules/module-2-ai-comic/features/learning-package/prepare-learning-package"
import { unzipWithPackWorker, zipWithPackWorker } from "@/modules/module-2-ai-comic/features/learning-package/pack-client"
import { downloadCqpack } from "@/modules/module-2-ai-comic/features/learning-package/download-cqpack"
import type { Module2PortfolioV1, Module2StoredAsset } from "@/modules/module-2-ai-comic/domains/portfolio/types"

interface PendingImport {
  portfolio: Module2PortfolioV1
  assets: Module2StoredAsset[]
  preview: LearningPackagePreview
}

function dataTransferHasDirectory(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.items ?? []).some(item => {
    if (typeof item.webkitGetAsEntry !== "function") return false
    return Boolean(item.webkitGetAsEntry()?.isDirectory)
  })
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

function displayName(value: string): string {
  const trimmed = value.trim()
  return trimmed || "未填写"
}

function PreviewFacts({ preview, replacing }: { preview: LearningPackagePreview; replacing: boolean }) {
  const rows = [
    ["姓名", displayName(preview.studentName)],
    ["班级", displayName(preview.clazz)],
    ["座号", displayName(preview.classSeatCode)],
    ["小说", displayName(preview.storyTitle)],
    ["小说状态", preview.storyState],
    ["进度", preview.progressLabel],
    ["图片", `${preview.imageCount} 张`],
  ]
  return (
    <div className="mt-3 space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <p key={label} className="grid grid-cols-[4.5rem_1fr] gap-2">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </p>
      ))}
      {replacing && <p className="font-medium text-destructive">{LEARNING_PACKAGE_MESSAGES.replaceHint}</p>}
    </div>
  )
}

function Diagnostic({ text }: { text: string }) {
  if (!text) return null
  return (
    <details className="mt-3 text-xs text-muted-foreground">
      <summary className="cursor-pointer">诊断</summary>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
    </details>
  )
}

export function Module2GlobalActions() {
  const { portfolio, isTeacherMode, flushPortfolio, replaceStudentPortfolio, clearStudentPortfolio } = useModule2State()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState("")
  const [noticeDetail, setNoticeDetail] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [importDone, setImportDone] = useState<LearningPackagePreview | null>(null)
  const [importError, setImportError] = useState("")
  const [importDetail, setImportDetail] = useState("")
  const [dragOver, setDragOver] = useState(false)

  const resetImportDialog = () => {
    setPending(null)
    setImportDone(null)
    setImportError("")
    setImportDetail("")
    setDragOver(false)
  }

  const handleSave = async () => {
    if (isTeacherMode || busy) return
    if (!portfolio) {
      setNotice(LEARNING_PACKAGE_MESSAGES.noRecord)
      setNoticeDetail("")
      return
    }
    setBusy(true)
    setSaving(true)
    setNotice(LEARNING_PACKAGE_MESSAGES.preparing)
    setNoticeDetail("")
    try {
      const prepared = await prepareModule2LearningPackage({
        flush: flushPortfolio,
        readSnapshot: id => module2PortfolioRepository.readExportSnapshot(id),
        zip: zipWithPackWorker,
      })
      if (!prepared.ok) {
        setNotice(prepared.message)
        setNoticeDetail(prepared.diagnostic)
        return
      }
      setNotice(LEARNING_PACKAGE_MESSAGES.downloading)
      downloadCqpack(prepared.bytes, prepared.filename)
      const warning = prepared.warning ? ` ${prepared.warning}` : ""
      setNotice(`${prepared.message}${warning}`)
    } catch (error) {
      setNotice(LEARNING_PACKAGE_MESSAGES.packFailed)
      setNoticeDetail(error instanceof Error ? error.message : "保存学习包没有完成")
    } finally {
      setSaving(false)
      setBusy(false)
    }
  }

  const readImportFile = async (file: File) => {
    setBusy(true)
    setImportError("")
    setImportDetail("")
    setImportDone(null)
    setPending(null)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (!isZipSignature(bytes)) {
        const explained = explainNonZipLearningPackage(bytes)
        setImportError(explained.message)
        setImportDetail(explained.diagnostic)
        return
      }
      const entries = await unzipWithPackWorker(bytes)
      const read = await interpretCqpack(entries, new Date().toISOString())
      setPending({ portfolio: read.portfolio, assets: read.assets, preview: read.preview })
    } catch (error) {
      if (error instanceof CqpackError) {
        setImportError(error.studentMessage)
        setImportDetail(error.message)
      } else {
        setImportError(LEARNING_PACKAGE_MESSAGES.incomplete)
        setImportDetail(error instanceof Error ? error.message : "无法读取学习包")
      }
    } finally {
      setBusy(false)
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    event.target.value = ""
    if (!files || files.length === 0 || busy || isTeacherMode) return
    if (files.length > 1) {
      setPending(null)
      setImportDone(null)
      setImportError("请一次放入一个学习包。当前作品未改变")
      setImportDetail("")
      return
    }
    await readImportFile(files[0])
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
    if (busy || isTeacherMode) return
    if (dataTransferHasDirectory(event.dataTransfer)) {
      setPending(null)
      setImportDone(null)
      setImportError("请放入学习包文件，不要放入文件夹。当前作品未改变")
      setImportDetail("")
      return
    }
    const files = event.dataTransfer.files
    if (!files || files.length === 0) {
      setPending(null)
      setImportDone(null)
      setImportError("请放入本模块保存的学习包。当前作品未改变")
      setImportDetail("")
      return
    }
    if (files.length > 1) {
      setPending(null)
      setImportDone(null)
      setImportError("请一次放入一个学习包。当前作品未改变")
      setImportDetail("")
      return
    }
    await readImportFile(files[0])
  }

  const confirmImport = async () => {
    if (!pending || isTeacherMode || busy) return
    setBusy(true)
    setImportError("")
    setImportDetail("")
    try {
      const replaced = await replaceStudentPortfolio(pending.portfolio, pending.assets)
      if (!replaced) {
        setImportError(LEARNING_PACKAGE_MESSAGES.importFailed)
        setImportDetail("没有写入这台电脑上的作品")
        return
      }
      setImportDone(pending.preview)
      setPending(null)
      setNotice(LEARNING_PACKAGE_MESSAGES.restored)
      setNoticeDetail("")
      navigate("/module/2")
    } catch (error) {
      if (error instanceof Module2PersistenceError && error.kind === "quota") {
        setImportError(LEARNING_PACKAGE_MESSAGES.quota)
      } else {
        setImportError(LEARNING_PACKAGE_MESSAGES.importFailed)
      }
      setImportDetail(error instanceof Error ? error.message : "导入没有完成")
    } finally {
      setBusy(false)
    }
  }

  const confirmReset = async () => {
    if (!portfolio || isTeacherMode || busy) return
    setBusy(true)
    setNotice("")
    setNoticeDetail("")
    // 先离开课时页，避免档案清空后课时页立刻再建一份空档案。
    navigate("/module/2")
    try {
      const cleared = await clearStudentPortfolio()
      if (!cleared) return
      setShowResetDialog(false)
    } catch (error) {
      setNotice("重置没有完成，这台电脑上的模块二档案还在。")
      setNoticeDetail(error instanceof Error ? error.message : "重置没有完成")
    } finally {
      setBusy(false)
    }
  }

  if (isTeacherMode) return null

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
          <Button
            size="sm"
            disabled={busy}
            title="把当前作品保存成学习包"
            onClick={() => void handleSave()}
            className="gap-1.5 border-blue-600 bg-blue-600 px-2 text-xs text-white hover:bg-blue-700 sm:px-3"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            保存学习包
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            title="从学习包恢复作品"
            onClick={() => {
              resetImportDialog()
              setShowImportDialog(true)
            }}
            className="gap-1.5 px-2 text-xs sm:px-3"
          >
            <Upload className="h-3.5 w-3.5" />
            导入学习包
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !portfolio}
            title="清除这台电脑上的模块二档案"
            onClick={() => setShowResetDialog(true)}
            className="gap-1.5 px-2 text-xs text-destructive hover:text-destructive sm:px-3"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </Button>
        </div>
        {notice && (
          <div role="status" className="max-w-xs text-right text-xs text-muted-foreground">
            <p>{notice}</p>
            <Diagnostic text={noticeDetail} />
          </div>
        )}
      </div>

      <Dialog
        open={showImportDialog}
        onOpenChange={(open) => {
          if (busy) return
          setShowImportDialog(open)
          if (!open) {
            if (pending && !importDone) setNotice(LEARNING_PACKAGE_MESSAGES.kept)
            resetImportDialog()
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          onDragOver={event => event.preventDefault()}
          onDrop={event => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>导入学习包</DialogTitle>
            <DialogDescription className="sr-only">
              {importDone ? "已恢复" : importError ? "无法导入" : "把学习包拖到左边，或点选文件。"}
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
              <span className="text-sm font-medium">拖入学习包，或点击选择</span>
            </div>
            <div
              aria-live="polite"
              className={`flex min-h-36 flex-col justify-center rounded-lg border p-4 ${
                importDone
                  ? "border-green-600 bg-green-50"
                  : importError
                    ? "border-red-300 bg-red-50"
                    : pending
                      ? "border-blue-300 bg-blue-50"
                      : "border-border bg-muted/40"
              }`}
            >
              {importDone ? (
                <>
                  <h2 className="text-lg font-semibold text-green-900">{LEARNING_PACKAGE_MESSAGES.restored}</h2>
                  <PreviewFacts preview={importDone} replacing={false} />
                </>
              ) : importError ? (
                <>
                  <h2 className="text-lg font-semibold text-red-900">无法导入</h2>
                  <p role="alert" className="mt-2 text-sm text-red-800">{importError}</p>
                  <Diagnostic text={importDetail} />
                </>
              ) : pending ? (
                <>
                  <h2 className="text-lg font-semibold text-blue-950">请确认</h2>
                  <PreviewFacts preview={pending.preview} replacing={Boolean(portfolio)} />
                </>
              ) : busy ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在读取…
                </p>
              ) : (
                <div className="space-y-1 text-sm text-foreground">
                  <p>把本模块保存的学习包拖到左边，或点选文件。</p>
                  <p>确认前，这台电脑上的作品不会改变。</p>
                </div>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={event => void handleFile(event)} />
          <DialogFooter className="gap-2 sm:space-x-0">
            {!importDone && (
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
                disabled={busy}
              >
                取消
              </Button>
            )}
            {pending && !importDone && (
              <Button onClick={() => void confirmImport()} disabled={busy}>
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                确认导入
              </Button>
            )}
            {importDone && (
              <Button onClick={() => setShowImportDialog(false)}>完成</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={open => { if (!busy) setShowResetDialog(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置模块二档案</DialogTitle>
            <DialogDescription>
              会清除这台电脑上的模块二档案。请先保存学习包。
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确认后只清除这台电脑上模块二的当前档案，不会改动模块一。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={busy}>取消</Button>
            <Button variant="destructive" onClick={() => void confirmReset()} disabled={busy || !portfolio}>
              {busy ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />重置中...</> : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
