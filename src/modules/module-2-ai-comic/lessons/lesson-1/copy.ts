/**
 * 文件说明：模块 2 课时 1 给学生看的固定文案。
 * 职责：集中放置四关标题说明、起承转合提示、人机职责短段与知识栏配图文件名、AARON 延展和学习目标；不放小说正文，正文只来自学生档案或样例清单。
 * 更新触发：课时 1 页面说明、三项目标表述、职责短段与配图、或 AARON 延展文案变化时，需要同步更新本文件。
 */

import type { FourPart } from "@/modules/module-2-ai-comic/domains/portfolio/types"

export const LESSON1_PARTS: { id: FourPart; label: string; hint: string }[] = [
  { id: "opening", label: "起", hint: "读者先看见谁，遇到什么处境？" },
  { id: "development", label: "承", hint: "人物做了什么，事情怎样向前？" },
  { id: "turn", label: "转", hint: "发生了什么关键变化，人物的做法或认识如何体现在行动中？" },
  { id: "ending", label: "合", hint: "最后留下什么状态或动作？开放结尾也可以。" },
]

export const LESSON1_RESPONSIBILITIES = [
  {
    title: "作者选时刻与方向",
    detail: "画之前，先由你选定一个瞬间，并想好读者要看清什么。样例没有把整篇小说都画进去，而是选了夜里拉窗帘这一刻：窗帘已经拉紧，枕头上仍有路灯的亮光。这一格要让人看见睡眠被打扰。",
    figures: [
      {
        file: "comic-panel-01.png",
        alt: "作者选定的一刻：夜里拉紧窗帘，枕头上仍有路灯的亮光",
        caption: "选定的一刻：枕头仍被照亮",
      },
    ],
  },
  {
    title: "AI 按条件生成",
    detail: "你写好谁、在哪里、正在做什么，再加上线条和颜色这类条件。AI 按这些条件出图，不替你决定故事讲到哪。同一段蹲在台阶边的场面，换成柔和水彩或黑白线描，画风就不同。",
    figures: [
      {
        file: "style-watercolor.png",
        alt: "同一场面按柔和水彩条件生成",
        caption: "条件：柔和水彩",
      },
      {
        file: "style-ink.png",
        alt: "同一场面按黑白线描条件生成",
        caption: "条件：黑白线描",
      },
    ],
  },
  {
    title: "作者对照原作核查与选择",
    detail: "图出来以后，要拿回原来的小说核对，再决定留下还是换掉。有一版把台阶画得又亮又清楚，读者就看不出为什么要停下来查看。对照原文后，留下台阶落在阴影里的一版。",
    figures: [
      {
        file: "revision-before.png",
        alt: "对照用的一版：台阶被画得过亮",
        caption: "台阶过亮，对不上原文",
      },
      {
        file: "comic-panel-03.png",
        alt: "核对后留下的一版：台阶处在阴影里",
        caption: "留下的一版：台阶在阴影里",
      },
    ],
  },
] as const

export const LESSON1_AARON = {
  title: "AARON 小故事",
  body: "Harold Cohen 长期设计规则和程序，让机器能够作画。人仍然要作出表达和系统设计上的选择。AARON 不是今天这种用提示词生成画面的模型，也不能凭画风判断是不是 AI 画的。",
  href: "https://whitney.org/exhibitions/harold-cohen-aaron",
  linkLabel: "Whitney Museum 官方展览",
} as const

export const LESSON1_GOALS = [
  "能结合样例说明四格漫画与创作记录的任务要求，并区分作者选取、AI 生成、作者核查三项职责。",
  "能从已确认小说中选出起、承、转、合四个关键时刻，写成包含人物、地点和主要动作的四句画面描述。",
  "能用 2—3 个视觉词说明初步风格，并用一句话解释该风格与故事情绪的关系。",
] as const

export const LESSON1_SCENE_PROMPT = "谁，在什么地方，正在做什么？"

export const LESSON1_REASON_PLACEHOLDER = "我选择……，因为我的故事希望让读者感到/看清……"
