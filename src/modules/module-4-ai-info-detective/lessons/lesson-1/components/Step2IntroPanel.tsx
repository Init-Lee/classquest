/**
 * 文件说明：模块 4 课时 1 第 2 关任务说明首屏文案区。
 * 职责：顶部蓝色关卡主题句（与第 1 关首屏同款特大字号）；左右两栏正文分层换行展示任务说明；配以图标与浅色分区背景；无入口按钮——向下滚动进入新闻样例屏。
 * 更新触发：关卡主题文案、标题与正文字阶、左右栏配色与图标变化时，需要同步更新本文件。
 */

import { LayoutTemplate, Newspaper } from "lucide-react"

/** 两栏正文保持易读体，须小于顶部蓝色关卡标题。 */
const bodyClass =
  "text-base leading-relaxed text-slate-800 md:text-lg dark:text-slate-100"

export function Step2IntroPanel() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8">
      <p className="text-center text-balance text-3xl font-bold tracking-[0.06em] text-primary md:text-4xl">
        关卡2 · 一张好题卡长什么样？
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <div className="flex gap-4 rounded-2xl border border-sky-200/90 bg-sky-50/90 p-5 shadow-sm dark:border-sky-800/60 dark:bg-sky-950/35">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300"
            aria-hidden
          >
            <Newspaper className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className={`min-w-0 space-y-2 ${bodyClass}`}>
            <p className="font-semibold text-sky-950 dark:text-sky-50">本关任务：</p>
            <p className="text-sky-950 dark:text-sky-50">观察 2 张标准题目卡：</p>
            <ol className="list-decimal space-y-1.5 pl-6 marker:font-medium marker:text-sky-800 dark:marker:text-sky-300">
              <li className="text-sky-950 dark:text-sky-50">新闻类样例</li>
              <li className="text-sky-950 dark:text-sky-50">图片类样例</li>
            </ol>
          </div>
        </div>

        <div className="flex gap-4 rounded-2xl border border-violet-200/90 bg-violet-50/90 p-5 shadow-sm dark:border-violet-800/60 dark:bg-violet-950/35">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300"
            aria-hidden
          >
            <LayoutTemplate className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className={`min-w-0 space-y-2 ${bodyClass}`}>
            <p className="font-medium text-violet-950 dark:text-violet-50">
              请你找出每张题卡中的四个固定部分：
            </p>
            <ul className="space-y-1.5">
              <li className="text-violet-950 dark:text-violet-50">① 素材展示</li>
              <li className="text-violet-950 dark:text-violet-50">② 判断任务</li>
              <li className="text-violet-950 dark:text-violet-50">③ 解析</li>
              <li className="text-violet-950 dark:text-violet-50">④ 来源与核验入口</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
