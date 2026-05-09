/**
 * 文件说明：模块 4 课时 2 素材工作台表单组件。
 * 职责：承载新闻素材与图片素材通用的上传/替换、来源记录、自检、疑点和交流记录编辑流程。
 * 更新触发：第 3/4 关必填字段、来源检查动作、计数规则或素材完成判定变化时，需要同步更新本文件。
 */

import type {
  Module4CompressedMaterialAsset,
  Module4MaterialKind,
  Module4MaterialScreeningRecord,
  Module4MaterialSourceType,
} from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { CompressedMaterialUploader } from "./CompressedMaterialUploader"
import { SourceRecordGuide } from "./SourceRecordGuide"
import { SourceRecordCheckBadge } from "./SourceRecordCheckBadge"
import { MaterialSelfCheckPanel } from "./MaterialSelfCheckPanel"
import { LESSON2_IMAGE_CLUE_EXAMPLES, LESSON2_SOURCE_TYPE_LABELS } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/data/screening-examples"
import { checkSourceRecord } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/source-record-check"
import { isLesson2MaterialComplete } from "@/modules/module-4-ai-info-detective/lessons/lesson-2/utils/material-completion"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

interface MaterialWorkbenchFormProps {
  kind: Module4MaterialKind
  record: Module4MaterialScreeningRecord
  onChange: (next: Module4MaterialScreeningRecord) => void
}

const SOURCE_TYPES: Module4MaterialSourceType[] = ["web", "ai_generated", "field_capture", "mixed"]

export function MaterialWorkbenchForm({ kind, record, onChange }: MaterialWorkbenchFormProps) {
  const isNews = kind === "news"
  const selfCheckLabels = isNews
    ? {
      typeFits: "这是一份新闻类素材，符合本模块范围。",
      contentCompliant: "这份素材不涉及明显隐私、侵权或不适宜内容。",
      hasJudgmentValue: "这份素材能围绕 AI 痕迹或核验需求提出讨论。",
    }
    : {
      typeFits: "这是一张单张静态图片，符合本模块范围。",
      contentCompliant: "这份素材不涉及明显隐私、侵权或不适宜内容。",
      hasJudgmentValue: "这份素材能围绕 AI 痕迹或核验需求提出讨论。",
    }

  const update = (patch: Partial<Module4MaterialScreeningRecord>) => {
    const next = { ...record, ...patch, completed: false, completedAt: "" }
    onChange({ ...next, completed: isLesson2MaterialComplete(next), completedAt: isLesson2MaterialComplete(next) ? new Date().toISOString() : "" })
  }

  const handleAssetChange = (asset: Module4CompressedMaterialAsset) => update({ asset })

  const handleSourceCheck = () => {
    const result = checkSourceRecord(record.sourceType, record.sourceRecord)
    update({
      sourceAutoPassed: result.passed,
      sourceCheckLastReason: result.reason,
      sourceCheckCount: record.sourceCheckCount + 1,
    })
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{isNews ? "新闻截图" : "图片素材"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            {isNews
              ? "新闻素材不是整篇文章，也不是只有标题。本课需要的是一张能展示标题、导语 / 正文片段，并尽量保留来源信息的新闻截图。"
              : "图片类素材应是单张静态图片。不要使用短视频、多图拼图、聊天记录长截图，也不要使用涉及隐私或未经授权人脸的图片。"}
          </p>
          <CompressedMaterialUploader kind={kind} asset={record.asset} onAssetChange={handleAssetChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">来源记录与基础信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">{isNews ? "新闻短名" : "图片短名"}</span>
              <Input value={record.titleOrName} onChange={event => update({ titleOrName: event.target.value })} placeholder="例如：校园 AI 图片新闻截图" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">来源类型</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={record.sourceType ?? ""}
                onChange={event => update({ sourceType: event.target.value as Module4MaterialSourceType, sourceAutoPassed: false })}
              >
                <option value="">请选择来源类型</option>
                {SOURCE_TYPES.map(type => <option key={type} value={type}>{LESSON2_SOURCE_TYPE_LABELS[type]}</option>)}
              </select>
            </label>
          </div>
          <SourceRecordGuide />
          <label className="space-y-2 text-sm">
            <span className="font-medium">来源记录</span>
            <Textarea value={record.sourceRecord} onChange={event => update({ sourceRecord: event.target.value, sourceAutoPassed: false })} placeholder="填写链接、平台、生成记录、拍摄说明或加工过程。" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={handleSourceCheck}>检查来源记录</Button>
            <SourceRecordCheckBadge checked={record.sourceCheckCount > 0} passed={record.sourceAutoPassed} reason={record.sourceCheckLastReason} />
            <span className="text-xs text-muted-foreground">已检查 {record.sourceCheckCount} 次。系统只检查格式，不判断来源真实可信。</span>
          </div>
        </CardContent>
      </Card>

      <MaterialSelfCheckPanel value={record.selfChecks} labels={selfCheckLabels} onChange={selfChecks => update({ selfChecks })} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">初步疑点与交流记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isNews && (
            <div className="grid gap-2 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 md:grid-cols-2">
              {LESSON2_IMAGE_CLUE_EXAMPLES.map(example => <p key={example}>“{example}”</p>)}
            </div>
          )}
          <label className="space-y-2 text-sm">
            <span className="font-medium">初步疑点提示</span>
            <Textarea value={record.clueNote} onChange={event => update({ clueNote: event.target.value, clueEditCount: record.clueEditCount + 1 })} placeholder="写 1 条 AI 痕迹、信息缺口或需要进一步核验之处。" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">同伴 / 自我交流记录</span>
            <Textarea value={record.peerFeedbackNote} onChange={event => update({ peerFeedbackNote: event.target.value, peerFeedbackEditCount: record.peerFeedbackEditCount + 1 })} placeholder="记录一条与同学交流后的提醒或修改意见。" />
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
