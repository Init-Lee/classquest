/**
 * 文件说明：旧版数据导入向导 UI（临时功能）
 * 职责：在首页提供4步导入向导，引导已用旧版工具完成课时1/2的学生
 *       将两份 JSON 文件迁移到新版 ClassQuest 学习档案，并直接进入对应进度。
 * 更新触发：LegacyL1 / LegacyL2 结构变化时；导入步骤流程调整时
 * 删除触发：全班迁移完成后，连同整个 legacy-import/ 目录一并删除
 */

import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, ChevronRight, CheckCircle2, AlertCircle, Users, User } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { usePortfolio } from "@/modules/module-3-ai-science-station/app/providers/AppProvider"
import {
  isLegacyL1,
  isLegacyL2,
  buildPortfolioFromLegacy,
  type LegacyL1,
  type LegacyL2,
} from "./legacy-import"

// ─────────────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：JSON 文件解析（带友好错误）
// ─────────────────────────────────────────────────────────────────────────────

async function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string))
      } catch {
        reject(new Error("JSON 格式错误，请确认是正确的导出文件"))
      }
    }
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsText(file, "utf-8")
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 步骤指示器组件
// ─────────────────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: WizardStep; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as WizardStep
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done ? "bg-green-500 text-white" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? "✓" : step}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-6 transition-colors ${done ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        )
      })}
      <span className="text-xs text-muted-foreground ml-1">
        {current === 1 && "上传课时1分工手册"}
        {current === 2 && "确认身份与角色"}
        {current === 3 && "上传课时2素材收集（可选）"}
        {current === 4 && "预览并确认导入"}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 步骤1：上传 L1
// ─────────────────────────────────────────────────────────────────────────────

