/**
 * 文件说明：模块 4 课时 2 素材卡预览弹窗。
 * 职责：把第 3/4 关分区填写的素材信息整合为一张可预览的素材卡，帮助学生检查最终呈现效果。
 * 更新触发：素材卡字段、预览样式、三态结果文案或第 3/4 关预览入口变化时，需要同步更新本文件。
 */

import type { Module4MaterialKind, Module4MaterialScreeningRecord, Module4PostCriteriaStatus } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { LESSON2_SOURCE_TYPE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog"
import { cn } from "@/shared/utils/cn"

interface MaterialPreviewDialogProps {
  kind: Module4MaterialKind
  record: Module4MaterialScreeningRecord
}

const STATUS_TEXT: Record<Module4PostCriteriaStatus, string> = {
  usable: "当前素材可以进入下一步",
  need_fix: "当前素材还需要补充信息或完成复核",
  need_replace: "当前素材建议更换后再继续",
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 min-h-5 whitespace-pre-wrap text-sm text-slate-900">{value || "未填写"}</p>
    </div>
  )
}

function CheckPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "rounded-full px-3 py-1 text-xs font-medium",
      ok ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500",
    )}
    >
      {ok ? "已确认" : "未确认"} · {label}
    </span>
  )
}

export function MaterialPreviewDialog({ kind, record }: MaterialPreviewDialogProps) {
  const isNews = kind === "news"
  const title = isNews ? "新闻素材卡预览" : "图片素材卡预览"
  const nameLabel = isNews ? "新闻短名" : "图片短名"
  const assetLabel = isNews ? "新闻截图" : "图片素材"
  const status = record.postCriteriaStatus ? STATUS_TEXT[record.postCriteriaStatus] : "当前素材还未生成完整状态"
  const statusClassName = record.postCriteriaStatus === "usable"
    ? "bg-green-50 text-green-800"
    : record.postCriteriaStatus === "need_replace"
      ? "bg-red-50 text-red-800"
      : "bg-amber-50 text-amber-900"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">预览{isNews ? "新闻" : "图片"}素材卡</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>把当前填写内容临时合成一张素材卡，便于检查整体样式和缺项。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.9fr),1.1fr]">
          <div className="space-y-3 rounded-3xl border bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">{assetLabel}</p>
            {record.asset ? (
              <img src={record.asset.dataUrl} alt={`${assetLabel}预览`} className="max-h-[52vh] w-full rounded-2xl border bg-white object-contain" />
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed bg-white text-sm text-muted-foreground">
                暂未上传{assetLabel}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className={cn("rounded-2xl px-4 py-3 text-sm font-medium", statusClassName)}>{status}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldRow label={nameLabel} value={record.titleOrName} />
              <FieldRow label="来源类型" value={record.sourceType ? LESSON2_SOURCE_TYPE_LABELS[record.sourceType] : ""} />
            </div>
            <FieldRow label="来源记录" value={record.sourceRecord} />
            <div className="rounded-2xl border bg-white px-4 py-3">
              <p className="text-xs text-muted-foreground">四关复核</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CheckPill ok={Boolean(record.asset)} label={isNews ? "有新闻截图" : "有图片素材"} />
                <CheckPill ok={record.sourceAutoPassed} label="来源记录格式通过" />
                <CheckPill ok={record.selfChecks.typeFits} label="类型符合" />
                <CheckPill ok={record.selfChecks.contentCompliant} label="内容合规" />
                <CheckPill ok={record.selfChecks.hasJudgmentValue} label="具备判断价值" />
              </div>
            </div>
            <FieldRow label="初步疑点" value={record.clueNote} />
            <FieldRow label="同伴 / 自我交流记录" value={record.peerFeedbackNote} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
