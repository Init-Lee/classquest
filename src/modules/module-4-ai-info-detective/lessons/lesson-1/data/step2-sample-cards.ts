/**
 * 文件说明：模块 4 课时 1 第 2 关标准样例题卡数据。
 * 职责：提供新闻类与图片类样例卡的结构化字段；素材从课时 1 assets 目录本地 import，分阶段组件用这些字段生成观察、解析核验和最终田字型结构配对页面。
 * 更新触发：Step 2 样例题卡文案、选项反馈、参考判断、解析、来源核验链接/提示或本地素材替换时，需要同步更新本文件。
 */

import type { Step2SampleCard, Step2StructureLabel } from "@/modules/module-4-ai-info-detective/lessons/lesson-1/types"
import step2News from "@/modules/module-4-ai-info-detective/lessons/lesson-1/assets/step2-news.png"
import step2Pic from "@/modules/module-4-ai-info-detective/lessons/lesson-1/assets/step2-pic.jpg"

const COMMON_OPTIONS = [
  { key: "A", label: "明显存在 AI 痕迹" },
  { key: "B", label: "暂无明显 AI 痕迹" },
  { key: "C", label: "证据不足，仍需核验" },
] as const

export const STEP2_STRUCTURE_LABELS: Step2StructureLabel[] = [
  {
    key: "material",
    label: "素材展示",
    hint: "这里呈现新闻截图或图片素材。",
  },
  {
    key: "task",
    label: "判断任务",
    hint: "这里提出问题并给出选项。",
  },
  {
    key: "explanation",
    label: "解析",
    hint: "这里说明为什么这样判断。",
  },
  {
    key: "source",
    label: "来源与核验入口",
    hint: "这里说明素材从哪里来，别人如何核验。",
  },
]

export const STEP2_NEWS_SAMPLE_CARD: Step2SampleCard = {
  id: "sample-news-001",
  type: "news",
  title: "新闻类样例卡",
  material: {
    kind: "image",
    imageSrc: step2News,
    alt: "新闻网页截图：一口气买480支笔，文具盲盒盯上小学生",
    caption: "新闻网页截图（课堂示例）",
  },
  taskPrompt: "请判断这则新闻截图中的内容是否存在 AI 痕迹。",
  options: [...COMMON_OPTIONS],
  correctOptionKey: "C",
  correctFeedback: "判断稳妥：你没有只凭截图和标题直接下结论，而是保留了继续核验的空间。",
  incorrectFeedback: "先别急着下结论。仅凭截图和部分正文，还不足以作出可靠判断。",
  feedbackByOption: {
    A: "先别急着判断为 AI 痕迹。网页内容讨论了学生生活话题，但这不等于文本本身由 AI 生成。",
    B: "这个判断也需要谨慎。仅凭截图和部分正文，还不足以确认它“暂无 AI 痕迹”，仍需要进一步核验。",
    C: "判断稳妥：你没有只凭截图和标题直接下结论，而是保留了继续核验的空间。",
  },
  explanation:
    "这则新闻截图讨论的是文具盲盒、学生消费和隐藏款等生活化话题，但仅凭网页截图、标题和部分正文，无法判断这篇文章本身是否由 AI 生成，也无法确认其中所有数据和表述是否完整可靠。更稳妥的做法是继续核验原始网页、发布时间、来源机构、完整正文和文中引用的信息。因此，本题应选择：证据不足，仍需核验。",
  source: {
    sourceType: "network",
    sourceTypeLabel: "网络来源",
    sourceUrl: "https://m.thepaper.cn/newsDetail_forward_15953947?commTag=true",
    sourceLocator: "查看页面标题《一口气买480支笔，文具盲盒盯上小学生》及正文开头",
    verificationLabel: "打开新闻原网页",
    verificationTips: [
      "查看原始网页，确认发布平台、来源名称和发布时间",
      "阅读完整正文，不只看标题和截图",
      "核验文中提到的“480支笔”“超过2000元”等信息是否有明确出处",
      "区分网页内容是否可信，与文本是否由 AI 生成，是两个不同问题",
    ],
  },
}

export const STEP2_IMAGE_SAMPLE_CARD: Step2SampleCard = {
  id: "sample-image-001",
  type: "image",
  title: "图片类样例卡",
  material: {
    kind: "image",
    imageSrc: step2Pic,
    alt: "调高曝光后的《骑楼时光》图片，存在 AI 图像争议",
    caption: "单张静态图片（课堂示例）",
  },
  taskPrompt: "请判断这张图片是否存在 AI 痕迹。",
  options: [...COMMON_OPTIONS],
  correctOptionKey: "A",
  correctFeedback: "观察方向正确：这张图片在报道上下文中被指出与 AI 生成作品争议有关，局部细节也值得进一步放大观察。",
  incorrectFeedback: "再谨慎一些。仅凭肉眼第一眼看不一定明显，需要结合来源页面和局部细节继续核验。",
  feedbackByOption: {
    A: "观察方向正确：这张图片在报道上下文中被指出与 AI 生成作品争议有关，局部细节也值得进一步放大观察。",
    B: "再谨慎一些。该图来自 AI 摄影比赛争议报道，仅凭肉眼第一眼看不一定明显，但结合来源和局部细节，不能简单判断为“暂无明显痕迹”。",
    C: "保留核验意识是好的，但本样例的来源页面已经提供了较明确的上下文，说明该图与 AI 生成作品争议有关，因此本题参考判断为“明显存在 AI 痕迹”。",
  },
  explanation:
    "这张图片来自一则关于 AI 作品参加摄影比赛的报道。报道中提到，该作品在调高曝光并放大观察后，被发现是一张 AI 图。图片中强光区域、人物轮廓、局部细节和街景空间关系都需要重点观察。结合报道上下文，本题可判断为：明显存在 AI 痕迹。",
  source: {
    sourceType: "network",
    sourceTypeLabel: "网络来源",
    sourceUrl: "https://www.nbd.com.cn/articles/2026-01-15/4221843.html",
    sourceLocator: "在页面中查找：调高曝光后的《骑楼时光》",
    verificationLabel: "打开原始报道页面",
    verificationTips: [
      "打开原始报道页面，查找“调高曝光后的《骑楼时光》”图片",
      "阅读图片前后的文字，确认该图与 AI 作品参赛争议有关",
      "观察图片中的强光区域、人物轮廓、边缘细节和空间关系",
      "不要只凭单张图下结论，应结合来源页面和上下文核验",
    ],
  },
}
