/**
 * 文件说明：继续学习包序列化/反序列化
 * 职责：将 ModulePortfolio 序列化为可携带的 JSON 文件（继续学习包）；
 *       以及将导入的 JSON 文件解析还原为 ModulePortfolio；
 *       同时提供课时3个人整理包（PersonalPackage）和课时4小组骨架包（SkeletonPackageV1）的序列化与反序列化。
 * 更新触发：ModulePortfolio 结构发生变化时；个人整理包/骨架包格式调整时；新增课时时
 */

import type { ModulePortfolio, EvidenceCard, SelectedMaterial } from "@/domains/portfolio/types"
import { createEmptyLesson3State, createEmptyLesson4State } from "@/domains/portfolio/types"
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
 * 同时携带海报排版所需的结构化字段（标题、副标题、为何关注、我们看见了什么、可能的线索）。
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
