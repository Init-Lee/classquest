/**
 * 文件说明：模块 4 课时 2 素材体检静态数据。
 * 职责：集中维护第 1 关案例、第 2 关四项标准挑战、来源类型说明和线索范例，避免页面散落硬编码。
 * 更新触发：课时 2 教学案例、挑战答案、来源类型说明或学生提示文案变化时，需要同步更新本文件。
 */

export type Lesson2CriterionKey = "typeFits" | "sourceTraceable" | "contentCompliant" | "hasJudgmentValue"

export const LESSON2_STATUS_LABELS = {
  ready: "已准备",
  incomplete: "材料不完整",
  none: "暂无合适素材",
  usable: "按标准看，可以继续",
  need_fix: "按标准看，需要补充",
  need_replace: "按标准看，需要更换",
} as const

export const LESSON2_SOURCE_TYPE_LABELS = {
  web: "网络来源",
  ai_generated: "AI 生成",
  field_capture: "现场采集",
  mixed: "混合加工",
} as const

export const LESSON2_STEP1_CASES = [
  {
    id: "news-with-source",
    title: "带标题、来源和正文开头的新闻截图",
    statusLabel: "可以继续",
    point: "它保留了来源与上下文，后续可以继续做体检。",
  },
  {
    id: "image-no-source",
    title: "看起来像 AI 的图片，但当前无来源说明",
    statusLabel: "需要补信息",
    point: "可疑不等于可用，缺少来源记录会影响后续判断。",
  },
  {
    id: "privacy-photo",
    title: "包含同学或路人清晰人脸的照片",
    statusLabel: "建议更换",
    point: "涉及隐私或授权风险，不适合进入本模块题库。",
  },
] as const

export const LESSON2_CRITERIA = [
  {
    key: "typeFits",
    title: "类型符合",
    description: "新闻素材应是能看到标题、正文片段和来源线索的新闻截图；图片素材应是单张静态图片。短视频、长篇文章全文、多图拼图、聊天记录长截图，都不适合直接入题。",
  },
  {
    key: "sourceTraceable",
    title: "来源可追溯",
    description: "能说清素材从哪里来、如何生成、如何采集或如何加工。网络素材要有链接或平台信息；AI 生成素材要有 Prompt 摘要或生成记录；现场采集素材要有时间、地点或采集方式；混合加工素材要说明改写、拼接或二次生成过程。",
  },
  {
    key: "contentCompliant",
    title: "内容合规",
    description: "不包含隐私信息、未经授权的人脸、攻击性内容、不适宜传播内容或明显侵权风险。能判断，不代表能使用；能吸引人，也不代表适合进入题库。",
  },
  {
    key: "hasJudgmentValue",
    title: "具备判断价值",
    description: "素材应能围绕 AI 痕迹或核验需求展开讨论。过于明显、一眼看穿、纯搞笑、完全无法讨论的素材，都不适合做成辨识题。",
  },
] as const

export const LESSON2_CRITERIA_CHALLENGES = [
  {
    id: "short-video",
    title: "一段短视频片段",
    issue: "它不是本课要求的新闻截图，也不是单张静态图片。",
    correctCriterion: "typeFits" as Lesson2CriterionKey,
    feedback: "这类素材首先卡在“类型符合”。本模块只处理新闻截图和单张静态图片。",
  },
  {
    id: "forwarded-no-origin",
    title: "群里转发来的图片，没有原始出处",
    issue: "缺少平台、链接、生成记录或采集说明。",
    correctCriterion: "sourceTraceable" as Lesson2CriterionKey,
    feedback: "这类素材主要卡在“来源可追溯”。没有出处，后续就很难核验。",
  },
  {
    id: "classmate-face",
    title: "同学正脸照片",
    issue: "可能涉及隐私与授权风险。",
    correctCriterion: "contentCompliant" as Lesson2CriterionKey,
    feedback: "能判断不代表能使用。涉及清晰人脸、隐私或授权风险的素材不适合进入题库。",
  },
  {
    id: "obvious-joke",
    title: "一张一眼就知道是玩笑的 AI 梗图",
    issue: "过于明显，几乎不需要判断。",
    correctCriterion: "hasJudgmentValue" as Lesson2CriterionKey,
    feedback: "好素材不是越夸张越好，而是要能引发有依据的讨论。",
  },
] as const

export const LESSON2_SOURCE_GUIDES = [
  { value: "web", title: "网络来源", example: "填写链接、平台名称、栏目名称或发布时间线索。" },
  { value: "ai_generated", title: "AI 生成", example: "说明工具名称、Prompt 摘要、生成时间或生成记录截图。" },
  { value: "field_capture", title: "现场采集", example: "说明拍摄时间、地点、采集方式或采集者备注。" },
  { value: "mixed", title: "混合加工", example: "说明原始来源，以及裁剪、拼接、二次生成等加工方式。" },
] as const

export const LESSON2_IMAGE_CLUE_EXAMPLES = [
  "人物手部细节异常，可能需要进一步核验。",
  "背景文字存在错乱，可能有 AI 生成或后期加工痕迹。",
  "主体与背景光影方向不一致，需结合来源判断。",
  "当前缺少来源记录，仅凭画面无法判断。",
] as const
