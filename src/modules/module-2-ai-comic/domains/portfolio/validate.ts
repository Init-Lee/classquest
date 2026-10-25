/**
 * 文件说明：模块 2 学习档案 v1 运行时校验器。
 * 职责：对来自本机数据库或学习包的未知输入逐字段检查类型、枚举、字符串长度、ID 唯一性与引用关系，并重新构造一个只含已知字段的干净档案；
 *       结构合法与课堂完成分开判断（身份全空的首次草稿、空字段候选都合法），未知未来 schemaVersion 明确拒绝。
 * 更新触发：数据契约字段、枚举、长度上限、引用规则或 schemaVersion 变化时，需要同步更新本文件与 validate 回归测试。
 *
 * 安全约定：只读取输入对象的自有属性（hasOwnProperty），`__proto__`、`constructor` 等危险键既不读取也不复制，
 * 输出对象逐字段新建，不做任何原型合并或展开拷贝。
 */

import { RESOURCE_LIMITS } from "@/modules/module-2-ai-comic/constants/resource-limits"
import {
  MODULE2_FOUR_PARTS,
  MODULE2_IMAGE_SLOTS,
  MODULE2_MODULE_ID,
  MODULE2_SCHEMA_VERSION,
  MODULE2_SELECTABLE_SLOTS,
  MODULE2_SOURCE_ORIGINS,
  type FourPart,
  type ImageVersion,
  type Iteration,
  type Module2Lesson1State,
  type Module2Lesson1StepId,
  type Module2PortfolioV1,
  type SelectableSlot,
  type SourceImportDraft,
  type SourceSnapshot,
  type Storyboard,
  type StudentIdentity,
  type VisualDirection,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

/** 字段长度上限（字符数）。小说正文上限取 RESOURCE_LIMITS，其余为结构性上限。 */
export const MODULE2_FIELD_LIMITS = {
  id: 128,
  identity: 64,
  filename: 255,
  storyTitle: 200,
  novelPart: RESOURCE_LIMITS.novelPartMaxChars,
  importNote: 2_000,
  sampleObservation: 2_000,
  sceneSentence: 500,
  visualWord: 30,
  visualWordsMax: 6,
  visualReason: 1_000,
  referenceStyleId: 64,
  prompt: 8_000,
  toolLabel: 100,
  note: 2_000,
  iterationText: 2_000,
  listMax: 2_000,
} as const

export type Module2ValidationResult =
  | { ok: true; value: Module2PortfolioV1 }
  | { ok: false; reason: "future-version" | "invalid"; message: string; errors: string[] }

const SHA256_HEX = /^[0-9a-f]{64}$/
const ASSET_ID = /^sha256:[0-9a-f]{64}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/

type Record_ = Record<string, unknown>

class Collector {
  readonly errors: string[] = []
  add(path: string, message: string): void {
    if (this.errors.length < 50) this.errors.push(`${path}：${message}`)
  }
}

function isRecord(value: unknown): value is Record_ {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** 只读取自有属性，防止从原型链读到被污染的值。 */
function own(source: Record_, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined
}

function readRecord(c: Collector, source: Record_, key: string, path: string): Record_ | null {
  const value = own(source, key)
  if (!isRecord(value)) {
    c.add(`${path}.${key}`, "须为对象")
    return null
  }
  return value
}

function readString(c: Collector, source: Record_, key: string, path: string, max: number): string {
  const value = own(source, key)
  if (typeof value !== "string") {
    c.add(`${path}.${key}`, "须为字符串")
    return ""
  }
  if (value.length > max) c.add(`${path}.${key}`, `长度超过 ${max} 字符`)
  return value
}

function readNonEmptyString(c: Collector, source: Record_, key: string, path: string, max: number): string {
  const value = readString(c, source, key, path, max)
  if (typeof own(source, key) === "string" && value.trim() === "") c.add(`${path}.${key}`, "不能为空")
  return value
}

function readNullableString(c: Collector, source: Record_, key: string, path: string, max: number): string | null {
  const value = own(source, key)
  if (value === null) return null
  return readString(c, source, key, path, max)
}

function readBoolean(c: Collector, source: Record_, key: string, path: string): boolean {
  const value = own(source, key)
  if (typeof value !== "boolean") {
    c.add(`${path}.${key}`, "须为布尔值")
    return false
  }
  return value
}

function readIso(c: Collector, source: Record_, key: string, path: string): string {
  const value = own(source, key)
  if (typeof value !== "string" || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    c.add(`${path}.${key}`, "须为 ISO 8601 时间字符串")
    return typeof value === "string" ? value : ""
  }
  return value
}

function readNullableIso(c: Collector, source: Record_, key: string, path: string): string | null {
  if (own(source, key) === null) return null
  return readIso(c, source, key, path)
}

function readEnum<T extends string>(c: Collector, source: Record_, key: string, path: string, allowed: readonly T[]): T {
  const value = own(source, key)
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    c.add(`${path}.${key}`, `须为 ${allowed.join(" / ")} 之一`)
    return allowed[0]
  }
  return value as T
}

function readArray(c: Collector, source: Record_, key: string, path: string, max: number = MODULE2_FIELD_LIMITS.listMax): unknown[] {
  const value = own(source, key)
  if (!Array.isArray(value)) {
    c.add(`${path}.${key}`, "须为数组")
    return []
  }
  if (value.length > max) c.add(`${path}.${key}`, `条目数超过 ${max}`)
  return value.slice(0, max)
}

function readAssetId(c: Collector, value: unknown, path: string): string {
  if (typeof value !== "string" || !ASSET_ID.test(value)) {
    c.add(path, "须为 sha256: 加 64 位小写十六进制")
    return typeof value === "string" ? value : ""
  }
  return value
}

function parseIdentity(c: Collector, source: Record_, key: string, path: string): StudentIdentity {
  const record = readRecord(c, source, key, path) ?? {}
  const base = `${path}.${key}`
  return {
    clazz: readString(c, record, "clazz", base, MODULE2_FIELD_LIMITS.identity),
    studentName: readString(c, record, "studentName", base, MODULE2_FIELD_LIMITS.identity),
    classSeatCode: readString(c, record, "classSeatCode", base, MODULE2_FIELD_LIMITS.identity),
  }
}

function parseParts(c: Collector, source: Record_, path: string, requireFilled: boolean): Record<FourPart, string> {
  const record = readRecord(c, source, "parts", path) ?? {}
  const read = requireFilled ? readNonEmptyString : readString
  const result = {} as Record<FourPart, string>
  for (const part of MODULE2_FOUR_PARTS) {
    result[part] = read(c, record, part, `${path}.parts`, MODULE2_FIELD_LIMITS.novelPart)
  }
  return result
}

/** 候选与已确认快照共用字段；已确认快照要求题目与四段完整。 */
function parseSourceCommon(c: Collector, record: Record_, path: string, confirmed: boolean): SourceImportDraft {
  const fileSha = readNullableString(c, record, "sourceFileSha256", path, 64)
  if (fileSha !== null && !SHA256_HEX.test(fileSha)) c.add(`${path}.sourceFileSha256`, "须为 64 位小写十六进制或 null")
  const readTitle = confirmed ? readNonEmptyString : readString
  return {
    origin: readEnum(c, record, "origin", path, MODULE2_SOURCE_ORIGINS),
    filename: readNullableString(c, record, "filename", path, MODULE2_FIELD_LIMITS.filename),
    sourceFileSha256: fileSha,
    importedAt: readIso(c, record, "importedAt", path),
    sourceConfirmedAt: readNullableIso(c, record, "sourceConfirmedAt", path),
    student: parseIdentity(c, record, "student", path),
    storyTitle: readTitle(c, record, "storyTitle", path, MODULE2_FIELD_LIMITS.storyTitle),
    parts: parseParts(c, record, path, confirmed),
    isTeachingSample: readBoolean(c, record, "isTeachingSample", path),
    importNote: readString(c, record, "importNote", path, MODULE2_FIELD_LIMITS.importNote),
  }
}

function parseSnapshot(c: Collector, value: unknown, path: string): SourceSnapshot | null {
  if (!isRecord(value)) {
    c.add(path, "须为对象")
    return null
  }
  return {
    id: readNonEmptyString(c, value, "id", path, MODULE2_FIELD_LIMITS.id),
    studentConfirmedAt: readIso(c, value, "studentConfirmedAt", path),
    ...parseSourceCommon(c, value, path, true),
  }
}

function parseLesson1(c: Collector, source: Record_, path: string): Module2Lesson1State {
  const record = readRecord(c, source, "lesson1", path) ?? {}
  const base = `${path}.lesson1`
  if (own(record, "contentVersion") !== 1) c.add(`${base}.contentVersion`, "须为 1")
  const step = own(record, "step")
  if (step !== 1 && step !== 2 && step !== 3 && step !== 4) c.add(`${base}.step`, "须为 1—4")
  const review = readRecord(c, record, "reviewNeeded", base) ?? {}
  return {
    contentVersion: 1,
    step: (typeof step === "number" && step >= 1 && step <= 4 ? step : 1) as Module2Lesson1StepId,
    step1Completed: readBoolean(c, record, "step1Completed", base),
    step2Completed: readBoolean(c, record, "step2Completed", base),
    step3Completed: readBoolean(c, record, "step3Completed", base),
    step4Completed: readBoolean(c, record, "step4Completed", base),
    completed: readBoolean(c, record, "completed", base),
    completedAt: readNullableIso(c, record, "completedAt", base),
    sampleObservation: readString(c, record, "sampleObservation", base, MODULE2_FIELD_LIMITS.sampleObservation),
    sampleViewed: readBoolean(c, record, "sampleViewed", base),
    reviewNeeded: {
      storyboard: readBoolean(c, review, "storyboard", `${base}.reviewNeeded`),
      visualDirection: readBoolean(c, review, "visualDirection", `${base}.reviewNeeded`),
    },
  }
}

function parseStoryboard(c: Collector, source: Record_, path: string): Storyboard {
  const record = readRecord(c, source, "storyboard", path) ?? {}
  const base = `${path}.storyboard`
  const frames = readRecord(c, record, "frames", base) ?? {}
  const parsedFrames = {} as Storyboard["frames"]
  for (const part of MODULE2_FOUR_PARTS) {
    const frame = readRecord(c, frames, part, `${base}.frames`) ?? {}
    parsedFrames[part] = {
      sceneSentence: readString(c, frame, "sceneSentence", `${base}.frames.${part}`, MODULE2_FIELD_LIMITS.sceneSentence),
    }
  }
  return {
    sourceSnapshotId: readNullableString(c, record, "sourceSnapshotId", base, MODULE2_FIELD_LIMITS.id),
    frames: parsedFrames,
    confirmedAt: readNullableIso(c, record, "confirmedAt", base),
  }
}

function parseVisualDirection(c: Collector, source: Record_, path: string): VisualDirection {
  const record = readRecord(c, source, "visualDirection", path) ?? {}
  const base = `${path}.visualDirection`
  const words = readArray(c, record, "words", base, MODULE2_FIELD_LIMITS.visualWordsMax).map((word, index) => {
    if (typeof word !== "string") {
      c.add(`${base}.words[${index}]`, "须为字符串")
      return ""
    }
    if (word.length > MODULE2_FIELD_LIMITS.visualWord) c.add(`${base}.words[${index}]`, `长度超过 ${MODULE2_FIELD_LIMITS.visualWord} 字符`)
    return word
  })
  return {
    words,
    reason: readString(c, record, "reason", base, MODULE2_FIELD_LIMITS.visualReason),
    referenceStyleId: readNullableString(c, record, "referenceStyleId", base, MODULE2_FIELD_LIMITS.referenceStyleId),
    confirmedAt: readNullableIso(c, record, "confirmedAt", base),
  }
}

function parseImageVersion(c: Collector, value: unknown, path: string): ImageVersion | null {
  if (!isRecord(value)) {
    c.add(path, "须为对象")
    return null
  }
  return {
    id: readNonEmptyString(c, value, "id", path, MODULE2_FIELD_LIMITS.id),
    slot: readEnum(c, value, "slot", path, MODULE2_IMAGE_SLOTS),
    sourceSnapshotId: readNonEmptyString(c, value, "sourceSnapshotId", path, MODULE2_FIELD_LIMITS.id),
    mainAssetId: readAssetId(c, own(value, "mainAssetId"), `${path}.mainAssetId`),
    originalAssetId: readAssetId(c, own(value, "originalAssetId"), `${path}.originalAssetId`),
    prompt: readString(c, value, "prompt", path, MODULE2_FIELD_LIMITS.prompt),
    referenceAssetIds: readArray(c, value, "referenceAssetIds", path, 20)
      .map((item, index) => readAssetId(c, item, `${path}.referenceAssetIds[${index}]`)),
    createdAt: readIso(c, value, "createdAt", path),
    toolLabel: readString(c, value, "toolLabel", path, MODULE2_FIELD_LIMITS.toolLabel),
    note: readString(c, value, "note", path, MODULE2_FIELD_LIMITS.note),
  }
}

function parseIteration(c: Collector, value: unknown, path: string): Iteration | null {
  if (!isRecord(value)) {
    c.add(path, "须为对象")
    return null
  }
  const text = (key: string) => readString(c, value, key, path, MODULE2_FIELD_LIMITS.iterationText)
  const versionRef = (key: string) => readNonEmptyString(c, value, key, path, MODULE2_FIELD_LIMITS.id)
  return {
    id: readNonEmptyString(c, value, "id", path, MODULE2_FIELD_LIMITS.id),
    problem: text("problem"),
    evidence: text("evidence"),
    changedConditions: text("changedConditions"),
    beforeVersionId: versionRef("beforeVersionId"),
    afterVersionId: versionRef("afterVersionId"),
    judgment: text("judgment"),
    selectedVersionId: versionRef("selectedVersionId"),
    createdAt: readIso(c, value, "createdAt", path),
  }
}

function parseSelectedVersions(c: Collector, source: Record_, path: string): Partial<Record<SelectableSlot, string>> {
  const record = readRecord(c, source, "selectedVersions", path) ?? {}
  const result: Partial<Record<SelectableSlot, string>> = {}
  for (const key of Object.keys(record)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue
    if (!(MODULE2_SELECTABLE_SLOTS as readonly string[]).includes(key)) {
      c.add(`${path}.selectedVersions.${key}`, "未知的选图槽位")
      continue
    }
    result[key as SelectableSlot] = readNonEmptyString(c, record, key, `${path}.selectedVersions`, MODULE2_FIELD_LIMITS.id)
  }
  return result
}

function checkUnique(c: Collector, ids: string[], path: string): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) c.add(path, `ID 重复：${id}`)
    seen.add(id)
  }
}

