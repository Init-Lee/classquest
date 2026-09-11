/**
 * 文件说明：模块 1 课时阶段快照 HTML 生成器。
 * 职责：按当前课时把身份与已完成字段渲染为不可导入的 HTML；下载前转义全部可控字段。
 * 更新触发：快照字段、文件名规则、转义策略、URL 映射或新增课时快照类型时，需要同步更新本文件。
 */

import {
  MODULE1_CUSTOM_STYLE_ID,
  type Module1Portfolio,
} from "@/modules/module-1-ai-story/domains/portfolio/types"

export type Module1SnapshotKind = "lesson1" | "lesson2"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function safeModule1SnapshotFilenamePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "未填写"
}

export function resolveModule1SnapshotKind(pathname: string): Module1SnapshotKind | null {
  if (/\/module\/1\/lesson\/2/.test(pathname)) return "lesson2"
  if (/\/module\/1\/lesson\/1/.test(pathname)) return "lesson1"
  return null
}

function buildLesson1ThemeCore(portfolio: Module1Portfolio): string {
  const { cityIssue, audience, sdg } = portfolio.lesson1
  return `围绕“${cityIssue}”这个具体问题，通过 2035 年回信的形式，向“${audience}”展示解决方案，体现所选 SDG“${sdg}”的实践意义。`
}

export function buildModule1Lesson1SnapshotFilename(
  studentName: string,
  now = new Date(),
): string {
  return `模块1_${safeModule1SnapshotFilenamePart(studentName)}_课时1主题设定快照_${now.toISOString().slice(0, 10)}.html`
}

export function buildModule1Lesson2SnapshotFilename(
  studentName: string,
  now = new Date(),
): string {
  return `模块1_${safeModule1SnapshotFilenamePart(studentName)}_课时2风格与人物快照_${now.toISOString().slice(0, 10)}.html`
}

const SNAPSHOT_STYLES = `
    :root { color-scheme: light; --ink: #172033; --muted: #667085; --line: #d8e2f0; --primary: #0f766e; --soft: #f0fdfa; --warm: #fff7ed; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      line-height: 1.7;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.16), transparent 30%),
        linear-gradient(135deg, #f8fffd 0%, #f4f8ff 45%, #fff7ed 100%);
    }
    main { max-width: 880px; margin: 0 auto; padding: 36px 24px 48px; }
    h1, h2, p { margin-top: 0; }
    .hero {
      border-radius: 28px;
      padding: 28px;
      color: white;
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #ea580c 130%);
    }
    .hero h1 { font-size: 28px; margin-bottom: 8px; }
    .hero .muted { color: rgba(255, 255, 255, 0.82); }
    section {
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 20px;
      margin-top: 18px;
      background: rgba(255, 255, 255, 0.92);
    }
    section h2 { font-size: 18px; margin-bottom: 12px; color: #0f766e; }
    .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .info-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; }
    .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .value { font-weight: 700; white-space: pre-wrap; }
    .note { border-left: 4px solid #ea580c; padding: 10px 12px; border-radius: 12px; background: var(--warm); }
    .item { margin: 10px 0; }
    @media print { body { background: white; } main { padding: 0; } }
`

