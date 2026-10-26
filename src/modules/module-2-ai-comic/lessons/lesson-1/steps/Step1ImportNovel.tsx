/**
 * 文件说明：课时 1 第 1 关「导入我的小说」。
 * 职责：用「导入文件」「直接填写」两个选项卡接入小说。文件解析出的身份、题目和四段只读核对，只有文件里缺的身份项可以补填；直接填写可改，保存为待核对候选后再确认。确认成功后展开已接入小说全文。教师虚构示例不能完成本人项目。
 * 更新触发：第 1 关导入方式、只读核对、缺项补填、换文件提示或确认后的全文展示变化时，需要同步更新本文件。
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
  isModule2IdentityComplete,
  isSameModule2Source,
} from "@/modules/module-2-ai-comic/domains/portfolio/lesson1-update"
import {
  MODULE2_FOUR_PARTS,
  createModule2Id,
  type Module2PortfolioV1,
  type SourceImportDraft,
  type SourceSnapshot,
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
  identityHasText,
  identityToForm,
  importedIdentityLocks,
  mergeReviewedIdentity,
  reviewedIdentityForConfirm,
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
  | { kind: "replace-fill" }
  | { kind: "switch-source" }
  | null

type ImportTab = "file" | "fill"

type FillForm = Lesson1IdentityForm & {
  title: string
  opening: string
  development: string
  turn: string
  ending: string
}

const EMPTY_FORM: Lesson1IdentityForm = { clazz: "", studentName: "", seatOnly: "" }
const EMPTY_FILL: FillForm = { title: "", ...EMPTY_FORM, opening: "", development: "", turn: "", ending: "" }
const READONLY_BOX = "whitespace-pre-wrap break-words rounded-md border border-input bg-muted px-3 py-2 text-sm leading-relaxed text-foreground"

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

function formForDraft(existing: StudentIdentity, currentDraft: SourceImportDraft): Lesson1IdentityForm {
  if (currentDraft.origin === "manual") {
    return identityHasText(currentDraft.student) ? identityToForm(currentDraft.student) : identityToForm(existing)
  }
  return mergeReviewedIdentity(existing, currentDraft.student)
}

function confirmStudent(form: Lesson1IdentityForm, currentDraft: SourceImportDraft): StudentIdentity {
  if (currentDraft.origin === "manual") return reviewedIdentityForConfirm(form, null, null)
  return reviewedIdentityForConfirm(form, currentDraft.student, importedIdentityLocks(currentDraft.student))
}

function TeachingSampleNotice() {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-medium">教师虚构示例</p>
      <p className="mt-1">这篇和课堂练习《关灯这件事》相同，不能用来完成你的本人项目。请另选自己的小说。</p>
    </div>
  )
}

/** 只读灰框。正文按原文保留换行，框会随全文变高。 */
function ReadOnlyText({ label, text, compact = false }: { label: string; text: string; compact?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <div className={`${READONLY_BOX} ${compact ? "min-h-10" : "min-h-[80px]"}`}>{text}</div>
    </div>
  )
}

function ReadOnlyIdentity({ student }: { student: StudentIdentity }) {
  const fields = [
    ["班级", student.clazz.trim() || "未填写"],
    ["姓名", student.studentName.trim() || "未填写"],
    ["班学号", student.classSeatCode.trim() || "未填写"],
  ] as const
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {fields.map(([label, value]) => <ReadOnlyText key={label} label={label} text={value} compact />)}
    </div>
  )
}

