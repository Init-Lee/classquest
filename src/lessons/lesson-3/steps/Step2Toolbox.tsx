/**
 * 文件说明：课时3 · 第2关 · 材料加工方法工具箱
 * 职责：以"零浪费食堂"为统一示例，展示四类材料（图片/文字/表格数据/视频）
 *       的最小加工方法和常见错误；学生了解方法后点击确认进入第3关。
 * 更新触发：材料加工方法内容调整时；示例内容更新时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, ImageIcon, FileText, BarChart2, Video } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { usePortfolio } from "@/app/providers/AppProvider"

/** 四类材料的配置数据 */
const MATERIAL_TYPES = [
  {
    id: "image" as const,
    label: "图片",
    icon: ImageIcon,
    color: "text-orange-600",
    bgActive: "bg-orange-50 border-orange-300 text-orange-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "让观众一眼看出图片里最关键的现象",
    actions: ["裁切掉无关背景，突出主体", "用箭头或圆圈标出关键位置", "写一句客观说明：「这张图显示了……」"],
    posterForm: "含标注箭头的图片 + 一句说明文字",
    example: {
      raw: "一张学校食堂的全景照片",
      process: "圈出剩菜明显的餐盘区域，标注「高峰期剩菜集中区」箭头",
      result: "「每日餐后高峰，主菜区平均约 1/3 餐盘有明显剩余」",
    },
    mistakes: ["只上传原图不做任何处理", "标注太多，重点反而不突出", "用截图或网络图代替现场拍摄"],
  },
  {
    id: "text" as const,
    label: "文字",
    icon: FileText,
    color: "text-blue-600",
    bgActive: "bg-blue-50 border-blue-300 text-blue-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "把原始文字压缩成一句可展示的客观表述",
    actions: ["摘录最能说明现象的关键句", "删去修饰性词语，保留事实", "压缩成不超过 30 字的客观表述"],
    posterForm: "引用句 + 来源标注",
    example: {
      raw: "采访记录：「其实很多同学点的时候觉得都想吃，但是吃到一半就饱了，剩下的也不好意思打包……」",
      process: "提炼关键信息：学生食量与点餐量不匹配导致剩余",
      result: "「受访学生反映：点餐时高估食量，实际食量不足，导致约半数情况有剩余」",
    },
    mistakes: ["直接大段复制粘贴", "没有注明来源", "把转述的话写成「已经证明了」"],
  },
  {
    id: "data" as const,
    label: "表格数据",
    icon: BarChart2,
    color: "text-green-600",
    bgActive: "bg-green-50 border-green-300 text-green-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "从一堆数字中提炼出清晰的趋势或对比，用文字或图表表达",
    actions: ["选出最能说明问题的 2~3 个关键数字", "做简单对比（如：今天 vs 昨天，高峰 vs 平峰）", "转成一句趋势判断句，不直接跳到原因", "也可以用手绘或工具（如 WPS 图表）把数据做成简单柱状图或折线图，更直观"],
    posterForm: "数据比较句 + 来源说明（或简单图表截图 + 一句说明）",
    example: {
      raw: "三天测量：周一剩余率 32%，周三 29%，周五 41%",
      process: "发现周五剩余率明显高于其他两天，对比差值约 10%",
      result: "「周五剩余率（41%）比周一、周三平均高约 10 个百分点，存在明显波动」",
    },
    mistakes: ["贴一整张表格不解释", "数字很多但不说明说明了什么", "直接从数字跳到「因此原因是……」"],
  },
  {
    id: "video" as const,
    label: "视频",
    icon: Video,
    color: "text-purple-600",
    bgActive: "bg-purple-50 border-purple-300 text-purple-800",
    bgInactive: "bg-white border-gray-200 text-gray-600",
    goal: "用关键帧说明视频记录了什么现象",
    actions: ["截取最能说明问题的 1~2 个关键帧", "标注帧的时间点和场景描述", "配一句客观观察说明：「这个画面显示了……」"],
    posterForm: "关键帧截图 + 时间标注 + 一句说明",
    example: {
      raw: "3 分钟食堂收餐视频",
      process: "截取 1:25 处餐盘归还画面，标注「收餐高峰，桶已满溢」",
      result: "「视频 1:25 显示收餐桶已超出容量，说明高峰期剩余量超出收容能力」",
    },
    mistakes: ["只上传整个视频不截关键帧", "依赖 AI 解读整个视频内容", "没说明截这一帧是为了说明什么"],
  },
]

