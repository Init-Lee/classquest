/**
 * 文件说明：课时一教师样例《关灯这件事》的运行时读取。
 * 职责：以 public 目录里的 sample-manifest.json 为唯一清单，再按清单读取原文和教学记录；缺文件时列出文件名。页面不把样例写进学生资产，也不嵌 sample-viewer.html。
 * 更新触发：样例静态目录、清单字段或页面必需素材变化时，需要同步更新本文件。
 */

export const GUAN_DENG_SAMPLE_BASE = "/module-2/samples/guan-deng"

/** 清单本身读不到时，用来核对站点里应有的文件。不含小说正文。 */
export const GUAN_DENG_EXPECTED_FILES = [
  "sample-manifest.json",
  "source-novel.json",
  "sample-learning-record.json",
  "comic-panel-01.png",
  "comic-panel-02.png",
  "comic-panel-03.png",
  "comic-panel-04.png",
  "revision-before.png",
  "style-watercolor.png",
  "style-ink.png",
] as const

export interface GuanDengPanel {
  id: string
  label: string
  image: string
  sourcePart: string
  sentence: string
  caption: string
  evidence: string
  choice: string
}

export interface GuanDengStyle {
  id: string
  image: string
  name: string
  words: string[]
  observe: string
}

export interface GuanDengImageMeta {
  file: string
  width: number
  height: number
}

export interface GuanDengManifest {
  title: string
  sampleType: string
  panels: GuanDengPanel[]
  styles: GuanDengStyle[]
  revision: { label: string; before: string; after: string }
  images: GuanDengImageMeta[]
  sourceNovelJson: string
  recordFile: string
}

export interface GuanDengNovelPart {
  id: string
  label: string
  text: string
}

export interface GuanDengSample {
  manifest: GuanDengManifest
  novelTitle: string
  novelParts: GuanDengNovelPart[]
  problem: string
  proposedChange: string
  judgment: string
  productionDisclosure: string
  secondIterationNote: string
  readerFeedbackNote: string
}

export type GuanDengLoadResult =
  | { ok: true; sample: GuanDengSample }
  | { ok: false; missing: string[]; message: string }

