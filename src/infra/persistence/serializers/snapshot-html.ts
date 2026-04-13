/**
 * 文件说明：阶段快照 HTML 生成器
 * 职责：将 ModulePortfolio 的某一阶段数据渲染为可打印的单文件 HTML 快照
 *       快照面向教师阅读评分，不要求可回写系统
 * 更新触发：快照内容字段变化时；需要新增快照类型时；调整打印样式时
 */

import type { ModulePortfolio } from "@/domains/portfolio/types"
import { buildSnapshotFilename } from "@/shared/utils/format"

const SNAPSHOT_STYLES = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 14px; color: #222; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: bold; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 24px; color: #1d4ed8; }
    h2 { font-size: 16px; font-weight: bold; color: #1e40af; margin: 20px 0 10px; }
    h3 { font-size: 14px; font-weight: bold; color: #374151; margin: 14px 0 6px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table td { border: 1px solid #e5e7eb; padding: 8px 12px; vertical-align: top; }
    .meta-table td:first-child { background: #f3f4f6; font-weight: bold; width: 120px; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .section-title { font-size: 15px; font-weight: bold; color: #1e40af; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .field { margin-bottom: 10px; }
    .field-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .field-value { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 10px; min-height: 32px; }
    .tag { display: inline-block; background: #dbeafe; color: #1e40af; border-radius: 12px; padding: 2px 10px; font-size: 12px; margin: 2px; }
    .evidence-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .evidence-table th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    .evidence-table td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; color: #9ca3af; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .section { break-inside: avoid; }
    }
  </style>
`

/** 生成 R1 个人快照 HTML（课时1 第1-2关阶段） */
function buildR1PersonalSnapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1 } = portfolio
  const myR1 = lesson1.r1ByMember.find(r => r.author === student.studentName)
  const now = new Date().toLocaleString("zh-CN")

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>R1个人快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时1 · 个人研究方向（R1）快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${student.role === "leader" ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
    <tr><td>快照阶段</td><td colspan="3">课时1 · 第2关完成（个人R1阶段）</td></tr>
  </table>

  ${myR1 ? `
  <div class="section">
    <div class="section-title">📋 我的研究方向（R1）</div>
    <div class="field"><div class="field-label">主题包</div><div class="field-value">${myR1.themePack}</div></div>
    <div class="field"><div class="field-label">观察范围</div><div class="field-value">${myR1.scope}</div></div>
    <div class="field"><div class="field-label">研究问题候选</div><div class="field-value">${myR1.researchQuestionDraft}</div></div>
    <div class="field"><div class="field-label">最低可行证据建议</div><div class="field-value">${myR1.minEvidenceIdea}</div></div>
    <div class="field"><div class="field-label">记录思路</div><div class="field-value">${myR1.roughRecordIdea}</div></div>
    ${myR1.driftWarnings.length > 0 ? `<div class="field"><div class="field-label">跑偏提醒</div><div class="field-value">${myR1.driftWarnings.join("；")}</div></div>` : ""}
    <div class="field"><div class="field-label">保存时间</div><div class="field-value">${new Date(myR1.savedAt).toLocaleString("zh-CN")}</div></div>
  </div>
  ` : "<p style='color:#999;margin:16px 0'>暂无 R1 记录</p>"}

  ${lesson1.aiAssistLogs.length > 0 ? `
  <div class="section">
    <div class="section-title">🤖 AI 助手使用记录（${lesson1.aiAssistLogs.length} 次）</div>
    ${lesson1.aiAssistLogs.map((log, i) => `
      <div style="margin-bottom:10px;padding:10px;background:#f9fafb;border-radius:4px;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">#${i + 1} · ${log.kind === "R2" ? "计划生成助手" : "风控体检助手"} · ${new Date(log.createdAt).toLocaleString("zh-CN")}</div>
        <div><strong>是否采纳：</strong>${log.adopted ? "是" : "否"}${log.adoptedNote ? `（${log.adoptedNote}）` : ""}</div>
        ${log.outputText ? `<div style="margin-top:6px;font-size:12px;color:#374151"><strong>AI 回复摘要：</strong>${log.outputText}</div>` : ""}
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为课时1第2关（个人R1）阶段的过程性评价材料。</p>
  </div>
</body>
</html>`
}

/** 生成课时1完整快照 HTML（第3关起，包含小组讨论、共识、证据清单、辅助材料等全量数据） */
function buildLesson1FullSnapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1 } = portfolio
  const now = new Date().toLocaleString("zh-CN")
  const isLeader = student.role === "leader"
  const isMember = student.role === "member"

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>课时1完整快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时1 · 完整阶段快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${isLeader ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
    <tr><td>当前进度</td><td colspan="3">课时${portfolio.pointer.lessonId} · 第${portfolio.pointer.stepId}关</td></tr>
    ${isMember && lesson1.confirmedOwnerName ? `<tr><td>分工确认名</td><td colspan="3">${lesson1.confirmedOwnerName}（组长文件中与本人对应的名字）</td></tr>` : ""}
    <tr><td>安全承诺</td><td colspan="3">${lesson1.declarationAgreed ? "✓ 已勾选" : "未勾选"}</td></tr>
  </table>

  <!-- ① 本人 R1 -->
  <div class="section">
    <div class="section-title">👤 我的研究方向（R1）</div>
    ${lesson1.r1ByMember.filter(r => r.author === student.studentName).map(r1 => `
      <div class="field"><div class="field-label">主题包</div><div class="field-value">${r1.themePack}</div></div>
      <div class="field"><div class="field-label">研究问题候选</div><div class="field-value">${r1.researchQuestionDraft}</div></div>
      <div class="field"><div class="field-label">观察范围</div><div class="field-value">${r1.scope}</div></div>
      <div class="field"><div class="field-label">最低可行证据建议</div><div class="field-value">${r1.minEvidenceIdea}</div></div>
      <div class="field"><div class="field-label">记录思路</div><div class="field-value">${r1.roughRecordIdea}</div></div>
      ${r1.driftWarnings.length > 0 ? `<div class="field"><div class="field-label">跑偏提醒</div><div class="field-value">${r1.driftWarnings.join("；")}</div></div>` : ""}
    `).join("") || "<p style='color:#999'>暂无记录</p>"}
  </div>

  <!-- ② 所有成员 R1（组长角色有意义；组员通过组长文件也可能有小组R1数据） -->
  ${lesson1.r1ByMember.filter(r => r.author !== student.studentName).length > 0 ? `
  <div class="section">
    <div class="section-title">👥 其他成员研究方向（R1）${isMember ? "（来自组长文件）" : ""}</div>
    ${lesson1.r1ByMember.filter(r => r.author !== student.studentName).map(r1 => `
      <h3>${r1.author}</h3>
      <div class="field"><div class="field-label">主题包 / 研究问题</div><div class="field-value">${r1.themePack} — ${r1.researchQuestionDraft}</div></div>
      <div class="field"><div class="field-label">观察范围</div><div class="field-value">${r1.scope}</div></div>
    `).join("")}
  </div>
  ` : ""}

  <!-- ③ 小组讨论留痕 -->
  ${lesson1.groupDiscussion.length > 0 ? `
  <div class="section">
    <div class="section-title">💬 小组讨论留痕（${lesson1.groupDiscussion.length} 条）${isMember ? "（来自组长文件）" : ""}</div>
    <table class="evidence-table">
      <thead><tr><th>成员</th><th>R1 问题候选</th><th>是否采纳</th><th>备注</th></tr></thead>
      <tbody>
        ${lesson1.groupDiscussion.map(d => `
        <tr>
          <td>${d.memberName}</td>
          <td>${d.r1Question}</td>
          <td>${d.adopted === "yes" ? "完全采纳" : d.adopted === "partial" ? "部分采纳" : "未采纳"}</td>
          <td>${d.note || "—"}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <!-- ④ 小组共识卡 -->
  ${lesson1.groupConsensus ? `
  <div class="section">
    <div class="section-title">🤝 小组共识卡${isMember ? "（来自组长文件）" : ""}</div>
    <div class="field"><div class="field-label">最终研究问题</div><div class="field-value">${lesson1.groupConsensus.finalResearchQuestion}</div></div>
    <div class="field"><div class="field-label">最终观察范围</div><div class="field-value">${lesson1.groupConsensus.scope}</div></div>
    <div class="field"><div class="field-label">为什么选择这个方案</div><div class="field-value">${lesson1.groupConsensus.whyThisPlan}</div></div>
    ${lesson1.groupConsensus.confirmedAt ? `<div class="field"><div class="field-label">确认时间</div><div class="field-value">${new Date(lesson1.groupConsensus.confirmedAt).toLocaleString("zh-CN")}</div></div>` : ""}
  </div>
  ` : ""}

  <!-- ⑤ 个人辅助材料来源（来自本人 R1 记录） -->
  ${(() => {
    const myR1 = lesson1.r1ByMember.find(r => r.author === student.studentName)
    const mySources = (myR1?.sourceRows || []).filter(r => r.meta.trim())
    return mySources.length > 0 ? `
  <div class="section">
    <div class="section-title">📖 我的辅助材料来源（${mySources.length} 条）</div>
    <table class="evidence-table">
      <thead><tr><th>来源信息</th><th>可核查事实</th><th>对本组计划的启发</th></tr></thead>
      <tbody>
        ${mySources.map(r => `
        <tr>
          <td>${r.meta}</td>
          <td>${r.fact}</td>
          <td>${r.inspire}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
    ` : ""
  })()}

  <!-- ⑤b 小组成员名单（来自组长登记） -->
  ${lesson1.groupMembers.length > 0 ? `
  <div class="section">
    <div class="section-title">👥 小组成员名单（${lesson1.groupMembers.length} 人）${isMember ? "（来自组长文件）" : ""}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;">
      ${lesson1.groupMembers.map(m => `<span class="tag">${m}</span>`).join("")}
    </div>
  </div>
  ` : ""}

  <!-- ⑥ 证据收集清单 -->
  <div class="section">
    <div class="section-title">📋 证据收集清单（${lesson1.evidenceRows.length} 条）${isMember ? "（来自组长文件）" : ""}</div>
    ${lesson1.evidenceRows.length > 0 ? `
    <table class="evidence-table">
      <thead><tr><th>证据项</th><th>类型</th><th>地点/时间</th><th>方法</th><th>负责人</th></tr></thead>
      <tbody>
        ${lesson1.evidenceRows.map(r => {
          const myName = student.studentName
          const confirmedName = lesson1.confirmedOwnerName
          const isMine = r.owners.includes(myName) || (isMember && confirmedName ? r.owners.includes(confirmedName) : false)
          return `
          <tr${isMine ? ' style="background:#eff6ff;"' : ""}>
            <td>${r.item}${isMine ? ' <span style="color:#1d4ed8;font-size:11px">◀ 我的</span>' : ""}</td>
            <td>${r.type === "first-hand" ? "现场采集" : "公开资源"}</td>
            <td>${r.whereWhen}</td>
            <td>${r.method}</td>
            <td>${r.owners.join("、")}</td>
          </tr>`
        }).join("")}
      </tbody>
    </table>
    ` : "<p style='color:#999'>暂无证据计划</p>"}
  </div>

  <!-- ⑦ AI 助手使用记录 -->
  ${lesson1.aiAssistLogs.length > 0 ? `
  <div class="section">
    <div class="section-title">🤖 AI 助手使用记录（${lesson1.aiAssistLogs.length} 次）</div>
    ${lesson1.aiAssistLogs.map((log, i) => `
      <div style="margin-bottom:12px;padding:10px;background:#f9fafb;border-radius:4px;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">#${i + 1} · ${log.kind === "R2" ? "计划生成助手" : "风控体检助手"} · ${new Date(log.createdAt).toLocaleString("zh-CN")}</div>
        <div><strong>是否采纳：</strong>${log.adopted ? "是" : "否"}${log.adoptedNote ? `（${log.adoptedNote}）` : ""}</div>
        ${log.outputText ? `<div style="margin-top:6px;font-size:12px;color:#374151"><strong>AI 回复摘要：</strong>${log.outputText}</div>` : ""}
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为课时1完整过程性评价材料，包含个人R1、小组讨论留痕、共识卡、辅助材料、证据规划及AI助手使用记录。</p>
  </div>
</body>
</html>`
}

/** 生成课时2公开资源快照（包含任务分配、公开资源记录、质检结果） */
function buildLesson2PublicSnapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1, lesson2 } = portfolio
  const now = new Date().toLocaleString("zh-CN")
  const myName = student.studentName
  const myRecords = lesson2.publicRecords.filter(r => r.owner === myName)
  const myAssignments = lesson2.assignments.filter(a => a.owners.includes(myName))

  // 建立质检结果的索引映射，便于快速查找
  const checkMap = new Map(lesson2.qualityChecks.map(c => [c.recordIndex, c]))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>课时2公开资源快照 — ${myName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时2 · 证据采集阶段快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${myName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${student.role === "leader" ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
    <tr><td>当前进度</td><td colspan="3">课时${portfolio.pointer.lessonId} · 第${portfolio.pointer.stepId}关</td></tr>
    ${lesson1.confirmedOwnerName && student.role === "member" ? `<tr><td>分工确认名</td><td colspan="3">${lesson1.confirmedOwnerName}</td></tr>` : ""}
  </table>

  <!-- ① 我的任务分配 -->
  ${myAssignments.length > 0 ? `
  <div class="section">
    <div class="section-title">📌 我的任务分配（${myAssignments.length} 条）</div>
    <table class="evidence-table">
      <thead><tr><th>证据项</th><th>预计来源类型</th><th>负责人</th></tr></thead>
      <tbody>
        ${myAssignments.map(a => `
        <tr>
          <td>${a.item}</td>
          <td>${a.expectedSourceType === "field" ? "现场采集" : a.expectedSourceType === "public" ? "公开资源" : "两种都有"}</td>
          <td>${a.owners.join("、")}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <!-- ② 公开资源记录 + 质检结果 -->
  <div class="section">
    <div class="section-title">📚 已录入公开资源记录（${myRecords.length} 条）</div>
    ${myRecords.length > 0 ? myRecords.map((r, i) => {
      const check = checkMap.get(i)
      return `
    <div style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:12px;">
      <div style="font-weight:bold;margin-bottom:8px;">#${i + 1} · ${r.item}</div>
      <div class="field"><div class="field-label">资源类型</div><div class="field-value">${r.resourceType === "其他" ? (r.resourceTypeOther || "其他") : r.resourceType || "—"}</div></div>
      <div class="field"><div class="field-label">来源平台 / 机构</div><div class="field-value">${r.sourcePlatform === "其他" ? (r.sourcePlatformOther || "其他") : r.sourcePlatform || "—"}${r.sourceOrg ? " / " + r.sourceOrg : ""}</div></div>
      <div class="field"><div class="field-label">链接</div><div class="field-value">${(r.urls || []).filter(Boolean).join("；") || "未填写"}</div></div>
      <div class="field"><div class="field-label">发布时间</div><div class="field-value">${r.publishedUnknown ? "不确定" : r.publishedAt || "—"}</div></div>
      <div class="field"><div class="field-label">获取时间</div><div class="field-value">${r.capturedAt || "—"}</div></div>
      <div class="field"><div class="field-label">素材类型</div><div class="field-value">${(r.materialTypes || []).join("、") || "—"}</div></div>
      <div class="field"><div class="field-label">方法与工具</div><div class="field-value">${(r.methods || []).map((m: string) => m === "其他" ? (r.methodOther || "其他") : m).join("、") || "—"}</div></div>
      <div class="field"><div class="field-label">摘要/引用笔记</div><div class="field-value">${r.quoteOrNote || "—"}</div></div>
      <div class="field"><div class="field-label">资料条目</div><div class="field-value" style="font-style:italic;">${r.citationFull || "—"}</div></div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
        <span class="tag">${r.status === "checked" ? "✓ 已质检" : "草稿"}</span>
        ${check ? `
          <span class="tag" style="background:${check.passed ? "#dcfce7" : "#fee2e2"};color:${check.passed ? "#166534" : "#991b1b"};">
            ${check.passed ? "✓ 质检通过" : "✗ 质检未通过"}
          </span>
        ` : ""}
      </div>
      ${check ? `
      <div style="margin-top:8px;font-size:12px;color:#6b7280;background:#f9fafb;padding:8px;border-radius:4px;">
        <strong>质检细项：</strong>
        有来源与时间 ${check.hasSourceAndTime ? "✓" : "✗"} ·
        能证明研究问题 ${check.provesSomething ? "✓" : "✗"} ·
        素材可定位 ${check.isLocatable ? "✓" : "✗"}
        <span style="margin-left:8px;">（检查时间：${new Date(check.checkedAt).toLocaleString("zh-CN")}）</span>
      </div>
      ` : ""}
    </div>`
    }).join("") : "<p style='color:#999'>暂无公开资源记录</p>"}
  </div>

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为课时2阶段过程性评价材料，包含任务分配、公开资源入库记录及质检结果。</p>
  </div>
</body>
</html>`
}

/** 生成课时3阶段快照（材料整理与表述加工进度） */
function buildLesson3Snapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1, lesson2, lesson3 } = portfolio
  const now = new Date().toLocaleString("zh-CN")
  const myName = lesson1.confirmedOwnerName || student.studentName
  const myPublicRecords = lesson2.publicRecords.filter(r => r.owner === myName)
  const myFieldTasks = lesson2.fieldTasks.filter(t => t.owner === myName)
  const researchQuestion = lesson1.groupConsensus?.finalResearchQuestion ?? ""

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>课时3阶段快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时3 · 素材整理与证据加工阶段快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${student.role === "leader" ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
    <tr><td>当前进度</td><td colspan="3">课时${portfolio.pointer.lessonId} · 第${portfolio.pointer.stepId}关</td></tr>
    <tr><td>本课完成度</td><td colspan="3">${lesson3.toolboxCompleted ? "✓ 第2关已完成" : "第2关进行中"}${lesson3.selectedMaterials.length > 0 ? `，第3关已选 ${lesson3.selectedMaterials.length} 条材料` : ""}${lesson3.evidenceCards.length > 0 ? `，第4关已完成 ${lesson3.evidenceCards.length} 张证据卡` : ""}${lesson3.completed ? "，✓ 课时3已完成" : ""}</td></tr>
  </table>

  ${researchQuestion ? `
  <div class="section">
    <div class="section-title">🔍 小组探究问题（来自课时1）</div>
    <div class="field-value">${researchQuestion}</div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">🧰 材料加工方法工具箱（第2关）</div>
    <div class="field"><div class="field-label">这条材料让我注意到什么</div>
      <div class="field-value">${lesson3.toolboxNoticeWhat || "（未填写）"}</div></div>
    <div class="field"><div class="field-label">海报上的「为何关注」表述草稿</div>
      <div class="field-value">${lesson3.toolboxWhyOnPoster || "（未填写）"}</div></div>
    <div class="field"><div class="field-label">表述状态</div>
      <div class="field-value">${lesson3.toolboxWhyPreviewLocked ? "✓ 已确认稳定稿" : "草稿中（未确认）"}</div></div>
  </div>

  ${lesson3.selectedMaterials.length > 0 ? `
  <div class="section">
    <div class="section-title">📋 已筛选入选材料（第3关，共 ${lesson3.selectedMaterials.length} 条）</div>
    <table class="evidence-table">
      <thead><tr><th>#</th><th>来源类型</th><th>材料摘要</th><th>现象说明句</th></tr></thead>
      <tbody>
        ${lesson3.selectedMaterials.map((sm, i) => {
          const rec = sm.sourceType === "public"
            ? myPublicRecords[sm.sourceIndex]
            : myFieldTasks[sm.sourceIndex]
          const title = rec
            ? ("materialName" in rec ? rec.materialName : rec.item)
            : `（来源 #${sm.sourceIndex}）`
          return `<tr>
            <td>${i + 1}</td>
            <td>${sm.sourceType === "public" ? "公开资源" : "现场采集"}</td>
            <td>${title || "—"}</td>
            <td>${sm.explanation || "（未填写）"}</td>
          </tr>`
        }).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${lesson3.evidenceCards.length > 0 ? `
  <div class="section">
    <div class="section-title">🃏 个人证据卡（第4关，共 ${lesson3.evidenceCards.length} 张）</div>
    ${lesson3.evidenceCards.map((card, i) => {
      const sm = lesson3.selectedMaterials[card.materialIndex]
      const rawRec = sm?.sourceType === "public"
        ? myPublicRecords[sm.sourceIndex]
        : sm ? myFieldTasks[sm.sourceIndex] : undefined
      const title = rawRec
        ? ("item" in rawRec ? rawRec.item : ("materialName" in rawRec ? (rawRec as {materialName?:string}).materialName ?? "" : ""))
        : card.title
      const typeLabel = card.materialType === "image" ? "图片" : card.materialType === "data" ? "表格数据" : card.materialType === "video" ? "视频" : "文字"
      return `<div style="border:1px solid #d8b4fe;border-radius:8px;padding:12px;margin-bottom:10px;background:#faf5ff">
        <p style="font-weight:600;margin:0 0 6px">${i + 1}. ${title || card.title} <span style="font-size:12px;color:#7c3aed;background:#ede9fe;padding:2px 6px;border-radius:4px">${typeLabel}</span></p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="width:120px;color:#6b7280;font-size:12px;padding:3px 0">我看见了什么</td><td style="font-size:13px">${card.objectiveStatement || "（未填写）"}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;padding:3px 0">最小加工</td><td style="font-size:13px">${card.processingResult || "（未填写）"}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;padding:3px 0">海报展示句</td><td style="font-weight:600;font-size:13px;color:#4c1d95">${card.posterExpression || "（未填写）"}</td></tr>
        </table>
      </div>`
    }).join("")}
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">📚 课时2证据库摘要（共 ${myPublicRecords.length + myFieldTasks.length} 条）</div>
    ${myPublicRecords.length > 0 ? `
    <h3>公开资源（${myPublicRecords.length} 条）</h3>
    <table class="evidence-table">
      <thead><tr><th>证据项</th><th>来源平台</th><th>摘要/引用</th></tr></thead>
      <tbody>
        ${myPublicRecords.map(r => `<tr><td>${r.item}</td><td>${r.sourcePlatform || "—"}</td><td>${r.quoteOrNote || "—"}</td></tr>`).join("")}
      </tbody>
    </table>` : ""}
    ${myFieldTasks.length > 0 ? `
    <h3 style="margin-top:12px">现场采集（${myFieldTasks.length} 条）</h3>
    <table class="evidence-table">
      <thead><tr><th>材料名称</th><th>场景/地点</th><th>日期</th></tr></thead>
      <tbody>
        ${myFieldTasks.map(t => `<tr><td>${t.materialName || t.item}</td><td>${t.scene}${t.location ? " · " + t.location : ""}</td><td>${t.date}</td></tr>`).join("")}
      </tbody>
    </table>` : ""}
    ${myPublicRecords.length === 0 && myFieldTasks.length === 0 ? "<p style='color:#999'>暂无课时2证据记录</p>" : ""}
  </div>

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为课时3（素材整理与证据加工）阶段过程性评价材料。</p>
  </div>
</body>
</html>`
}

/** 生成课时4阶段快照（结论形成与网页传播进度） */
function buildLesson4Snapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1, lesson4 } = portfolio
  const now = new Date().toLocaleString("zh-CN")
  const researchQuestion = lesson1.groupConsensus?.finalResearchQuestion ?? ""

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>课时4阶段快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时4 · 结论形成与网页传播阶段快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${student.role === "leader" ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
    <tr><td>当前进度</td><td colspan="3">课时${portfolio.pointer.lessonId} · 第${portfolio.pointer.stepId}关</td></tr>
    <tr><td>本课完成度</td><td colspan="3">
      ${lesson4.groupMergeCompleted ? "✓ 第1关已完成（小组合并）" : "第1关进行中"}
      ${lesson4.personalDraftCompleted ? "，✓ 第2关已完成（个人草稿）" : ""}
      ${lesson4.planCompleted ? "，✓ 第3关已完成（制作方案）" : ""}
      ${lesson4.collabCompleted ? "，✓ 第4关已完成（协商生成）" : ""}
      ${lesson4.completed ? "，✓ 课时4已完成" : ""}
    </td></tr>
  </table>

  ${researchQuestion ? `
  <div class="section">
    <div class="section-title">🔍 小组探究问题（来自课时1）</div>
    <div class="field-value">${researchQuestion}</div>
  </div>` : ""}

  ${lesson4.possibleCauses ? `
  <div class="section">
    <div class="section-title">💡 可能的原因（第1关小组讨论）</div>
    <div class="field-value">${lesson4.possibleCauses}</div>
  </div>` : ""}

  ${(() => {
    if (!lesson4.skeletonPackageJson) return ""
    try {
      const sk = JSON.parse(lesson4.skeletonPackageJson)
      return `
  <div class="section">
    <div class="section-title">🗂️ 小组骨架包内容（第1关合并，组长导出 / 组员导入后可见）</div>
    ${sk.posterTitle ? `<div class="field"><div class="field-label">海报标题</div><div class="field-value" style="font-weight:600">${sk.posterTitle}</div></div>` : ""}
    ${sk.posterSubtitle ? `<div class="field"><div class="field-label">海报副标题</div><div class="field-value">${sk.posterSubtitle}</div></div>` : ""}
    ${sk.mergedWhyCare ? `<div class="field"><div class="field-label">为何关注（合并）</div><div class="field-value" style="white-space:pre-line">${sk.mergedWhyCare}</div></div>` : ""}
    ${(sk.mergedWhatWeSee ?? []).length > 0 ? `<div class="field"><div class="field-label">我们看见了什么（${sk.mergedWhatWeSee.length} 条）</div><div class="field-value">${sk.mergedWhatWeSee.map((s: string) => `· ${s}`).join("<br>")}</div></div>` : ""}
    ${sk.possibleCauses ? `<div class="field"><div class="field-label">可能的线索/原因</div><div class="field-value">${sk.possibleCauses}</div></div>` : ""}
    ${(sk.mergedSources ?? []).length > 0 ? `<div class="field"><div class="field-label">来源资料（${sk.mergedSources.length} 条）</div><div class="field-value">${sk.mergedSources.map((s: string) => `· ${s}`).join("<br>")}</div></div>` : ""}
  </div>`
    } catch { return "" }
  })()}

  ${lesson4.productionPlan ? `
  <div class="section">
    <div class="section-title">📋 小组制作方案单（第3关）</div>
    <table class="evidence-table">
      <tbody>
        <tr><td>底稿作者</td><td>${lesson4.productionPlan.baseAuthor}</td></tr>
        <tr><td>主操手</td><td>${lesson4.productionPlan.operatorName}</td></tr>
        <tr><td>证据核对</td><td>${lesson4.productionPlan.evidenceCheckerName || "—"}</td></tr>
        <tr><td>来源说明</td><td>${lesson4.productionPlan.sourceCheckerName || "—"}</td></tr>
        <tr><td>AI声明核查</td><td>${lesson4.productionPlan.aiVerifierName || "—"}</td></tr>
        <tr><td>AI使用边界</td><td>${lesson4.productionPlan.aiUsageBoundary || "—"}</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${lesson4.personalDraftHtml ? `
  <div class="section">
    <div class="section-title">📄 个人网页草稿 v0（第2关，代码）</div>
    <pre style="background:#f8f8f8;border:1px solid #e5e7eb;border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;white-space:pre-wrap;max-height:200px;overflow-y:auto">${lesson4.personalDraftHtml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  </div>` : ""}

  ${lesson4.finalHtml ? `
  <div class="section">
    <div class="section-title">🌐 小组网页最终版（第5关）</div>
    <div style="border:1px solid #d1d5db;border-radius:6px;overflow:hidden">
      <iframe srcdoc="${lesson4.finalHtml.replace(/"/g, "&quot;")}" style="width:100%;height:300px;border:none;" sandbox="allow-same-origin" title="小组网页最终版"></iframe>
    </div>
  </div>` : lesson4.groupWebpageV1 ? `
  <div class="section">
    <div class="section-title">🌐 小组网页 v1（第4关）</div>
    <div style="border:1px solid #d1d5db;border-radius:6px;overflow:hidden">
      <iframe srcdoc="${lesson4.groupWebpageV1.replace(/"/g, "&quot;")}" style="width:100%;height:300px;border:none;" sandbox="allow-same-origin" title="小组网页v1"></iframe>
    </div>
  </div>` : ""}

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为课时4（结论形成与网页传播）阶段过程性评价材料。</p>
  </div>
</body>
</html>`
}

/** 根据快照类型分发到对应的生成函数 */
export function buildSnapshotHTML(
  type: "r1-personal" | "lesson1-full" | "lesson2-public" | "lesson2-full" | "lesson3-toolbox" | "lesson4-full",
  portfolio: ModulePortfolio
): string {
  switch (type) {
    case "r1-personal":
      return buildR1PersonalSnapshot(portfolio)
    case "lesson1-full":
      return buildLesson1FullSnapshot(portfolio)
    case "lesson2-public":
      return buildLesson2PublicSnapshot(portfolio)
    case "lesson2-full":
      return buildLesson1FullSnapshot(portfolio) // 占位，实际使用时替换
    case "lesson3-toolbox":
      return buildLesson3Snapshot(portfolio)
    case "lesson4-full":
      return buildLesson4Snapshot(portfolio)
    default:
      return buildLesson1FullSnapshot(portfolio)
  }
}

/** 触发浏览器下载快照 HTML */
export function downloadSnapshot(
  type: "r1-personal" | "lesson1-full" | "lesson2-public" | "lesson2-full" | "lesson3-toolbox" | "lesson4-full",
  portfolio: ModulePortfolio
): void {
  const html = buildSnapshotHTML(type, portfolio)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  /** 用快照类型推导课时编号，避免依赖可能落后的 pointer */
  const lessonIdForFilename = type === "lesson4-full" ? 4
    : type === "lesson3-toolbox" ? 3
    : type.startsWith("lesson2") ? 2
    : 1
  const filename = buildSnapshotFilename(portfolio.student.studentName, lessonIdForFilename)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
