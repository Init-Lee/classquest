/**
 * 文件说明：课时 1 第 1 关「导入我的小说」。
 * 职责：选择小说文件或手工粘贴四段，核对身份、题目和四段后，调用已有解析与确认事务；教师虚构示例不能完成本人项目，改编样例只在第 2 关观看。
 * 更新触发：第 1 关导入、核对、换小说提示或确认后的放行条件变化时，需要同步更新本文件。
 */

import { useEffect, useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { useModule2State } from "@/modules/module-2-ai-comic/app/providers/Module2Provider"
import { MODULE2_CLASS_OPTIONS } from "@/modules/module-2-ai-comic/constants/class-options"
import {
  cancelModule2SourceImportDraft,
  computeModule2Lesson1Gates,
  confirmModule2SourceImportDraft,
  isSameModule2Source,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  MODULE2_FOUR_PARTS,
  createModule2Id,
  type Module2PortfolioV1,
  type SourceImportDraft,
  type StudentIdentity,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { MODULE2_FIELD_LIMITS } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import { createManualNovelDraft, editNovelDraft } from "@/modules/module-2-ai-comic/features/source-import/novel-draft"
import type { NovelCandidate } from "@/modules/module-2-ai-comic/features/source-import/novel-types"
import { parseNovelSource } from "@/modules/module-2-ai-comic/features/source-import/parse-novel"
import { stageNovelCandidate } from "@/modules/module-2-ai-comic/features/source-import/stage-novel"
import {
  displayIdentity,
  formToIdentity,
  identityConflict,
  identityFieldErrors,
  identityToForm,
  initialReviewedIdentity,
  reviewedIdentityReady,
  sameIdentity,
  type Lesson1IdentityForm,
} from "@/modules/module-2-ai-comic/lessons/lesson-1/components/identity-form"
import {
  Lesson1ContinueButton,
  Lesson1StepHeader,
} from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-chrome"
import { commitLesson1Change } from "@/modules/module-2-ai-comic/lessons/lesson-1/components/lesson1-commit"
import { LESSON1_PARTS } from "@/modules/module-2-ai-comic/lessons/lesson-1/copy"

type PendingDialog =
  | { kind: "replace-file"; candidate: NovelCandidate }
  | { kind: "replace-paste" }
  | { kind: "switch-source" }
  | null

const EMPTY_FORM: Lesson1IdentityForm = { clazz: "", studentName: "", seatOnly: "" }

function switchImpact(portfolio: Module2PortfolioV1): string[] {
  const title = portfolio.sourceSnapshot?.storyTitle.trim() || "原来的小说"
  const lines = [`当前已接入的《${title}》会留在记录里，确认后改用这一篇。`]
  const hasScenes = MODULE2_FOUR_PARTS.some(part => portfolio.storyboard.frames[part].sceneSentence.trim() !== "")
  const hasVisual = portfolio.visualDirection.words.some(word => word.trim() !== "") || portfolio.visualDirection.reason.trim() !== ""
  lines.push(hasScenes ? "已经写下的四个画面会保留，但需要重新核对后才能继续。" : "目前还没有四个画面。")
  lines.push(hasVisual ? "视觉词和理由会保留，但需要重新确认。" : "目前还没有视觉方向。")
  if (portfolio.lesson1.sampleObservation.trim()) lines.push("看样例时写的观察会保留。")
  return lines
}

function IdentityFields({
  idPrefix,
  form,
  errors,
  onChange,
}: {
  idPrefix: string
  form: Lesson1IdentityForm
  errors: Partial<Record<keyof Lesson1IdentityForm, string>>
  onChange: (form: Lesson1IdentityForm) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-class`} className="text-sm font-medium">班级</label>
        <select
          id={`${idPrefix}-class`}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.clazz}
          onChange={event => onChange({ ...form, clazz: event.target.value })}
        >
          <option value="">请选择班级</option>
          {MODULE2_CLASS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        {errors.clazz && <p className="text-xs text-red-600">{errors.clazz}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-name`} className="text-sm font-medium">姓名</label>
        <Input id={`${idPrefix}-name`} value={form.studentName} maxLength={MODULE2_FIELD_LIMITS.identity} onChange={event => onChange({ ...form, studentName: event.target.value })} />
        {errors.studentName && <p className="text-xs text-red-600">{errors.studentName}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-seat`} className="text-sm font-medium">座号后两位</label>
        <Input
          id={`${idPrefix}-seat`}
          inputMode="numeric"
          maxLength={2}
          value={form.seatOnly}
          placeholder="01～50"
          onChange={event => onChange({ ...form, seatOnly: event.target.value.replace(/\D/g, "").slice(0, 2) })}
        />
        {errors.seatOnly && <p className="text-xs text-red-600">{errors.seatOnly}</p>}
      </div>
    </div>
  )
}

export default function Step1ImportNovel() {
  const { portfolio, updatePortfolio, flushPortfolio, saveStatus, isTeacherMode, retrySave } = useModule2State()
  const fileRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef<SourceImportDraft | null>(null)
  const studentRef = useRef<StudentIdentity | null>(null)
  const [form, setForm] = useState<Lesson1IdentityForm>(EMPTY_FORM)
  const [baseline, setBaseline] = useState<StudentIdentity | null>(null)
  const [locked, setLocked] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [reading, setReading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<PendingDialog>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [paste, setPaste] = useState({ title: "", ...EMPTY_FORM, opening: "", development: "", turn: "", ending: "" })

  const draft = portfolio?.sourceImportDraft ?? null
  const draftToken = draft ? `${draft.importedAt}|${draft.sourceFileSha256 ?? ""}|${draft.filename ?? ""}` : ""
  draftRef.current = draft
  if (portfolio) studentRef.current = portfolio.student

  useEffect(() => {
    const currentDraft = draftRef.current
    const existing = studentRef.current
    if (!currentDraft || !existing) return
    const nextForm = initialReviewedIdentity(existing, currentDraft.student)
    setForm(nextForm)
    setBaseline(existing)
    const lockedNow = reviewedIdentityReady(identityToForm(existing))
    setLocked(lockedNow)
    if (!lockedNow) {
      const student = formToIdentity(nextForm)
      updatePortfolio(current => sameIdentity(current.student, student) ? current : { ...current, student })
    }
  }, [draftToken, updatePortfolio])

  if (!portfolio) return null
  const source = portfolio.sourceSnapshot
  const gates = computeModule2Lesson1Gates(portfolio)
  const errors = identityFieldErrors(form)
  const conflict = Boolean(baseline && draft && identityConflict(baseline, draft.student))
  const teachingSample = Boolean(draft?.isTeachingSample || source?.isTeachingSample)
  const connected = !busy
    && !draft
    && saveStatus.state !== "error"
    && saveStatus.state !== "saving"
    && Boolean(source && !source.isTeachingSample && gates.step1)

  const changeIdentity = (next: Lesson1IdentityForm) => {
    setForm(next)
    if (locked) return
    const student = formToIdentity(next)
    updatePortfolio(current => sameIdentity(current.student, student) ? current : { ...current, student })
  }

  const applyCandidate = (candidate: NovelCandidate) => {
    updatePortfolio(current => stageNovelCandidate(current, candidate).portfolio)
    setNotice(candidate.message)
    setError("")
    setPasteOpen(candidate.review === "manual")
  }

  const onFile = async (file: File) => {
    setReading(true)
    setError("")
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const result = await parseNovelSource({ bytes, filename: file.name, importedAt: new Date().toISOString() })
      if (result.kind === "rejected") {
        setError(result.message)
        return
      }
      if (portfolio.sourceImportDraft) {
        setDialog({ kind: "replace-file", candidate: result })
        return
      }
      applyCandidate(result)
    } catch {
      setError("这个文件没有读出来。请换一份模块一「我的小说」下载的 HTML 或 Markdown。")
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const stagePaste = () => {
    const parts = {
      opening: paste.opening,
      development: paste.development,
      turn: paste.turn,
      ending: paste.ending,
    }
    if (MODULE2_FOUR_PARTS.some(part => parts[part].trim() === "") || paste.title.trim() === "") {
      setError("请自己填好题目和起、承、转、合四段。这里不会自动分段。")
      return
    }
    if (portfolio.sourceImportDraft) {
      setDialog({ kind: "replace-paste" })
      return
    }
    applyCandidate({
      kind: "candidate",
      review: "manual",
      message: "候选已保存，待核对。",
      draft: createManualNovelDraft(
        { filename: null, importedAt: new Date().toISOString(), sourceFileSha256: null },
        { student: formToIdentity(paste), storyTitle: paste.title, parts },
      ),
    })
  }

  const requestConfirm = () => {
    if (!draft) return
    if (draft.isTeachingSample) {
      setError("这是教师虚构示例，不能用来完成你的本人项目。请导入自己的小说。")
      return
    }
    if (MODULE2_FOUR_PARTS.some(part => draft.parts[part].trim() === "") || draft.storyTitle.trim() === "") {
      setError("题目和起、承、转、合四段都需要填写后才能确认。")
      return
    }
    if (!reviewedIdentityReady(form)) {
      setError("请先核对班级、姓名和座号。")
      return
    }
    if (source && !isSameModule2Source(source, draft)) {
      setDialog({ kind: "switch-source" })
      return
    }
    void runConfirm()
  }

  const runConfirm = async () => {
    setDialog(null)
    setBusy(true)
    setError("")
    try {
      const failure = await commitLesson1Change(updatePortfolio, flushPortfolio, (current) => {
        if (!current.sourceImportDraft || current.sourceImportDraft.isTeachingSample) {
          return { portfolio: current, error: "这是教师虚构示例，不能用来完成你的本人项目。" }
        }
        const result = confirmModule2SourceImportDraft(current, {
          snapshotId: createModule2Id("src"),
          student: formToIdentity(form),
          now: new Date().toISOString(),
        })
        if (!result.ok) return { portfolio: current, error: result.reason }
        return { portfolio: result.portfolio, error: "" }
      })
      if (failure) setError(failure)
      else setNotice("这篇小说已经接入。")
    } catch {
      setError("确认还没有保存成功。你核对过的内容还在，请重试保存。")
    } finally {
      setBusy(false)
    }
  }

  const cancelDraft = () => {
    updatePortfolio(current => cancelModule2SourceImportDraft(current))
    setNotice("已取消这份候选。已经接入的小说没有改动。")
    setError("")
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <Lesson1StepHeader
        step={1}
        title="导入我的小说"
        lead="把模块一完成的小说带进来，我们将从中选出四个画面。"
      />
      <div className="max-w-3xl space-y-4">
        <div className="space-y-2">
          <input
            ref={fileRef}
            id="m2-novel-file"
            className="sr-only"
            type="file"
            accept=".html,.htm,.md,.markdown,.txt,.json,text/html,text/markdown,text/plain,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onFile(file)
            }}
          />
          <Button type="button" onClick={() => fileRef.current?.click()} disabled={reading || busy}>
            {reading ? "正在读取…" : "选择小说文件"}
          </Button>
          <p className="text-sm text-muted-foreground">优先选择模块一「我的小说」下载的 HTML，也支持 Markdown。</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        {saveStatus.state === "error" && (
          <p role="alert" className="text-sm text-red-600">
            保存失败，输入还在。
            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={retrySave}>重试保存</Button>
          </p>
        )}

        {source && (
          <section className="rounded-lg border p-4 text-sm">
            <h2 className="font-medium">{connected ? "已接入" : "当前小说"}：《{source.storyTitle}》</h2>
            {source.isTeachingSample && <p className="mt-2 text-amber-900">这是教师虚构示例，不能作为你的本人项目。</p>}
            {isTeacherMode && connected && <p className="mt-2 text-amber-800">这是讲解演示，没有写入学生档案。</p>}
          </section>
        )}

        {draft && (
          <section className="space-y-4 rounded-lg border p-4" aria-label="待核对的小说">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{draft.storyTitle.trim() || "未命名小说"}</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">候选已保存，待核对</span>
            </div>
            {draft.filename && <p className="break-all text-xs text-muted-foreground">文件：{draft.filename}</p>}
            {draft.isTeachingSample && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-medium">教师虚构示例</p>
                <p className="mt-1">这篇和课堂练习《关灯这件事》相同，不能用来完成你的本人项目。请另选自己的小说。</p>
              </div>
            )}
            <div className="space-y-1 text-sm">
              <p className="font-medium">文件里的身份</p>
              <p>{displayIdentity(draft.student)}</p>
            </div>
            {conflict && baseline && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <p>这台电脑上已有的身份和文件里的不一样。请核对后再确认，确认前不会改掉已有记录。</p>
                <p className="mt-1">已有身份：{displayIdentity(baseline)}</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => changeIdentity(identityToForm(draft.student))}>
                  改用文件里的身份
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">核对后使用的身份</h3>
              <IdentityFields idPrefix="m2-review" form={form} errors={errors} onChange={changeIdentity} />
            </div>
            <div className="space-y-1">
              <label htmlFor="m2-title" className="text-sm font-medium">题目</label>
              <Input
                id="m2-title"
                value={draft.storyTitle}
                maxLength={MODULE2_FIELD_LIMITS.storyTitle}
                onChange={event => updatePortfolio(current => {
                  if (!current.sourceImportDraft) return current
                  return { ...current, sourceImportDraft: editNovelDraft(current.sourceImportDraft, { storyTitle: event.target.value }) }
                })}
              />
            </div>
            {LESSON1_PARTS.map(part => (
              <div key={part.id} className="space-y-1">
                <label htmlFor={`m2-part-${part.id}`} className="text-sm font-medium">{part.label}</label>
                <Textarea
                  id={`m2-part-${part.id}`}
                  className="min-h-[120px] whitespace-pre-wrap"
                  value={draft.parts[part.id]}
                  maxLength={MODULE2_FIELD_LIMITS.novelPart}
                  onChange={event => updatePortfolio(current => {
                    if (!current.sourceImportDraft) return current
                    return {
                      ...current,
                      sourceImportDraft: editNovelDraft(current.sourceImportDraft, { parts: { [part.id]: event.target.value } }),
                    }
                  })}
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={requestConfirm} disabled={busy || draft.isTeachingSample}>确认这篇小说</Button>
              <Button type="button" variant="outline" onClick={cancelDraft}>取消这份候选</Button>
            </div>
            {draft && source && !draft.isTeachingSample && (
              <p className="text-xs text-muted-foreground">取消或重选候选不会改动已经接入的小说。下一关仍使用已接入的那一篇，直到你确认换成新的。</p>
            )}
          </section>
        )}

        <details className="rounded-lg border p-4" open={pasteOpen} onToggle={event => setPasteOpen((event.currentTarget as HTMLDetailsElement).open)}>
          <summary className="cursor-pointer text-sm font-medium">文件找不到？</summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">把题目和四段分别贴到下面。每一段一个框，不会自动猜分段。</p>
            <div className="space-y-1">
              <label htmlFor="m2-paste-title" className="text-sm font-medium">题目</label>
              <Input id="m2-paste-title" value={paste.title} maxLength={MODULE2_FIELD_LIMITS.storyTitle} onChange={event => setPaste(current => ({ ...current, title: event.target.value }))} />
            </div>
            <IdentityFields
              idPrefix="m2-paste"
              form={paste}
              errors={{}}
              onChange={next => setPaste(current => ({ ...current, ...next }))}
            />
            {LESSON1_PARTS.map(part => (
              <div key={part.id} className="space-y-1">
                <label htmlFor={`m2-paste-${part.id}`} className="text-sm font-medium">{part.label}</label>
                <Textarea
                  id={`m2-paste-${part.id}`}
                  value={paste[part.id]}
                  maxLength={MODULE2_FIELD_LIMITS.novelPart}
                  onChange={event => setPaste(current => ({ ...current, [part.id]: event.target.value }))}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={stagePaste}>保存为待核对候选</Button>
          </div>
        </details>

        <Lesson1ContinueButton
          enabled={gates.step1 && !busy}
          toStep={2}
          label="进入下一关"
          hint={teachingSample && !gates.step1 ? "教师虚构示例不能完成第 1 关。请导入自己的小说。" : "确认这篇小说并保存成功后，才能进入下一关。"}
        />
      </div>

      <Dialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null) }}>
        <DialogContent className="max-w-[min(100vw-1.5rem,32rem)]">
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "switch-source" ? "换成这篇小说之前" : "替换待核对的候选"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "switch-source"
                ? "请先看会影响到的选景和视觉方向，再决定要不要换。"
                : "换成新的内容只会替换这份候选，不会改动已经接入的小说。"}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === "switch-source" && (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {switchImpact(portfolio).map(line => <li key={line}>{line}</li>)}
            </ul>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>留下原来的</Button>
            {dialog?.kind === "replace-file" && (
              <Button type="button" onClick={() => { applyCandidate(dialog.candidate); setDialog(null) }}>替换候选</Button>
            )}
            {dialog?.kind === "replace-paste" && (
              <Button type="button" onClick={() => {
                updatePortfolio(current => cancelModule2SourceImportDraft(current))
                setDialog(null)
                applyCandidate({
                  kind: "candidate",
                  review: "manual",
                  message: "候选已保存，待核对。",
                  draft: createManualNovelDraft(
                    { filename: null, importedAt: new Date().toISOString(), sourceFileSha256: null },
                    {
                      student: formToIdentity(paste),
                      storyTitle: paste.title,
                      parts: { opening: paste.opening, development: paste.development, turn: paste.turn, ending: paste.ending },
                    },
                  ),
                })
              }}>替换候选</Button>
            )}
            {dialog?.kind === "switch-source" && (
              <Button type="button" onClick={() => void runConfirm()}>确认换成这篇小说</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
