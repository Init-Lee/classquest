/**
 * 文件说明：课时 1 是否已经走进第 2 关的本机记号。
 * 职责：学生打开第 2 关时在这台电脑记一笔，回到第 1 关时用来决定小说是否只读。不写入学习档案，也不改后面关卡的内容。
 * 更新触发：第 1 关“进过第 2 关就只读”的判断方式变化时，需要同步更新本文件。
 */

const PREFIX = "classquest.module2.lesson1.step2Entered."

function localNote(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null
    return localStorage
  } catch {
    return null
  }
}

/** 记下这台电脑上已经打开过第 2 关。记不住时不影响学习档案。 */
export function markLesson1Step2Entered(portfolioId: string): void {
  try {
    localNote()?.setItem(PREFIX + portfolioId, "1")
  } catch {
    // 本机不能记时，仍可依靠“看过样例”的记录。
  }
}

/** 这台电脑是否已经打开过该档案的第 2 关。 */
export function hasLesson1Step2Entered(portfolioId: string): boolean {
  try {
    return localNote()?.getItem(PREFIX + portfolioId) === "1"
  } catch {
    return false
  }
}
