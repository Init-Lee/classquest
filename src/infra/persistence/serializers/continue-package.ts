/**
 * 文件说明：继续学习包序列化/反序列化
 * 职责：将 ModulePortfolio 序列化为可携带的 JSON 文件（继续学习包）；
 *       以及将导入的 JSON 文件解析还原为 ModulePortfolio；
 *       同时提供课时3个人整理包（PersonalPackage）、课时4小组骨架包（SkeletonPackageV1）、
 *       课时5第2关组长汇总包（Lesson5VersionChangeLeaderPackageV1）的序列化与反序列化。
 * 更新触发：ModulePortfolio 结构发生变化时；个人整理包/骨架包格式调整时；新增课时时；
 *           `normalizeLesson6State` 与课时6 字段迁移时
 */

import type { ModulePortfolio, EvidenceCard, SelectedMaterial, FeedbackDimension, ChangeRecord } from "@/domains/portfolio/types"
import {
  createEmptyLesson3State,
  createEmptyLesson4State,
  createEmptyLesson5State,
  createEmptyLesson6State,
  normalizeLesson5State,
  normalizeLesson6State,
} from "@/domains/portfolio/types"
import type { PublicEvidenceRecord, FieldEvidenceTask } from "@/domains/evidence/types"
import { buildContinuePackageFilename, buildLeaderFilename } from "@/shared/utils/format"

/**
 * 课时3第5关个人整理包
 * 含学生在课时2采集的原始资料条目和课时3的加工结果；
 * 供课时4第1关组长导入合并时使用，保留来源追溯链。
 */
export interface PersonalPackage {
  /** 文件类型标识 */
  packageType: "personal-package-v1"
  /** 学生姓名 */
  studentName: string
  /** 学生角色 */
  role: string
  /** 小组名称 */
  groupName: string
  /** 课时3：为何关注表述草稿 */
  toolboxWhyOnPoster: string
  /** 课时3：这条材料让我注意到什么 */
  toolboxNoticeWhat: string
  /** 课时3：已筛选材料列表 */
  selectedMaterials: SelectedMaterial[]
  /** 课时3：证据卡列表 */
  evidenceCards: EvidenceCard[]
  /** 课时2：公开资源记录（该学生名下） */
  publicRecords: PublicEvidenceRecord[]
  /** 课时2：现场采集任务（该学生名下） */
  fieldTasks: FieldEvidenceTask[]
  /** 生成时间戳 */
  exportedAt: string
}

/**
 * 课时4第1关小组网页文字骨架包 v1
 * 由组长合并所有成员个人整理包后生成，分发给组员在第2关导入。
 * 包含来源追溯信息，确保第2关个人草稿和第5关最终提交能回溯每条材料的来源。
 * 同时携带海报排版所需的结构化字段（标题、副标题、为何关注、我们看见了什么、可能的原因）。
 */
export interface SkeletonPackageV1 {
  /** 文件类型标识 */
  packageType: "skeleton-package-v1"
  /** 小组名称 */
  groupName: string
  /** 组长姓名 */
  leaderName: string
  /** 探究问题（来自课时1） */
  researchQuestion: string
  /** 海报标题（组长在第1关填写） */
  posterTitle: string
  /** 海报副标题（组长在第1关填写） */
  posterSubtitle: string
  /** 合并后的"为何关注"（全员表述汇总，组长可编辑） */
  mergedWhyCare: string
  /** 合并后的"我们看见了什么"——来自所有成员证据卡的 posterExpression 列表 */
  mergedWhatWeSee: string[]
  /** 合并后的来源资料列表（课时2公开记录标题/来源，供海报脚注） */
  mergedSources: string[]
  /** 合并的成员整理包列表（保留来源追溯链） */
  memberPackages: PersonalPackage[]
  /** 小组讨论补齐的"可能的原因" */
  possibleCauses: string
  /** 生成时间戳 */
  exportedAt: string
}