function Step1Upload({ onNext }: { onNext: (l1: LegacyL1) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<LegacyL1 | null>(null)

  const handleFile = async (file: File) => {
    setError("")
    setLoading(true)
    try {
      const data = await readJsonFile(file)
      if (!isLegacyL1(data)) {
        setError("这不是正确的「分工手册」文件，请检查是否选错了文件。")
        setLoading(false)
        return
      }
      setPreview(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "文件读取失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault() }}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">上传课时1的「分工手册」JSON 文件</p>
          <p className="text-xs text-muted-foreground mt-1">点击此处或直接拖放文件</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-green-50 border-green-200 p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">文件识别成功</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-800">
            <div><span className="opacity-60">主题包：</span>{preview.basic.themePack}</div>
            <div><span className="opacity-60">班级：</span>{preview.basic.clazz}班</div>
            <div className="col-span-2"><span className="opacity-60">研究问题：</span>{preview.basic.researchQuestion || "（未填写）"}</div>
            <div className="col-span-2">
              <span className="opacity-60">成员列表：</span>
              {preview.basic.groupName || "（未填写）"}
            </div>
            <div><span className="opacity-60">证据条数：</span>{preview.evidences.length} 条</div>
          </div>
          <button
            className="text-xs text-green-600 underline underline-offset-2 hover:text-green-800"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = "" }}
          >
            重新上传
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground text-center">解析中…</p>}

      <Button className="w-full" disabled={!preview} onClick={() => preview && onNext(preview)}>
        下一步：确认身份
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 步骤2：选姓名 + 选角色
// ─────────────────────────────────────────────────────────────────────────────

function Step2Identity({
  l1,
  onNext,
  onBack,
}: {
  l1: LegacyL1
  onNext: (name: string, role: "leader" | "member") => void
  onBack: () => void
}) {
  // 解析成员列表（中英文逗号均支持）
  const members = l1.basic.groupName
    .split(/[，,]/)
    .map(s => s.trim())
    .filter(Boolean)

  const [selectedName, setSelectedName] = useState("")
  const [selectedRole, setSelectedRole] = useState<"leader" | "member" | "">("")

  const isValid = selectedName && selectedRole

  return (
    <div className="space-y-5">
      {/* 选姓名 */}
      <div>
        <p className="text-sm font-medium mb-2">你是哪位同学？<span className="text-destructive">*</span></p>
        <div className="flex flex-wrap gap-2">
          {members.map(name => (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedName(name)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                selectedName === name
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        {members.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">分工手册中未找到成员姓名，请联系组长检查文件。</p>
        )}
      </div>

      {/* 选角色 */}
      <div>
        <p className="text-sm font-medium mb-2">你的角色是？<span className="text-destructive">*</span></p>
        <div className="flex gap-3">
          {(["leader", "member"] as const).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                selectedRole === role
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {role === "leader" ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
              {role === "leader" ? "组长" : "组员"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selectedRole === "leader"
            ? "组长：负责小组整体协调，可查看全组任务与进度"
            : selectedRole === "member"
            ? "组员：完成个人分配任务，查看自己的分工安排"
            : "旧版工具没有记录角色，请根据实际情况选择"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>返回</Button>
        <Button
          className="flex-1"
          disabled={!isValid}
          onClick={() => isValid && selectedRole && onNext(selectedName, selectedRole)}
        >
          下一步：上传课时2
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 步骤3：上传 L2（可跳过）
// ─────────────────────────────────────────────────────────────────────────────

function Step3UploadL2({
  selectedName,
  onNext,
  onBack,
}: {
  selectedName: string
  onNext: (l2: LegacyL2 | null) => void
  onBack: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<LegacyL2 | null>(null)

  const handleFile = async (file: File) => {
    setError("")
    setLoading(true)
    try {
      const data = await readJsonFile(file)
      if (!isLegacyL2(data)) {
        setError("这不是正确的「素材收集包」文件，请检查是否选错了文件。")
        setLoading(false)
        return
      }
      // 校验 collector 是否与选中姓名一致（仅警告，不阻断）
      const l2 = data as LegacyL2
      if (l2.collector && l2.collector !== selectedName) {
        setError(
          `提示：该文件的收集人是「${l2.collector}」，与你选择的姓名「${selectedName}」不一致。如果是你本人的文件，可忽略此提示继续导入。`
        )
      }
      setPreview(l2)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "文件读取失败")
    } finally {
      setLoading(false)
    }
  }

  const publicCount = preview?.evidences.filter(e => e.sourceType === "public").length ?? 0
  const fieldCount = preview?.evidences.filter(e => e.sourceType === "field").length ?? 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        如果你已经完成了课时2的素材收集，请上传「素材收集包」文件；
        如果还没有，可以直接跳过，导入后从课时2第1关继续。
      </p>

      {!preview ? (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">上传课时2的「素材收集包」JSON 文件</p>
          <p className="text-xs text-muted-foreground mt-1">点击此处或直接拖放文件</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-green-50 border-green-200 p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">文件识别成功</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-800">
            <div><span className="opacity-60">收集人：</span>{preview.collector}</div>
            <div><span className="opacity-60">公开资源：</span>{publicCount} 条</div>
            <div><span className="opacity-60">现场采集：</span>{fieldCount} 条</div>
          </div>
          <button
            className="text-xs text-green-600 underline underline-offset-2 hover:text-green-800"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; setError("") }}
          >
            重新上传
          </button>
        </div>
      )}

      {/* 警告（不阻断） */}
      {error && (
        <div className={`flex items-start gap-2 text-sm rounded p-3 border ${
          preview ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-600 bg-red-50 border-red-200"
        }`}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground text-center">解析中…</p>}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>返回</Button>
        <Button variant="outline" className="flex-1 text-muted-foreground" onClick={() => onNext(null)}>
          跳过此步
        </Button>
        <Button className="flex-1" disabled={!preview} onClick={() => preview && onNext(preview)}>
          下一步：预览
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 步骤4：预览 + 确认
// ─────────────────────────────────────────────────────────────────────────────

function Step4Confirm({
  l1,
  l2,
  selectedName,
  selectedRole,
  onBack,
  onConfirm,
  saving,
}: {
  l1: LegacyL1
  l2: LegacyL2 | null
  selectedName: string
  selectedRole: "leader" | "member"
  onBack: () => void
  onConfirm: () => void
  saving: boolean
}) {
  const hasL2 = !!l2
  const publicCount = l2?.evidences.filter(e => e.sourceType === "public").length ?? 0
  const fieldCount = l2?.evidences.filter(e => e.sourceType === "field").length ?? 0
  const hasRecords = publicCount > 0 || fieldCount > 0
  const targetStep = hasL2 ? (hasRecords ? "课时2 · 第4关（质检）" : "课时2 · 第3关（证据入库）") : "课时2 · 第1关（恢复进度）"

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">请确认以下导入信息，点击"确认导入"后系统将创建你的学习档案并跳转到对应进度。</p>

      <div className="rounded-lg border divide-y text-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground">身份</span>
          <span className="font-medium">{selectedName} · {selectedRole === "leader" ? "组长" : "组员"}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground">课时1</span>
          <span className="font-medium">{l1.evidences.length} 条证据清单 · 已完成</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground">课时2</span>
          {hasL2 ? (
            <span className="font-medium">公开 {publicCount} 条 · 现场 {fieldCount} 条</span>
          ) : (
            <span className="text-muted-foreground">未导入（从第1关开始）</span>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
          <span className="text-muted-foreground">进入位置</span>
          <Badge variant="default">{targetStep}</Badge>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
        <p className="font-medium">注意事项</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>导入后部分旧字段可能无对应新字段，系统已填写默认值</li>
          <li>证据入库表单的部分信息可能需要补充（如合规勾选）</li>
          <li>导入前请确认本设备上没有其他同学的学习档案</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={saving}>返回</Button>
        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={onConfirm} disabled={saving}>
          {saving ? "导入中…" : "确认导入，开始学习"}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 主组件：向导（无折叠壳，可直接嵌入独立页面）
// ─────────────────────────────────────────────────────────────────────────────

export function LegacyImportWizard() {
  const { savePortfolio } = usePortfolio()
  const navigate = useNavigate()

  const [step, setStep] = useState<WizardStep>(1)
  const [l1, setL1] = useState<LegacyL1 | null>(null)
  const [l2, setL2] = useState<LegacyL2 | null>(null)
  const [selectedName, setSelectedName] = useState("")
  const [selectedRole, setSelectedRole] = useState<"leader" | "member">("member")
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState("")

  const handleConfirm = async () => {
    if (!l1) return
    setSaving(true)
    setImportError("")
    try {
      const portfolio = buildPortfolioFromLegacy({ l1, l2, selectedName, selectedRole })
      await savePortfolio(portfolio)
      navigate(`/module/3/lesson/${portfolio.pointer.lessonId}/step/${portfolio.pointer.stepId}`)
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "导入失败，请重试")
      setSaving(false)
    }
  }

  return (
    <div>
      <StepDots current={step} total={4} />

      {step === 1 && (
        <Step1Upload
          onNext={data => { setL1(data); setStep(2) }}
        />
      )}

      {step === 2 && l1 && (
        <Step2Identity
          l1={l1}
          onNext={(name, role) => { setSelectedName(name); setSelectedRole(role); setStep(3) }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3UploadL2
          selectedName={selectedName}
          onNext={data => { setL2(data); setStep(4) }}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && l1 && (
        <Step4Confirm
          l1={l1}
          l2={l2}
          selectedName={selectedName}
          selectedRole={selectedRole}
          onBack={() => setStep(3)}
          onConfirm={handleConfirm}
          saving={saving}
        />
      )}

      {importError && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {importError}
        </div>
      )}
    </div>
  )
}