export default function Step2Toolbox() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"image" | "text" | "data" | "video">("image")
  const [saving, setSaving] = useState(false)

  if (!portfolio) return null

  const alreadyDone = portfolio.lesson3.toolboxCompleted
  const activeMaterial = MATERIAL_TYPES.find((m) => m.id === activeTab)!

  const handleConfirm = async () => {
    if (saving) return
    setSaving(true)
    try {
      await savePortfolio({
        ...portfolio,
        lesson3: { ...portfolio.lesson3, toolboxCompleted: true },
      })
      navigate("/lesson/3/step/3")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* 统一处理逻辑总览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">材料加工的统一逻辑</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { step: "1", text: "原始材料\n是什么" },
              { step: "2", text: "我看到了\n什么" },
              { step: "3", text: "我做了什么\n最小加工" },
              { step: "4", text: "海报上可以\n怎么说" },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex items-center">
                <div className="flex-1 bg-gray-100 rounded-md p-2">
                  <div className="font-bold text-gray-500 mb-0.5">{item.step}</div>
                  <div className="whitespace-pre-line text-gray-700 leading-tight">{item.text}</div>
                </div>
                {i < arr.length - 1 && <div className="text-gray-400 mx-1">→</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 四类材料标签页 */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          选择材料类型，查看具体处理方法
        </p>
        {/* Tab 按钮 */}
        <div className="flex gap-2 flex-wrap mb-4">
          {MATERIAL_TYPES.map((m) => {
            const Icon = m.icon
            const isActive = activeTab === m.id
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  isActive ? m.bgActive : m.bgInactive + " hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "" : "text-gray-400"}`} />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Tab 内容 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = activeMaterial.icon
                return <Icon className={`h-4 w-4 ${activeMaterial.color}`} />
              })()}
              <CardTitle className="text-sm">{activeMaterial.label}的处理方法</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 处理目标 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">处理目标</p>
              <p className="text-sm text-gray-700">{activeMaterial.goal}</p>
            </div>

            {/* 最小加工动作 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">最小加工动作</p>
              <ul className="space-y-1">
                {activeMaterial.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            {/* 加工后形态 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">加工后在海报上的形态</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1.5">{activeMaterial.posterForm}</p>
            </div>

            {/* 「零浪费食堂」示例 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                示例：「零浪费食堂」课题
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground w-16">原始材料</span>
                  <span className="text-gray-600">{activeMaterial.example.raw}</span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground w-16">加工过程</span>
                  <span className="text-gray-700">{activeMaterial.example.process}</span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground w-16">加工结果</span>
                  <span className="font-medium text-gray-800">{activeMaterial.example.result}</span>
                </div>
              </div>
            </div>

            {/* 图表类型演示（仅表格数据 Tab 显示） */}
            {activeTab === "data" && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  三种常用图表类型 · 怎么选？
                </p>
                <div className="space-y-2">
                  {/* 柱状图 */}
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-green-700">📊 柱状图</span>
                      <span className="text-xs text-green-600">— 对比多个类别 / 时间点的数量</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">零浪费食堂示例：</span>
                      周一 32%、周三 29%、周五 41% → 画三根柱子，高低一目了然
                    </p>
                    <p className="text-xs text-gray-500 italic">说明句写法：「如柱状图所示，周五剩余率最高（41%），比周一高约 9 个百分点」</p>
                  </div>

                  {/* 折线图 */}
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-blue-700">📈 折线图</span>
                      <span className="text-xs text-blue-600">— 展示随时间变化的趋势</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">零浪费食堂示例：</span>
                      连续 5 天每天的剩余量（周一→周二→…→周五）→ 折线走势，看出是否呈上升或下降规律
                    </p>
                    <p className="text-xs text-gray-500 italic">说明句写法：「如折线图所示，剩余量整体呈周末前上升趋势，周五达到峰值」</p>
                  </div>

                  {/* 饼图 */}
                  <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-orange-700">🥧 饼图</span>
                      <span className="text-xs text-orange-600">— 展示各部分的占比构成</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">零浪费食堂示例：</span>
                      剩余类型：主菜 52%、主食 28%、汤 14%、其他 6% → 饼图扇形，哪类浪费最多一眼看出
                    </p>
                    <p className="text-xs text-gray-500 italic">说明句写法：「如饼图所示，主菜剩余占总浪费量的 52%，是最主要的浪费类型」</p>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    💡 工具推荐：WPS 表格 / Excel 插入图表 → 截图放入海报，记得配一句说明
                  </p>
                </div>
              </div>
            )}

            {/* 常见错误 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">常见错误</p>
              <ul className="space-y-1">
                {activeMaterial.mistakes.map((err, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-red-400 shrink-0" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => navigate("/lesson/3/step/1")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 上一步
        </Button>
        {alreadyDone ? (
          <Button onClick={() => navigate("/lesson/3/step/3")}>
            继续第3关 <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "保存中…" : "我已了解处理方法，开始筛选材料"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