function IdentityFields({
  idPrefix,
  form,
  errors,
  onChange,
  locks,
  seatDisplay,
}: {
  idPrefix: string
  form: Lesson1IdentityForm
  errors: Partial<Record<keyof Lesson1IdentityForm, string>>
  onChange: (form: Lesson1IdentityForm) => void
  locks?: Partial<Record<keyof Lesson1IdentityForm, boolean>>
  seatDisplay?: string
}) {
  const classLocked = Boolean(locks?.clazz)
  const nameLocked = Boolean(locks?.studentName)
  const seatLocked = Boolean(locks?.seatOnly)
  const seatShowsCode = seatLocked && !/^\d{2}$/.test(form.seatOnly)
  const classOptions = !form.clazz || MODULE2_CLASS_OPTIONS.includes(form.clazz)
    ? MODULE2_CLASS_OPTIONS
    : [form.clazz, ...MODULE2_CLASS_OPTIONS]
  const gray = "bg-muted text-foreground disabled:opacity-100"
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-class`} className="text-sm font-medium">班级</label>
        <select
          id={`${idPrefix}-class`}
          className={`flex h-10 w-full rounded-md border border-input px-3 text-sm ${classLocked ? gray : "bg-background"}`}
          value={form.clazz}
          disabled={classLocked}
          onChange={event => onChange({ ...form, clazz: event.target.value })}
        >
          <option value="">请选择班级</option>
          {classOptions.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        {errors.clazz && <p className="text-xs text-red-600">{errors.clazz}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-name`} className="text-sm font-medium">姓名</label>
        <Input
          id={`${idPrefix}-name`}
          value={form.studentName}
          readOnly={nameLocked}
          maxLength={MODULE2_FIELD_LIMITS.identity}
          className={nameLocked ? "bg-muted text-foreground" : undefined}
          onChange={event => onChange({ ...form, studentName: event.target.value })}
        />
        {errors.studentName && <p className="text-xs text-red-600">{errors.studentName}</p>}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-seat`} className="text-sm font-medium">{seatShowsCode ? "班学号" : "座号后两位"}</label>
        <Input
          id={`${idPrefix}-seat`}
          inputMode="numeric"
          maxLength={seatShowsCode ? MODULE2_FIELD_LIMITS.identity : 2}
          value={seatShowsCode ? (seatDisplay ?? form.seatOnly) : form.seatOnly}
          readOnly={seatLocked}
          placeholder={seatLocked ? undefined : "01～50"}
          className={seatLocked ? "bg-muted text-foreground" : undefined}
          onChange={event => onChange({ ...form, seatOnly: event.target.value.replace(/\D/g, "").slice(0, 2) })}
        />
        {errors.seatOnly && <p className="text-xs text-red-600">{errors.seatOnly}</p>}
      </div>
    </div>
  )
}

function ConfirmedNovel({
  source,
  student,
  connected,
  teacherMode,
}: {
  source: SourceSnapshot
  student: StudentIdentity
  connected: boolean
  teacherMode: boolean
}) {
  return (
    <section className="space-y-4 rounded-lg border p-4" aria-label={connected ? "已接入的小说" : "当前小说"}>
      <h2 className="break-words font-medium">{connected ? "已接入" : "当前小说"}：《{source.storyTitle}》</h2>
      {source.isTeachingSample && <TeachingSampleNotice />}
      {teacherMode && connected && <p className="text-sm text-amber-800">这是讲解演示，没有写入学生档案。</p>}
      <ReadOnlyIdentity student={student} />
      <ReadOnlyText label="题目" text={source.storyTitle} compact />
      {LESSON1_PARTS.map(part => <ReadOnlyText key={part.id} label={part.label} text={source.parts[part.id]} />)}
    </section>
  )
}

export default function Step1ImportNovel() {
  const { portfolio, updatePortfolio, flushPortfolio, saveStatus, isTeacherMode, retrySave } = useModule2State()
  const fileRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef<SourceImportDraft | null>(null)
  const studentRef = useRef<StudentIdentity | null>(null)
  const seenDraftTab = useRef<string | null>(null)
  const [form, setForm] = useState<Lesson1IdentityForm>(EMPTY_FORM)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [reading, setReading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<PendingDialog>(null)
  const [tab, setTab] = useState<ImportTab>("file")
  const [fillForm, setFillForm] = useState<FillForm>(EMPTY_FILL)

  const draft = portfolio?.sourceImportDraft ?? null
  const draftToken = draft ? `${draft.origin}|${draft.importedAt}|${draft.sourceFileSha256 ?? ""}|${draft.filename ?? ""}` : ""
  draftRef.current = draft
  if (portfolio) studentRef.current = portfolio.student

  useEffect(() => {
    const currentDraft = draftRef.current
    const existing = studentRef.current
    if (!currentDraft || !existing) return
    setForm(formForDraft(existing, currentDraft))
  }, [draftToken])

  useEffect(() => {
    const currentDraft = draftRef.current
    if (!currentDraft || !draftToken) return
    if (seenDraftTab.current === null) setTab(currentDraft.origin === "manual" ? "fill" : "file")
    seenDraftTab.current = draftToken
  }, [draftToken])

  if (!portfolio) return null
  const source = portfolio.sourceSnapshot
  const gates = computeModule2Lesson1Gates(portfolio)
  const errors = identityFieldErrors(form)
  const fileLocks = draft && draft.origin !== "manual" ? importedIdentityLocks(draft.student) : null
  const identityAllLocked = Boolean(fileLocks?.clazz && fileLocks.studentName && fileLocks.seatOnly)
  const conflict = Boolean(draft && fileLocks && identityConflict(portfolio.student, draft.student))
  const teachingSample = Boolean(draft?.isTeachingSample || source?.isTeachingSample)
  const connected = !busy
    && saveStatus.state !== "error"
    && saveStatus.state !== "saving"
    && Boolean(source && !source.isTeachingSample && gates.step1)
  const shownErrors: Partial<Record<keyof Lesson1IdentityForm, string>> = fileLocks
    ? {
        clazz: fileLocks.clazz ? undefined : errors.clazz,
        studentName: fileLocks.studentName ? undefined : errors.studentName,
        seatOnly: fileLocks.seatOnly ? undefined : errors.seatOnly,
      }
    : errors

  const changeIdentity = (next: Lesson1IdentityForm) => {
    const safe: Lesson1IdentityForm = fileLocks
      ? {
          clazz: fileLocks.clazz ? form.clazz : next.clazz,
          studentName: fileLocks.studentName ? form.studentName : next.studentName,
          seatOnly: fileLocks.seatOnly ? form.seatOnly : next.seatOnly,
        }
      : next
    setForm(safe)
    if (!draft || draft.origin !== "manual") return
    const student = formToIdentity(safe)
    updatePortfolio(current => {
      const draftNow = current.sourceImportDraft
      if (!draftNow || draftNow.origin !== "manual" || sameIdentity(draftNow.student, student)) return current
      return { ...current, sourceImportDraft: editNovelDraft(draftNow, { student }) }
    })
  }

  const applyCandidate = (candidate: NovelCandidate) => {
    updatePortfolio(current => stageNovelCandidate(current, candidate).portfolio)
    setNotice(candidate.message)
    setError("")
    const existing = studentRef.current
    if (existing) setForm(formForDraft(existing, candidate.draft))
    setTab(candidate.draft.origin === "manual" ? "fill" : "file")
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

  const stagedFillDraft = (): SourceImportDraft => createManualNovelDraft(
    { filename: null, importedAt: new Date().toISOString(), sourceFileSha256: null },
    {
      student: formToIdentity(fillForm),
      storyTitle: fillForm.title,
      parts: {
        opening: fillForm.opening,
        development: fillForm.development,
        turn: fillForm.turn,
        ending: fillForm.ending,
      },
    },
  )

  const stageFill = () => {
    const next = stagedFillDraft()
    if (MODULE2_FOUR_PARTS.some(part => next.parts[part].trim() === "") || next.storyTitle.trim() === "") {
      setError("请自己填好题目和起、承、转、合四段。这里不会自动分段。")
      return
    }
    if (portfolio.sourceImportDraft) {
      setDialog({ kind: "replace-fill" })
      return
    }
    applyCandidate({ kind: "candidate", review: "manual", message: "候选已保存，待核对。", draft: next })
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
    if (!isModule2IdentityComplete(confirmStudent(form, draft))) {
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
    const currentDraft = portfolio.sourceImportDraft
    const student = currentDraft ? confirmStudent(form, currentDraft) : formToIdentity(form)
    setDialog(null)
    setBusy(true)
    setError("")
    try {
      const failure = await commitLesson1Change(updatePortfolio, flushPortfolio, (current) => {
        if (!current.sourceImportDraft || current.sourceImportDraft.isTeachingSample) {
          return { portfolio: current, error: "这是教师虚构示例，不能用来完成你的本人项目。" }
        }
        const draftNow = current.sourceImportDraft
        const withIdentity = draftNow && draftNow.origin === "manual" && !sameIdentity(draftNow.student, student)
          ? { ...current, sourceImportDraft: editNovelDraft(draftNow, { student }) }
          : current
        const result = confirmModule2SourceImportDraft(withIdentity, {
          snapshotId: createModule2Id("src"),
          student,
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

  const replaceFill = () => {
    const next = stagedFillDraft()
    if (MODULE2_FOUR_PARTS.some(part => next.parts[part].trim() === "") || next.storyTitle.trim() === "") {
      setDialog(null)
      setError("请自己填好题目和起、承、转、合四段。这里不会自动分段。")
      return
    }
    updatePortfolio(current => cancelModule2SourceImportDraft(current))
    setDialog(null)
    applyCandidate({ kind: "candidate", review: "manual", message: "候选已保存，待核对。", draft: next })
  }

  const candidateActions = draft && (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={requestConfirm} disabled={busy || draft.isTeachingSample}>确认这篇小说</Button>
        <Button type="button" variant="outline" onClick={cancelDraft}>取消这份候选</Button>
      </div>
      {source && !draft.isTeachingSample && (
        <p className="text-xs text-muted-foreground">取消或重选候选不会改动已经接入的小说。下一关仍使用已接入的那一篇，直到你确认换成新的。</p>
      )}
    </>
  )

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <Lesson1StepHeader
        step={1}
        title="导入我的小说"
        lead="把模块一完成的小说带进来，或直接填写四段。确认后，我们从中选出四个画面。"
      />
      <div className="max-w-3xl space-y-4">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        {saveStatus.state === "error" && (
          <p role="alert" className="text-sm text-red-600">
            保存失败，输入还在。
            <Button type="button" variant="outline" size="sm" className="ml-2" onClick={retrySave}>重试保存</Button>
          </p>
        )}

        {source && (
          <ConfirmedNovel source={source} student={portfolio.student} connected={connected} teacherMode={isTeacherMode} />
        )}

        <div role="tablist" aria-label="导入方式" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            role="tab"
            id="m2-import-tab-file"
            aria-selected={tab === "file"}
            aria-controls="m2-import-panel-file"
            className={`rounded-md px-3 py-2 text-sm font-medium ${tab === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            onClick={() => setTab("file")}
          >
            导入文件
          </button>
          <button
            type="button"
            role="tab"
            id="m2-import-tab-fill"
            aria-selected={tab === "fill"}
            aria-controls="m2-import-panel-fill"
            className={`rounded-md px-3 py-2 text-sm font-medium ${tab === "fill" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            onClick={() => setTab("fill")}
          >
            直接填写
          </button>
        </div>

        {tab === "file" ? (
          <div role="tabpanel" id="m2-import-panel-file" aria-labelledby="m2-import-tab-file" className="space-y-4">
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
            {draft?.origin === "manual" && (
              <p className="text-sm text-muted-foreground">这份候选在「直接填写」里。切换选项卡不会清掉已经接入的小说。</p>
            )}
            {draft && draft.origin !== "manual" && (
              <section className="space-y-4 rounded-lg border p-4" aria-label="待核对的小说">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">待核对的小说</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">候选已保存，待核对</span>
                </div>
                {draft.filename && <p className="break-all text-xs text-muted-foreground">文件：{draft.filename}</p>}
                {draft.isTeachingSample && <TeachingSampleNotice />}
                {conflict && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                    <p>这台电脑上已有的身份和文件里的不一样。文件里已有的项目不能改。确认后才会写入核对结果，确认前不会改掉已有记录。</p>
                    <p className="mt-1">已有身份：{displayIdentity(portfolio.student)}</p>
                    <p className="mt-1">文件里的身份：{displayIdentity(draft.student)}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">身份</h3>
                  {!identityAllLocked && (
                    <p className="text-xs text-muted-foreground">文件里没有的班级、姓名或班学号才需要填写。已经读到的内容不能改。</p>
                  )}
                  {identityAllLocked ? (
                    <ReadOnlyIdentity student={draft.student} />
                  ) : (
                    <IdentityFields
                      idPrefix="m2-review"
                      form={form}
                      errors={shownErrors}
                      locks={fileLocks ?? undefined}
                      seatDisplay={draft.student.classSeatCode}
                      onChange={changeIdentity}
                    />
                  )}
                </div>
                <ReadOnlyText label="题目" text={draft.storyTitle} compact />
                {LESSON1_PARTS.map(part => <ReadOnlyText key={part.id} label={part.label} text={draft.parts[part.id]} />)}
                {candidateActions}
              </section>
            )}
          </div>
        ) : (
          <div role="tabpanel" id="m2-import-panel-fill" aria-labelledby="m2-import-tab-fill" className="space-y-4">
            {draft && draft.origin !== "manual" && (
              <p className="text-sm text-muted-foreground">文件里读到的小说在「导入文件」里，只能核对。若改成直接填写，保存前会先询问是否替换这份候选。</p>
            )}
            {draft?.origin === "manual" ? (
              <section className="space-y-4 rounded-lg border p-4" aria-label="待核对的小说">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">待核对的小说</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">候选已保存，待核对</span>
                </div>
                {draft.filename && <p className="break-all text-xs text-muted-foreground">文件：{draft.filename}</p>}
                {draft.isTeachingSample && <TeachingSampleNotice />}
                <p className="text-sm text-muted-foreground">身份、题目和四段都可以改。改完后确认这篇小说。</p>
                <IdentityFields idPrefix="m2-manual" form={form} errors={errors} onChange={changeIdentity} />
                <div className="space-y-1">
                  <label htmlFor="m2-title" className="text-sm font-medium">题目</label>
                  <Input
                    id="m2-title"
                    value={draft.storyTitle}
                    maxLength={MODULE2_FIELD_LIMITS.storyTitle}
                    onChange={event => updatePortfolio(current => {
                      if (!current.sourceImportDraft || current.sourceImportDraft.origin !== "manual") return current
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
                        if (!current.sourceImportDraft || current.sourceImportDraft.origin !== "manual") return current
                        return {
                          ...current,
                          sourceImportDraft: editNovelDraft(current.sourceImportDraft, { parts: { [part.id]: event.target.value } }),
                        }
                      })}
                    />
                  </div>
                ))}
                {candidateActions}
              </section>
            ) : (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">填写身份、题目和起承转合。保存为待核对候选后，再确认这篇小说。这里不会自动分段。</p>
                <div className="space-y-1">
                  <label htmlFor="m2-fill-title" className="text-sm font-medium">题目</label>
                  <Input
                    id="m2-fill-title"
                    value={fillForm.title}
                    maxLength={MODULE2_FIELD_LIMITS.storyTitle}
                    onChange={event => setFillForm(current => ({ ...current, title: event.target.value }))}
                  />
                </div>
                <IdentityFields
                  idPrefix="m2-fill"
                  form={fillForm}
                  errors={{}}
                  onChange={next => setFillForm(current => ({ ...current, ...next }))}
                />
                {LESSON1_PARTS.map(part => (
                  <div key={part.id} className="space-y-1">
                    <label htmlFor={`m2-fill-${part.id}`} className="text-sm font-medium">{part.label}</label>
                    <Textarea
                      id={`m2-fill-${part.id}`}
                      className="min-h-[120px] whitespace-pre-wrap"
                      value={fillForm[part.id]}
                      maxLength={MODULE2_FIELD_LIMITS.novelPart}
                      onChange={event => setFillForm(current => ({ ...current, [part.id]: event.target.value }))}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={stageFill}>保存为待核对候选</Button>
              </div>
            )}
          </div>
        )}

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
            {dialog?.kind === "replace-fill" && (
              <Button type="button" onClick={replaceFill}>替换候选</Button>
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
