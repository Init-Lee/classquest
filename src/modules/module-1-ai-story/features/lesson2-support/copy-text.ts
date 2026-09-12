/**
 * 文件说明：模块 1 课时 2 文本复制辅助。
 * 职责：优先使用剪贴板接口，失败时抛出错误供界面打开可全选文本层。
 * 更新触发：复制策略或浏览器剪贴板兼容方式变化时，需要同步更新本文件。
 */

export async function copyModule1Lesson2Text(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("当前浏览器未开放剪贴板接口")
  }
  await navigator.clipboard.writeText(text)
}