/** 引用关系：版本引用的资产在库存中；选中版本与修改记录引用的版本存在；版本与选景引用的来源存在。 */
function checkReferences(c: Collector, portfolio: Module2PortfolioV1): void {
  const snapshotIds = new Set<string>(portfolio.sourceHistory.map(item => item.id))
  if (portfolio.sourceSnapshot) snapshotIds.add(portfolio.sourceSnapshot.id)
  checkUnique(c, [
    ...(portfolio.sourceSnapshot ? [portfolio.sourceSnapshot.id] : []),
    ...portfolio.sourceHistory.map(item => item.id),
  ], "portfolio.sourceSnapshot/sourceHistory")
  checkUnique(c, portfolio.assetIds, "portfolio.assetIds")
  checkUnique(c, portfolio.imageVersions.map(item => item.id), "portfolio.imageVersions")
  checkUnique(c, portfolio.iterations.map(item => item.id), "portfolio.iterations")

  const sbSource = portfolio.storyboard.sourceSnapshotId
  if (sbSource !== null && !snapshotIds.has(sbSource)) {
    c.add("portfolio.storyboard.sourceSnapshotId", `引用的来源不存在：${sbSource}`)
  }

  const inventory = new Set(portfolio.assetIds)
  const versionIds = new Set<string>()
  portfolio.imageVersions.forEach((version, index) => {
    const path = `portfolio.imageVersions[${index}]`
    versionIds.add(version.id)
    if (!snapshotIds.has(version.sourceSnapshotId)) c.add(`${path}.sourceSnapshotId`, `引用的来源不存在：${version.sourceSnapshotId}`)
    for (const assetId of [version.mainAssetId, version.originalAssetId, ...version.referenceAssetIds]) {
      if (!inventory.has(assetId)) c.add(path, `引用的资产不在 assetIds 中：${assetId}`)
    }
  })

  for (const [slot, versionId] of Object.entries(portfolio.selectedVersions)) {
    if (versionId && !versionIds.has(versionId)) c.add(`portfolio.selectedVersions.${slot}`, `引用的版本不存在：${versionId}`)
  }

  portfolio.iterations.forEach((iteration, index) => {
    const path = `portfolio.iterations[${index}]`
    for (const key of ["beforeVersionId", "afterVersionId", "selectedVersionId"] as const) {
      if (!versionIds.has(iteration[key])) c.add(`${path}.${key}`, `引用的版本不存在：${iteration[key]}`)
    }
    if (iteration.selectedVersionId !== iteration.beforeVersionId && iteration.selectedVersionId !== iteration.afterVersionId) {
      c.add(`${path}.selectedVersionId`, "须为 beforeVersionId 或 afterVersionId")
    }
  })
}

