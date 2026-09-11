/**
 * 文件说明：模块 1 课时 2 风格选择对话框。
 * 职责：提供预设风格卡与自定义风格两个页签；自定义页只生成并复制给外部 AI 的提示词，确认后写回档案。
 * 更新触发：风格卡内容、自定义字段、抽取器工作流文案或确认校验变化时，需要同步更新本文件。
 */

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  MODULE1_CUSTOM_STYLE_ID,
  type Module1Lesson2State,
} from "@/modules/module-1-ai-story/domains/portfolio/types"
import {
  MODULE1_STYLE_CARDS,
  type Module1StyleCard,
} from "@/modules/module-1-ai-story/constants/story-options"
import { buildModule1CustomStyleExtractorPrompt } from "@/modules/module-1-ai-story/features/style-selector/build-custom-style-prompt"
import { cn } from "@/shared/utils/cn"

type StyleTab = "preset" | "custom"

interface StyleSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: Module1Lesson2State
  onConfirm: (patch: Pick<Module1Lesson2State, "styleId" | "styleName" | "styleHint" | "styleExamples">) => void
}

async function copyTextWithFallback(text: string): Promise<void> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("当前浏览器未开放剪贴板接口")
    await navigator.clipboard.writeText(text)
    return
  } catch (clipboardError) {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    try {
      if (!document.execCommand("copy")) throw clipboardError
    } finally {
      textarea.remove()
    }
  }
}

