/**
 * 文件说明：模块 4 课时 4 V2 题卡本地编辑器。
 * 职责：在 Step3 中编辑 V2 题卡的素材展示、判断任务、核心解析与来源核验字段，避免直接复用课时 3 业务组件。
 * 更新触发：V2 可编辑字段、题卡结构、选项编辑规则或 Step3 左侧编辑布局变化时，需要同步更新本文件。
 */

import type { Module4Lesson3OptionKey, Module4Lesson4V2CardDraft } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

export function V2QuestionCardEditorWorkbench({
  card,
  onChange,
}: {
  card: Module4Lesson4V2CardDraft
  onChange: (card: Module4Lesson4V2CardDraft) => void
}) {
  const touch = (patch: Partial<Module4Lesson4V2CardDraft>) => {
    onChange({ ...card, ...patch, status: "draft", updatedAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-5 rounded-xl border bg-white p-5">
      <section className="space-y-3">
        <h3 className="font-semibold">素材展示</h3>
        <Input
          value={card.material.titleOrName}
          onChange={event => touch({ material: { ...card.material, titleOrName: event.target.value } })}
          placeholder="素材标题或名称"
        />
        <Textarea
          value={card.material.displayNote}
          onChange={event => touch({ material: { ...card.material, displayNote: event.target.value } })}
          placeholder="说明这则新闻或图片为什么适合作为辨识素材"
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">判断任务</h3>
        <Textarea
          value={card.task.prompt}
          onChange={event => touch({ task: { ...card.task, prompt: event.target.value } })}
          placeholder="填写判断题任务"
        />
        <div className="space-y-2">
          {card.task.options.map((option, index) => (
            <div key={option.key} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[3rem_1fr_1fr_5rem]">
              <span className="font-semibold">{option.key}</span>
              <Input
                value={option.label}
                onChange={event => {
                  const options = card.task.options.map((item, itemIndex) => (
                    itemIndex === index ? { ...item, label: event.target.value } : item
                  ))
                  touch({ task: { ...card.task, options } })
                }}
                placeholder="选项文案"
              />
              <Input
                value={option.rationale}
                onChange={event => {
                  const options = card.task.options.map((item, itemIndex) => (
                    itemIndex === index ? { ...item, rationale: event.target.value } : item
                  ))
                  touch({ task: { ...card.task, options } })
                }}
                placeholder="选项解析"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`${card.id}-answer`}
                  checked={card.task.correctOptionKey === option.key}
                  onChange={() => touch({ task: { ...card.task, correctOptionKey: option.key as Module4Lesson3OptionKey } })}
                />
                正解
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">核心解析</h3>
        <Textarea
          value={card.explanation.text}
          onChange={event => touch({
            explanation: {
              ...card.explanation,
              text: event.target.value,
              editCount: card.explanation.editCount + 1,
              updatedAt: new Date().toISOString(),
            },
          })}
          placeholder="解释参考答案与关键证据"
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">来源核验</h3>
        <Input
          value={card.source.sourceRecord}
          onChange={event => touch({ source: { ...card.source, sourceRecord: event.target.value } })}
          placeholder="来源链接、出处或保存记录"
        />
        <Textarea
          value={card.source.verificationNote}
          onChange={event => touch({ source: { ...card.source, verificationNote: event.target.value } })}
          placeholder="说明你如何核验来源"
        />
      </section>
    </div>
  )
}

