/**
 * 文件说明：课时 6 V3 发布审核预览弹窗。
 * 职责：展示单条 V3 审核详情中的题卡内容、课时 5 统计、修订说明与教师确认发布操作。
 * 更新触发：Lesson6 审核详情字段、题卡 JSON 结构、发布确认口径、教师备注或只读权限规则变化时，需要同步更新本文件。
 */

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import type { Lesson6ReviewDetail } from "@/teacher-console/types"

interface Lesson6V3ReviewPreviewDialogProps {
  open: boolean
  detail: Lesson6ReviewDetail | null
  loading?: boolean
  publishing?: boolean
  canManage?: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onPublish: (teacherNote: string) => void
}

interface NormalizedOption {
  key: string
  text: string
  rationale: string
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalizeOptions(cardJson: Record<string, unknown>): NormalizedOption[] {
  const task = recordValue(cardJson.task)
  const rawOptions = arrayValue(task.options).length > 0 ? arrayValue(task.options) : arrayValue(cardJson.options)
  return rawOptions
    .map(option => recordValue(option))
    .map((option, index) => ({
      key: textValue(option.key) || String.fromCharCode(65 + index),
      text: textValue(option.text) || textValue(option.label) || textValue(option.content) || "未填写选项内容",
      rationale: textValue(option.rationale),
    }))
}

function readCorrectOptionKey(cardJson: Record<string, unknown>): string {
  const task = recordValue(cardJson.task)
  return textValue(task.correctOptionKey) || textValue(cardJson.correctOptionKey)
}

function renderSource(source: unknown): string {
  if (source == null || source === "") return "未提供来源摘要。"
  if (typeof source === "string") return source
  if (typeof source !== "object" || Array.isArray(source)) return "来源摘要格式暂不可展示。"
  const record = source as Record<string, unknown>
  const parts = [
    textValue(record.sourceType) || textValue(record.type),
    textValue(record.sourceRecord) || textValue(record.record) || textValue(record.url) || textValue(record.link),
    textValue(record.verificationNote) || textValue(record.note) || textValue(record.verification),
  ].filter(Boolean)
  return parts.join("；") || "未提供来源摘要。"
}

function formatRate(value: number | null | undefined): string {
  return value == null ? "暂无" : `${Math.round(value * 100)}%`
}

function diagnosisText(diagnosis: Record<string, unknown>): string {
  const selected = Array.isArray(diagnosis.selectedProblems)
    ? diagnosis.selectedProblems.filter((item): item is string => typeof item === "string")
    : []
  const evidence = textValue(diagnosis.evidence)
  return [selected.join("、"), evidence].filter(Boolean).join("；") || "未填写"
}

function cardTitle(detail: Lesson6ReviewDetail): string {
  const material = recordValue(detail.cardJson.material)
  return textValue(material.titleOrName)
    || textValue(material.title)
    || textValue(material.headline)
    || detail.itemShortName
    || "未命名 V3 题卡"
}

function CardPreview({ detail }: { detail: Lesson6ReviewDetail }) {
  const material = recordValue(detail.cardJson.material)
  const task = recordValue(detail.cardJson.task)
  const asset = recordValue(material.asset)
  const assetUrl = textValue(asset.dataUrl)
  const assetAlt = textValue(asset.alt) || textValue(asset.title) || cardTitle(detail)
  const prompt = textValue(task.prompt) || textValue(task.question) || "未填写判断任务"
  const explanation = textValue(recordValue(detail.cardJson.explanation).text)
    || textValue(task.explanation)
    || textValue(detail.cardJson.explanation)
  const source = detail.cardJson.source ?? task.source ?? task.sourceRecord ?? material.source
  const options = normalizeOptions(detail.cardJson)
  const correctOptionKey = readCorrectOptionKey(detail.cardJson)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-2xl border bg-slate-50/70 p-4">
        <p className="text-xs font-semibold tracking-wide text-primary">素材区</p>
        {assetUrl ? (
          <div className="mt-3 flex min-h-56 items-center justify-center overflow-hidden rounded-xl border bg-white">
            <img src={assetUrl} alt={assetAlt} className="max-h-72 max-w-full object-contain" />
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed bg-white p-4 text-sm text-muted-foreground">
            当前题卡没有图片素材，或素材为文字/网页来源。
          </div>
        )}
        <h3 className="mt-3 text-sm font-semibold">{cardTitle(detail)}</h3>
        {(textValue(material.displayNote) || textValue(material.description)) && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {textValue(material.displayNote) || textValue(material.description)}
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary">判断任务</p>
            <h3 className="mt-2 text-base font-semibold leading-6">{prompt}</h3>
          </div>
          <Badge variant={detail.cardKind === "news" ? "secondary" : "warning"}>
            {detail.cardKind === "news" ? "新闻题卡" : "图片题卡"}
          </Badge>
        </div>

        <div className="space-y-2">
          {options.length > 0 ? options.map(option => {
            const correct = option.key === correctOptionKey
            return (
              <div key={`${option.key}:${option.text}`} className={`rounded-xl border p-3 text-sm ${correct ? "border-emerald-200 bg-emerald-50" : "bg-slate-50"}`}>
                <div className="flex items-start gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">{option.key}</span>
                  <div className="flex-1">
                    <p className="leading-6">{option.text}</p>
                    {option.rationale && <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.rationale}</p>}
                  </div>
                  {correct && <Badge variant="success">正解</Badge>}
                </div>
              </div>
            )
          }) : (
            <p className="rounded-xl border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">未填写选项。</p>
          )}
        </div>

        {explanation && (
          <div className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            <p className="font-medium">解析</p>
            <p className="mt-1">{explanation}</p>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
          <p>来源核验：{renderSource(source)}</p>
        </div>
      </section>
    </div>
  )
}

export function Lesson6V3ReviewPreviewDialog({
  open,
  detail,
  loading = false,
  publishing = false,
  canManage = false,
  error = "",
  onOpenChange,
  onPublish,
}: Lesson6V3ReviewPreviewDialogProps) {
  const [teacherNote, setTeacherNote] = useState("")

  useEffect(() => {
    setTeacherNote(detail?.teacherNote ?? "")
  }, [detail?.reviewId, detail?.teacherNote])

  const publishDisabled = useMemo(
    () => !detail || !canManage || publishing || detail.checkStatus === "publishable",
    [canManage, detail, publishing],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>V3 题卡发布审核</DialogTitle>
          <DialogDescription>
            预览题卡、统计与修订计划后，具备 manage 权限的教师可确认进入公共题库。
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">正在加载审核详情...</p>}
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {!loading && detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={detail.checkStatus === "publishable" ? "success" : "warning"}>
                {detail.checkStatus === "publishable" ? "已确认可发布" : "待确认"}
              </Badge>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{detail.className}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{detail.studentDisplay}</span>
              <span className="text-muted-foreground">提交：{new Date(detail.submittedAt).toLocaleString()}</span>
              {detail.checkedAt && <span className="text-muted-foreground">确认：{new Date(detail.checkedAt).toLocaleString()}</span>}
            </div>

            <CardPreview detail={detail} />

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-4">
                <h3 className="text-sm font-semibold">课时 5 试答统计</h3>
                {detail.lesson5Stats ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-muted-foreground">有效样本</p>
                      <p className="mt-1 text-xl font-semibold">{detail.lesson5Stats.validAnswerCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-muted-foreground">正确率</p>
                      <p className="mt-1 text-xl font-semibold">{formatRate(detail.lesson5Stats.correctRate)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-muted-foreground">问题标记率</p>
                      <p className="mt-1 text-xl font-semibold">{formatRate(detail.lesson5Stats.issueFlagRate)}</p>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground sm:col-span-3">
                      清晰 {detail.lesson5Stats.avgClarity?.toFixed(1) ?? "暂无"} · 思考 {detail.lesson5Stats.avgThinkingValue?.toFixed(1) ?? "暂无"} · 解析 {detail.lesson5Stats.avgExplanationHelpfulness?.toFixed(1) ?? "暂无"} · {detail.lesson5Stats.statsStatus || "暂无样本状态"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">暂无课时 5 统计摘要。</p>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <h3 className="text-sm font-semibold">V3 修订说明</h3>
                {detail.revisionPlan ? (
                  <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <p><span className="font-medium text-slate-900">动作：</span>{detail.revisionPlan.revisionAction || "未填写"}</p>
                    <p><span className="font-medium text-slate-900">诊断：</span>{diagnosisText(detail.revisionPlan.diagnosis)}</p>
                    <p><span className="font-medium text-slate-900">原因：</span>{detail.revisionPlan.revisionReason || "未填写"}</p>
                    <p><span className="font-medium text-slate-900">预期效果：</span>{detail.revisionPlan.expectedEffect || "未填写"}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">暂无修订说明。</p>
                )}
              </div>
            </section>

            <label className="block space-y-2">
              <span className="text-sm font-medium">教师备注</span>
              <Textarea
                value={teacherNote}
                onChange={event => setTeacherNote(event.target.value)}
                placeholder="可选：记录确认依据或提醒。"
                disabled={!canManage || detail.checkStatus === "publishable" || publishing}
              />
            </label>

            {!canManage && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                当前账号对该班级没有 manage 权限，只能查看审核详情，不能确认发布。
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={publishing}>关闭</Button>
          <Button onClick={() => onPublish(teacherNote)} disabled={publishDisabled}>
            {publishing ? "发布中..." : detail?.checkStatus === "publishable" ? "已确认可发布" : "确认可发布"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