export function StyleSelectorDialog({
  open,
  onOpenChange,
  state,
  onConfirm,
}: StyleSelectorDialogProps) {
  const [tab, setTab] = useState<StyleTab>("preset")
  const [selectedPresetId, setSelectedPresetId] = useState("")
  const [customName, setCustomName] = useState("")
  const [customHint, setCustomHint] = useState("")
  const [customExample1, setCustomExample1] = useState("")
  const [customExample2, setCustomExample2] = useState("")
  const [extractorInput, setExtractorInput] = useState("")
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error" | "empty">("idle")
  const [formError, setFormError] = useState("")
  const [draftSession, setDraftSession] = useState(open)

  if (open !== draftSession) {
    setDraftSession(open)
    if (open) {
      const isCustom = state.styleId === MODULE1_CUSTOM_STYLE_ID
      setTab(isCustom ? "custom" : "preset")
      setSelectedPresetId(isCustom ? "" : state.styleId)
      setCustomName(isCustom ? state.styleName : "")
      setCustomHint(isCustom ? state.styleHint : "")
      setCustomExample1(isCustom ? state.styleExamples[0] ?? "" : "")
      setCustomExample2(isCustom ? state.styleExamples[1] ?? "" : "")
      setExtractorInput("")
      setCopyStatus("idle")
      setFormError("")
    }
  }

  const confirm = () => {
    if (tab === "preset") {
      const card = MODULE1_STYLE_CARDS.find(item => item.id === selectedPresetId)
      if (!card) {
        setFormError("请选择一个预设风格。")
        return
      }
      onConfirm({
        styleId: card.id,
        styleName: card.title,
        styleHint: card.hint,
        styleExamples: [...card.examples],
      })
      onOpenChange(false)
      return
    }

    const name = customName.trim()
    const hint = customHint.trim()
    const example1 = customExample1.trim()
    const example2 = customExample2.trim()
    if (!name || !hint || !example1 || !example2) {
      setFormError("请填写完整的自定义风格信息（风格名称、特点和两个示例开头）。")
      return
    }
    onConfirm({
      styleId: MODULE1_CUSTOM_STYLE_ID,
      styleName: name,
      styleHint: hint,
      styleExamples: [example1, example2],
    })
    onOpenChange(false)
  }

  const copyPrompt = async () => {
    const inputText = extractorInput.trim()
    if (!inputText) {
      setCopyStatus("empty")
      return
    }
    setCopyStatus("idle")
    try {
      await copyTextWithFallback(buildModule1CustomStyleExtractorPrompt(inputText))
      setCopyStatus("success")
    } catch (error) {
      console.error("[module1 style extractor] copy failed", error)
      setCopyStatus("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>选择写作风格</DialogTitle>
          <DialogDescription>
            预设卡可直接选用。自定义风格需要你在常用的 AI 工具里完成分析，再把结果填回本页。
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={tab === "preset" ? "default" : "outline"} onClick={() => { setTab("preset"); setFormError("") }}>
            预设风格
          </Button>
          <Button type="button" size="sm" variant={tab === "custom" ? "default" : "outline"} onClick={() => { setTab("custom"); setFormError("") }}>
            自定义风格
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {tab === "preset" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE1_STYLE_CARDS.map(card => (
                <StyleCardButton
                  key={card.id}
                  card={card}
                  selected={selectedPresetId === card.id}
                  onSelect={() => { setSelectedPresetId(card.id); setFormError("") }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold">风格抽取器</h3>
                <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
                  <li>在下方贴一段你喜欢的文字，或写书名、作者名。</li>
                  <li>点击「生成提示词并复制」。本页只生成提示词，不会在站内调用模型。</li>
                  <li>打开你常用的 AI 工具，把提示词粘贴进去。</li>
                  <li>把 AI 返回的风格名称、特点和两个示例开头填回下面的自定义风格栏。</li>
                </ol>
                <label className="space-y-1 text-sm font-medium">
                  <span>输入文字内容</span>
                  <Textarea
                    className="min-h-[96px]"
                    value={extractorInput}
                    onChange={event => { setExtractorInput(event.target.value); setCopyStatus("idle") }}
                    placeholder="例如：雨停在午夜，街灯却像失眠的人，眼皮一眨一眨。或者输入书名、作者名等"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void copyPrompt()}>
                    {copyStatus === "success" ? "提示词已复制" : "生成提示词并复制"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setExtractorInput(""); setCopyStatus("idle") }}>
                    清空
                  </Button>
                </div>
                {copyStatus === "empty" && <p className="text-xs text-destructive">请先输入文字内容，再生成提示词。</p>}
                {copyStatus === "success" && (
                  <p className="text-xs text-muted-foreground">提示词已复制。请粘贴到你常用的 AI 工具，再把结果填回来。本页不会替你调用模型。</p>
                )}
                {copyStatus === "error" && <p role="alert" className="text-xs text-destructive">复制失败，请检查浏览器剪贴板权限后重试。</p>}
              </section>
              <section className="space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">自定义风格</h3>
                <p className="text-xs text-muted-foreground">填写 AI 生成的结果，或完全手动创建风格。</p>
                <label className="space-y-1 text-sm font-medium">
                  <span>风格名称</span>
                  <Input value={customName} onChange={event => setCustomName(event.target.value)} placeholder="输入风格名称" />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>风格特点</span>
                  <Input value={customHint} onChange={event => setCustomHint(event.target.value)} placeholder="输入风格特点" />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>示例开头 1</span>
                  <Input value={customExample1} onChange={event => setCustomExample1(event.target.value)} placeholder="输入第一个示例开头" />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  <span>示例开头 2</span>
                  <Input value={customExample2} onChange={event => setCustomExample2(event.target.value)} placeholder="输入第二个示例开头" />
                </label>
              </section>
            </div>
          )}
        </div>
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" onClick={confirm}>确认选择</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StyleCardButton({
  card,
  selected,
  onSelect,
}: {
  card: Module1StyleCard
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/10" : "hover:border-primary/50 hover:bg-accent/40",
      )}
    >
      <p className="font-semibold">{card.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">适配 SDG：{card.sdg.join("、")}</p>
      <p className="mt-2 text-xs leading-relaxed">{card.hint}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">① {card.examples[0]}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">② {card.examples[1]}</p>
    </button>
  )
}