/**
 * 课时5第1关 · 组员「同伴意见包」
 * 组员填写四维度与一条优先修改后导出，供组长在课时5第1关右侧导入汇总。
 */
export interface PeerFeedbackOpinionPackage {
  /** 文件类型标识 */
  packageType: "peer-feedback-opinion-v1"
  /** 学生姓名 */
  studentName: string
  /** 学生角色 */
  role: string
  /** 班级 */
  clazz: string
  /** 小组名称 */
  groupName: string
  /** 四维度判断与建议 */
  feedbackDimensions: FeedbackDimension[]
  /** 一条优先修改表述 */
  priorityChange: string
  /** 生成时间戳 */
  exportedAt: string
}

/** 从文件解析同伴意见包；格式不符时抛出可读中文错误 */
export function parsePeerFeedbackOpinionPackageJson(text: string): PeerFeedbackOpinionPackage {
  const raw = JSON.parse(text) as unknown
  if (!raw || typeof raw !== "object") throw new Error("文件内容为空或无法解析")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = raw as any
  if (o.packageType !== "peer-feedback-opinion-v1") {
    throw new Error("请选择由本关「导出意见包」生成的文件")
  }
  if (!o.studentName || !o.groupName) throw new Error("意见包缺少姓名或小组信息，无法导入")
  if (!Array.isArray(o.feedbackDimensions)) throw new Error("意见包格式不完整")
  return o as PeerFeedbackOpinionPackage
}

/** 根据当前档案生成同伴意见包对象（供下载） */
export function buildPeerFeedbackOpinionPackage(portfolio: ModulePortfolio): PeerFeedbackOpinionPackage {
  const { student, lesson5 } = portfolio
  return {
    packageType: "peer-feedback-opinion-v1",
    studentName: student.studentName,
    role: student.role,
    clazz: student.clazz,
    groupName: student.groupName,
    feedbackDimensions: lesson5.feedbackDimensions,
    priorityChange: lesson5.priorityChange,
    exportedAt: new Date().toISOString(),
  }
}

