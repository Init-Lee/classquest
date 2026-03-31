/**
 * 文件说明：旧版工具数据迁移 — 映射函数（临时功能）
 * 职责：将旧版 HTML 工具（证据收集清单 v1 + 素材收集包 v1）导出的 JSON
 *       转换为新版 ClassQuest 所需的 ModulePortfolio 结构。
 *       缺失的新字段一律填写安全默认值，不要求学生补填。
 * 更新触发：新版类型定义发生 breaking change 时；旧版工具格式升级时
 * 删除触发：全班学生完成旧数据迁移后，连同整个 legacy-import/ 目录一并删除
 */

import type { ModulePortfolio, Lesson1State, Lesson2State } from "@/domains/portfolio/types"
import { createEmptyLesson3State } from "@/domains/portfolio/types"
import type { StudentProfile } from "@/domains/student/types"
import type { GroupEvidencePlanRow, GroupConsensus, R1Record, GroupSourceRow } from "@/domains/group-plan/types"
import type { PublicEvidenceRecord, FieldEvidenceTask, Lesson2Assignment } from "@/domains/evidence/types"

// ─────────────────────────────────────────────────────────────────────────────
// 旧版 L1（证据收集清单 v1）JSON 结构
// ─────────────────────────────────────────────────────────────────────────────
export interface LegacyL1Evidence {
  item: string
  whereWhen: string
  method: string
  fields: string
  owner: string
}

export interface LegacyL1 {
  meta: { tool: string; version: string; exportedAt?: string }
  basic: {
    clazz: string
    groupName: string
    themePack: string
    scope: string
    researchQuestion: string
  }
  sources: { meta: string; fact: string; inspire: string }[]
  evidences: LegacyL1Evidence[]
  declaration: { agreed: boolean }
}

// ─────────────────────────────────────────────────────────────────────────────
// 旧版 L2（素材收集包 v1）JSON 结构
// ─────────────────────────────────────────────────────────────────────────────
export interface LegacyL2Evidence {
  planIndex: number
  displayIndex?: string
  item: string
  owner: string
  sourceType: "public" | "field"
  fields: string
  whereWhen?: string
  method: string
  locator?: string
  // 公开资源专有字段
  resourceType?: string
  platform?: string
  urls?: string[]
  publishTime?: string
  collectTime?: string
  // 现场采集专有字段
  scene?: string
  location?: string
  date?: string
  complianceConfirmed?: boolean
  // 自动生成引用
  citation_full?: string
}