export function guanDengAssetUrl(file: string): string {
  const name = file.split(/[/\\]/).pop()?.trim() ?? ""
  return `${GUAN_DENG_SAMPLE_BASE}/${encodeURIComponent(name)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function own(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = own(source, key)
  return typeof value === "string" && value.trim() !== "" ? value : null
}

function fileName(value: string | null): string | null {
  if (!value) return null
  const name = value.split(/[/\\]/).pop()?.trim() ?? ""
  if (!name || name === "." || name === ".." || name.includes("..")) return null
  return name
}

async function readJson(file: string): Promise<unknown> {
  const response = await fetch(guanDengAssetUrl(file))
  if (!response.ok) throw new Error(file)
  return response.json() as Promise<unknown>
}

async function missingExpectedFiles(): Promise<string[]> {
  const checks = await Promise.all(GUAN_DENG_EXPECTED_FILES.map(async (file) => {
    try {
      const response = await fetch(guanDengAssetUrl(file), { method: "HEAD" })
      return response.ok ? null : file
    } catch {
      return file
    }
  }))
  const missing: string[] = []
  for (const file of checks) {
    if (file) missing.push(file)
  }
  return missing
}

function readManifest(value: unknown): GuanDengManifest | null {
  if (!isRecord(value)) return null
  const title = readString(value, "title")
  const sampleType = readString(value, "sampleType")
  const sourceNovel = own(value, "sourceNovel")
  const revisionRaw = own(value, "revision")
  const panelsRaw = own(value, "panels")
  const stylesRaw = own(value, "styles")
  const imagesRaw = own(value, "images")
  if (!title || !sampleType || !isRecord(sourceNovel) || !isRecord(revisionRaw)) return null
  if (!Array.isArray(panelsRaw) || !Array.isArray(stylesRaw)) return null
  const sourceNovelJson = fileName(readString(sourceNovel, "json"))
  const recordFile = fileName(readString(value, "record"))
  const revision = {
    label: readString(revisionRaw, "label"),
    before: fileName(readString(revisionRaw, "before")),
    after: fileName(readString(revisionRaw, "after")),
  }
  if (!sourceNovelJson || !recordFile || !revision.label || !revision.before || !revision.after) return null
  const panels: GuanDengPanel[] = []
  for (const item of panelsRaw) {
    if (!isRecord(item)) return null
    const panel = {
      id: readString(item, "id"),
      label: readString(item, "label"),
      image: fileName(readString(item, "image")),
      sourcePart: readString(item, "sourcePart"),
      sentence: readString(item, "sentence"),
      caption: readString(item, "caption"),
      evidence: readString(item, "evidence"),
      choice: readString(item, "choice"),
    }
    if (!panel.id || !panel.label || !panel.image || !panel.sourcePart || !panel.sentence || !panel.caption || !panel.evidence || !panel.choice) {
      return null
    }
    panels.push({
      id: panel.id,
      label: panel.label,
      image: panel.image,
      sourcePart: panel.sourcePart,
      sentence: panel.sentence,
      caption: panel.caption,
      evidence: panel.evidence,
      choice: panel.choice,
    })
  }
  const styles: GuanDengStyle[] = []
  for (const item of stylesRaw) {
    if (!isRecord(item)) return null
    const wordsRaw = own(item, "words")
    const style = {
      id: readString(item, "id"),
      image: fileName(readString(item, "image")),
      name: readString(item, "name"),
      observe: readString(item, "observe"),
    }
    if (!style.id || !style.image || !style.name || !style.observe || !Array.isArray(wordsRaw)) return null
    const words = wordsRaw.filter((word): word is string => typeof word === "string" && word.trim() !== "")
    if (words.length === 0) return null
    styles.push({ id: style.id, image: style.image, name: style.name, observe: style.observe, words })
  }
  const images: GuanDengImageMeta[] = []
  if (Array.isArray(imagesRaw)) {
    for (const item of imagesRaw) {
      if (!isRecord(item)) continue
      const file = fileName(readString(item, "file"))
      const width = own(item, "width")
      const height = own(item, "height")
      if (file && typeof width === "number" && typeof height === "number") images.push({ file, width, height })
    }
  }
  if (panels.length !== 4 || styles.length !== 3) return null
  return {
    title,
    sampleType,
    panels,
    styles,
    revision: { label: revision.label, before: revision.before, after: revision.after },
    images,
    sourceNovelJson,
    recordFile,
  }
}

function readSample(manifest: GuanDengManifest, novel: unknown, record: unknown): GuanDengSample | null {
  if (!isRecord(novel) || !isRecord(record)) return null
  const novelTitle = readString(novel, "title")
  const partsRaw = own(novel, "parts")
  if (!novelTitle || !Array.isArray(partsRaw)) return null
  const novelParts: GuanDengNovelPart[] = []
  for (const item of partsRaw) {
    if (!isRecord(item)) return null
    const part = { id: readString(item, "id"), label: readString(item, "label"), text: readString(item, "text") }
    if (!part.id || !part.label || !part.text) return null
    novelParts.push({ id: part.id, label: part.label, text: part.text })
  }
  const revision = own(record, "revisionDemonstration")
  const second = own(record, "secondIteration")
  const feedback = own(record, "readerFeedback")
  if (!isRecord(revision) || !isRecord(second) || !isRecord(feedback)) return null
  const problem = readString(revision, "problem")
  const proposedChange = readString(revision, "proposedChange")
  const judgment = readString(revision, "judgment")
  const productionDisclosure = readString(revision, "productionDisclosure")
  const secondIterationNote = readString(second, "note")
  const readerFeedbackNote = readString(feedback, "note")
  if (!problem || !proposedChange || !judgment || !productionDisclosure || !secondIterationNote || !readerFeedbackNote) return null
  if (novelParts.length !== 4) return null
  return {
    manifest,
    novelTitle,
    novelParts,
    problem,
    proposedChange,
    judgment,
    productionDisclosure,
    secondIterationNote,
    readerFeedbackNote,
  }
}

export async function loadGuanDengSample(): Promise<GuanDengLoadResult> {
  let manifestJson: unknown
  try {
    manifestJson = await readJson("sample-manifest.json")
  } catch {
    const missing = await missingExpectedFiles()
    return {
      ok: false,
      missing: missing.length > 0 ? missing : ["sample-manifest.json"],
      message: "改编样例清单没有读到，四格页面暂时不能展示。",
    }
  }
  const manifest = readManifest(manifestJson)
  if (!manifest) {
    return { ok: false, missing: ["sample-manifest.json"], message: "改编样例清单不完整，四格页面暂时不能展示。" }
  }
  const missing: string[] = []
  let novel: unknown
  let record: unknown
  try {
    novel = await readJson(manifest.sourceNovelJson)
  } catch {
    missing.push(manifest.sourceNovelJson)
  }
  try {
    record = await readJson(manifest.recordFile)
  } catch {
    missing.push(manifest.recordFile)
  }
  if (missing.length > 0 || novel === undefined || record === undefined) {
    return { ok: false, missing, message: "改编样例的原文或修改说明没有读到。" }
  }
  const sample = readSample(manifest, novel, record)
  if (!sample) {
    return {
      ok: false,
      missing: [manifest.sourceNovelJson, manifest.recordFile],
      message: "改编样例的原文或修改说明不完整。",
    }
  }
  return { ok: true, sample }
}

export function guanDengImageSize(sample: GuanDengSample, file: string): { width: number; height: number } | null {
  const found = sample.manifest.images.find(item => item.file === file)
  return found ? { width: found.width, height: found.height } : null
}

export function guanDengPartText(sample: GuanDengSample, partId: string): string {
  return sample.novelParts.find(part => part.id === partId)?.text ?? ""
}
