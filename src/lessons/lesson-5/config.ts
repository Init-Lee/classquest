/**
 * 文件说明：课时5配置
 * 职责：定义课时5的步骤名称（共2关）及课时元信息
 * 更新触发：课时5步骤名称变更时；新增或删除步骤时
 */

/** 第2关「修改项目」下拉：海报五块文字区（与网页骨架字段一致） */
export const LESSON5_POSTER_SECTION_OPTIONS = [
  "标题",
  "探究问题",
  "为何关注",
  "我们看见了什么",
  "可能的线索",
] as const

export type Lesson5PosterSection = (typeof LESSON5_POSTER_SECTION_OPTIONS)[number]

export const LESSON5_CONFIG = {
  id: 5,
  title: "预演展示与反馈优化",
  steps: [
    { id: 1, label: "意见入池" },
    { id: 2, label: "改动落地" },
  ],
}
