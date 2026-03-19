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

/** 生成 R1 个人快照 HTML */
function buildR1PersonalSnapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1 } = portfolio
  const myR1 = lesson1.r1ByMember.find(r => r.author === student.studentName)
  const now = new Date().toLocaleString("zh-CN")

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>R1个人快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时1 · R1个人快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${student.role === "leader" ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
  </table>

  ${myR1 ? `
  <div class="section">
    <div class="section-title">📋 个人研究方向（R1）</div>
    <div class="field"><div class="field-label">主题包</div><div class="field-value">${myR1.themePack}</div></div>
    <div class="field"><div class="field-label">观察范围</div><div class="field-value">${myR1.scope}</div></div>
    <div class="field"><div class="field-label">研究问题候选</div><div class="field-value">${myR1.researchQuestionDraft}</div></div>
    <div class="field"><div class="field-label">最低可行证据建议</div><div class="field-value">${myR1.minEvidenceIdea}</div></div>
    <div class="field"><div class="field-label">记录思路</div><div class="field-value">${myR1.roughRecordIdea}</div></div>
    ${myR1.driftWarnings.length > 0 ? `<div class="field"><div class="field-label">跑偏提醒</div><div class="field-value">${myR1.driftWarnings.join("；")}</div></div>` : ""}
  </div>
  ` : "<p>暂无 R1 记录</p>"}

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为过程性评价材料，记录了学生在课时1第3步完成时的个人研究方向思考。</p>
  </div>
</body>
</html>`
}

/** 生成课时1完整快照 HTML */
function buildLesson1FullSnapshot(portfolio: ModulePortfolio): string {
  const { student, lesson1 } = portfolio
  const now = new Date().toLocaleString("zh-CN")

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>课时1完整快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时1 · 完整阶段快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>角色</td><td>${student.role === "leader" ? "组长" : "组员"}</td></tr>
    <tr><td>生成时间</td><td colspan="3">${now}</td></tr>
    <tr><td>当前进度</td><td colspan="3">课时${portfolio.pointer.lessonId} · 第${portfolio.pointer.stepId}关</td></tr>
  </table>

  <div class="section">
    <div class="section-title">👤 个人研究方向（R1）</div>
    ${lesson1.r1ByMember.filter(r => r.author === student.studentName).map(r1 => `
      <div class="field"><div class="field-label">主题包 / 研究问题</div><div class="field-value">${r1.themePack} — ${r1.researchQuestionDraft}</div></div>
      <div class="field"><div class="field-label">观察范围</div><div class="field-value">${r1.scope}</div></div>
      <div class="field"><div class="field-label">记录思路</div><div class="field-value">${r1.roughRecordIdea}</div></div>
    `).join("") || "<p>暂无记录</p>"}
  </div>

  ${lesson1.groupConsensus ? `
  <div class="section">
    <div class="section-title">🤝 小组共识</div>
    <div class="field"><div class="field-label">最终研究问题</div><div class="field-value">${lesson1.groupConsensus.finalResearchQuestion}</div></div>
    <div class="field"><div class="field-label">观察范围</div><div class="field-value">${lesson1.groupConsensus.scope}</div></div>
    <div class="field"><div class="field-label">为什么选择这个方案</div><div class="field-value">${lesson1.groupConsensus.whyThisPlan}</div></div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">📋 证据收集清单（${lesson1.evidenceRows.length} 条）</div>
    ${lesson1.evidenceRows.length > 0 ? `
    <table class="evidence-table">
      <thead><tr><th>证据项</th><th>类型</th><th>地点/时间</th><th>方法</th><th>负责人</th></tr></thead>
      <tbody>
        ${lesson1.evidenceRows.map(r => `
        <tr>
          <td>${r.item}</td>
          <td>${r.type === "first-hand" ? "一手" : "二手"}</td>
          <td>${r.whereWhen}</td>
          <td>${r.method}</td>
          <td>${r.owner}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
    ` : "<p>暂无证据计划</p>"}
  </div>

  ${lesson1.aiAssistLogs.length > 0 ? `
  <div class="section">
    <div class="section-title">🤖 AI 助手使用记录（${lesson1.aiAssistLogs.length} 次）</div>
    ${lesson1.aiAssistLogs.map((log, i) => `
      <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 4px;">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">#${i + 1} · ${log.kind === "R2" ? "计划生成助手" : "风控体检助手"} · ${new Date(log.createdAt).toLocaleString("zh-CN")}</div>
        <div><strong>是否采纳：</strong>${log.adopted ? "是" : "否"}${log.adoptedNote ? `（${log.adoptedNote}）` : ""}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
    <p>说明：本快照为课时1完整过程性评价材料，包含个人研究方向、小组讨论与证据计划。</p>
  </div>
</body>
</html>`
}

/** 生成课时2公开资源快照 */
function buildLesson2PublicSnapshot(portfolio: ModulePortfolio): string {
  const { student, lesson2 } = portfolio
  const now = new Date().toLocaleString("zh-CN")
  const myRecords = lesson2.publicRecords.filter(r => r.owner === student.studentName)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>课时2公开资源快照 — ${student.studentName}</title>${SNAPSHOT_STYLES}</head>
<body>
  <h1>AI科学传播站 · 课时2 · 公开资源快照</h1>
  <table class="meta-table">
    <tr><td>班级</td><td>${student.clazz}</td><td>姓名</td><td>${student.studentName}</td></tr>
    <tr><td>小组</td><td>${student.groupName}</td><td>生成时间</td><td>${now}</td></tr>
  </table>

  <div class="section">
    <div class="section-title">📚 已录入公开资源记录（${myRecords.length} 条）</div>
    ${myRecords.map((r, i) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
      <div style="font-weight: bold; margin-bottom: 8px;">#${i + 1} · ${r.item}</div>
      <div class="field"><div class="field-label">来源平台 / 机构</div><div class="field-value">${r.sourcePlatform} / ${r.sourceOrg}</div></div>
      <div class="field"><div class="field-label">URL</div><div class="field-value">${r.url || "未填写"}</div></div>
      <div class="field"><div class="field-label">发布时间 / 获取时间</div><div class="field-value">${r.publishedAt} / ${r.capturedAt}</div></div>
      <div class="field"><div class="field-label">摘要</div><div class="field-value">${r.quoteOrNote}</div></div>
      <div class="field"><div class="field-label">自动生成引用</div><div class="field-value" style="font-style: italic;">${r.citationFull}</div></div>
      <div style="margin-top: 8px;"><span class="tag">${r.status === "checked" ? "✓ 已质检" : "草稿"}</span></div>
    </div>
    `).join("") || "<p>暂无公开资源记录</p>"}
  </div>

  <div class="footer">
    <p>文件由 ClassQuest 自动生成 · ${now}</p>
  </div>
</body>
</html>`
}

/** 根据快照类型分发到对应的生成函数 */
export function buildSnapshotHTML(
  type: "r1-personal" | "lesson1-full" | "lesson2-public" | "lesson2-full",
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
    default:
      return buildLesson1FullSnapshot(portfolio)
  }
}

/** 触发浏览器下载快照 HTML */
export function downloadSnapshot(
  type: "r1-personal" | "lesson1-full" | "lesson2-public" | "lesson2-full",
  portfolio: ModulePortfolio
): void {
  const html = buildSnapshotHTML(type, portfolio)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const filename = buildSnapshotFilename(portfolio.student.studentName, portfolio.pointer.lessonId)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
