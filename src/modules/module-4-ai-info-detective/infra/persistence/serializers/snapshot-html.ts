/**
 * 文件说明：模块 4 阶段快照 HTML 序列化工具。
 * 职责：根据 Module4Portfolio 生成课时 1 阶段快照，并提供浏览器下载入口，方便学生提交过程证据。
 * 更新触发：课时快照内容、文件命名规则、脱敏边界或新增课时快照类型时，需要同步更新本文件。
 */

import type { Module4Portfolio } from "@/modules/module-4-ai-info-detective/domains/portfolio/types"

export type Module4SnapshotType = "lesson1-full"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function safeFilenamePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "module4"
}

function newsSourceTypeLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    news_site: "新闻网站",
    wechat_article: "公众号文章",
    social_screenshot: "社交平台截图",
    other: "其他",
  }
  return value ? labels[value] ?? value : "未选择"
}

function imageSourceTypeLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    web: "网络来源",
    ai_generated: "AI 生成",
    field_capture: "现场采集",
    mixed: "混合加工",
  }
  return value ? labels[value] ?? value : "未选择"
}

export function buildModule4Lesson1SnapshotHtml(portfolio: Module4Portfolio): string {
  const lesson1 = portfolio.lesson1
  const completedAt = new Date().toLocaleString("zh-CN")
  const name = escapeHtml(portfolio.student.studentName || "未填写")
  const clazz = escapeHtml(portfolio.student.clazz || "未填写")
  const seat = escapeHtml(portfolio.student.classSeatCode || "未填写")
  const missionQuizAttempts = lesson1.missionQuizAttempts
  const missionQuizPassedAttempt = [...missionQuizAttempts].reverse().find(attempt => attempt.passed)
  const step2 = lesson1.step2
  const step5 = lesson1.step5
  const step2Rows = [
    ["新闻类", step2.news],
    ["图片类", step2.image],
  ].map(([label, sample]) => {
    const record = sample as typeof step2.news
    return `
      <tr>
        <td>${label}</td>
        <td>${record.answered ? `已作答（选择 ${escapeHtml(record.selectedOptionKey || "未记录")}，${record.isCorrect ? "答对" : "未答对"}）` : "未作答"}</td>
        <td>${escapeHtml(record.selectedAt || "未记录")}</td>
        <td>${escapeHtml(record.answeredAt || "未记录")}</td>
        <td>${escapeHtml(record.explanationViewedAt || "未记录")}</td>
        <td>${record.materialPreviewOpenedCount}</td>
        <td>${record.structureInteractionCount}</td>
        <td>${Object.values(record.structureMatched).filter(Boolean).length}/4</td>
      </tr>`
  }).join("")
  const missionQuizRows = missionQuizAttempts.length
    ? missionQuizAttempts.map(attempt => `
      <tr>
        <td>${attempt.attemptNo}</td>
        <td>${escapeHtml(attempt.submittedAt || "未记录")}</td>
        <td>${attempt.passed ? "通过" : "未通过"}</td>
        <td>${escapeHtml(attempt.wrongQuestionIds.join("、") || "无")}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="muted">暂无三题确认记录</td></tr>`

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块四课时1阶段快照</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #2563eb; --soft: #eff6ff; --warm: #fff7ed; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      line-height: 1.7;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 30%),
        linear-gradient(135deg, #f8fbff 0%, #f3f7ff 45%, #fff7ed 100%);
    }
    main { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, h3, p { margin-top: 0; }
    .hero {
      border: 1px solid rgba(37, 99, 235, 0.18);
      border-radius: 28px;
      padding: 28px;
      color: white;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #f97316 130%);
      box-shadow: 0 20px 50px rgba(37, 99, 235, 0.22);
    }
    .hero h1 { font-size: 30px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .hero .muted { color: rgba(255, 255, 255, 0.78); }
    section {
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 20px;
      margin-top: 18px;
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }
    section h2 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
    .muted { color: var(--muted); }
    .item { margin: 8px 0; }
    .info-grid, .stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card, .stat-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #ffffff; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; }
    .status { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 700; background: var(--soft); color: #1d4ed8; }
    .status.pending { background: #f3f4f6; color: #475467; }
    .note { border-left: 4px solid #f97316; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    table { border-collapse: separate; border-spacing: 0; width: 100%; margin-top: 10px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; font-size: 14px; background: white; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    th { background: #eef4ff; color: #1e3a8a; }
    @media print {
      body { background: white; }
      main { padding: 0; }
      section, .hero { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>ClassQuest 模块四：AI 信息辨识员</h1>
      <p class="muted">课时1：框架发布与样例拆解 · 阶段快照 lesson1-full</p>
      <p>本快照按第 1 关到第 5 关记录学习过程，用于提交阶段证据与回看学习进度。</p>
    </div>
    <section>
      <h2>学习者信息</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${name}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${clazz}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${seat}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${escapeHtml(completedAt)}</span></div>
      </div>
    </section>
    <section>
      <h2>学习进度概览</h2>
      <div class="stat-grid">
        <div class="stat-card"><span class="label">当前指针</span><span class="value">课时 ${portfolio.progress.lessonId} · 第 ${portfolio.progress.stepId} 关</span></div>
        <div class="stat-card"><span class="label">课时 1 状态</span><span class="status ${lesson1.completed ? "" : "pending"}">${lesson1.completed ? "已完成" : "进行中"}</span></div>
        <div class="stat-card"><span class="label">创建时间</span><span class="value">${escapeHtml(portfolio.createdAt || "未记录")}</span></div>
        <div class="stat-card"><span class="label">最近更新时间</span><span class="value">${escapeHtml(portfolio.updatedAt || "未记录")}</span></div>
      </div>
    </section>
    <section>
      <h2>第 1 关 · 任务发布确认</h2>
      <p class="item"><span class="status ${lesson1.missionAcknowledged ? "" : "pending"}">${lesson1.missionAcknowledged ? "已确认" : "未确认"}</span> 理解最终产出：新闻题卡 1 张 + 图片题卡 1 张。</p>
      <p class="item">三题确认：共提交 ${missionQuizAttempts.length} 次；${missionQuizPassedAttempt ? `通过时间：${escapeHtml(missionQuizPassedAttempt.submittedAt || "未记录")}` : "尚未通过"}。</p>
      <table>
        <thead>
          <tr><th>次数</th><th>提交时间</th><th>结果</th><th>错题 ID</th></tr>
        </thead>
        <tbody>${missionQuizRows}</tbody>
      </table>
    </section>
    <section>
      <h2>第 2 关 · 样例观察与解析核验</h2>
      <p class="item"><span class="status ${step2.completed ? "" : "pending"}">${step2.completed ? "已完成" : "未完成"}</span> 样例观察任务；说明页：${step2.introViewed ? "已查看" : "未查看"}。</p>
      <p class="item">新闻样例：${lesson1.newsSampleViewed ? "已查看" : "未查看"}；图片样例：${lesson1.imageSampleViewed ? "已查看" : "未查看"}。</p>
      <table>
        <thead>
          <tr><th>样例</th><th>作答</th><th>最近选择</th><th>提交判断</th><th>查看解析</th><th>放大素材次数</th><th>结构操作次数</th><th>结构配对</th></tr>
        </thead>
        <tbody>${step2Rows}</tbody>
      </table>
    </section>
    <section>
      <h2>第 3 关 · 四部分结构拆解</h2>
      <p class="item"><span class="status ${lesson1.cardAnatomyCompleted ? "" : "pending"}">${lesson1.cardAnatomyCompleted ? "已完成" : "未完成"}</span> 田字型结构配对。</p>
      <p class="item">结构拆解得分：<strong>${lesson1.cardAnatomyScore}/4</strong>。</p>
    </section>
    <section>
      <h2>第 4 关 · 完整题卡模板确认</h2>
      <p class="item"><span class="status ${lesson1.fullCardTemplateConfirmed ? "" : "pending"}">${lesson1.fullCardTemplateConfirmed ? "已确认" : "未确认"}</span> 完整题卡模板；确认时间：${escapeHtml(lesson1.fullCardTemplateConfirmedAt || "未记录")}。</p>
      <p><strong>完整题卡模板确认记录：</strong></p>
      <p class="note">${escapeHtml(lesson1.beforeAfterReason || "未填写")}</p>
    </section>
    <section>
      <h2>第 5 关 · 素材准备出口任务</h2>
      <p class="item"><span class="status ${step5.completed || lesson1.personalTaskChecklistCompleted ? "" : "pending"}">${step5.completed || lesson1.personalTaskChecklistCompleted ? "已完成" : "未完成"}</span> 候选素材包准备确认。</p>
      <p><strong>新闻素材计划：</strong>${escapeHtml(step5.newsPlanText || lesson1.newsSourcePlan || "未填写")}</p>
      <p><strong>新闻可能来源：</strong>${escapeHtml(newsSourceTypeLabel(step5.newsPossibleSourceType))}</p>
      <p><strong>图片素材计划：</strong>${escapeHtml(step5.imagePlanText || lesson1.imageSourcePlan || "未填写")}</p>
      <p><strong>图片可能来源：</strong>${escapeHtml(imageSourceTypeLabel(step5.imagePossibleSourceType))}</p>
      <p><strong>避免素材与出口总确认：</strong>${step5.exitAndAvoidAcknowledged ? "已确认" : "未确认"}</p>
    </section>
  </main>
</body>
</html>`
}

export function downloadModule4Snapshot(type: Module4SnapshotType, portfolio: Module4Portfolio): void {
  const html = buildModule4Lesson1SnapshotHtml(portfolio)
  const date = new Date().toISOString().slice(0, 10)
  const namePart = safeFilenamePart(portfolio.student.studentName || "未登记")
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `模块4_${namePart}_${type}_阶段快照_${date}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
