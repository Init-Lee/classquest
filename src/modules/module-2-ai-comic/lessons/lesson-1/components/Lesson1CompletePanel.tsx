/**
 * 文件说明：课时 1 完成弹窗。
 * 职责：在第 4 关保存成功后展示小说题目、四句画面、视觉词和理由；请老师一起检查三项目标，并提供保存学习包、本课阶段快照和回到模块首页。回到首页只离开本关，不清除本机档案。只宣布本课任务已保存，不给星级，也不说已经交给老师，也不开放下一课。
 * 更新触发：完成弹窗展示字段、学习目标表述、学习包按钮、阶段快照按钮、回到首页或下一课提示变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { module2PortfolioRepository } from "@/modules/module-2-ai-comic/infra/persistence/module2-persistence"
import { LEARNING_PACKAGE_MESSAGES } from "@/modules/module-2-ai-comic/features/learning-package/package-contract"
import { prepareModule2LearningPackage } from "@/modules/module-2-ai-comic/features/learning-package/prepare-learning-package"
import { zipWithPackWorker } from "@/modules/module-2-ai-comic/features/learning-package/pack-client"
import { downloadCqpack } from "@/modules/module-2-ai-comic/features/learning-package/download-cqpack"
import { Lesson1StageSnapshotButton } from "@/modules/module-2-ai-comic/features/global-actions/Lesson1StageSnapshotButton"
import { LESSON1_GOALS, LESSON1_PARTS } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"
import type { Module2PortfolioV1 } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export function Lesson1CompletePanel({
  open,
  onOpenChange,
  portfolio,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: Module2PortfolioV1
}) {
  const navigate = useNavigate()
  const { isTeacherMode, flushPortfolio, saveStatus } = useModule2State()
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const saved = saveStatus.state !== "saving" && saveStatus.state !== "error"
  const source = portfolio.sourceSnapshot
  const savedLine = isTeacherMode
    ? "讲解模式没有写入学生档案。"
    : saved
      ? "本课任务已保存"
      : saveStatus.state === "saving"
        ? "正在保存…"
        : "保存还没有成功，内容还在，请重试。"

  const savePack = async () => {
    if (isTeacherMode || busy) return
    setBusy(true)
    setNotice(LEARNING_PACKAGE_MESSAGES.preparing)
    try {
      const prepared = await prepareModule2LearningPackage({
        flush: flushPortfolio,
        readSnapshot: id => module2PortfolioRepository.readExportSnapshot(id),
        zip: zipWithPackWorker,
      })
      if (!prepared.ok) {
        setNotice(prepared.message)
        return
      }
      downloadCqpack(prepared.bytes, prepared.filename)
      const warning = prepared.warning ? ` ${prepared.warning}` : ""
      setNotice(`${prepared.message}。${warning}请到浏览器的下载里查看。本包包含小说和本课记录，用来恢复进度；后续图片会一起保存。`)
    } catch {
      setNotice(LEARNING_PACKAGE_MESSAGES.packFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[min(100vw-1.5rem,40rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>本课小结</DialogTitle>
          <DialogDescription>
            阶段快照用来交作业，不能恢复学习进度。换设备请保存学习包。
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm font-medium">{savedLine}</p>
        <p className="text-sm"><span className="text-muted-foreground">小说题目：</span>{source?.storyTitle}</p>
        <div className="space-y-2">
          {LESSON1_PARTS.map(part => (
            <p key={part.id} className="whitespace-pre-wrap break-words text-sm">
              <span className="font-medium">{part.label}：</span>
              {portfolio.storyboard.frames[part.id].sceneSentence}
            </p>
          ))}
        </div>
        <p className="text-sm"><span className="font-medium">视觉词：</span>{portfolio.visualDirection.words.join("、")}</p>
        <p className="whitespace-pre-wrap break-words text-sm"><span className="font-medium">理由：</span>{portfolio.visualDirection.reason}</p>
        <div>
          <h3 className="text-sm font-semibold">三项学习目标，请与老师一起检查</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
            {LESSON1_GOALS.map(goal => <li key={goal}>{goal}</li>)}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2">
          <Lesson1StageSnapshotButton portfolio={portfolio} enabled />
          <Button type="button" onClick={() => void savePack()} disabled={isTeacherMode || busy}>
            {busy ? "正在准备…" : "保存学习包"}
          </Button>
          {/* 只导航回模块首页，不重置、不清除档案。 */}
          <Button type="button" variant="outline" onClick={() => navigate("/module/2")}>回到首页</Button>
        </div>
        {isTeacherMode && <p className="text-sm text-amber-800">讲解模式不能保存学习包，避免和学生作品混在一起。</p>}
        {notice && <p role="status" className="text-sm">{notice}</p>}
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">下一课待开放</p>
      </DialogContent>
    </Dialog>
  )
}
