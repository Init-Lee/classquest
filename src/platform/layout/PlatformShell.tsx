/**
 * 文件说明：ClassQuest 平台外壳组件。
 * 职责：为平台门户和模块入口提供最外层视觉框架，不包含任何模块内部课时逻辑。
 * 更新触发：平台级导航、页脚或门户外层布局变化时，需要同步更新本文件。
 */

import { Outlet, useNavigate } from "react-router-dom"

export function PlatformShell() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="回到平台首页"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              CQ
            </div>
            <div className="min-w-0 text-left">
              <div className="text-sm font-semibold truncate">ClassQuest</div>
              <div className="text-xs text-muted-foreground">程序化教学平台</div>
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        ClassQuest · Platform Portal · MIT License
      </footer>
    </div>
  )
}