/** 触发浏览器下载同伴意见包（组员交给组长） */
export function downloadPeerFeedbackOpinionPackage(portfolio: ModulePortfolio): void {
  const pkg = buildPeerFeedbackOpinionPackage(portfolio)
  const json = JSON.stringify(pkg, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const safeName = `${portfolio.student.clazz ?? ""}_${portfolio.student.studentName}_同伴意见包`.replace(/[/\\?%*:|"<>]/g, "_")
  const a = document.createElement("a")
  a.href = url
  a.download = `${safeName}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 课时5第2关 · 组长「改动落地汇总包」内嵌的组员意见摘要（与第1关导入的意见包对应）
 */
export interface Lesson5PeerSummaryInLeaderPackage {
  /** 组员姓名 */
  studentName: string
  /** 该组员一条优先修改 */
  priorityChange: string
  /** 四维度判断与建议的拼接摘要（多行） */
  dimensionsSummary: string
}

/**
 * 课时5第2关 · 组长导出、组员导入的改动落地汇总包 v1
 */
export interface Lesson5VersionChangeLeaderPackageV1 {
  packageType: "lesson5-version-change-leader-v1"
  /** 组长姓名 */
  leaderName: string
  clazz: string
  /** 档案中的小组字段（与意见包一致，便于核对） */
  groupName: string
  /** 课时1共识探究问题 */
  finalResearchQuestion: string
  /** 第1关组长定稿：本轮优先修改 */
  leaderPriorityChange: string
  /** 第1关已导入的各组员意见摘要 */
  peerSummaries: Lesson5PeerSummaryInLeaderPackage[]
  /** 第2关详细改动表（至少完整行由组长在导出前填好） */
  changeRecords: ChangeRecord[]
  exportedAt: string
}

/** 解析组长汇总包 JSON */
export function parseLesson5VersionChangeLeaderPackageJson(text: string): Lesson5VersionChangeLeaderPackageV1 {
  const raw = JSON.parse(text) as unknown
  if (!raw || typeof raw !== "object") throw new Error("文件内容为空或无法解析")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = raw as any
  if (o.packageType !== "lesson5-version-change-leader-v1") {
    throw new Error("请选择组长在本关导出的「改动落地汇总包」JSON 文件")
  }
  if (!Array.isArray(o.changeRecords)) throw new Error("汇总包缺少改动表，请让组长重新导出")
  return o as Lesson5VersionChangeLeaderPackageV1
}

/**
 * 根据当前档案构建组长汇总包
 * @param changeRecordsOverride 若传入，则用其代替档案中的 changeRecords（便于导出前尚未写回 IDB 的编辑态）
 */
export function buildLesson5VersionChangeLeaderPackage(
  portfolio: ModulePortfolio,
  changeRecordsOverride?: ChangeRecord[]
): Lesson5VersionChangeLeaderPackageV1 {
  const { student, lesson1, lesson5 } = portfolio
  const rows = changeRecordsOverride ?? lesson5.changeRecords
  let pkgs: PeerFeedbackOpinionPackage[] = []
  try {
    const arr = JSON.parse(lesson5.peerFeedbackImportedPackagesJson || "[]") as unknown
    if (Array.isArray(arr)) pkgs = arr as PeerFeedbackOpinionPackage[]
  } catch {
    /* 忽略 */
  }
  const peerSummaries: Lesson5PeerSummaryInLeaderPackage[] = pkgs.map(p => ({
    studentName: p.studentName,
    priorityChange: p.priorityChange ?? "",
    dimensionsSummary: (p.feedbackDimensions ?? [])
      .filter(d => d.status !== "" || (d.suggestion && d.suggestion.trim()))
      .map(d => {
        const st = d.status === "needs-change" ? "需改" : d.status === "clear" ? "清楚" : "未判断"
        const sug = d.suggestion?.trim() ? `；${d.suggestion.trim()}` : ""
        return `${d.name}：${st}${sug}`
      })
      .join("\n") || "（未填写维度判断）",
  }))
  return {
    packageType: "lesson5-version-change-leader-v1",
    leaderName: student.studentName,
    clazz: student.clazz,
    groupName: student.groupName,
    finalResearchQuestion: lesson1.groupConsensus?.finalResearchQuestion ?? "",
    leaderPriorityChange: lesson5.priorityChange,
    peerSummaries,
    changeRecords: rows.filter(r => r.item.trim() && r.before.trim() && r.after.trim() && r.reason.trim()),
    exportedAt: new Date().toISOString(),
  }
}

/** 下载组长改动落地汇总包 */
export function downloadLesson5VersionChangeLeaderPackage(
  portfolio: ModulePortfolio,
  changeRecordsOverride?: ChangeRecord[]
): void {
  const pkg = buildLesson5VersionChangeLeaderPackage(portfolio, changeRecordsOverride)
  const json = JSON.stringify(pkg, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const safe = `${portfolio.student.clazz ?? ""}_${pkg.leaderName}_改动落地汇总包`.replace(/[/\\?%*:|"<>]/g, "_")
  const a = document.createElement("a")
  a.href = url
  a.download = `${safe}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 导出继续学习包为 Blob（JSON 格式） */
export function serializeContinuePackage(portfolio: ModulePortfolio): Blob {
  const json = JSON.stringify(portfolio, null, 2)
  return new Blob([json], { type: "application/json" })
}

/**
 * 数据迁移：将旧格式的档案升级到当前数据结构
 * - evidenceRows.owner (string) → owners (string[])
 * - assignments.owner (string) → owners (string[])
 * - lesson1.groupMembers 缺失时补空数组
 * - R1Record.sourceRows 缺失时补空数组
 * - lesson3 字段缺失时补默认初始状态（v0.3 → v0.4 迁移）
 * 保持向后兼容，旧文件导入后可正常使用
 */
function migratePortfolioData(raw: unknown): ModulePortfolio {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any

  // 迁移 evidenceRows.owner (string) → owners (string[])
  if (Array.isArray(data?.lesson1?.evidenceRows)) {
    data.lesson1.evidenceRows = data.lesson1.evidenceRows.map((row: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any
      if (!Array.isArray(r.owners)) {
        r.owners = r.owner ? [r.owner] : []
      }
      return r
    })
  }

  // 补充 groupMembers 字段
  if (data?.lesson1 && !Array.isArray(data.lesson1.groupMembers)) {
    data.lesson1.groupMembers = []
  }

  // 迁移 R1Record.sourceRows 缺失
  if (Array.isArray(data?.lesson1?.r1ByMember)) {
    data.lesson1.r1ByMember = data.lesson1.r1ByMember.map((r: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = r as any
      if (!Array.isArray(rec.sourceRows)) {
        rec.sourceRows = []
      }
      return rec
    })
  }

  // 迁移 assignments.owner (string) → owners (string[])
  if (Array.isArray(data?.lesson2?.assignments)) {
    data.lesson2.assignments = data.lesson2.assignments.map((a: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asg = a as any
      if (!Array.isArray(asg.owners)) {
        asg.owners = asg.owner ? [asg.owner] : []
      }
      return asg
    })
  }

  // v0.3 → v0.4：补充 lesson3 字段（旧版继续学习包无此字段）
  if (!data?.lesson3) {
    data.lesson3 = createEmptyLesson3State()
  } else {
    data.lesson3 = { ...createEmptyLesson3State(), ...data.lesson3 }
  }

  // v0.4 → v0.5：补充 lesson4 字段（课时4上线前的旧包无此字段）
  if (!data?.lesson4) {
    data.lesson4 = createEmptyLesson4State()
  } else {
    data.lesson4 = { ...createEmptyLesson4State(), ...data.lesson4 }
  }

  // v0.5 → v0.5+：补充 lesson5 字段（课时5上线前的旧包无此字段）
  if (!data?.lesson5) {
    data.lesson5 = createEmptyLesson5State()
  } else {
    data.lesson5 = normalizeLesson5State(data.lesson5)
  }

  // 预埋 lesson6 字段（课时6上线前的旧包无此字段）
  if (!data?.lesson6) {
    data.lesson6 = createEmptyLesson6State()
  } else {
    data.lesson6 = normalizeLesson6State(data.lesson6)
  }

  return data as ModulePortfolio
}

/** 从文件读取并解析继续学习包，返回 ModulePortfolio */
export async function deserializeContinuePackage(file: File): Promise<ModulePortfolio> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const raw = JSON.parse(text) as unknown

        // 基本结构校验
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = raw as any
        if (!obj?.id || !obj?.moduleId || !obj?.student || !obj?.lesson1) {
          reject(new Error("文件格式不正确，请选择有效的继续学习包文件"))
          return
        }

        if (obj.moduleId !== "G7_M3") {
          reject(new Error("文件不属于本模块，无法导入"))
          return
        }

        // 执行迁移，确保新旧格式均可使用
        resolve(migratePortfolioData(raw))
      } catch {
        reject(new Error("文件解析失败，请确认文件未被损坏"))
      }
    }

    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsText(file)
  })
}

