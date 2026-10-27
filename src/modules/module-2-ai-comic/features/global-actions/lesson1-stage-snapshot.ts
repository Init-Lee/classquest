/**
 * 文件说明：模块 2 课时 1 阶段快照。
 * 职责：把当前档案里的身份、小说题目、第 2 关观察、四句画面和视觉方向渲染成一份转义过的独立 HTML，并给出文件名与下载入口规则。快照只用于交作业，不能恢复学习进度，也不写入学生本机档案。
 * 更新触发：课时 1 快照字段、转义规则、文件名、课卡或教师课时页入口变化时，需要同步更新本文件与回归测试。
 */

import {
  MODULE2_FOUR_PARTS,
  type FourPart,
  type Module2PortfolioV1,
} from "@/modules/module-2-ai-comic/domains/portfolio/types"

const PART_LABELS: Record<FourPart, string> = {
  opening: "起",
  development: "承",
  turn: "转",
  ending: "合",
}

/** 老师手写的三行。页面只列出题目，不打勾、不写通过。 */
const TEACHER_LINES = [
  "能说出作者选取、AI 生成、作者核查。",
  "四句能让人想象人物、地点和动作。",
  "视觉词和理由与故事情绪有关。",
] as const

export interface Module2LessonCardSnapshotButton {
  visible: boolean
  enabled: boolean
  hint: string
}

const HIDDEN_CARD_SNAPSHOT: Module2LessonCardSnapshotButton = {
  visible: false,
  enabled: false,
  hint: "",
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function snapshotText(value: string): string {
  const trimmed = value.trim()
  return escapeHtml(trimmed || "未填写")
}

/** 去掉文件名里的路径和非法字符。空白也换成连字符，避免下载名被拆开。 */
export function safeModule2SnapshotFilenamePart(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return cleaned || "未填写"
}

export function buildModule2Lesson1StageSnapshotFilename(studentName: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10)
  return `模块2_${safeModule2SnapshotFilenamePart(studentName)}_课时1_阶段快照_${day}.html`
}

/** 学生顶栏不放阶段快照。恢复进度只用「保存学习包」「导入学习包」。 */
export function shouldShowModule2StudentTopBarSnapshot(): boolean {
  return false
}

/** 教师讲解模式只在课时 1 页面提供当前课快照。首页和其他课时不从这里下载。 */
export function shouldShowModule2TeacherLessonSnapshot(pathname: string, isTeacherMode: boolean): boolean {
  return isTeacherMode && /\/module\/2\/lesson\/1(?:\/|$)/.test(pathname)
}

/**
 * 首页课卡：只有课时 1 显示。未完成时按钮不可点，并旁注「完成本课后可下载」。
 * 课时 2—6 本轮不提供快照。
 */
export function getModule2LessonCardSnapshotButton(
  lessonId: number,
  options: { available: boolean; completed: boolean },
): Module2LessonCardSnapshotButton {
  if (lessonId !== 1 || !options.available) return HIDDEN_CARD_SNAPSHOT
  if (!options.completed) {
    return { visible: true, enabled: false, hint: "完成本课后可下载" }
  }
  return { visible: true, enabled: true, hint: "" }
}

function identitySection(portfolio: Module2PortfolioV1): string {
  const { clazz, studentName, classSeatCode } = portfolio.student
  return `<section>
      <h2>身份</h2>
      <p><span class="label">班级</span><span class="value">${snapshotText(clazz)}</span></p>
      <p><span class="label">姓名</span><span class="value">${snapshotText(studentName)}</span></p>
      <p><span class="label">班学号</span><span class="value">${snapshotText(classSeatCode)}</span></p>
    </section>`
}

function storySection(portfolio: Module2PortfolioV1): string {
  const title = portfolio.sourceSnapshot?.storyTitle ?? ""
  const frames = MODULE2_FOUR_PARTS.map(part => {
    const sentence = portfolio.storyboard.frames[part].sceneSentence
    return `<p><span class="label">${PART_LABELS[part]}</span><span class="value">${snapshotText(sentence)}</span></p>`
  }).join("\n      ")
  const words = portfolio.visualDirection.words.map(word => word.trim()).filter(Boolean)
  const wordText = words.length === 0 ? "未填写" : words.join("、")
  return `<section>
      <h2>小说题目</h2>
      <p class="value">${snapshotText(title)}</p>
    </section>
    <section>
      <h2>第 2 关的观察</h2>
      <p class="value">${snapshotText(portfolio.lesson1.sampleObservation)}</p>
    </section>
    <section>
      <h2>四个画面</h2>
      ${frames}
    </section>
    <section>
      <h2>视觉方向</h2>
      <p><span class="label">视觉词</span><span class="value">${snapshotText(wordText)}</span></p>
      <p><span class="label">理由</span><span class="value">${snapshotText(portfolio.visualDirection.reason)}</span></p>
    </section>`
}

function teacherLines(): string {
  const items = TEACHER_LINES.map(line => `<li>
        <p>${escapeHtml(line)}</p>
        <div class="handwrite"></div>
      </li>`).join("\n      ")
  return `<section>
      <h2>请老师手写</h2>
      <p>下面三行留给老师手写。系统不打勾，也不写通过。</p>
      <ol>
      ${items}
      </ol>
    </section>`
}

/** 生成独立 HTML。全部学生字段先转义，页内不引用教师样例图。 */
export function buildModule2Lesson1StageSnapshotHtml(portfolio: Module2PortfolioV1): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>模块二 · 课时 1 · 阶段快照</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "PingFang SC", "Noto Sans SC", "Songti SC", serif; line-height: 1.7; color: #1c1917; background: #fff; }
    main { max-width: 760px; margin: 0 auto; padding: 32px 20px 48px; }
    h1, h2, p { margin-top: 0; }
    header h1 { font-size: 24px; margin-bottom: 8px; }
    header p, footer p { color: #44403c; }
    section { border-top: 1px solid #e7e5e4; margin-top: 20px; padding-top: 12px; }
    h2 { font-size: 18px; margin-bottom: 8px; }
    .label { display: inline-block; min-width: 4.5em; color: #57534e; }
    .value { white-space: pre-wrap; font-weight: 600; }
    .handwrite { min-height: 2.4em; margin: 4px 0 16px; border-bottom: 1px solid #a8a29e; }
    footer { margin-top: 28px; border-top: 1px solid #e7e5e4; padding-top: 12px; }
    @media print { body { background: white; } main { padding: 0; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>模块二 · 课时 1 · 阶段快照</h1>
      <p>本文件用于交作业，不能恢复学习进度。换设备继续学习请使用「保存学习包」。</p>
    </header>
    ${identitySection(portfolio)}
    ${storySection(portfolio)}
    ${teacherLines()}
    <footer>
      <p>本页不代表老师已经检查，也不给出分数或星级。阶段快照不能恢复学习进度。</p>
    </footer>
  </main>
</body>
</html>`
}

/** 只触发浏览器下载。不读取、不写入学生本机数据库。 */
export function downloadModule2Lesson1StageSnapshot(portfolio: Module2PortfolioV1, now = new Date()): void {
  const html = buildModule2Lesson1StageSnapshotHtml(portfolio)
  const filename = buildModule2Lesson1StageSnapshotFilename(portfolio.student.studentName, now)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
