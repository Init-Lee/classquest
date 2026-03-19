/**
 * 文件说明：AI 助手抽屉组件
 * 职责：提供 R2（计划生成）和 R3（风控体检）的提示词模板和外部 AI 工具跳转链接
 *       学生复制提示词 -> 去豆包等工具对话 -> 粘贴结果回来 -> 系统记录日志
 *       首版不接入 AI API，置灰"在线AI"入口作为未来升级占位
 * 更新触发：提示词模板更新时；AI 工具链接变化时；接入 API 时替换 mock 逻辑
 */

import { useState } from "react"
import { Copy, ExternalLink, Check, Bot } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import type { ModulePortfolio } from "@/domains/portfolio/types"
import type { AIAssistKind } from "@/domains/prompts/types"

/** 豆包外部链接 */
const DOUBAO_URL = "https://www.doubao.com/chat/"

/** 根据 kind 和上下文生成提示词模板 */
function buildPromptTemplate(kind: AIAssistKind, contextSummary: string): string {
  if (kind === "R2") {
    return `你是一个科学研究助手，帮助初中生完善证据收集计划。

【我的研究背景】
${contextSummary}

请帮我：
1. 判断我的研究问题是否可采证（能找到具体证据来支持或反驳）
2. 建议 3 条最关键的证据采集方案（一手/二手各说明）
3. 提示可能的跑偏风险（我容易把研究做偏的方向）

请用简洁的中文回答，每条建议不超过50字。`
  }

  return `你是一个科研风险评估助手，帮助初中生检查证据收集计划的合理性。

【我的证据收集计划】
${contextSummary}

请帮我做"风控体检"，具体检查：
1. 最可能失败的 2 个风险点（比如：采不到、时间来不及、隐私问题等）
2. 针对每个风险的规避建议
3. 是否存在隐私、安全或误导风险
4. AI 使用声明要点（如果用了 AI 辅助，应该怎么注明）

请用简洁的中文回答。`
}

interface AIHelperDrawerProps {
  open: boolean
  onClose: () => void
  kind: AIAssistKind
  portfolio: ModulePortfolio
  onSave: (portfolio: ModulePortfolio) => Promise<void>
  contextSummary: string
}

export function AIHelperDrawer({ open, onClose, kind, portfolio, onSave, contextSummary }: AIHelperDrawerProps) {
  const [copied, setCopied] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const [adopted, setAdopted] = useState(false)
  const [adoptedNote, setAdoptedNote] = useState("")
  const [saving, setSaving] = useState(false)

  const promptText = buildPromptTemplate(kind, contextSummary)
  const kindLabel = kind === "R2" ? "计划生成助手" : "风控体检助手"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级处理
    }
  }

  const handleSaveLog = async () => {
    if (!aiResult.trim()) return
    setSaving(true)
    try {
      const newLog = {
        kind,
        inputSummary: contextSummary,
        outputText: aiResult,
        adopted,
        adoptedNote: adoptedNote || undefined,
        createdAt: new Date().toISOString(),
      }
      await onSave({
        ...portfolio,
        lesson1: {
          ...portfolio.lesson1,
          aiAssistLogs: [...portfolio.lesson1.aiAssistLogs, newLog],
        },
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-yellow-500" />
            AI 助手 · {kindLabel}
          </SheetTitle>
          <SheetDescription>
            {kind === "R2" ? "把你的研究方向发给 AI，获取计划生成建议" : "把你的证据清单发给 AI，进行风险体检"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 步骤1：复制提示词 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">第一步：复制下面的提示词</p>
            <div className="relative">
              <div className="bg-muted rounded-lg p-4 text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                {promptText}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 gap-1"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>

          {/* 步骤2：去 AI 工具对话 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">第二步：去 AI 工具粘贴对话</p>
            <a
              href={DOUBAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full p-3 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              打开豆包 AI（新标签页）
            </a>
            <p className="text-xs text-muted-foreground">
              复制上面的提示词，粘贴到豆包或其他 AI 工具，获取回复后回到这里粘贴
            </p>
            {/* 置灰的在线 AI 入口（未来 API 接入后启用） */}
            <Button variant="outline" disabled className="w-full gap-2 opacity-40">
              <Bot className="h-4 w-4" />
              在线 AI 助手（即将开放）
            </Button>
          </div>

          {/* 步骤3：粘贴 AI 回复 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">第三步：把 AI 回复粘贴到这里</p>
            <Textarea
              placeholder="把 AI 的回复粘贴到这里..."
              value={aiResult}
              onChange={e => setAiResult(e.target.value)}
              rows={6}
            />
          </div>

          {/* 步骤4：记录是否采纳 */}
          {aiResult.trim() && (
            <div className="space-y-2">
              <p className="text-sm font-medium">第四步：记录你的态度</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adopted}
                  onChange={e => setAdopted(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">我采纳了 AI 的建议（部分或全部）</span>
              </label>
              {adopted && (
                <Textarea
                  placeholder="采纳了哪些建议？（可选）"
                  value={adoptedNote}
                  onChange={e => setAdoptedNote(e.target.value)}
                  rows={2}
                />
              )}
              <Button
                className="w-full"
                onClick={handleSaveLog}
                disabled={saving}
              >
                {saving ? "记录中..." : "记录本次 AI 使用"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
