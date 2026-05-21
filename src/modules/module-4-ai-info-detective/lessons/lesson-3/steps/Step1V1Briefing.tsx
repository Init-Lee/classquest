/**
 * 文件说明：模块 4 课时 3 第 1 步页面。
 * 职责：引导学生确认课时 3 只制作两张 V1 题卡初稿，并写入进入编辑器前的边界确认。
 * 更新触发：课时 3 任务边界、规则卡片文案或进入第 2 步策略变化时，需要同步更新本文件。
 */

import { useNavigate } from "react-router-dom"
import { useModule4Portfolio } from "@/modules/module-4-ai-info-detective/app/providers/Module4Provider"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Lesson3StepLayout } from "../components/Lesson3StepLayout"

const RULE_CARDS = [
  { title: "今天做什么", text: "完成 2 张题目卡 V1：新闻题卡 V1 与图片题卡 V1。" },
  { title: "今天不做什么", text: "不做同伴互审、不做 V2、不做难度标注、不正式入库。" },
  { title: "一张卡长什么样", text: "素材展示、判断任务、核心解析、来源与核验入口四部分齐全。" },
  { title: "下一步", text: "先制作新闻题卡，再制作图片题卡，最后统一保存 V1 初稿。" },
]

export default function Step1V1Briefing() {
  const { portfolio, savePortfolio } = useModule4Portfolio()
  const navigate = useNavigate()
  if (!portfolio) return null

  const confirm = () => {
    const now = new Date().toISOString()
    void savePortfolio({
      ...portfolio,
      progress: { lessonId: 3, stepId: 2 },
      lesson3: {
        ...portfolio.lesson3,
        step1Acknowledged: true,
        step1AcknowledgedAt: now,
      },
    })
    navigate("/module/4/lesson/3/step/2")
  }

  return (
    <Lesson3StepLayout
      title="第1步 · V1 规则确认"
      subtitle="先把今天的交付边界说清楚，后面只围绕两张 V1 初稿推进。"
      footer={<Button onClick={confirm}>我已确认，进入新闻题卡编辑器</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {RULE_CARDS.map(card => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-xl">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{card.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Lesson3StepLayout>
  )
}
