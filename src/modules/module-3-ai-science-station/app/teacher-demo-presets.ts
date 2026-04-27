/**
 * 文件说明：教师演示模式下的演示数据补丁
 * 职责：`applyTeacherDemoPreset` 用于恢复完整演示；`applyTeacherMemberImportDrill` 在当前路由下切换组员「导入前/导入后」字段且不跳转指针
 * 更新触发：演示档案字段、课时4/5/6 组员导入链路、或 `createDemoPortfolio` 结构变化时同步修订
 */

import type { ModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import { normalizeModulePortfolio } from "@/modules/module-3-ai-science-station/domains/portfolio/types"
import { createDemoPortfolio } from "@/modules/module-3-ai-science-station/constants/demo-portfolio"
import { buildLesson5VersionChangeLeaderPackage } from "@/modules/module-3-ai-science-station/infra/persistence/serializers/continue-package"
import {
  buildLesson6PathJsonPayload,
  parseLesson6RoadshowPathPackageJson,
} from "@/modules/module-3-ai-science-station/lessons/lesson-6/export"

/** 教师模式：一键恢复完整演示（组长默认指针） */
export type TeacherDemoPresetId =
  | "reset_full"
  | "member_l4_before_skeleton"
  | "member_l4_after_skeleton"
  | "member_l5_before_leader_pkg"
  | "member_l5_after_leader_pkg"

/** 组员在课时4第1关 / 课时5第2关 / 课时6第2关横幅内：导入前 ↔ 导入后（不改指针） */
export type TeacherMemberImportDrill =
  | "l4-before"
  | "l4-after"
  | "l5-before"
  | "l5-after"
  | "l6-before"
  | "l6-after"

/**
 * 基于标准演示档案生成指定预设（每次从 `createDemoPortfolio()` 分叉，避免脏引用）
 */
export function applyTeacherDemoPreset(preset: TeacherDemoPresetId): ModulePortfolio {
  const base = createDemoPortfolio()
  const now = new Date().toISOString()
  const ptr = (lessonId: 1 | 2 | 3 | 4 | 5 | 6, stepId: number) => ({ lessonId, stepId, updatedAt: now })

  if (preset === "reset_full") {
    return normalizeModulePortfolio(base)
  }

  if (preset === "member_l4_before_skeleton") {
    return normalizeModulePortfolio({
      ...base,
      student: { ...base.student, role: "member" },
      pointer: ptr(4, 1),
      lesson4: {
        ...base.lesson4,
        skeletonImported: false,
        skeletonPackageJson: "",
        personalDraftHtml: "",
        personalDraftCompleted: false,
      },
    })
  }

  if (preset === "member_l4_after_skeleton") {
    return normalizeModulePortfolio({
      ...base,
      student: { ...base.student, role: "member" },
      pointer: ptr(4, 2),
      lesson4: {
        ...base.lesson4,
        skeletonImported: true,
      },
    })
  }

  if (preset === "member_l5_before_leader_pkg") {
    return normalizeModulePortfolio({
      ...base,
      student: { ...base.student, role: "member" },
      pointer: ptr(5, 2),
      lesson5: {
        ...base.lesson5,
        importedVersionChangePackageJson: "",
        versionChangeMemberAcknowledged: false,
        completed: false,
      },
    })
  }

  if (preset === "member_l5_after_leader_pkg") {
    const pkgJson = JSON.stringify(buildLesson5VersionChangeLeaderPackage(base), null, 2)
    return normalizeModulePortfolio({
      ...base,
      student: { ...base.student, role: "member" },
      pointer: ptr(5, 2),
      lesson5: {
        ...base.lesson5,
        importedVersionChangePackageJson: pkgJson,
        versionChangeMemberAcknowledged: false,
        completed: false,
      },
    })
  }

  return normalizeModulePortfolio(base)
}

/**
 * 在当前页切换组员导入演练态：保持 `pointer` 与除目标字段外的档案不变，仅改 `lesson4` / `lesson5` / `lesson6` 相关导入字段
 */
export function applyTeacherMemberImportDrill(
  portfolio: ModulePortfolio,
  drill: TeacherMemberImportDrill,
): ModulePortfolio {
  const ref = createDemoPortfolio()
  const now = new Date().toISOString()
  const pointer = { ...portfolio.pointer, updatedAt: now }

  const lesson6AfterFromDemoPkg = () => {
    const pkgJson = JSON.stringify(buildLesson6PathJsonPayload(ref), null, 2)
    const parsed = parseLesson6RoadshowPathPackageJson(pkgJson)
    return { pkgJson, parsed }
  }

  if (drill === "l4-before") {
    return normalizeModulePortfolio({
      ...portfolio,
      student: { ...portfolio.student, role: "member" },
      pointer,
      lesson4: {
        ...portfolio.lesson4,
        skeletonImported: false,
        skeletonPackageJson: "",
        personalDraftHtml: "",
        personalDraftCompleted: false,
      },
    })
  }

  if (drill === "l4-after") {
    return normalizeModulePortfolio({
      ...portfolio,
      student: { ...portfolio.student, role: "member" },
      pointer,
      lesson4: {
        ...portfolio.lesson4,
        skeletonImported: true,
        skeletonPackageJson: ref.lesson4.skeletonPackageJson,
      },
    })
  }

  if (drill === "l5-before") {
    return normalizeModulePortfolio({
      ...portfolio,
      student: { ...portfolio.student, role: "member" },
      pointer,
      lesson5: {
        ...portfolio.lesson5,
        importedVersionChangePackageJson: "",
        versionChangeMemberAcknowledged: false,
        completed: false,
      },
    })
  }

  if (drill === "l5-after") {
    const pkgJson = JSON.stringify(buildLesson5VersionChangeLeaderPackage(portfolio), null, 2)
    return normalizeModulePortfolio({
      ...portfolio,
      student: { ...portfolio.student, role: "member" },
      pointer,
      lesson5: {
        ...portfolio.lesson5,
        importedVersionChangePackageJson: pkgJson,
        versionChangeMemberAcknowledged: false,
        completed: false,
      },
    })
  }

  if (drill === "l6-before") {
    return normalizeModulePortfolio({
      ...portfolio,
      student: { ...portfolio.student, role: "member" },
      pointer,
      lesson6: {
        ...portfolio.lesson6,
        importedRoadshowPathPackageJson: "",
        roadshowPathMemberAcknowledged: false,
      },
    })
  }

  if (drill === "l6-after") {
    const { pkgJson, parsed } = lesson6AfterFromDemoPkg()
    return normalizeModulePortfolio({
      ...portfolio,
      student: { ...portfolio.student, role: "member" },
      pointer,
      lesson6: {
        ...portfolio.lesson6,
        roadshowSteps: parsed.roadshowSteps,
        challengeQuestion: parsed.challengeQuestion,
        evidenceBack: parsed.evidenceBack,
        closingSentence: parsed.closingSentence,
        importedRoadshowPathPackageJson: pkgJson,
        roadshowPathMemberAcknowledged: false,
      },
    })
  }

  return normalizeModulePortfolio(portfolio)
}