export interface LegacyL2 {
  meta: { tool: string; version: string; exportedAt?: string }
  collector: string
  groupRef: { clazz: string; groupName: string; themePack?: string; scope?: string; researchQuestion?: string }
  evidences: LegacyL2Evidence[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 校验工具
// ─────────────────────────────────────────────────────────────────────────────

/** 检测 JSON 是否为旧版 L1 文件 */
export function isLegacyL1(data: unknown): data is LegacyL1 {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.meta === "object" &&
    (d.meta as Record<string, unknown>).tool === "evidence_checklist_v1.html" &&
    typeof d.basic === "object" &&
    Array.isArray(d.evidences)
  )
}

/** 检测 JSON 是否为旧版 L2 文件 */
export function isLegacyL2(data: unknown): data is LegacyL2 {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.meta === "object" &&
    (d.meta as Record<string, unknown>).tool === "evidence_collect_pack_v1.html" &&
    typeof d.collector === "string" &&
    Array.isArray(d.evidences)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部辅助函数
// ─────────────────────────────────────────────────────────────────────────────

/** "1" → "初一（1）班"（与首页 CLASS_OPTIONS 保持一致） */
function mapClazz(raw: string): string {
  const n = parseInt(raw, 10)
  if (n >= 1 && n <= 12) return `初一（${n}）班`
  return raw || "初一（1）班"
}

/**
 * 解析小组成员列表：支持中文逗号"，"和英文逗号","
 * 例："赵瑾曦，孟凡溪，郭夏谨睿，翁仲菁" → ["赵瑾曦","孟凡溪","郭夏谨睿","翁仲菁"]
 */
function parseMembers(groupName: string): string[] {
  return groupName
    .split(/[，,]/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** 将旧版 fields 字符串（"文字、数据、图像"）拆分为数组 */
function parseTagString(str: string): string[] {
  if (!str) return []
  return str.split(/[、，,\/\s]+/).map(s => s.trim()).filter(Boolean)
}

/** 构造 GroupSourceRow 列表 */
function mapSources(sources: LegacyL1["sources"]): GroupSourceRow[] {
  return sources.map(s => ({
    meta: s.meta || "",
    fact: s.fact || "",
    inspire: s.inspire || "",
  }))
}

/**
 * 从 L2 数据推断 L1 evidenceRow 的 type：
 * 若 L2 中找到 planIndex 匹配的记录，按其 sourceType 推断；
 * 否则按 owner 和 item 模糊匹配；
 * 均无匹配时默认 "first-hand"
 */
function inferEvidenceType(
  ev: LegacyL1Evidence,
  idx: number,
  l2Evidences: LegacyL2Evidence[],
): "first-hand" | "second-hand" {
  const byIndex = l2Evidences.find(e => e.planIndex === idx)
  if (byIndex) return byIndex.sourceType === "public" ? "second-hand" : "first-hand"
  const byItem = l2Evidences.find(e => e.item === ev.item && e.owner === ev.owner)
  if (byItem) return byItem.sourceType === "public" ? "second-hand" : "first-hand"
  return "first-hand"
}

/** L2 公开资源 → PublicEvidenceRecord */
function mapPublicRecord(ev: LegacyL2Evidence): PublicEvidenceRecord {
  const publishUnknown = !ev.publishTime
  return {
    planIndex: ev.planIndex ?? 0,
    item: ev.item || "",
    owner: ev.owner || "",
    sourceType: "public",
    resourceType: ev.resourceType || "",
    resourceTypeOther: "",
    sourcePlatform: ev.platform || "",
    sourcePlatformOther: "",
    sourceOrg: "",
    urls: Array.isArray(ev.urls) && ev.urls.length ? ev.urls : [""],
    publishedAt: publishUnknown ? "" : (ev.publishTime || ""),
    publishedUnknown: publishUnknown,
    capturedAt: ev.collectTime || new Date().toISOString().slice(0, 10),
    materialTypes: parseTagString(ev.fields),
    methods: parseTagString(ev.method),
    methodOther: "",
    quoteOrNote: "",
    citationFull: ev.citation_full || "",
    status: "draft",
  }
}

/** L2 现场采集 → FieldEvidenceTask */
function mapFieldTask(ev: LegacyL2Evidence): FieldEvidenceTask {
  // locator（如"路口雨后积水"）比 item 更适合作为素材名称
  const materialName = (ev.locator && !ev.locator.startsWith("http")) ? ev.locator : ev.item || ""
  const allComp = !!ev.complianceConfirmed
  return {
    planIndex: ev.planIndex ?? 0,
    item: ev.item || "",
    owner: ev.owner || "",
    sourceType: "field",
    materialName,
    scene: ev.scene || "",
    sceneOther: "",
    location: ev.location || "",
    date: ev.date || new Date().toISOString().slice(0, 10),
    materialTypes: parseTagString(ev.fields),
    methods: parseTagString(ev.method),
    methodOther: "",
    compNoFace: allComp,
    compNoPrivate: allComp,
    compNoFake: allComp,
    compSafety: allComp,
    citationFull: ev.citation_full || "",
    status: "todo",
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 主映射函数
// ─────────────────────────────────────────────────────────────────────────────

export interface LegacyImportParams {
  l1: LegacyL1
  l2: LegacyL2 | null
  selectedName: string
  selectedRole: "leader" | "member"
}

/** 从旧版 JSON 构造完整 ModulePortfolio */
export function buildPortfolioFromLegacy(params: LegacyImportParams): ModulePortfolio {
  const { l1, l2, selectedName, selectedRole } = params
  const now = new Date().toISOString()
  const l2Evidences = l2?.evidences ?? []

  // ── 基本信息 ──────────────────────────────────────────────────────────────
  const groupMembers = parseMembers(l1.basic.groupName)
  const clazz = mapClazz(l1.basic.clazz)
  // 小组名：取第一位成员名字 + "组"，作为小组标识（功能性，非组号）
  const groupName = groupMembers.length ? `${groupMembers[0]}组` : "未知组"
  const themePack = (["A", "B", "C"].includes(l1.basic.themePack)
    ? l1.basic.themePack : "A") as "A" | "B" | "C"

  const student: StudentProfile = {
    clazz,
    studentName: selectedName,
    groupName,
    role: selectedRole,
  }

  // ── 课时1 ─────────────────────────────────────────────────────────────────
  const evidenceRows: GroupEvidencePlanRow[] = l1.evidences.map((ev, idx) => ({
    item: ev.item || "",
    type: inferEvidenceType(ev, idx, l2Evidences),
    whereWhen: ev.whereWhen || "",
    method: ev.method || "",
    recordIdea: "",
    owners: ev.owner ? [ev.owner] : [],
    locked: true,
  }))

  const r1Record: R1Record = {
    author: selectedName,
    themePack,
    scope: l1.basic.scope || "",
    researchQuestionDraft: l1.basic.researchQuestion || "",
    minEvidenceIdea: "",
    roughRecordIdea: "",
    driftWarnings: [],
    sourceRows: mapSources(l1.sources),
    savedAt: now,
  }

  const groupConsensus: GroupConsensus = {
    themePack,
    scope: l1.basic.scope || "",
    finalResearchQuestion: l1.basic.researchQuestion || "",
    firstHandEvidenceIdeas: [],
    secondHandSourceIdeas: [],
    roughRecordIdeas: [],
    whyThisPlan: "",
    confirmedAt: now,
  }

  const lesson1: Lesson1State = {
    introDone: true,
    r1ByMember: [r1Record],
    groupDiscussion: [],
    groupConsensus,
    groupMembers,
    evidenceRows,
    declarationAgreed: l1.declaration?.agreed ?? false,
    aiAssistLogs: [],
    confirmedOwnerName: selectedName,
    completed: true,
  }

  // ── 课时2 ─────────────────────────────────────────────────────────────────
  const publicRecords: PublicEvidenceRecord[] = l2Evidences
    .filter(e => e.sourceType === "public")
    .map(mapPublicRecord)

  const fieldTasks: FieldEvidenceTask[] = l2Evidences
    .filter(e => e.sourceType === "field")
    .map(mapFieldTask)

  // assignments：从 evidenceRows 中筛出当前学生负责的任务
  const assignments: Lesson2Assignment[] = evidenceRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => row.owners.includes(selectedName))
    .map(({ row, idx }) => {
      // 推断 expectedSourceType
      const l2Match = l2Evidences.find(e => e.planIndex === idx || e.item === row.item)
      const expectedSourceType: Lesson2Assignment["expectedSourceType"] =
        l2Match ? l2Match.sourceType : (row.type === "second-hand" ? "public" : "field")
      return {
        planIndex: idx,
        item: row.item,
        owners: row.owners,
        expectedSourceType,
        fromLeaderVersion: 1,
      }
    })

  // pointer：根据 L2 数据丰富程度决定入口
  const hasL2Records = publicRecords.length > 0 || fieldTasks.length > 0
  const stepId = l2 ? (hasL2Records ? 4 : 3) : 1

  const lesson2: Lesson2State = {
    resumeDone: true,
    leaderSyncDone: true,
    assignments,
    publicRecords,
    fieldTasks,
    qualityChecks: [],
    completed: false,
  }

  return {
    id: crypto.randomUUID(),
    moduleId: "G7_M3",
    schemaVersion: 1,
    appVersion: "1.0.0",
    student,
    pointer: { lessonId: 2, stepId, updatedAt: now },
    lesson1,
    lesson2,
    lesson3: createEmptyLesson3State(),
    snapshotHistory: [],
    groupPlanVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
