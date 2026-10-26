/**
 * 文件说明：模块 2 小说候选草稿的构造与人工改写。
 * 职责：把解析出的纯文本收成 SourceImportDraft，标出教学样例指纹；人工改写题目或四段时改为 manual，并清掉源定稿时间。
 * 更新触发：候选草稿字段、字数上限、教学样例判定或人工改写规则变化时，需要同步更新本文件。
 */

import { MODULE2_FIELD_LIMITS } from "@/modules/module-2-ai-comic/domains/portfolio/validate"
import {
  MODULE2_FOUR_PARTS,
  createEmptyFourParts,
  type FourPart,
  type SourceImportDraft,
  type SourceOrigin,
  type StudentIdentity,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"
import { matchesTeachingSample } from "@/modules/module-2-ai-comic/features/source-import/teaching-sample"
import type { NovelFileMeta } from "@/modules/module-2-ai-comic/features/source-import/novel-types"

export function emptyNovelParts(): Record<FourPart, string> {
  return createEmptyFourParts(() => "")
}

export function emptyNovelStudent(): StudentIdentity {
  return { clazz: "", studentName: "", classSeatCode: "" }
}

/** 超限时返回学生能看懂的原因；未超限返回 null。 */
export function novelTextLimitError(
  student: StudentIdentity,
  storyTitle: string,
  parts: Record<FourPart, string>,
): string | null {
  if ([student.clazz, student.studentName, student.classSeatCode].some(value => value.length > MODULE2_FIELD_LIMITS.identity)) {
    return "班级、姓名或班学号太长，这份文件不能直接读入。"
  }
  if (storyTitle.length > MODULE2_FIELD_LIMITS.storyTitle) return "小说题目太长，这份文件不能直接读入。"
  if (MODULE2_FOUR_PARTS.some(part => parts[part].length > MODULE2_FIELD_LIMITS.novelPart)) {
    return "某一段正文超过可以保存的字数，请先缩短后再试。"
  }
  return null
}

export function buildNovelDraft(
  meta: NovelFileMeta,
  input: {
    origin: SourceOrigin
    sourceConfirmedAt: string | null
    student: StudentIdentity
    storyTitle: string
    parts: Record<FourPart, string>
    /** 新 HTML 里的显式标记。旧格式和人工粘贴不传，只靠正文指纹。 */
    explicitTeachingSample?: boolean
    importNote?: string
  },
): SourceImportDraft {
  const textMatch = matchesTeachingSample(input.storyTitle, input.parts)
  return {
    origin: input.origin,
    filename: meta.filename,
    sourceFileSha256: meta.sourceFileSha256,
    importedAt: meta.importedAt,
    sourceConfirmedAt: input.sourceConfirmedAt,
    student: { ...input.student },
    storyTitle: input.storyTitle,
    parts: { ...input.parts },
    isTeachingSample: input.explicitTeachingSample === true || textMatch,
    importNote: (input.importNote ?? "").slice(0, MODULE2_FIELD_LIMITS.importNote),
  }
}

/** 纯手工补入。源定稿时间保持空，教学样例只看正文指纹。 */
export function createManualNovelDraft(
  meta: NovelFileMeta,
  input: {
    student?: Partial<StudentIdentity>
    storyTitle?: string
    parts?: Partial<Record<FourPart, string>>
    importNote?: string
  } = {},
): SourceImportDraft {
  const parts = { ...emptyNovelParts(), ...input.parts }
  return buildNovelDraft(meta, {
    origin: "manual",
    sourceConfirmedAt: null,
    student: { ...emptyNovelStudent(), ...input.student },
    storyTitle: input.storyTitle ?? "",
    parts,
    importNote: input.importNote ?? "人工核对接入",
  })
}

/**
 * 学生改了题目或四段：来源改为人工，源定稿时间清空。
 * 原来的定稿时间只写进说明，不用当前时间冒充旧作品的定稿时间。
 * 只改身份时保留文件来源和源定稿时间。
 */
export function editNovelDraft(
  draft: SourceImportDraft,
  patch: {
    student?: Partial<StudentIdentity>
    storyTitle?: string
    parts?: Partial<Record<FourPart, string>>
    importNote?: string
  },
): SourceImportDraft {
  const storyTitle = patch.storyTitle ?? draft.storyTitle
  const parts = { ...draft.parts, ...patch.parts }
  const student = { ...draft.student, ...patch.student }
  const textChanged = storyTitle !== draft.storyTitle || MODULE2_FOUR_PARTS.some(part => parts[part] !== draft.parts[part])
  const notes: string[] = []
  if (textChanged) {
    notes.push("人工核对接入")
    if (draft.sourceConfirmedAt) notes.push(`原文件记录的定稿时间：${draft.sourceConfirmedAt}（只作说明）`)
  }
  if (patch.importNote) notes.push(patch.importNote)
  const importNote = notes.length > 0 ? notes.join("。") : draft.importNote
  return {
    ...draft,
    student,
    storyTitle,
    parts,
    origin: textChanged ? "manual" : draft.origin,
    sourceConfirmedAt: textChanged ? null : draft.sourceConfirmedAt,
    isTeachingSample: textChanged ? matchesTeachingSample(storyTitle, parts) : draft.isTeachingSample || matchesTeachingSample(storyTitle, parts),
    importNote: importNote.slice(0, MODULE2_FIELD_LIMITS.importNote),
  }
}