/**
 * 校验未知输入是否为合法的模块 2 档案 v1。
 * 只判断结构是否合法；是否“完成”由 lesson1-update.ts 的 gate 函数按真实字段重算。
 */
export function validateModule2Portfolio(input: unknown): Module2ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, reason: "invalid", message: "学习记录格式不正确。", errors: ["portfolio：须为对象"] }
  }
  const schemaVersion = own(input, "schemaVersion")
  if (typeof schemaVersion === "number" && Number.isInteger(schemaVersion) && schemaVersion > MODULE2_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: "future-version",
      message: `这份学习记录来自更新版本（格式版本 ${schemaVersion}），当前页面只能读取版本 ${MODULE2_SCHEMA_VERSION}。请使用更新后的页面打开，当前作品未改变。`,
      errors: [`portfolio.schemaVersion：不支持未来版本 ${schemaVersion}`],
    }
  }

  const c = new Collector()
  const path = "portfolio"
  if (schemaVersion !== MODULE2_SCHEMA_VERSION) c.add(`${path}.schemaVersion`, `须为 ${MODULE2_SCHEMA_VERSION}`)
  if (own(input, "moduleId") !== MODULE2_MODULE_ID) c.add(`${path}.moduleId`, `须为 ${MODULE2_MODULE_ID}`)
  const revision = own(input, "revision")
  if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) c.add(`${path}.revision`, "须为非负整数")

  const rawSnapshot = own(input, "sourceSnapshot")
  const rawDraft = own(input, "sourceImportDraft")
  let sourceImportDraft: SourceImportDraft | null = null
  if (rawDraft !== null) {
    if (isRecord(rawDraft)) sourceImportDraft = parseSourceCommon(c, rawDraft, `${path}.sourceImportDraft`, false)
    else c.add(`${path}.sourceImportDraft`, "须为对象或 null")
  }

  const portfolio: Module2PortfolioV1 = {
    schemaVersion: MODULE2_SCHEMA_VERSION,
    id: readNonEmptyString(c, input, "id", path, MODULE2_FIELD_LIMITS.id),
    moduleId: MODULE2_MODULE_ID,
    revision: typeof revision === "number" ? revision : 0,
    createdAt: readIso(c, input, "createdAt", path),
    updatedAt: readIso(c, input, "updatedAt", path),
    student: parseIdentity(c, input, "student", path),
    sourceSnapshot: rawSnapshot === null ? null : parseSnapshot(c, rawSnapshot, `${path}.sourceSnapshot`),
    sourceImportDraft,
    sourceHistory: readArray(c, input, "sourceHistory", path)
      .map((item, index) => parseSnapshot(c, item, `${path}.sourceHistory[${index}]`))
      .filter((item): item is SourceSnapshot => item !== null),
    lesson1: parseLesson1(c, input, path),
    storyboard: parseStoryboard(c, input, path),
    visualDirection: parseVisualDirection(c, input, path),
    assetIds: readArray(c, input, "assetIds", path)
      .map((item, index) => readAssetId(c, item, `${path}.assetIds[${index}]`)),
    imageVersions: readArray(c, input, "imageVersions", path)
      .map((item, index) => parseImageVersion(c, item, `${path}.imageVersions[${index}]`))
      .filter((item): item is ImageVersion => item !== null),
    selectedVersions: parseSelectedVersions(c, input, path),
    iterations: readArray(c, input, "iterations", path)
      .map((item, index) => parseIteration(c, item, `${path}.iterations[${index}]`))
      .filter((item): item is Iteration => item !== null),
  }

  if (c.errors.length === 0) checkReferences(c, portfolio)
  if (c.errors.length > 0) {
    return { ok: false, reason: "invalid", message: "学习记录内容不完整或已损坏，当前作品未改变。", errors: c.errors }
  }
  return { ok: true, value: portfolio }
}
