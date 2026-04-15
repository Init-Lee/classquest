/**
 * 文件说明：课时5配置
 * 职责：定义课时5的步骤名称（共2关）、第2关「修改项目」海报板块枚举，及旧版存盘文案归一化（避免已选「可能的线索」的档案无法校验）
 * 更新触发：课时5步骤名称变更；海报板块对外文案与枚举变更；汇总包/校验引用这些字符串时
 */

/** 第2关「修改项目」下拉：海报五块文字区（与网页骨架字段一致） */
export const LESSON5_POSTER_SECTION_OPTIONS = [
  "标题",
  "探究问题",
  "为何关注",
  "我们看见了什么",
  "可能的原因",
] as const

export type Lesson5PosterSection = (typeof LESSON5_POSTER_SECTION_OPTIONS)[number]

/** 旧版下拉选项文案，读入档案或汇总包时映射为 {@link LESSON5_POSTER_SECTION_OPTIONS} 中的现行值 */
const LESSON5_POSTER_SECTION_LEGACY_ITEM = "可能的线索"

/** 将「修改项目」存盘值规范为当前枚举（兼容旧版「可能的线索」） */
export function normalizeLesson5PosterSectionItem(item: string): string {
  const t = item.trim()
  if (t === LESSON5_POSTER_SECTION_LEGACY_ITEM) return "可能的原因"
  return item
}

export const LESSON5_CONFIG = {
  id: 5,
  title: "预演展示与反馈优化",
  steps: [
    { id: 1, label: "意见入池" },
    { id: 2, label: "改动落地" },
  ],
}