/**
 * 触发浏览器下载组长文件（供组员在课时2导入分工使用）
 * 内容与继续学习包相同，区别仅在文件名，方便区分
 */
export function downloadLeaderFile(portfolio: ModulePortfolio): void {
  const blob = serializeContinuePackage(portfolio)
  const url = URL.createObjectURL(blob)
  const filename = buildLeaderFilename(portfolio.student.groupName, portfolio.groupPlanVersion)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 触发浏览器下载继续学习包 */
export function downloadContinuePackage(portfolio: ModulePortfolio): void {
  const blob = serializeContinuePackage(portfolio)
  const url = URL.createObjectURL(blob)
  const filename = buildContinuePackageFilename(
    portfolio.student.studentName,
    portfolio.pointer.lessonId,
    portfolio.pointer.stepId
  )

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// 课时3个人整理包（PersonalPackage）序列化/反序列化
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 从 ModulePortfolio 提取并序列化课时3个人整理包
 * 包含该学生名下课时2原始资料条目和课时3完整加工结果
 */
export function serializePersonalPackage(portfolio: ModulePortfolio): Blob {
  const { student, lesson2, lesson3 } = portfolio
  const myName = portfolio.lesson1.confirmedOwnerName || student.studentName

  const pkg: PersonalPackage = {
    packageType: "personal-package-v1",
    studentName: student.studentName,
    role: student.role,
    groupName: student.groupName,
    toolboxWhyOnPoster: lesson3.toolboxWhyOnPoster,
    toolboxNoticeWhat: lesson3.toolboxNoticeWhat,
    selectedMaterials: lesson3.selectedMaterials,
    evidenceCards: lesson3.evidenceCards,
    // 只导出属于该学生的资料条目
    publicRecords: lesson2.publicRecords.filter(r => r.owner === myName),
    fieldTasks: lesson2.fieldTasks.filter(t => t.owner === myName),
    exportedAt: new Date().toISOString(),
  }

  return new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" })
}

/** 触发浏览器下载课时3个人整理包（供组员带到课时4使用） */
export function downloadPersonalPackage(portfolio: ModulePortfolio): void {
  const blob = serializePersonalPackage(portfolio)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `个人整理包_${portfolio.student.studentName}_课时3.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 从文件读取并解析课时3个人整理包 */
export async function deserializePersonalPackage(file: File): Promise<PersonalPackage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = JSON.parse(text) as any
        if (obj?.packageType !== "personal-package-v1") {
          reject(new Error(`"${file.name}"不是有效的个人整理包文件，请确认文件来自课时3第5关导出`))
          return
        }
        if (!obj.studentName || !obj.evidenceCards) {
          reject(new Error(`"${file.name}"文件内容不完整，请重新导出`))
          return
        }
        resolve(obj as PersonalPackage)
      } catch {
        reject(new Error(`"${file.name}"解析失败，请确认文件未被损坏`))
      }
    }
    reader.onerror = () => reject(new Error(`"${file.name}"读取失败`))
    reader.readAsText(file)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 课时4小组网页文字骨架包 v1（SkeletonPackageV1）序列化/反序列化
// ─────────────────────────────────────────────────────────────────────────────

/** 序列化小组网页文字骨架包 v1 为 Blob */
export function serializeSkeletonPackageV1(data: Omit<SkeletonPackageV1, "packageType" | "exportedAt">): Blob {
  const pkg: SkeletonPackageV1 = {
    packageType: "skeleton-package-v1",
    ...data,
    exportedAt: new Date().toISOString(),
  }
  return new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" })
}

/** 从文件读取并解析小组网页文字骨架包 v1 */
export async function deserializeSkeletonPackageV1(file: File): Promise<SkeletonPackageV1> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = JSON.parse(text) as any
        if (obj?.packageType !== "skeleton-package-v1") {
          reject(new Error("不是有效的小组网页文字骨架包文件，请确认文件来自课时4第1关导出"))
          return
        }
        if (!obj.groupName) {
          reject(new Error("文件内容不完整，请让组长重新导出"))
          return
        }
        // 兼容旧版本骨架包（补充新增的结构化字段）
        const normalized: SkeletonPackageV1 = {
          posterTitle: "",
          posterSubtitle: "",
          mergedWhyCare: "",
          mergedWhatWeSee: [],
          mergedSources: [],
          memberPackages: [],
          possibleCauses: "",
          ...obj,
        }
        resolve(normalized)
      } catch {
        reject(new Error("文件解析失败，请确认文件未被损坏"))
      }
    }
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsText(file)
  })
}
