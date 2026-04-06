/**
 * 文件说明：课时3 · 第2关 · 材料加工方法工具箱
 * 职责：顶部全宽展示「材料加工的统一逻辑」（四格漫画 + 课堂翻页）；其下左右双栏——左侧为本关操作区
 *       （课时1 辅助材料来源 + 两条填写 + 确认表述/解锁 + 海报弹窗）；右侧为材料处理参考（仅文字 Tab；无右侧预览卡）。
 * 更新触发：统一逻辑或双栏布局调整时；第2关持久化字段增减时；右侧参考组件契约变化时
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft, Presentation, ClipboardList, LayoutTemplate } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Textarea } from "@/shared/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import type { Lesson3State } from "@/domains/portfolio/types"
import { usePortfolio } from "@/app/providers/AppProvider"
import { advancePointer } from "@/shared/utils/pointer"
import { MaterialProcessingReferencePanel } from "@/features/material-processing-reference"
import { PosterSketchPreview } from "../components/PosterSketchPreview"
import { UnifiedLogicPresentation } from "../components/UnifiedLogicPresentation"
import { UNIFIED_LOGIC_STEPS, stepCaptionLine } from "../lib/unified-logic-content"
import { useComicPanelUrls } from "../lib/useComicPanelUrls"

const TEXT_SAVE_MS = 420

export default function Step2Toolbox() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [logicPresentOpen, setLogicPresentOpen] = useState(false)
  const [logicPresentNonce, setLogicPresentNonce] = useState(0)
  const [posterPreviewOpen, setPosterPreviewOpen] = useState(false)
  const comicImageUrls = useComicPanelUrls()

  const portfolioRef = useRef(portfolio)
  portfolioRef.current = portfolio

  const l3 = portfolio?.lesson3
  const [noticeWhat, setNoticeWhat] = useState("")
  const [whyOnPoster, setWhyOnPoster] = useState("")
  const noticeDraftRef = useRef(noticeWhat)
  const whyDraftRef = useRef(whyOnPoster)
  noticeDraftRef.current = noticeWhat
  whyDraftRef.current = whyOnPoster

  /** 仅在切换档案时从持久化恢复，避免与输入竞态把本地草稿写回空（勿监听 lesson3 全文） */
  useEffect(() => {
    if (!portfolio) return
    setNoticeWhat(portfolio.lesson3.toolboxNoticeWhat)
    setWhyOnPoster(portfolio.lesson3.toolboxWhyOnPoster)
  }, [portfolio?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- 仅 id 变更同步，避免与防抖/确认预览竞态

  useEffect(() => {
    const t = window.setTimeout(() => {
      const p = portfolioRef.current
      if (!p) return
      if (noticeWhat === p.lesson3.toolboxNoticeWhat && whyOnPoster === p.lesson3.toolboxWhyOnPoster) return
      void savePortfolio({
        ...p,
        lesson3: {
          ...p.lesson3,
          toolboxNoticeWhat: noticeWhat,
          toolboxWhyOnPoster: whyOnPoster,
        },
      })
    }, TEXT_SAVE_MS)
    return () => window.clearTimeout(t)
  }, [noticeWhat, whyOnPoster, savePortfolio])

  const patchLesson3 = useCallback(
    async (patch: Partial<Lesson3State>) => {
      const p = portfolioRef.current
      if (!p) return
      await savePortfolio({
        ...p,
        lesson3: {
          ...p.lesson3,
          toolboxNoticeWhat: noticeDraftRef.current,
          toolboxWhyOnPoster: whyDraftRef.current,
          ...patch,
        },
      })
    },
    [savePortfolio]
  )

  if (!portfolio || !l3) return null

  const { student, lesson1, lesson2 } = portfolio
  const myName = lesson1.confirmedOwnerName || student.studentName
  const myR1 = lesson1.r1ByMember.find((r) => r.author === myName)
  const mySourceRows = myR1?.sourceRows ?? []
  const myPublicRecords = lesson2.publicRecords.filter((r) => r.owner === myName)
  const myFieldTasks = lesson2.fieldTasks.filter((t) => t.owner === myName)
  const totalMyRecords = myPublicRecords.length + myFieldTasks.length
  const researchQuestion = lesson1.groupConsensus?.finalResearchQuestion ?? null

  const alreadyDone = l3.toolboxCompleted
  const previewLocked = l3.toolboxWhyPreviewLocked
  /** 步骤进行中且已确认预览时禁用输入；步骤已完成后始终可编辑（防抖保存） */
  const inputsDisabled = !alreadyDone && previewLocked

  const handleConfirm = async () => {
    if (saving) return
    if (!l3.toolboxWhyPreviewLocked) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        pointer: advancePointer(portfolio.pointer, 3, 2),
        lesson3: {
          ...portfolio.lesson3,
          toolboxNoticeWhat: noticeDraftRef.current,
          toolboxWhyOnPoster: whyDraftRef.current,
          toolboxCompleted: true,
        },
      })
      navigate("/lesson/3/step/3")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 w-full max-w-7xl mx-auto">
      <Card className="w-full overflow-hidden border-stone-300 bg-[#faf8f3]">
        <CardHeader className="pb-2 border-b border-dashed border-stone-300/80 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base">材料加工的统一逻辑</CardTitle>
              <p className="text-xs text-muted-foreground font-normal mt-1">
                四步流程一览：上课时可点「内容详解」全屏逐张学习（← → 或空格翻页，Esc 退出）。
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 gap-1.5 border-stone-300 bg-amber-100/90 text-stone-900 hover:bg-amber-200/90"
              onClick={() => {
                setLogicPresentNonce((n) => n + 1)
                setLogicPresentOpen(true)
              }}
            >
              <Presentation className="h-4 w-4" aria-hidden />
              内容详解
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-2 sm:px-4">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full min-w-0"
            role="list"
            aria-label="材料加工统一逻辑四格示意"
          >
            {UNIFIED_LOGIC_STEPS.map((item, i) => {
              const src = comicImageUrls[i]
              const captionLine = stepCaptionLine(item)
              return (
                <div
                  key={item.step}
                  role="listitem"
                  className="flex min-w-0 flex-col rounded-xl border-2 border-stone-800 bg-white overflow-hidden shadow-[5px_5px_0_0_rgba(28,25,23,0.88)]"
                >
                  <div className="relative aspect-[4/3] bg-stone-100 border-b-2 border-stone-800 min-h-0">
                    {src ? (
                      <img
                        src={src}
                        alt={`材料加工统一逻辑第 ${item.step} 步示意图`}
                        className="absolute inset-0 w-full h-full object-contain p-1"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                        请在 <code className="text-[10px] bg-stone-200/80 px-1 rounded">lesson-3/assets</code> 根目录放入第{" "}
                        {item.step} 张 <code className="text-[10px] bg-stone-200/80 px-1 rounded">.jpg</code> /{" "}
                        <code className="text-[10px] bg-stone-200/80 px-1 rounded">.jpeg</code>（按文件名排序对应本格；大图源可放{" "}
                        <code className="text-[10px] bg-stone-200/80 px-1 rounded">assets/原图</code>）
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-[2.25rem] items-center gap-1.5 px-1.5 py-1 sm:gap-2 sm:px-2 sm:py-1.5 bg-amber-50/40">
                    <span className="shrink-0 inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-stone-800 text-[10px] sm:text-xs font-bold text-amber-50">
                      {item.step}
                    </span>
                    <span className="min-w-0 flex-1 text-left text-[10px] sm:text-xs text-stone-800 leading-tight font-medium">
                      {captionLine}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <UnifiedLogicPresentation
        key={logicPresentNonce}
        open={logicPresentOpen}
        onOpenChange={setLogicPresentOpen}
        imageUrls={comicImageUrls}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="min-w-0 space-y-4 order-2 lg:order-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" aria-hidden />
                <CardTitle className="text-base">本关操作区</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground font-normal">
                结合你在课时1 记录的辅助来源，先写下观察与海报用语；右侧可对照文字类加工参考，并在预览区确认稳定稿。
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-normal">
                  我的辅助材料来源（课时1，共 {mySourceRows.length} 条）
                </p>
                {mySourceRows.length > 0 ? (
                  <ul className="space-y-2">
                    {mySourceRows.map((row, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-stone-200/90 bg-stone-50/90 px-3 py-2.5 text-sm font-normal text-stone-800 space-y-1.5 leading-relaxed"
                      >
                        <p className="text-xs font-normal text-muted-foreground">
                          第 {i + 1} 条 · 资料类型：辅助材料来源（课时1 个人 R1 记录）
                        </p>
                        <p className="text-sm font-normal text-stone-800">{row.meta}</p>
                        {(row.fact || row.inspire) && (
                          <div className="text-sm font-normal text-stone-800 space-y-1 pt-0.5 border-t border-dashed border-stone-200/80">
                            {row.fact ? (
                              <p>
                                <span className="text-muted-foreground">可核查事实：</span>
                                {row.fact}
                              </p>
                            ) : null}
                            {row.inspire ? (
                              <p>
                                <span className="text-muted-foreground">对本组计划的启发：</span>
                                {row.inspire}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic border border-dashed rounded-md px-3 py-4 text-center">
                    暂无辅助材料来源记录，可回到课时1 补记后再整理本关表述。
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="toolbox-notice" className="text-sm font-normal leading-snug">
                  这条材料让我注意到什么
                </label>
                <Textarea
                  id="toolbox-notice"
                  rows={4}
                  disabled={inputsDisabled}
                  value={noticeWhat}
                  onChange={(e) => setNoticeWhat(e.target.value)}
                  placeholder="例如：这组数据里周五的剩余率明显偏高……"
                  className="resize-y min-h-[5rem]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="toolbox-why" className="text-sm font-normal leading-snug">
                  海报上的「为何关注」我可以这样写
                </label>
                <Textarea
                  id="toolbox-why"
                  rows={4}
                  disabled={inputsDisabled}
                  value={whyOnPoster}
                  onChange={(e) => setWhyOnPoster(e.target.value)}
                  placeholder="压缩成一句适合贴在海报上的话，客观、可核对……"
                  className="resize-y min-h-[5rem]"
                />
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPosterPreviewOpen(true)}
                >
                  <LayoutTemplate className="h-4 w-4 shrink-0" aria-hidden />
                  在海报上预览「为何关注」位置
                </Button>
              </div>

              {!alreadyDone && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!previewLocked ? (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-violet-700 hover:bg-violet-800 text-white"
                      onClick={() => void patchLesson3({ toolboxWhyPreviewLocked: true })}
                    >
                      确认本条表述
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void patchLesson3({ toolboxWhyPreviewLocked: false })}
                    >
                      解锁修改
                    </Button>
                  )}
                </div>
              )}

              {previewLocked && !alreadyDone && (
                <p className="text-xs text-violet-800 bg-violet-50 border border-violet-200 rounded-md px-3 py-2">
                  表述已确认。若要改动请先点「解锁修改」，编辑后再点「确认本条表述」。
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 order-1 lg:order-2 lg:sticky lg:top-4">
          <MaterialProcessingReferencePanel unlockedTabIds={["text"]} />
        </div>
      </div>

      <Dialog open={posterPreviewOpen} onOpenChange={setPosterPreviewOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-hidden gap-3 p-4 sm:p-5"
          aria-describedby={undefined}
        >
          <DialogHeader className="shrink-0 space-y-0 text-left">
            <DialogTitle>海报草图预览</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 overflow-hidden flex justify-center [&_.font-poster-display]:origin-top [&_.font-poster-display]:scale-[0.92] sm:[&_.font-poster-display]:scale-100">
            <PosterSketchPreview
              embedded
              spotlightCard="why"
              researchQuestion={researchQuestion}
              evidenceEntryCount={totalMyRecords}
              whyBodyOverride={whyOnPoster}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/lesson/3/step/1")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 上一步
        </Button>
        <div className="flex flex-col items-stretch sm:items-end gap-1">
          {!alreadyDone && !l3.toolboxWhyPreviewLocked && (
            <p className="text-xs text-muted-foreground text-right">请先填写左侧内容，并点击「确认本条表述」后再进入下一关。</p>
          )}
          {alreadyDone ? (
            <Button onClick={() => {
              // #region agent log (post-fix verify)
              fetch('http://127.0.0.1:7867/ingest/f477b48f-d907-4d17-af01-17b6b09ded5c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2a660e'},body:JSON.stringify({sessionId:'2a660e',location:'Step2Toolbox.tsx:continue-btn',message:'[post-fix] navigate only, no pointer update',data:{pointer:portfolio.pointer},timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
              // #endregion
              navigate("/lesson/3/step/3")
            }}>
              继续第3关 <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={saving || !l3.toolboxWhyPreviewLocked}>
              {saving ? "保存中…" : "我已了解处理方法，开始筛选材料"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