function wrapSnapshotHtml(title: string, subtitle: string, body: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${SNAPSHOT_STYLES}
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>ClassQuest 模块一：未来来信</h1>
      <p class="muted">${subtitle}</p>
      <p>本文件只用于提交阶段证据和课堂回看，不能导入恢复进度。换设备继续学习请使用「保存进度」下载的学习包。</p>
    </div>
    ${body}
  </main>
</body>
</html>`
}

function identitySection(portfolio: Module1Portfolio, now: Date): string {
  const name = escapeHtml(portfolio.student.studentName || "未填写")
  const clazz = escapeHtml(portfolio.student.clazz || "未填写")
  const seat = escapeHtml(portfolio.student.classSeatCode || "未填写")
  const generatedAt = escapeHtml(now.toLocaleString("zh-CN"))
  return `<section>
      <h2>身份与时间</h2>
      <div class="info-grid">
        <div class="info-card"><span class="label">姓名</span><span class="value">${name}</span></div>
        <div class="info-card"><span class="label">班级</span><span class="value">${clazz}</span></div>
        <div class="info-card"><span class="label">班学号</span><span class="value">${seat}</span></div>
        <div class="info-card"><span class="label">生成时间</span><span class="value">${generatedAt}</span></div>
      </div>
    </section>`
}

export function buildModule1Lesson1SnapshotHtml(portfolio: Module1Portfolio, now = new Date()): string {
  const lesson1 = portfolio.lesson1
  const themeCore = escapeHtml(buildLesson1ThemeCore(portfolio))
  return wrapSnapshotHtml(
    "模块一课时1主题设定快照",
    "课时 1：故事主题 · 主题设定阶段快照",
    `${identitySection(portfolio, now)}
    <section>
      <h2>课时 1 主题设定</h2>
      <p class="item"><span class="label">SDG</span><span class="value">${escapeHtml(lesson1.sdg || "未填写")}</span></p>
      <p class="item"><span class="label">选择理由</span><span class="value">${escapeHtml(lesson1.sdgWhy || "未填写")}</span></p>
      <p class="item"><span class="label">城市问题</span><span class="value">${escapeHtml(lesson1.cityIssue || "未填写")}</span></p>
      <p class="item"><span class="label">受众</span><span class="value">${escapeHtml(lesson1.audience || "未填写")}</span></p>
      <p class="item"><span class="label">受众关切</span><span class="value">${escapeHtml(lesson1.audienceConcern || "未填写")}</span></p>
    </section>
    <section>
      <h2>主题核心</h2>
      <p class="value">${themeCore}</p>
      <p class="note">阶段快照不能恢复进度。需要继续学习时，请选择继续学习包。</p>
    </section>`,
  )
}

export function buildModule1Lesson2SnapshotHtml(portfolio: Module1Portfolio, now = new Date()): string {
  const lesson2 = portfolio.lesson2
  const who = lesson2.protagonistIdentity.trim() || "未填写"
  const want = lesson2.goal.trim() || "未填写"
  const blocked = lesson2.obstacle.trim() || "未填写"
  const change = lesson2.changeAction.trim() || "未填写"
  const styleDetailsLabel = lesson2.styleId === MODULE1_CUSTOM_STYLE_ID ? "自定义风格特点" : "风格特点"
  const examples = lesson2.styleExamples.filter(item => item.trim()).length > 0
    ? lesson2.styleExamples.filter(item => item.trim()).map(example => escapeHtml(example)).join("<br />")
    : "未填写"
  const arcAnalysis = `作为“${who}”，从“${blocked}”的困境出发，通过“${change}”的具体行动，最终实现“${want}”的目标，体现个人成长与社会责任。`
  return wrapSnapshotHtml(
    "模块一课时2风格与人物快照",
    "课时 2：风格与人物 · 阶段快照",
    `${identitySection(portfolio, now)}
    <section>
      <h2>课时 2 风格与人物</h2>
      <p class="item"><span class="label">写作风格</span><span class="value">${escapeHtml(lesson2.styleName || "未填写")}</span></p>
      <p class="item"><span class="label">选择理由</span><span class="value">${escapeHtml(lesson2.styleWhy || "未填写")}</span></p>
      <p class="item"><span class="label">${escapeHtml(styleDetailsLabel)}</span><span class="value">${escapeHtml(lesson2.styleHint || "未填写")}</span></p>
      <p class="item"><span class="label">示例开头</span><span class="value">${examples}</span></p>
      <p class="item"><span class="label">我是谁</span><span class="value">${escapeHtml(lesson2.protagonistIdentity || "未填写")}</span></p>
      <p class="item"><span class="label">我想要</span><span class="value">${escapeHtml(lesson2.goal || "未填写")}</span></p>
      <p class="item"><span class="label">我卡在</span><span class="value">${escapeHtml(lesson2.obstacle || "未填写")}</span></p>
      <p class="item"><span class="label">我改变</span><span class="value">${escapeHtml(lesson2.changeAction || "未填写")}</span></p>
    </section>
    <section>
      <h2>弧光分析</h2>
      <p class="value">${escapeHtml(arcAnalysis)}</p>
      <p class="note">阶段快照不能恢复进度。需要继续学习时，请选择继续学习包。</p>
    </section>`,
  )
}

function triggerHtmlDownload(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadModule1Lesson1Snapshot(portfolio: Module1Portfolio): void {
  triggerHtmlDownload(
    buildModule1Lesson1SnapshotHtml(portfolio),
    buildModule1Lesson1SnapshotFilename(portfolio.student.studentName),
  )
}

export function downloadModule1Lesson2Snapshot(portfolio: Module1Portfolio): void {
  triggerHtmlDownload(
    buildModule1Lesson2SnapshotHtml(portfolio),
    buildModule1Lesson2SnapshotFilename(portfolio.student.studentName),
  )
}

export function isModule1SnapshotReady(portfolio: Module1Portfolio, kind: Module1SnapshotKind): boolean {
  if (kind === "lesson2") return portfolio.lesson2.completed
  return portfolio.lesson1.completed
}

export function downloadModule1Snapshot(portfolio: Module1Portfolio, kind: Module1SnapshotKind): void {
  if (kind === "lesson2") {
    downloadModule1Lesson2Snapshot(portfolio)
    return
  }
  downloadModule1Lesson1Snapshot(portfolio)
}
