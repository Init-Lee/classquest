/**
 * 文件说明：课时1 · 步骤1 · 任务启动
 * 职责：向学生说明本课时的任务边界和交付物，消除认知焦虑
 *       过关条件：点击两个知晓按钮
 * 更新触发：本课时任务说明文案变化时
 */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { usePortfolio } from "@/app/providers/AppProvider"

export default function Step1Intro() {
  const { portfolio, savePortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [check1, setCheck1] = useState(portfolio?.lesson1.introDone || false)
  const [check2, setCheck2] = useState(portfolio?.lesson1.introDone || false)
  const canProceed = check1 && check2

  const handleNext = async () => {
    if (!portfolio || !canProceed) return
    await savePortfolio({
      ...portfolio,
      lesson1: { ...portfolio.lesson1, introDone: true },
      pointer: { ...portfolio.pointer, lessonId: 1, stepId: 2 },
    })
    navigate("/lesson/1/step/2")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">第1关：今天我们要做什么？</h3>
        <p className="text-muted-foreground text-sm">这一步只做一件事：把今天的任务说清楚</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 今天做什么 */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> 今天要做的
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                确定小组研究的问题（把大方向收束成能采到证据的问题）
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                小组讨论，选出最可行的方向
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                把"去哪儿采证据、怎么采"规划出来
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                分好工，每人知道自己负责什么
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 今天不做什么 */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-800 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> 今天不做的
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                不做海报，不做最终结论
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                不要求真的去采集证据（那是下节课的事）
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                不需要把记录方式想得很细很严格
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 今天的3个核心交付物 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">今天结束时，你和小组应该有：</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { num: "①", title: "个人 R1", desc: "你个人对研究问题的初步判断" },
              { num: "②", title: "小组共识", desc: "小组讨论后确定的最终方向" },
              { num: "③", title: "证据收集清单", desc: "谁、去哪、采什么、怎么记" },
            ].map(item => (
              <div key={item.num} className="flex flex-col gap-1 p-3 bg-muted/40 rounded-lg">
                <div className="text-lg font-bold text-primary">{item.num}</div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 过关条件：两个知晓勾选 */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm font-medium">确认你已经了解：</p>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={check1}
              onChange={e => setCheck1(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm group-hover:text-primary transition-colors">
              我知道今天不做海报，不要求出最终结论
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={check2}
              onChange={e => setCheck2(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm group-hover:text-primary transition-colors">
              我知道今天要把"证据怎么采"规划出来
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!canProceed || !portfolio}>
          下一关：填写我的信息
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
