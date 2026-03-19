/**
 * 文件说明：课时1配置
 * 职责：定义课时1的步骤名称、AI助手开关等静态配置
 * 更新触发：课时1步骤名称变更时；AI助手功能开关调整时
 */

export const LESSON1_CONFIG = {
  id: 1,
  title: "项目启动与定题",
  steps: [
    { id: 1, label: "任务启动" },
    { id: 2, label: "我的信息" },
    { id: 3, label: "个人 R1" },
    { id: 4, label: "小组讨论" },
    { id: 5, label: "证据清单" },
    { id: 6, label: "回顾导出" },
  ],
  /** AI 助手功能开关 */
  aiAssistEnabled: true,
  /** HTML 知识卡开关（首版不启用） */
  knowledgeCardEnabled: false,
}
